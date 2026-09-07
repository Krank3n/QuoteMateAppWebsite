#!/usr/bin/env python3
"""Read-only GA4/GSC/CrUX foundation scorecard. No API configuration mutations.

Requires google-auth and requests in the active Python environment.
Credentials: --credentials or GOOGLE_APPLICATION_CREDENTIALS / Google ADC.
Outputs aggregate reports to --output (default: a dated folder under /tmp).

Three things this script is careful about, because getting them wrong produces
confident numbers that are simply false:

  * A failed API call is recorded as `unavailable`, never as zero traffic.
  * GSC query tables omit anonymised queries. Property totals are the only
    honest source for overall clicks/impressions; the sum of a query table is
    always an undercount and the two are reported separately.
  * Field Core Web Vitals, origin-level field data and laboratory results are
    three different things. PSI's `loadingExperience` carries `origin_fallback`
    when a URL has too few samples and the origin's numbers were substituted;
    that flag is surfaced rather than quietly ignored. "Insufficient field
    data" is a real finding.
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

# Brand segmentation has to be stated, not assumed. Any query containing one of
# these is brand; everything else is non-brand. Misspellings a searcher plausibly
# types are included; the generic trade words are deliberately not.
BRAND_TERMS = ["quotemate", "quote mate", "quotmate", "quotemateapp", "quote mate app"]
BRAND_REGEX = "(?i).*(" + "|".join(t.replace(" ", "[ ]?") for t in BRAND_TERMS) + ").*"

# Field CWV sample: the homepage plus one page from each template/article/hub
# family, so a thin-data verdict can be attributed to a page type.
CWV_URLS = [
    "https://quotemateapp.au/",
    "https://quotemateapp.au/templates/",
    "https://quotemateapp.au/templates/fence-quote-template/",
    "https://quotemateapp.au/pricing/",
    "https://quotemateapp.au/articles/how-to-quote-concrete-driveway/",
]

GSC_ROW_LIMIT = 25000


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
    parser.add_argument("--windows", default="28", help="Comma-separated window lengths in days, e.g. 28,90")
    parser.add_argument("--cwv", action="store_true", help="Also collect PSI/CrUX field Core Web Vitals")
    parser.add_argument("--inspect", type=int, default=0, help="Inspect this many top GSC pages (URL Inspection quota is small)")
    args = parser.parse_args()
    try:
        windows = [int(w) for w in args.windows.split(",") if w.strip()]
    except ValueError:
        parser.error("--windows must be comma-separated integers, e.g. 28,90")
    if not windows or any(w < 1 for w in windows):
        parser.error("--windows must contain at least one positive integer")
    if not args.property.isdigit():
        parser.error("--property must be a numeric GA4 property ID")
    try:
        import google.auth
        from google.auth.transport.requests import AuthorizedSession
    except ImportError:
        parser.error("Install google-auth and requests in a Python virtual environment first")
    scopes = ["https://www.googleapis.com/auth/analytics.readonly"]
    if args.gsc or args.inspect:
        scopes.append("https://www.googleapis.com/auth/webmasters.readonly")
    if args.cwv:
        # PSI is called with the user's own quota project rather than the
        # shared anonymous pool, which is routinely exhausted (HTTP 429).
        scopes.append("https://www.googleapis.com/auth/cloud-platform")
    try:
        credentials, _ = (google.auth.load_credentials_from_file(args.credentials, scopes=scopes)
                          if args.credentials else google.auth.default(scopes=scopes))
    except Exception as error:
        parser.error(f"Could not load Google credentials ({type(error).__name__}); check your local configuration")
    session = AuthorizedSession(credentials)
    end = args.end_date

    def window(days):
        """A window and the equally-long period immediately before it."""
        return (
            {"startDate": str(end - dt.timedelta(days=days - 1)), "endDate": str(end)},
            {"startDate": str(end - dt.timedelta(days=2 * days - 1)), "endDate": str(end - dt.timedelta(days=days))},
        )

    # GA4 comparisons keep the original 28-day shape regardless of --windows.
    current, previous = window(28)
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

    site = quote(args.gsc_property, safe="")
    gsc_url = f"https://www.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
    au_filter = [{"filters": [{"dimension": "country", "operator": "equals", "expression": "aus"}]}]

    def gsc_paged(name, dates, dimensions, extra_groups=()):
        """Fetch every row, not just the first page.

        A single 25,000-row response is a page, not a table. Without this the
        long tail is silently missing and any "top queries" list is really
        "top queries in the first page Google happened to return".
        """
        groups = list(au_filter) + list(extra_groups)
        rows, start, pages, status, truncated = [], 0, 0, None, False
        while True:
            body = {**dates, "type": "web", "dataState": "final", "dimensions": dimensions,
                    "rowLimit": GSC_ROW_LIMIT, "startRow": start, "dimensionFilterGroups": groups}
            result = request(f"{name}_page{pages}" if pages else name, gsc_url, body)
            status = result.get("http_status")
            if status != 200:
                break
            page_rows = result["response"].get("rows", [])
            rows.extend(page_rows)
            pages += 1
            if len(page_rows) < GSC_ROW_LIMIT:
                break
            start += GSC_ROW_LIMIT
            if pages >= 8:  # 200k rows; past here the export is the wrong tool
                truncated = True
                break
        summary = {"http_status": status, "rows": len(rows), "pages_fetched": pages,
                   "truncated": truncated, "dimensions": dimensions, "dates": dates,
                   "filters": groups, "data": rows}
        (out / f"{name}.json").write_text(json.dumps(summary, indent=2) + "\n")
        reports[name] = summary
        return summary

    if args.gsc:
        for days in windows:
            cur, prev = window(days)
            for period, dates in [("current", cur), ("previous", prev)]:
                tag = f"gsc_au_{days}d_{period}"
                # Property totals FIRST and separately: these include anonymised
                # queries, so they are the only honest overall clicks figure.
                totals = gsc_paged(f"{tag}_totals", dates, [])
                if totals.get("http_status") != 200:
                    break  # do not hammer a disabled or unauthorised API
                gsc_paged(f"{tag}_devices", dates, ["device"])
                gsc_paged(f"{tag}_pages", dates, ["page"])
                gsc_paged(f"{tag}_queries", dates, ["query"])
                gsc_paged(f"{tag}_query_pages", dates, ["query", "page"])
                # Brand / non-brand, defined explicitly by BRAND_REGEX rather
                # than inferred from whatever the top rows happen to look like.
                for label, operator in [("brand", "includingRegex"), ("nonbrand", "excludingRegex")]:
                    gsc_paged(f"{tag}_{label}_totals", dates, [], extra_groups=[
                        {"filters": [{"dimension": "query", "operator": operator, "expression": BRAND_REGEX}]}])
            else:
                continue
            break

        request("gsc_sitemaps", f"https://www.googleapis.com/webmasters/v3/sites/{site}/sitemaps")

    if args.inspect:
        # URL Inspection has a tight daily quota — sample the top pages only.
        top = next((reports.get(f"gsc_au_{d}d_current_pages") for d in windows
                    if reports.get(f"gsc_au_{d}d_current_pages", {}).get("http_status") == 200), None)
        pages = [r["keys"][0] for r in (top or {}).get("data", [])][: args.inspect] if top else []
        if not pages:
            pages = CWV_URLS[: args.inspect]
        for i, page in enumerate(pages):
            request(f"gsc_inspect_{i}", "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                    {"inspectionUrl": page, "siteUrl": args.gsc_property, "languageCode": "en-AU"})

    if args.cwv:
        # PSI returns BOTH the URL's own field record (loadingExperience) and
        # the origin's (originLoadingExperience), plus a Lighthouse lab run.
        # They are three different measurements and are kept apart on purpose.
        for i, page in enumerate(CWV_URLS):
            for strategy in ("mobile", "desktop"):
                psi = ("https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed"
                       f"?url={quote(page, safe='')}&strategy={strategy}&category=performance")
                name = f"cwv_{strategy}_{i}"
                if request(name, psi).get("http_status") != 200:
                    request(name, psi)  # one retry; PSI 500s on individual URLs

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
    # ---- Search Console -------------------------------------------------
    def gsc_totals(name):
        """(clicks, impressions) from a totals report, or None when unavailable."""
        r = reports.get(name)
        if not r or r.get("http_status") != 200:
            return None
        rows = r.get("data") or []
        if not rows:
            return (0, 0)  # a successful empty response is genuinely zero
        return (rows[0].get("clicks", 0), rows[0].get("impressions", 0))

    def fmt(pair, index):
        return "unavailable" if pair is None else f"{pair[index]:,.0f}"

    if args.gsc:
        lines += ["", "## Search Console — AU, Web search, final data only", ""]
        for days in windows:
            cur, prev = window(days)
            tag_c, tag_p = f"gsc_au_{days}d_current", f"gsc_au_{days}d_previous"
            lines += [f"### {days}-day window",
                      f"Current: {cur['startDate']}–{cur['endDate']} · Preceding: {prev['startDate']}–{prev['endDate']}",
                      "", "| Segment | Preceding clicks | Current clicks | Preceding impressions | Current impressions |",
                      "|---|---:|---:|---:|---:|"]
            for label, suffix in [("**Property total** (includes anonymised queries)", "totals"),
                                  ("Brand queries", "brand_totals"),
                                  ("Non-brand queries", "nonbrand_totals")]:
                c, pr = gsc_totals(f"{tag_c}_{suffix}"), gsc_totals(f"{tag_p}_{suffix}")
                lines.append(f"| {label} | {fmt(pr,0)} | {fmt(c,0)} | {fmt(pr,1)} | {fmt(c,1)} |")
            devices = reports.get(f"{tag_c}_devices")
            if devices and devices.get("http_status") == 200:
                lines += ["", "| Device | Clicks | Impressions |", "|---|---:|---:|"]
                for row in devices.get("data", []):
                    lines.append(f"| {row['keys'][0]} | {row.get('clicks',0):,.0f} | {row.get('impressions',0):,.0f} |")
            for suffix in ("queries", "pages", "query_pages"):
                r = reports.get(f"{tag_c}_{suffix}")
                if r and r.get("http_status") == 200:
                    note = " — TRUNCATED, treat as a sample" if r.get("truncated") else ""
                    lines.append(f"- `{suffix}`: {r['rows']:,} rows over {r['pages_fetched']} page(s){note}")
                else:
                    lines.append(f"- `{suffix}`: unavailable (not zero)")
            lines += ["", "Brand is defined as any query matching: " + ", ".join(f"`{t}`" for t in BRAND_TERMS) + ".",
                      "Brand + non-brand will NOT sum to the property total: anonymised queries are counted in the",
                      "total but belong to no query row. Use the property total for overall clicks.", ""]
        sm = reports.get("gsc_sitemaps")
        if sm and sm.get("http_status") == 200:
            lines += ["### Sitemaps", "", "| Sitemap | Last downloaded | Warnings | Errors | Submitted / Indexed |", "|---|---|---:|---:|---|"]
            for entry in sm["response"].get("sitemap", []):
                counts = entry.get("contents", [{}])[0]
                lines.append(f"| {entry.get('path','')} | {entry.get('lastDownloaded','never')} | "
                             f"{entry.get('warnings','0')} | {entry.get('errors','0')} | "
                             f"{counts.get('submitted','?')} / {counts.get('indexed','not reported')} |")
            lines.append("")
        elif args.gsc:
            lines += ["### Sitemaps", "", "unavailable (not zero)", ""]

    inspections = sorted(k for k in reports if k.startswith("gsc_inspect_"))
    if inspections:
        lines += ["### URL Inspection sample", "", "| URL | Verdict | Coverage | Last crawl | Canonical (Google) |", "|---|---|---|---|---|"]
        for key in inspections:
            r = reports[key]
            if r.get("http_status") != 200:
                lines.append(f"| {r.get('request',{}).get('inspectionUrl','?')} | unavailable | — | — | — |")
                continue
            idx = r["response"].get("inspectionResult", {}).get("indexStatusResult", {})
            lines.append(f"| {r['request']['inspectionUrl']} | {idx.get('verdict','?')} | {idx.get('coverageState','?')} | "
                         f"{idx.get('lastCrawlTime','?')} | {idx.get('googleCanonical','?')} |")
        lines += ["", "URL Inspection reflects Google's index at request time and has a small daily quota;", 
                  "this is a sample, not an audit of every URL.", ""]

    # ---- Field Core Web Vitals -------------------------------------------
    if args.cwv:
        lines += ["", "## Core Web Vitals", "",
                  "Three distinct things, never merged: the URL's own field record, the ORIGIN's",
                  "field record, and a Lighthouse lab run. `origin fallback` means the URL had too",
                  "few real-user samples and PSI substituted origin data — that is insufficient",
                  "field data for the URL, not a passing URL.", "",
                  "| URL | Device | Field scope | LCP p75 | INP p75 | CLS p75 | FCP p75 | Verdict |",
                  "|---|---|---|---:|---:|---:|---:|---|"]
        metric_keys = [("LARGEST_CONTENTFUL_PAINT_MS", "ms"), ("INTERACTION_TO_NEXT_PAINT", "ms"),
                       ("CUMULATIVE_LAYOUT_SHIFT_SCORE", ""), ("FIRST_CONTENTFUL_PAINT_MS", "ms")]
        for i, page in enumerate(CWV_URLS):
            for strategy in ("mobile", "desktop"):
                r = reports.get(f"cwv_{strategy}_{i}")
                if not r or r.get("http_status") != 200:
                    lines.append(f"| {page} | {strategy} | unavailable | — | — | — | — | API error, not a pass |")
                    continue
                exp = r["response"].get("loadingExperience") or {}
                scope = "origin fallback" if exp.get("origin_fallback") else ("URL" if exp else "none")
                cells = []
                for key, unit in metric_keys:
                    m = (exp.get("metrics") or {}).get(key)
                    if not m:
                        cells.append("insufficient")
                    elif key == "CUMULATIVE_LAYOUT_SHIFT_SCORE":
                        # CrUX scales CLS by 100 — percentile 1 means 0.01.
                        cells.append(f"{m['percentile'] / 100:.2f}")
                    else:
                        cells.append(f"{m['percentile']}{unit}")
                lines.append(f"| {page} | {strategy} | {scope} | {' | '.join(cells)} | {exp.get('overall_category','insufficient data')} |")
        lines += ["", "A metric shown as `insufficient` has too few field samples to report — a real",
                  "finding, not a failure and not a pass. Local Lighthouse numbers are never a",
                  "substitute; nothing in this table comes from localhost.", ""]

    lines += ["", "CTA occurrences are in organic_cta_clicks.json; never report them as customers.",
              "Signups/first quote/payment cohorts are not joined here. Durable product/payment state remains revenue truth.",
              "GA dimension subtotals are not always additive. Use the directly filtered marketing aggregate.",
              "GSC exports, if available, are AU Web Search only and include anonymised queries in totals but not query rows.",
              "Query tables are paginated to exhaustion (or explicitly flagged TRUNCATED). Query/page sums still differ from property totals.",
              "No rankings forecast or paid-customer count is inferred from these reports. CWV rows, where present, are field data with their scope stated.",
              "Review each JSON http_status and metadata before using the values. Missing/denied data is not zero."]
    (out / "scorecard.md").write_text("\n".join(lines) + "\n")
    print(f"Saved read-only scorecard and report definitions to {out}")
    if reports["organic_marketing"].get("http_status") != 200:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
