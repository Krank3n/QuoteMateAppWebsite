#!/usr/bin/env python3
"""Generate one unique trade x city 'localInsight' paragraph per page (240 total)
via Gemini 2.5 Flash. Stores to seo/local-content.json keyed [tradeSlug][citySlug].
Idempotent: only generates missing pairs unless --force. Concurrent for speed.
"""
import json, os, sys, time, urllib.request, urllib.error
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

def prompt(trade, city):
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

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object."""

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
        futs = {ex.submit(call, prompt(t, c)): (t, c) for t, c in tasks}
        for fut in as_completed(futs):
            t, c = futs[fut]
            res = fut.result()
            done += 1
            if not res:
                print(f"  FAIL {t['slug']}/{c['slug']}")
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
