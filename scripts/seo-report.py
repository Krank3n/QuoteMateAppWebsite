#!/usr/bin/env python3
"""Read-only GA4/GSC foundation scorecard. No API configuration mutations.

Requires google-auth and requests in the active Python environment.
Credentials: --credentials or GOOGLE_APPLICATION_CREDENTIALS / Google ADC.
Outputs aggregate reports to --output (default: a dated folder under /tmp).
"""
import argparse
import datetime as dt
import json
from pathlib import Path
from urllib.parse import quote

ORGANIC = {"filter": {"fieldName": "sessionDefaultChannelGroup", "stringFilter": {"matchType": "EXACT", "value": "Organic Search"}}}
EXCLUDE = {"notExpression": {"filter": {"fieldName": "landingPage", "stringFilter": {
    "matchType": "FULL_REGEXP",
    "value": r"(\(not set\)|/(app|admin|portal|q|join)(/.*)?|/(google-calendar|reece|square|xero)/callback(/.*)?)",
}}}}
CTA_EVENTS = ["app_store_click", "google_play_click", "web_app_click", "cta_click", "pricing_cta_click"]


def report_rows(response):
    keys = [h["name"] for h in response.get("dimensionHeaders", []) + response.get("metricHeaders", [])]
    return [dict(zip(keys, [v["value"] for v in r.get("dimensionValues", []) + r.get("metricValues", [])]))
            for r in response.get("rows", [])]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--credentials", help="Google credential file; never copied to output")
    parser.add_argument("--property", default="527922866", help="GA4 numeric property ID")
    parser.add_argument("--end-date", type=dt.date.fromisoformat, default=dt.date.today() - dt.timedelta(days=3))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--gsc", action="store_true", help="Also attempt GSC exports; failures remain explicit")
    parser.add_argument("--gsc-property", default="sc-domain:quotemateapp.au")
    args = parser.parse_args()
    if not args.property.isdigit():
        parser.error("--property must be a numeric GA4 property ID")
    try:
        import google.auth
        from google.auth.transport.requests import AuthorizedSession
    except ImportError:
        parser.error("Install google-auth and requests in a Python virtual environment first")
    scopes = ["https://www.googleapis.com/auth/analytics.readonly"]
    if args.gsc:
        scopes.append("https://www.googleapis.com/auth/webmasters.readonly")
    try:
        credentials, _ = (google.auth.load_credentials_from_file(args.credentials, scopes=scopes)
                          if args.credentials else google.auth.default(scopes=scopes))
    except Exception as error:
        parser.error(f"Could not load Google credentials ({type(error).__name__}); check your local configuration")
    session = AuthorizedSession(credentials)
    end = args.end_date
    current = {"startDate": str(end - dt.timedelta(days=27)), "endDate": str(end)}
    previous = {"startDate": str(end - dt.timedelta(days=55)), "endDate": str(end - dt.timedelta(days=28))}
    out = args.output or Path("/tmp") / f"quotemate-seo-{end}"
    out.mkdir(parents=True, exist_ok=True)
    reports = {}

    def request(name, url, body=None):
        try:
            response = session.post(url, json=body, timeout=60) if body is not None else session.get(url, timeout=60)
            payload = response.json()
            result = {"http_status": response.status_code, "request": body, "response": payload}
            if not response.ok:
                print(f"{name}: HTTP {response.status_code} — report unavailable (not zero traffic)")
        except Exception as error:
            result = {"error": type(error).__name__, "request": body}
            print(f"{name}: {type(error).__name__} — report unavailable")
        (out / f"{name}.json").write_text(json.dumps(result, indent=2) + "\n")
        reports[name] = result
        return result

    def ga(name, dimensions, metrics, extra=None, marketing=True):
        filters = [ORGANIC] + ([EXCLUDE] if marketing else []) + ([extra] if extra else [])
        body = {"dateRanges": [current, previous], "dimensions": [{"name": x} for x in dimensions],
                "metrics": [{"name": x} for x in metrics], "dimensionFilter": {"andGroup": {"expressions": filters}}, "limit": 10000}
        return request(name, f"https://analyticsdata.googleapis.com/v1beta/properties/{args.property}:runReport", body)

    ga("organic_channel", [], ["sessions", "engagedSessions"], marketing=False)
    ga("organic_marketing", [], ["sessions", "engagedSessions"])
    ga("organic_marketing_country", ["country"], ["sessions"])
    ga("organic_landing_pages", ["landingPage"], ["sessions", "engagedSessions"])
    ga("organic_signups", [], ["eventCount", "totalUsers"], {"filter": {"fieldName": "eventName", "stringFilter": {"matchType": "EXACT", "value": "sign_up"}}})
    ga("organic_cta_clicks", ["eventName"], ["eventCount", "totalUsers"], {"filter": {"fieldName": "eventName", "inListFilter": {"values": CTA_EVENTS}}})
    ga("organic_downloads", [], ["eventCount", "totalUsers"], {"filter": {"fieldName": "eventName", "stringFilter": {"matchType": "EXACT", "value": "template_download"}}})
    request("ga_key_event_definitions", f"https://analyticsadmin.googleapis.com/v1beta/properties/{args.property}/keyEvents")

    if args.gsc:
        url = f"https://www.googleapis.com/webmasters/v3/sites/{quote(args.gsc_property, safe='')}/searchAnalytics/query"
        for period, dates in [("current", current), ("previous", previous)]:
            for name, dimensions in [("totals", []), ("pages", ["page"]), ("queries", ["query"]), ("query_pages", ["query", "page"])]:
                body = {**dates, "type": "web", "dataState": "final", "dimensions": dimensions, "rowLimit": 25000,
                        "dimensionFilterGroups": [{"filters": [{"dimension": "country", "operator": "equals", "expression": "aus"}]}]}
                result = request(f"gsc_au_{period}_{name}", url, body)
                if result.get("http_status") != 200:
                    break  # do not hammer a disabled/unauthorised API
            if result.get("http_status") != 200:
                break

    def value(name, metric, period):
        result = reports.get(name, {})
        if result.get("http_status") != 200:
            return "unavailable"
        rows = report_rows(result["response"])
        # Zero only after a successful response with no matching event rows.
        return next((r[metric] for r in rows if r.get("dateRange") == f"date_range_{period}"), "0")

    lines = ["# SEO foundation scorecard", "", f"GA4 property: {args.property}",
             f"Current: {current['startDate']}–{current['endDate']} (inclusive)",
             f"Previous: {previous['startDate']}–{previous['endDate']} (inclusive)", "",
             "| Metric | Previous | Current |", "|---|---:|---:|"]
    for label, name, metric in [
        ("All organic sessions (includes utility/unknown landings)", "organic_channel", "sessions"),
        ("**Organic marketing sessions**", "organic_marketing", "sessions"),
        ("Tracked organic signup users — validate against auth", "organic_signups", "totalUsers"),
        ("Download click events — not signups", "organic_downloads", "eventCount"),
    ]:
        lines.append(f"| {label} | {value(name, metric, 1)} | {value(name, metric, 0)} |")
    lines += ["", "CTA occurrences are in organic_cta_clicks.json; never report them as customers.",
              "Signups/first quote/payment cohorts are not joined here. Durable product/payment state remains revenue truth.",
              "GA dimension subtotals are not always additive. Use the directly filtered marketing aggregate.",
              "GSC exports, if available, are AU Web Search only and include anonymised queries in totals but not query rows.",
              "A 25,000-row GSC table may be truncated; paginate before treating it as exhaustive. Query/page totals may differ from property totals.",
              "No field Core Web Vitals, rankings forecast or paid-customer count is inferred from these reports.",
              "Review each JSON http_status and metadata before using the values. Missing/denied data is not zero."]
    (out / "scorecard.md").write_text("\n".join(lines) + "\n")
    print(f"Saved read-only scorecard and report definitions to {out}")
    if reports["organic_marketing"].get("http_status") != 200:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
