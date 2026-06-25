#!/usr/bin/env python3
"""Generate unique richContent blocks for trade hub pages via Gemini 2.5 Pro.
Reads seo/data.json, generates for any trade missing richContent, writes back.
Idempotent: skips trades that already have richContent unless --force.
"""
import json, os, sys, time, urllib.request, urllib.error, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "seo", "data.json")
VOICE = open(os.path.join(ROOT, "seo", "voice.md")).read()
MODEL = "gemini-2.5-pro"

def api_key():
    for line in open(os.path.join(ROOT, ".env")):
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no GEMINI_API_KEY in .env")

KEY = api_key()
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"

SCHEMA = {
    "type": "object",
    "properties": {
        "intro": {"type": "string"},
        "sections": {
            "type": "array",
            "minItems": 3, "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["heading", "body"],
            },
        },
    },
    "required": ["intro", "sections"],
}

def prompt(trade, example):
    jobs = ", ".join(j["name"] if isinstance(j, dict) else j for j in trade["commonJobs"])
    return f"""{VOICE}

---

You are writing the unique "richContent" block for the QuoteMate landing page targeting **{trade['name']}** (keyword: "{trade['keyword']}") in Australia.

Trade context:
- Description: {trade['description']}
- Pain point: {trade['painPoint']}
- Common jobs: {jobs}
- Typical quote range: {trade.get('avgQuoteRange','')}
- Key features: {", ".join(trade['features'])}

Write:
- intro: 90-120 words. State the quoting job for this trade, who it's for, and what gets quoted wrong. Include the keyword "{trade['keyword']}" naturally in the first 100 words.
- exactly 3 sections, each with a SPECIFIC H2 heading (not generic) and a body of 90-130 words. Lead with the answer, then reasoning. Close each section with a concrete number, AUD price, real Australian supplier (Bunnings, Reece, Tradelink, Beacon, CSR, Bristile, etc.), or an Australian Standard relevant to {trade['name']}. Mention QuoteMate naturally once or twice across the sections, never in every one.

Make the content genuinely specific to {trade['name']} — real materials, real units of measure, real pricing pitfalls for THIS trade. Do NOT reuse generic phrasing that could apply to any trade. Follow the voice guide and banlist strictly.

Here is an EXAMPLE of the depth and style expected (this is for a DIFFERENT trade — do not copy its content, only match its quality and structure):
{json.dumps(example, ensure_ascii=False, indent=2)}

Return ONLY the JSON object matching the schema."""

def call(p):
    body = {
        "contents": [{"parts": [{"text": p}]}],
        "generationConfig": {
            "temperature": 0.8,
            "responseMimeType": "application/json",
            "responseSchema": SCHEMA,
        },
    }
    req = urllib.request.Request(URL, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    for attempt in range(4):
        try:
            r = urllib.request.urlopen(req, timeout=180)
            d = json.loads(r.read())
            txt = d["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(txt)
        except urllib.error.HTTPError as e:
            wait = 5 * (attempt + 1)
            sys.stderr.write(f"  HTTP {e.code}, retry in {wait}s: {e.read()[:200]}\n")
            time.sleep(wait)
        except Exception as e:
            wait = 5 * (attempt + 1)
            sys.stderr.write(f"  err {e}, retry in {wait}s\n")
            time.sleep(wait)
    raise SystemExit("failed after retries")

BANLIST = ["unlock","harness","leverage","empower","elevate","supercharge","unleash",
    "game-changer","next-level","cutting-edge","state-of-the-art","world-class",
    "moreover","furthermore","in conclusion","robust","seamless","streamline","synergy",
    "revolutionise","delve into","dive in","navigate the complexities"]

def check(rc, slug):
    txt = (rc["intro"] + " " + " ".join(s["heading"]+" "+s["body"] for s in rc["sections"])).lower()
    hits = [w for w in BANLIST if w in txt]
    wc = len(txt.split())
    flag = " ⚠ BANLIST:" + ",".join(hits) if hits else ""
    print(f"  {slug}: {wc} words, {len(rc['sections'])} sections{flag}")
    return not hits

def main():
    force = "--force" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    data = json.load(open(DATA))
    example = next(t["richContent"] for t in data["trades"] if t["slug"] == "electricians")
    targets = [t for t in data["trades"]
               if (force or not t.get("richContent"))
               and (not only or t["slug"] in only)]
    print(f"Generating richContent for {len(targets)} trades via {MODEL}\n")
    for t in targets:
        print(f"-> {t['slug']}")
        rc = call(prompt(t, example))
        check(rc, t["slug"])
        t["richContent"] = rc
        json.dump(data, open(DATA, "w"), ensure_ascii=False, indent=2)
    print("\nDone. Wrote", DATA)

if __name__ == "__main__":
    main()
