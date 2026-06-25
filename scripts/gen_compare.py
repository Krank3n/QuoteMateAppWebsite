#!/usr/bin/env python3
"""Generate unique editorial content for compare pages via Gemini 2.5 Pro.
Per competitor: intro + 2 narrative sections + 3 competitor-specific FAQs.
Plus a hub intro block. Stored in seo/compare-content.json.
Idempotent unless --force.
"""
import json, os, re, sys, time, subprocess, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATAF = os.path.join(ROOT, "app", "compare", "data.ts")
OUT = os.path.join(ROOT, "seo", "compare-content.json")
VOICE = open(os.path.join(ROOT, "seo", "voice.md")).read()
MODEL = "gemini-2.5-pro"

def api_key():
    for line in open(os.path.join(ROOT, ".env")):
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no GEMINI_API_KEY in .env")

URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key()}"

COMP_SCHEMA = {
    "type": "object",
    "properties": {
        "intro": {"type": "string"},
        "sections": {"type": "array", "minItems": 2, "maxItems": 2,
            "items": {"type": "object", "properties": {
                "heading": {"type": "string"}, "body": {"type": "string"}},
                "required": ["heading", "body"]}},
        "faqs": {"type": "array", "minItems": 3, "maxItems": 3,
            "items": {"type": "object", "properties": {
                "question": {"type": "string"}, "answer": {"type": "string"}},
                "required": ["question", "answer"]}},
    },
    "required": ["intro", "sections", "faqs"],
}

HUB_SCHEMA = {
    "type": "object",
    "properties": {
        "intro": {"type": "string"},
        "sections": {"type": "array", "minItems": 2, "maxItems": 2,
            "items": {"type": "object", "properties": {
                "heading": {"type": "string"}, "body": {"type": "string"}},
                "required": ["heading", "body"]}},
    },
    "required": ["intro", "sections"],
}

def parse_competitors():
    txt = open(DATAF).read()
    eq = txt.index("=", txt.index("competitors:"))
    start = txt.index("[", eq)
    depth = 0
    for i in range(start, len(txt)):
        if txt[i] == "[": depth += 1
        elif txt[i] == "]":
            depth -= 1
            if depth == 0:
                end = i + 1; break
    arr = txt[start:end]
    js = f"process.stdout.write(JSON.stringify({arr}))"
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def comp_prompt(c):
    feats = "; ".join(f"{f['name']}: QuoteMate={f['quotemate']}, {c['name']}={f['competitor']}" for f in c["features"])
    return f"""{VOICE}

---

Write fair, factual editorial content for the page **QuoteMate vs {c['name']}** (a comparison for Australian tradies). QuoteMate is an AI quoting app for tradies (free plan; Pro $49/month or $328/year flat, no per-user fees).

Facts you must stay consistent with (do not invent competitor weaknesses beyond these):
- {c['name']} description: {c['description']}
- {c['name']} pricing: {c['pricing']}
- Feature comparison: {feats}
- Existing summary: {c['summary']}

Be even-handed. Credit {c['name']} where it is genuinely stronger (e.g. teams, timesheets, dispatch). Do not make legal/defamatory claims. Frame QuoteMate's edge around quoting speed, AI materials, live Australian supplier pricing, and flat pricing.

Produce JSON:
- intro: 80-110 words. Who should read this comparison, and the one-line honest verdict on when {c['name']} fits vs when QuoteMate fits.
- exactly 2 sections, specific H2 + 90-130 word body each:
  1. "Who {c['name']} is best for" — honest, names the type of business it suits.
  2. "Why tradies switch from {c['name']} to QuoteMate" — concrete reasons grounded in the facts above (pricing model, quoting speed, AU supplier pricing). Mention QuoteMate naturally.
- faqs: exactly 3 specific to QuoteMate vs {c['name']} (e.g. migration, pricing for a sole trader, can it replace {c['name']}). Concrete 40-70 word answers grounded in the facts.

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object."""

def hub_prompt(comps):
    names = ", ".join(c["name"] for c in comps)
    return f"""{VOICE}

---

Write the intro editorial for the **QuoteMate vs The Rest** hub page — an index that links to individual comparisons ({names}). Audience: Australian tradies choosing quoting/job-management software.

Produce JSON:
- intro: 90-120 words. What this page helps a tradie decide, and the honest framing (most of these tools are solid job-management platforms; QuoteMate is purpose-built for fast quoting on a flat price). Do not bag the competitors.
- exactly 2 sections, specific H2 + 90-130 word body each:
  1. "What to look for in a tradie quoting app" — the real decision factors (pricing model per-user vs flat, quoting speed, local supplier pricing, GST/ABN handling, offline use).
  2. "Where QuoteMate fits" — honest positioning: who it's best for (sole traders, small crews) and who might need a heavier team platform instead.

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object."""

def call(p, schema):
    body = {"contents": [{"parts": [{"text": p}]}],
            "generationConfig": {"temperature": 0.75, "responseMimeType": "application/json", "responseSchema": schema}}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(5):
        try:
            return json.loads(json.loads(urllib.request.urlopen(req, timeout=200).read())["candidates"][0]["content"]["parts"][0]["text"])
        except Exception as e:
            sys.stderr.write(f"  err {e}\n"); time.sleep(5 * (attempt + 1))
    return None

BAN = ["unlock","harness","leverage","empower","supercharge","game-changer","cutting-edge",
    "moreover","furthermore","robust","seamless","streamline","synergy","revolutionise","delve into"]

def main():
    force = "--force" in sys.argv
    comps = parse_competitors()
    store = json.load(open(OUT)) if os.path.exists(OUT) and not force else {}
    print(f"Compare content via {MODEL}\n")
    for c in comps:
        if not force and store.get(c["slug"]): continue
        print(f"-> {c['slug']}")
        res = call(comp_prompt(c), COMP_SCHEMA)
        if not res: print("   FAIL"); continue
        txt = json.dumps(res).lower()
        hits = [w for w in BAN if w in txt]
        if hits: print("   ⚠ banlist:", hits)
        store[c["slug"]] = res
        json.dump(store, open(OUT, "w"), ensure_ascii=False, indent=2)
    if force or "_hub" not in store:
        print("-> _hub")
        res = call(hub_prompt(comps), HUB_SCHEMA)
        if res:
            store["_hub"] = res
            json.dump(store, open(OUT, "w"), ensure_ascii=False, indent=2)
    print(f"\nDone. {len(store)} entries in {OUT}")

if __name__ == "__main__":
    main()
