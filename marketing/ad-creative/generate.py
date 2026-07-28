import base64, json, os, sys, urllib.request

KEY = os.environ["GEMINI_API_KEY"]
MODEL = "gemini-3-pro-image"
OUT = "/Users/tom/Documents/GitHub/QuoteMateAppWebsite/marketing/ad-creative"
os.makedirs(OUT, exist_ok=True)

# House rules appended to EVERY prompt. Each line exists because a previous
# round shipped the exact mistake it forbids (QA 2026-07-27):
#   - fake browser chrome/URL bars read as impersonating a real publication
#   - a Facebook Like button + "1.2k" was baked into qm-c2-news: Meta bans ads
#     that mimic its own UI or fabricate social proof — instant rejection risk
#   - burned-in dates went stale immediately (qm-b1-news "OCTOBER 26, 2024",
#     qm-a1-inset "2023-10-26") on ads whose whole angle is "breaking news"
#   - half-legible micro-text always garbles: qm-f1-news shipped a calendar with
#     "Tuesdey", duplicate dates, and a Tennessee address in an ad for Aussies
#   - qm-b2-inset grew a third arm; qm-b2-ute-driveway was left-hand drive
HOUSE_RULES = (
    " STRICT REQUIREMENTS. "
    "No browser window, no address bar, no URL, no tabs, no window controls, no scrollbars. "
    "No social media interface of any kind: no Like/Share/Comment buttons, no reaction icons, "
    "no follower or engagement counts. "
    "No bylines, no author names, no datelines, no timestamps, no dates anywhere in the image, "
    "and no camera date stamp burned into the photo. "
    "No real company names, logos, brand marks or vehicle badges; clothing and equipment must be unbranded. "
    "Text rule: any text in the image is either one of the exact strings specified above, rendered "
    "large and perfectly legible and spelled correctly, or else genuinely out of focus and unreadable. "
    "Never render small half-legible pseudo-text, invented words, or fake fine print. "
    "Do not render calendars, dense tables, or paragraphs of body copy. "
    "Anatomy: every person has exactly two arms and two hands, with five fingers per hand. "
    "Never show more limbs than the number of people in frame allows. "
    "Setting is Australia: any vehicle is right-hand drive with the steering wheel on the RIGHT, "
    "and any address or place name is Australian - never a US state, ZIP code or city."
)

ADS = {
    "qm-a1-kitchen-9pm": (
        "Candid smartphone photo taken at night in an ordinary Australian home kitchen. "
        "A tradesperson still wearing a hi-vis work shirt sits at the kitchen table at night, "
        "hunched over a laptop surrounded by crumpled paper quotes, a calculator and a cooling mug of coffee. "
        "A small digital clock on the kitchen bench reads exactly '9:05 PM' in clear digits. "
        "Warm single pendant light, slightly grainy low-light phone-photo quality, imperfect framing, "
        "authentic and unstaged documentary feel. "
        "The photo fills the entire square frame edge to edge - it is NOT shot through a doorway, "
        "and there are no dark vertical bands or borders down the left or right sides. "
        "No text overlays."
    ),
    # Phone screens: keep on-screen content to a few LARGE words. Every attempt
    # at a realistic full document has come back as unreadable grey mush.
    "qm-b2-ute-driveway": (
        "Candid smartphone photo taken from the DRIVER'S seat of an Australian ute parked in a "
        "suburban driveway. This is a right-hand-drive vehicle: the steering wheel and instrument "
        "dials are on the RIGHT of the frame directly in front of the camera, and the empty passenger "
        "seat with a hi-vis vest and work gloves on it is to the LEFT of the frame. "
        "One hand holds up a phone in the centre of the frame. The phone screen is clean and bright "
        "and shows only three things, large and crisply legible: the heading 'QUOTE' at the top, "
        "a big total '$4,850' in the middle, and a blue button reading 'Send quote' at the bottom. "
        "Through the windscreen a brick house with a tiled roof is visible in bright daylight. "
        "Slightly grainy authentic phone-photo look, unstaged. "
        "Exactly one person is present, so only ONE arm and ONE hand are visible in the whole frame. "
        "The centre of the steering wheel is a plain undecorated plastic airbag cover: it carries NO "
        "emblem, NO oval or circular badge, NO logo and NO lettering of any kind. The sun visor and "
        "dashboard carry no stickers or writing."
    ),
    "qm-c1-boots-toolbox": (
        "Candid smartphone photo on an Australian residential construction site: muddy leather work "
        "boots next to a phone propped upright against a scuffed red steel toolbox, timber house "
        "framing in the background. "
        "The phone screen is clean and bright and shows only three things, large and crisply legible: "
        "the heading 'QUOTE' at the top, a big total '$2,480' in the middle, and a blue button reading "
        "'Send quote' at the bottom. Nothing else is written on the screen. "
        "Bright Australian daylight, sawdust and timber offcuts scattered around, shallow depth of "
        "field, grainy authentic phone-photo aesthetic, unstaged. No text overlays."
    ),
    # Editorial-style cards. Fictional masthead only, and NO browser chrome -
    # the advertorial look survives, the impersonation risk does not.
    "qm-b1-news": (
        "A square social media graphic styled like a clean online news article, filling the whole "
        "frame with no browser window around it. White background, slim dark-navy masthead bar "
        "across the top reading 'TRADE WIRE' in small white capitals (fictional masthead). "
        "Bold black sans-serif news headline: 'The quote that took 4 hours just lost to a number "
        "pulled from a hat' with a smaller grey subheadline: 'Tradies are ditching the late-night "
        "quote grind for a 4-minute version'. "
        "Under the text, a news-style photo of a hand pulling a FLAT, slightly creased piece of paper "
        "out of an upturned yellow hard hat on a timber workbench. The paper is held flat and facing "
        "the camera so the handwritten price '$1500' scrawled on it in marker is large and clearly "
        "readable. Crisp editorial layout. All text exactly as specified, spelled correctly."
    ),
    "qm-c2-news": (
        "A square social media graphic styled like a clean online news article, filling the whole "
        "frame with no browser window around it. White background, slim dark-navy masthead bar "
        "across the top reading 'TRADE WIRE' in small white capitals (fictional masthead). "
        "Bold black sans-serif news headline: 'Does a 20-minute job still come with two hours of "
        "paperwork?' with a smaller grey subheadline: 'The job is the easy bit - the quote, the "
        "invoice and the chasing eat the evening'. "
        "Under the text, a news-style photo of a neat new kitchen tap installation beside a messy "
        "thick stack of paperwork on the bench. Three sheets on top of the pile are angled toward "
        "the camera and each carries one large clearly legible word: 'QUOTE', 'INVOICE' and "
        "'JOB SHEET'. Every other sheet is blurred and unreadable. "
        "Nothing appears below the photo - no footer, no buttons, no author line. "
        "Crisp editorial layout. All text exactly as specified, spelled correctly."
    ),
    "qm-e1-news": (
        "A square social media graphic styled like a breaking-news alert card. Dark navy background, a red "
        "banner strip across the top reading 'PRICE ALERT' in white capitals, below it large bold white "
        "sans-serif text: 'Founding tradies lock $49 a month for life' and a smaller light-grey line "
        "underneath: 'Latecomers pay $99 once the founding spots fill'. Text is generously sized and "
        "vertically centred so the card does not look bottom-heavy or empty. "
        "Minimal, high-contrast, professional news-alert layout, no photos."
    ),
    "qm-f1-news": (
        "A square social media graphic styled like a clean online news article, filling the whole "
        "frame with no browser window around it. White background, slim dark-navy masthead bar "
        "across the top reading 'TRADE WIRE' in small white capitals (fictional masthead). "
        "Bold black sans-serif news headline: 'Nearly half of tradie invoices get paid late (the "
        "other half found a fix)' with a smaller grey subheadline: 'The average wait to get paid is "
        "22.6 days - some tradies now take the card payment at the job'. "
        "Under the text, a news-style photo taken at an Australian front door: a tradesperson in a "
        "hi-vis shirt holds out a small plain card reader and a customer taps a bank card against it. "
        "The card reader has a single small green tick light and no writing on it. The bank card is a "
        "plain blank card: it carries NO card-network logo, no interlocking circles, no numbers and no "
        "lettering of any kind. The tradesperson's whole head and face are inside the frame - the top "
        "of the head is NOT cropped off. Warm natural "
        "daylight, real and unstaged. No paperwork, no calendar, no invoice and no desk in the shot. "
        "Crisp editorial layout. All text exactly as specified, spelled correctly."
    ),
    # Native-highlight format (Suby): raw photo + zoomed detail in a red-ringed
    # circle inset + hand-drawn arrow.
    #
    # TWO failure modes, and avoiding one causes the other:
    #  1. The inset must be a TRUE zoom of what the arrow points at. Round one
    #     zoomed a flat sheet while the hand held a crumpled ball.
    #  2. The inset must REVEAL something. Round two made the base detail large
    #     and perfectly legible, so the circle magnified something already
    #     readable - pure decoration that just covers up image area.
    # So: in the BASE photo the detail is small, angled or glare-washed - you can
    # tell a number is there but not read it. The circle is what makes it
    # readable. That is also what keeps these visibly distinct from their plain
    # counterparts (qm-b2-ute-driveway, qm-a1-kitchen-9pm), which matters because
    # >60% creative similarity gets collapsed into one entity by Meta.
    "qm-b2-inset": (
        "Candid smartphone photo from the DRIVER'S seat of an Australian ute parked in a suburban "
        "driveway. This is a right-hand-drive vehicle: the steering wheel is on the RIGHT of the frame. "
        "This is a WIDE interior shot taking in the whole cabin, so the phone is SMALL in the frame. "
        "A hand rests a phone low down near the centre console, tilted away from the camera with "
        "daylight glare washing across the screen: you can tell a quote with a dollar figure and a blue "
        "button is on it, but the screen is small and reflective and the number cannot be read. "
        "Overlaid on the top-right: a large circular inset with a thick red ring containing a zoomed-in, "
        "glare-free close-up of that same phone screen, where '$4,850' and a blue 'Send quote' button "
        "are now big and perfectly readable. A hand-drawn style red arrow points from the circle down to "
        "the small phone. Grainy authentic phone-photo look for the base image, crisp readable detail "
        "inside the circle only. Brick house visible through the windscreen in daylight. "
        "The centre of the steering wheel is a plain undecorated plastic airbag cover: it carries NO "
        "emblem, NO oval or circular badge, NO logo and NO lettering of any kind."
    ),
    "qm-a1-inset": (
        "Candid low-light smartphone photo of a tradesperson in a hi-vis shirt at a kitchen table at "
        "night, hunched over a laptop with crumpled paper quotes and a coffee mug, warm pendant light. "
        "This is a WIDE shot of the whole kitchen taken from the far side of the room, so the small "
        "digital clock on the far bench is TINY in the frame - you can see it is a clock with glowing "
        "digits, but at that distance the time cannot be read. "
        "Overlaid on the top-left: a large circular inset with a thick red ring containing a zoomed-in "
        "close-up of that same small clock, where '9:05 PM' is now big and perfectly readable. "
        "A hand-drawn style red arrow points from the circle across to the tiny clock on the bench. "
        "Grainy authentic phone-photo look, crisp detail inside the circle only. "
        "The papers on the table are blurred and carry no readable text or logos. "
        "The laptop is a plain dark laptop and the back of its lid is completely blank: no illuminated "
        "logo, no fruit symbol, no badge, no lettering. "
        "The person's face is clearly and evenly lit by the pendant light and fully visible - it is not "
        "in heavy shadow, not smudged and not obscured."
    ),
    # Combined format: editorial card WHOSE PHOTO carries the red-circle inset -
    # advertorial thumbnail style, both pattern interrupts at once.
    "qm-b1-news-inset": (
        "A square social media graphic styled like a clean online news article, filling the whole "
        "frame with no browser window around it. White background, slim dark-navy masthead bar "
        "across the top reading 'TRADE WIRE' in small white capitals (fictional masthead). "
        "Bold black sans-serif news headline reading EXACTLY: 'The quote that took 4 hours just lost "
        "to a number pulled from a hat'. Smaller grey subheadline: 'Tradies are ditching the "
        "late-night quote grind for a 4-minute version'. "
        "Below the text, the article photo is a WIDE shot of a whole timber workbench, so the hard hat "
        "and paper sit SMALL within it: a hand lifts a slightly creased piece of paper out of an "
        "upturned yellow hard hat, the paper tilted steeply away from the camera so the handwritten "
        "marker scrawl on it is small and foreshortened - you can see a price is written there but you "
        "cannot read it. Overlaid on the photo's top-right corner is a MODEST red-ringed circular inset "
        "- it spans roughly one quarter of the photo's width, sits entirely inside the photo's bounds, "
        "and does not crop the photo or cover the hand and hard hat - "
        "containing a zoomed, straightened close-up of that SAME piece of paper, where the handwritten "
        "'$1500' is big and perfectly readable. A hand-drawn style red arrow runs from the circle "
        "down to the small paper. Crisp editorial layout. The headline and subheadline text is exactly "
        "as specified and spelled correctly."
    ),
    # TV-broadcast variant (added 29 Jul at Tom's request). He asked for something
    # that looks "super similar" to Seven/Nine - which would be trademark
    # infringement, misleading conduct under Australian Consumer Law, and a Meta
    # policy breach for implying a broadcaster endorsed us. What actually drives
    # the format is the VISUAL GRAMMAR of TV news - breaking flag, lower third,
    # station bug - so this reproduces that with a clearly fictional network.
    # Never name, style or imply a real broadcaster.
    "qm-b1-tvnews": (
        "A square graphic that looks like a still frame captured from an Australian television news "
        "bulletin. The underlying image is field-camera footage of a tradesperson in a hi-vis shirt "
        "standing in front of a suburban brick house on a residential job site in bright daylight, "
        "shot like a TV news reporter's piece to camera. "
        "Across the bottom third sits a broadcast lower-third graphic: on the left a bold red "
        "rectangular flag containing the single word 'BREAKING' in white capitals; beside it a dark "
        "navy bar carrying two lines of white sans-serif text - the first line large and bold in "
        "capitals reading 'TRADIES DITCH THE LATE-NIGHT QUOTE GRIND', the second line smaller reading "
        "'Four-hour quotes now taking four minutes'. Beneath the bar runs a thin lighter-blue strip "
        "with no text on it. "
        "In the top-right corner a small clean station identifier reads 'TW NEWS' in white - this is a "
        "fictional network. Do NOT use, imitate or evoke the name, logo, numerals, colour scheme or "
        "on-screen styling of any real television network or broadcaster. "
        "Subtle broadcast video grain, slightly soft focus, realistic television picture quality. "
        "All text exactly as specified and spelled correctly."
    ),
}

# Optional CLI filter: `python3 generate.py qm-b1-news qm-e1-news` regenerates only those.
if len(sys.argv) > 1:
    ADS = {k: v for k, v in ADS.items() if k in sys.argv[1:]}

for name, prompt in ADS.items():
    body = {
        "contents": [{"parts": [{"text": prompt + HOUSE_RULES}]}],
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
