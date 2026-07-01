#!/usr/bin/env python3
"""Generate one unique trade x city 'localInsight' paragraph per page (240 total)
via Gemini 2.5 Flash. Stores to seo/local-content.json keyed [tradeSlug][citySlug].
Idempotent: only generates missing pairs unless --force. Concurrent for speed.
"""
import json, os, re, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "seo", "data.json")
OUT = os.path.join(ROOT, "seo", "local-content.json")
VOICE = open(os.path.join(ROOT, "seo", "voice.md")).read()
MODEL = "gemini-2.5-flash"

def api_key():
    for line in open(os.path.join(ROOT, ".env")):
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no GEMINI_API_KEY in .env")

URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key()}"

SCHEMA = {
    "type": "object",
    "properties": {
        "heading": {"type": "string"},
        "body": {"type": "string"},
    },
    "required": ["heading", "body"],
}

def prompt(trade, city, feedback=""):
    jobs = ", ".join(j["name"] if isinstance(j, dict) else j for j in trade["commonJobs"])
    suburbs = ", ".join(city.get("keySuburbs", []))
    return f"""{VOICE}

---

Write ONE short, unique local section for a QuoteMate landing page targeting **{trade['name']} in {city['name']}, {city['state']}**.

Trade: {trade['name']} ({trade['keyword']}). Common jobs: {jobs}. Typical quote range: {trade.get('avgQuoteRange','')}.

Local facts about {city['name']} (use the ones relevant to THIS trade, do not list them all):
- Region: {city.get('region','')}
- Climate: {city.get('climateNote','')}
- Building stock: {city.get('buildingStock','')}
- Key suburbs: {suburbs}
- Licensing: {city.get('stateLicensing','')}
- Demand: {city.get('demandNote','')}

Produce JSON:
- heading: a specific H2 about {trade['keyword']} in {city['name']} (e.g. "What {city['name']} {trade['name'].lower()} quote most"). Must include "{city['name']}".
- body: 70-110 words. Tie THIS trade's work to THIS city specifically — local building stock, climate effects on the work, the suburbs/regions where the work concentrates, and the {city['state']} licensing body where relevant. Be concrete. Mention QuoteMate at most once. End on a concrete detail (a suburb, a standard, a price, or the licensing body). It must read uniquely for {trade['name']} in {city['name']} and not be swappable to another trade or city.

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object.{feedback}"""

def call(p):
    body = {"contents": [{"parts": [{"text": p}]}],
            "generationConfig": {"temperature": 0.85, "responseMimeType": "application/json", "responseSchema": SCHEMA}}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(5):
        try:
            return json.loads(json.loads(urllib.request.urlopen(req, timeout=180).read())["candidates"][0]["content"]["parts"][0]["text"])
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(10 * (attempt + 1)); continue
            time.sleep(4 * (attempt + 1))
        except Exception:
            time.sleep(4 * (attempt + 1))
    return None

# --- Validation gate (mirrors scripts/lib/checklist.ts so this matches the article pipeline) ---
MAX_VALID_ATTEMPTS = 3
BANLIST = [
    "unlock", "harness", "leverage", "empower", "elevate", "supercharge", "turbocharge",
    "unleash", "game-changer", "next-level", "cutting-edge", "state-of-the-art", "world-class",
    "best-in-class", "in today's fast-paced", "navigate the complexities", "delve into", "dive in",
    "let's explore", "moreover", "furthermore", "in conclusion", "to summarise", "as we've seen",
    "robust", "seamless", "streamline", "synergy", "ecosystem", "revolutionise",
    "it's important to note", "it's worth noting",
]
US_ENGLISH = [r"\bcolor\b", r"\bcenter\b", r"\bneighborhood\b", r"\bfavorite\b",
              r"\borganize\b", r"\boptimize\b", r"\bUSD\b", r"\bLowe's\b", r"\bHome Depot\b"]
COMPETITORS = [r"\bTradify\b", r"\bServiceM8\b", r"\bJobber\b", r"\bSimpro\b", r"\bAroFlo\b", r"\bFergus\b"]

def validate(res, city):
    """Return a list of failure strings. Empty list = pass."""
    if not res:
        return ["empty response"]
    heading = (res.get("heading") or "").strip()
    body = (res.get("body") or "").strip()
    fails = []
    if not heading:
        fails.append("missing heading")
    if not body:
        fails.append("missing body")
    if not heading or not body:
        return fails
    text = f"{heading}\n{body}"
    low = text.lower()
    wc = len(body.split())
    if wc < 60:
        fails.append(f"body too short ({wc} words, min 60)")
    if wc > 130:
        fails.append(f"body too long ({wc} words, max 130)")
    cname = city["name"]
    if cname.lower() not in heading.lower():
        fails.append(f'heading must include "{cname}"')
    # Anti-generic: the body must be anchored to this city (city name or a key suburb),
    # so it can't be swapped to another location.
    suburbs = [s.lower() for s in city.get("keySuburbs", [])]
    if cname.lower() not in body.lower() and not any(s in body.lower() for s in suburbs):
        fails.append(f'body must reference {cname} or a local suburb (anti-generic)')
    for w in BANLIST:
        if w in low:
            fails.append(f'banned phrase "{w}"')
    for rx in US_ENGLISH + COMPETITORS:
        m = re.search(rx, text, re.I)
        if m:
            fails.append(f'disallowed term "{m.group(0)}"')
    return fails

def generate(trade, city):
    """Generate, validate, and regenerate with feedback until it passes or attempts run out.
    Returns a valid result or None (None is reported as FAIL and never stored)."""
    feedback = ""
    for _ in range(MAX_VALID_ATTEMPTS):
        res = call(prompt(trade, city, feedback))
        fails = validate(res, city)
        if not fails:
            return res
        feedback = ("\n\nThe previous attempt was REJECTED for: " + "; ".join(fails)
                    + ". Fix every issue listed and return corrected JSON.")
    return None

def main():
    force = "--force" in sys.argv
    data = json.load(open(DATA))
    store = {}
    if os.path.exists(OUT) and not force:
        store = json.load(open(OUT))
    tasks = []
    for t in data["trades"]:
        for c in data["cities"]:
            if not force and store.get(t["slug"], {}).get(c["slug"]):
                continue
            tasks.append((t, c))
    print(f"Generating {len(tasks)} trade x city insights via {MODEL}\n")
    done = 0
    lock_save = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(generate, t, c): (t, c) for t, c in tasks}
        for fut in as_completed(futs):
            t, c = futs[fut]
            res = fut.result()
            done += 1
            if not res:
                print(f"  FAIL {t['slug']}/{c['slug']} (failed validation after {MAX_VALID_ATTEMPTS} attempts; not stored)")
                continue
            store.setdefault(t["slug"], {})[c["slug"]] = res
            if done % 20 == 0:
                json.dump(store, open(OUT, "w"), ensure_ascii=False, indent=2)
                print(f"  ...{done}/{len(tasks)} (saved)")
    json.dump(store, open(OUT, "w"), ensure_ascii=False, indent=2)
    total = sum(len(v) for v in store.values())
    print(f"\nDone. {total} pairs stored in {OUT}")

if __name__ == "__main__":
    main()
