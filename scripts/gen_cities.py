#!/usr/bin/env python3
"""Enrich each city in seo/data.json with unique local fields via Gemini 2.5 Pro.
Adds: region, climateNote, buildingStock, keySuburbs[], stateLicensing, demandNote.
Idempotent: skips cities already enriched unless --force.
"""
import json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "seo", "data.json")
VOICE = open(os.path.join(ROOT, "seo", "voice.md")).read()
MODEL = "gemini-2.5-pro"

def api_key():
    for line in open(os.path.join(ROOT, ".env")):
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no GEMINI_API_KEY in .env")

URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key()}"

SCHEMA = {
    "type": "object",
    "properties": {
        "region": {"type": "string"},
        "climateNote": {"type": "string"},
        "buildingStock": {"type": "string"},
        "keySuburbs": {"type": "array", "items": {"type": "string"}, "minItems": 5, "maxItems": 8},
        "stateLicensing": {"type": "string"},
        "demandNote": {"type": "string"},
    },
    "required": ["region", "climateNote", "buildingStock", "keySuburbs", "stateLicensing", "demandNote"],
}

NEW_FIELDS = ["region", "climateNote", "buildingStock", "keySuburbs", "stateLicensing", "demandNote"]

def prompt(city):
    return f"""{VOICE}

---

You are writing structured local facts about **{city['name']}, {city['state']}** ({city['description']}, population {city['population']}) for QuoteMate, an Australian tradie quoting app. These facts will be woven into landing pages for many different trades working in {city['name']}, so they must be true, specific, and useful to a tradie pricing a local job.

Produce JSON with:
- region: the broader region/metro descriptor (e.g. "Greater Western Sydney and the Illawarra"). One short phrase.
- climateNote: 1-2 sentences on the local climate and how it affects building/repair work and seasonal demand for trades (e.g. coastal salt corrosion, frost, cyclone/bushfire exposure, humidity). Concrete to {city['name']}.
- buildingStock: 1-2 sentences on the typical housing/building stock tradies work on here (e.g. Federation terraces, post-war brick veneer, high-rise apartments, Queenslanders, new estates). Specific to {city['name']}.
- keySuburbs: 5-8 real suburbs or local government areas where trade work is common (mix of inner and outer).
- stateLicensing: 1-2 sentences naming the actual {city['state']} licensing/regulatory body tradies deal with (e.g. NSW Fair Trading, QBCC, VBA, CBOS, Service SA, Access Canberra) and what it means for quoting/compliance.
- demandNote: 1-2 sentences on what's driving local trade demand right now (e.g. renovation booms, new housing estates, ageing infrastructure, storm repair, apartment growth). Specific to {city['name']}.

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object."""

def call(p):
    body = {"contents": [{"parts": [{"text": p}]}],
            "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json", "responseSchema": SCHEMA}}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(4):
        try:
            return json.loads(json.loads(urllib.request.urlopen(req, timeout=180).read())["candidates"][0]["content"]["parts"][0]["text"])
        except Exception as e:
            wait = 5 * (attempt + 1)
            sys.stderr.write(f"  err {e}, retry in {wait}s\n"); time.sleep(wait)
    raise SystemExit("failed after retries")

def main():
    force = "--force" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    data = json.load(open(DATA))
    targets = [c for c in data["cities"]
               if (force or not all(f in c for f in NEW_FIELDS))
               and (not only or c["slug"] in only)]
    print(f"Enriching {len(targets)} cities via {MODEL}\n")
    for c in targets:
        print(f"-> {c['slug']}")
        res = call(prompt(c))
        for f in NEW_FIELDS:
            c[f] = res[f]
        print(f"   region: {res['region']} | suburbs: {', '.join(res['keySuburbs'])}")
        json.dump(data, open(DATA, "w"), ensure_ascii=False, indent=2)
    print("\nDone. Wrote", DATA)

if __name__ == "__main__":
    main()
