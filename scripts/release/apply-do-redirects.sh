#!/bin/bash
# Merge ONLY the four reviewed redirect rules into the LIVE DigitalOcean app
# spec. Never replaces the live spec with the repository's copy — the live one
# may carry components, routes or env settings the repo file has never seen.
set -euo pipefail
# Backups land outside the repo tree by default; override with SPEC_DIR.
SP="${SPEC_DIR:-${TMPDIR:-/tmp}/quotemate-do-spec}"
mkdir -p "$SP"
STAMP=$(date +%Y%m%d-%H%M%S)

echo "== 1. Identify the app serving quotemateapp.au =="
APP_ID=$(doctl apps list --output json | python3 -c "
import json,sys
apps=json.load(sys.stdin)
for a in apps:
    domains=[d.get('domain','') for d in (a.get('spec',{}).get('domains') or [])]
    ingress=a.get('default_ingress','') or ''
    if any('quotemateapp.au' in d for d in domains) or 'quotemateapp' in ingress:
        print(a['id']); break
else:
    sys.exit('No app found serving quotemateapp.au')
")
echo "   app id: $APP_ID"
doctl apps get "$APP_ID" --format ID,Spec.Name,DefaultIngress,ActiveDeployment.Phase

echo "== 2. Back up the live spec (private, not committed) =="
doctl apps spec get "$APP_ID" > "$SP/live-spec-$STAMP.yaml"
cp "$SP/live-spec-$STAMP.yaml" "$SP/live-spec-ROLLBACK.yaml"
echo "   backed up to $SP/live-spec-$STAMP.yaml ($(wc -l < "$SP/live-spec-$STAMP.yaml") lines)"
echo "   ROLLBACK: doctl apps update $APP_ID --spec $SP/live-spec-ROLLBACK.yaml"

echo "== 3. Merge the four reviewed rules ahead of the catch-all =="
python3 - "$SP/live-spec-$STAMP.yaml" "$SP/merged-spec-$STAMP.yaml" <<'PY'
import json, sys, yaml
spec = yaml.safe_load(open(sys.argv[1]))
redirects = json.load(open('/Users/tom/Documents/GitHub/QuoteMateAppWebsite/seo/redirects.json'))
rules = (spec.setdefault('ingress', {}).setdefault('rules', []) or [])

def is_ours(rule):
    return (rule.get('redirect') or {}).get('uri') in {r['to'] for r in redirects}

# Idempotent: drop any previous copy of these rules before re-inserting.
rules = [r for r in rules if not is_ours(r)]
new = [{'match': {'path': {'prefix': r['from']}},
        'redirect': {'uri': r['to'], 'redirect_code': 301}} for r in redirects]

# Everything that is not a catch-all keeps its position; redirects go in front
# of the first '/' prefix rule, which would otherwise swallow them.
def is_catchall(rule):
    return (rule.get('match') or {}).get('path', {}).get('prefix') == '/'
head = [r for r in rules if not is_catchall(r)]
tail = [r for r in rules if is_catchall(r)]
spec['ingress']['rules'] = head + new + tail
yaml.safe_dump(spec, open(sys.argv[2], 'w'), sort_keys=False, default_flow_style=False)
print(f"   live rules in: {len(rules)}  ->  out: {len(spec['ingress']['rules'])} "
      f"({len(new)} redirects inserted before {len(tail)} catch-all rule(s))")
PY

echo "== 4. Diff for review =="
diff -u "$SP/live-spec-$STAMP.yaml" "$SP/merged-spec-$STAMP.yaml" || true

echo "== 5. Apply =="
if [ "${APPLY:-0}" != "1" ]; then
  echo "   DRY RUN. Re-run with APPLY=1 to push the merged spec."
  exit 0
fi
doctl apps update "$APP_ID" --spec "$SP/merged-spec-$STAMP.yaml" --wait
echo "   applied. Rollback: doctl apps update $APP_ID --spec $SP/live-spec-ROLLBACK.yaml"
