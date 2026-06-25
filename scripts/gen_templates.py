#!/usr/bin/env python3
"""Generate unique richContent + template-specific FAQs for every quote template.
Reads templates from seo/data.json AND lib/extraTemplates.ts.
Stores to seo/template-content.json keyed by template slug.
Idempotent: only generates missing slugs unless --force. Concurrent.
"""
import json, os, re, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "seo", "data.json")
EXTRA = os.path.join(ROOT, "lib", "extraTemplates.ts")
OUT = os.path.join(ROOT, "seo", "template-content.json")
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
        "intro": {"type": "string"},
        "sections": {
            "type": "array", "minItems": 2, "maxItems": 2,
            "items": {"type": "object", "properties": {
                "heading": {"type": "string"}, "body": {"type": "string"}},
                "required": ["heading", "body"]},
        },
        "faqs": {
            "type": "array", "minItems": 3, "maxItems": 3,
            "items": {"type": "object", "properties": {
                "question": {"type": "string"}, "answer": {"type": "string"}},
                "required": ["question", "answer"]},
        },
    },
    "required": ["intro", "sections", "faqs"],
}

def load_templates():
    out = []
    out += json.load(open(DATA))["quoteTemplates"]
    txt = open(EXTRA).read()
    start = txt.index("=", txt.index("extraTemplates"))
    arr = txt[txt.index("[", start):txt.rindex("]") + 1]
    out += json.loads(arr)
    return out

def prompt(t):
    job = re.sub(r"\s*Quote Template$", "", t["name"], flags=re.I)
    return f"""{VOICE}

---

Write unique supporting content for a QuoteMate page: the **{t['name']}** (a free quote template for Australian tradies). The job being quoted is: **{job}**. Trade: {t['trade']}.

The page already lists these materials: {", ".join(t['materials'])}
And these quoting steps: {", ".join(t['steps'])}

Do NOT repeat the materials or steps lists. Add the value a tradie needs to actually price this job right.

Produce JSON:
- intro: 80-110 words. Say what this template is for, what {job.lower()} jobs it suits, and the one or two things most often quoted wrong on this job. Include the phrase "{t['keyword']}" naturally.
- exactly 2 sections, each with a SPECIFIC H2 heading and an 90-130 word body:
  1. How to price a {job.lower()} (the real cost drivers — measurements, units, waste factors, labour, with concrete AUD figures and a real Australian supplier such as Bunnings, Reece, Tradelink, Beacon, CSR, Bristile where relevant).
  2. Common mistakes / what gets left off a {job.lower()} quote (specific omitted line items, access/disposal/permit costs, the relevant Australian Standard if any).
- faqs: exactly 3 FAQs specific to {job.lower()} (NOT generic QuoteMate questions). Real questions a tradie or customer asks about quoting this job, with concrete 40-70 word answers. End answers on a number, supplier, or standard where possible.

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object."""

def call(p):
    body = {"contents": [{"parts": [{"text": p}]}],
            "generationConfig": {"temperature": 0.8, "responseMimeType": "application/json", "responseSchema": SCHEMA}}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(5):
        try:
            return json.loads(json.loads(urllib.request.urlopen(req, timeout=200).read())["candidates"][0]["content"]["parts"][0]["text"])
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(15 * (attempt + 1)); continue
            time.sleep(5 * (attempt + 1))
        except Exception:
            time.sleep(5 * (attempt + 1))
    return None

BAN = ["unlock","harness","leverage","empower","supercharge","unleash","game-changer",
    "next-level","cutting-edge","state-of-the-art","world-class","moreover","furthermore",
    "robust","seamless","streamline","synergy","revolutionise","delve into","dive in"]

def banhits(rc):
    txt = (rc["intro"] + " " + " ".join(s["heading"]+s["body"] for s in rc["sections"]) +
           " " + " ".join(f["question"]+f["answer"] for f in rc["faqs"])).lower()
    return [w for w in BAN if w in txt]

def main():
    force = "--force" in sys.argv
    templates = load_templates()
    store = {}
    if os.path.exists(OUT) and not force:
        store = json.load(open(OUT))
    todo = [t for t in templates if force or t["slug"] not in store]
    print(f"Generating content for {len(todo)} templates via {MODEL}\n")
    done = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(call, prompt(t)): t for t in todo}
        for fut in as_completed(futs):
            t = futs[fut]; res = fut.result(); done += 1
            if not res:
                print(f"  FAIL {t['slug']}"); continue
            hits = banhits(res)
            store[t["slug"]] = res
            tag = f" ⚠ {hits}" if hits else ""
            print(f"  [{done}/{len(todo)}] {t['slug']}{tag}")
            if done % 10 == 0:
                json.dump(store, open(OUT, "w"), ensure_ascii=False, indent=2)
    json.dump(store, open(OUT, "w"), ensure_ascii=False, indent=2)
    print(f"\nDone. {len(store)} templates stored in {OUT}")

if __name__ == "__main__":
    main()
