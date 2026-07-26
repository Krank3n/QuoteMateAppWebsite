import base64, json, os, sys, urllib.request

KEY = os.environ["GEMINI_API_KEY"]
MODEL = "gemini-3-pro-image"
OUT = "/Users/tom/Documents/GitHub/QuoteMateAppWebsite/marketing/ad-creative"
os.makedirs(OUT, exist_ok=True)

ADS = {
    "qm-a1-kitchen-9pm": (
        "Candid smartphone photo taken at night in an ordinary Australian home kitchen. "
        "A tradesperson still wearing a hi-vis work shirt sits at the kitchen table at 9pm, "
        "hunched over a laptop surrounded by crumpled paper quotes, a calculator and a cooling mug of coffee. "
        "Warm single pendant light, slightly grainy low-light phone-photo quality, imperfect framing, "
        "authentic and unstaged documentary feel. No text overlays, no logos."
    ),
    "qm-b2-ute-driveway": (
        "Candid over-the-shoulder smartphone photo from the driver's seat of an Australian ute parked in a "
        "suburban driveway. The tradesperson's hand holds a phone displaying a clean professional quote "
        "document (generic layout, small soft-focus text). Through the windscreen a brick house is visible "
        "in bright daylight. Natural glare on the phone screen, slightly grainy authentic phone-photo look, "
        "unstaged. No visible brand logos, no text overlays."
    ),
    "qm-c1-boots-toolbox": (
        "Candid smartphone photo on a residential construction site: muddy leather work boots next to a phone "
        "propped upright against a red steel toolbox, the phone screen showing a clean finished quote document "
        "with generic soft-focus text. Bright Australian daylight, sawdust and timber offcuts scattered around, "
        "shallow depth of field, grainy authentic phone-photo aesthetic, unstaged. No text overlays, no logos."
    ),
    # Breaking-news style cards, v2 headlines (2026-07-26) — see playbook §4a.
    # Generic masthead only — never a real news outlet's name or branding.
    "qm-b1-news": (
        "A square social media graphic styled like a screenshot of an online news article. Clean white "
        "background, slim generic dark-navy masthead bar reading 'TRADE WIRE' in small capitals (fictional "
        "masthead, no real news outlet). Bold black sans-serif news headline: 'The quote that took 4 hours "
        "just lost to a number pulled from a hat' (no repeated words, proofread carefully) with a smaller grey subheadline: 'Tradies are ditching "
        "the late-night quote grind for a 4-minute version'. Under the text, a news-style photo of a hand "
        "pulling a crumpled piece of paper with a scribbled price out of an upturned yellow hard hat on a "
        "workbench. Crisp editorial layout, realistic article screenshot aesthetic. All text exactly as "
        "specified, spelled correctly."
    ),
    "qm-c2-news": (
        "A square social media graphic styled like a screenshot of an online news article. Clean white "
        "background, slim generic dark-navy masthead bar reading 'TRADE WIRE' in small capitals (fictional "
        "masthead, no real news outlet). Bold black sans-serif news headline: 'Does a 20-minute job still "
        "come with two hours of paperwork?' with a smaller grey subheadline: 'The job is the easy bit - "
        "the quote, the invoice and the chasing eat the evening'. Under the text, a news-style photo of a "
        "neat new tapware installation beside a messy thick stack of paper quotes and invoices on a kitchen "
        "bench. Crisp editorial layout, realistic article screenshot aesthetic. All text exactly as "
        "specified, spelled correctly."
    ),
    "qm-e1-news": (
        "A square social media graphic styled like a breaking-news alert card. Dark navy background, a red "
        "banner strip across the top reading 'PRICE ALERT' in white capitals, below it large bold white "
        "sans-serif text: 'Founding tradies lock $49 a month for life' and a smaller light-grey line "
        "underneath: 'Latecomers pay $99 once the founding spots fill'. Minimal, high-contrast, professional "
        "news-alert layout, no photos, no logos of real companies. All text exactly as specified, spelled "
        "correctly."
    ),
    "qm-f1-news": (
        "A square social media graphic styled like a screenshot of an online news article. Clean white "
        "background, slim generic dark-navy masthead bar reading 'TRADE WIRE' in small capitals (fictional "
        "masthead, no real news outlet). Bold black sans-serif news headline: 'Nearly half of tradie "
        "invoices get paid late (the other half found a fix)' with a smaller grey subheadline: 'The average "
        "wait to get paid is 22.6 days - some tradies now take the card payment at the job'. Under the "
        "text, a news-style photo of a wall calendar with days crossed off in red pen next to a paper "
        "invoice on a desk. Crisp editorial layout, realistic article screenshot aesthetic. All text "
        "exactly as specified, spelled correctly."
    ),
    # Native-highlight format (Suby): raw photo + zoomed detail in a red-ringed
    # circle inset + hand-drawn arrow. Double pattern-interrupt; reads as a
    # marked-up shared photo, not an ad.
    "qm-b2-inset": (
        "Candid smartphone photo from the driver's seat of an Australian ute parked in a suburban "
        "driveway, a tradesperson's hand holding a phone showing a quote document, brick house visible "
        "through the windscreen in daylight. Overlaid on the top-right: a large circular inset with a "
        "thick red ring, containing a zoomed-in close-up of the phone screen showing the quote total "
        "'$4,850' and a blue 'Send quote' button. A hand-drawn style red arrow points from the circle "
        "to the phone. Grainy authentic phone-photo look for the base image, crisp readable detail "
        "inside the circle. The text '$4,850' and 'Send quote' spelled exactly as specified. Steering wheel "
        "and dashboard plain, NO vehicle brand badge or emblem anywhere. No other "
        "text overlays, no logos."
    ),
    "qm-a1-inset": (
        "Candid low-light smartphone photo of a tradesperson in a hi-vis shirt at a kitchen table at "
        "night, hunched over a laptop with crumpled paper quotes and a coffee mug, warm pendant light. "
        "Overlaid on the top-left: a large circular inset with a thick red ring containing a zoomed-in "
        "close-up of a digital clock reading '9:05 PM'. A hand-drawn style red arrow points from the "
        "circle toward the clock in the background of the photo. Grainy authentic phone-photo look, "
        "crisp detail inside the circle. The clock text '9:05 PM' exactly as specified. No other text "
        "overlays, no logos."
    ),
    # Combined format: breaking-news article card WHOSE PHOTO carries the
    # red-circle inset — advertorial-thumbnail style, both interrupts at once.
    "qm-b1-news-inset": (
        "A square social media graphic styled like a screenshot of an online news article. Clean white "
        "background, slim generic dark-navy masthead bar reading 'TRADE WIRE' in small capitals "
        "(fictional masthead, no real news outlet). Bold black sans-serif news headline reading "
        "EXACTLY: 'The quote that took 4 hours just lost to a number pulled from a hat' — no repeated "
        "words, proofread carefully. Smaller grey subheadline: 'Tradies are ditching the late-night "
        "quote grind for a 4-minute version'. Below the text, the article photo: a hand pulling a "
        "crumpled piece of paper out of an upturned yellow hard hat on a workbench, with a large "
        "red-ringed circular inset overlaid on the photo's top-right corner showing a zoomed close-up "
        "of the crumpled paper with '$1,500' scribbled in marker, and a hand-drawn style red arrow "
        "from the circle to the paper. Crisp editorial layout, realistic article screenshot "
        "aesthetic. All text exactly as specified, spelled correctly."
    ),
}

# Optional CLI filter: `python3 generate.py qm-b1-news qm-e1-news` regenerates only those.
if len(sys.argv) > 1:
    ADS = {k: v for k, v in ADS.items() if k in sys.argv[1:]}

for name, prompt in ADS.items():
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "1:1"},
        },
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"{name}: HTTP {e.code} {e.read()[:300]}")
        continue
    saved = False
    for part in resp.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            path = f"{OUT}/{name}.png"
            with open(path, "wb") as f:
                f.write(base64.b64decode(part["inlineData"]["data"]))
            print(f"{name}: saved {path} ({os.path.getsize(path)//1024} KB)")
            saved = True
    if not saved:
        print(f"{name}: no image in response: {json.dumps(resp)[:300]}")
