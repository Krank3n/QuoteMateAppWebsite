#!/bin/bash
# Live acceptance checks for the SEO foundation release.
# Read-only: HEAD/GET only, no state changed anywhere.
BASE="https://quotemateapp.au"
pass=0; fail=0
chk() { if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1)); else echo "  FAIL  $1 (got '$2', want '$3')"; fail=$((fail+1)); fi; }

echo "=== 1. Retired URLs: one-hop 301 to the manifest destination ==="
while IFS='|' read -r src dst; do
  for variant in "$src" "$src/"; do
    out=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}|%{redirect_url}" "$BASE$variant")
    code=${out%%|*}; loc=${out#*|}
    printf "%-56s %s -> %s\n" "$variant" "$code" "${loc:-(none)}"
    chk "$variant is 301" "$code" "301"
    # Second hop must be a 200, not another redirect.
    if [ -n "$loc" ]; then
      hop2=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}" "$loc")
      chk "$variant destination is 200 in one hop" "$hop2" "200"
      chk "$variant lands on the manifest destination" "$loc" "$BASE$dst"
    fi
  done
done <<'MAP'
/articles/how-to-quote-a-concrete-driveway|/articles/how-to-quote-concrete-driveway/
/articles/how-to-quote-retaining-wall-installation|/articles/how-to-quote-a-retaining-wall/
/articles/how-to-quote-an-epoxy-floor-coating|/articles/how-to-quote-epoxy-floor-coating/
/articles/how-to-price-a-fence-installation|/articles/how-to-quote-a-fence-installation/
MAP

echo
echo "=== 2. Destinations: 200 + self-canonical ==="
for d in /articles/how-to-quote-concrete-driveway/ /articles/how-to-quote-a-retaining-wall/ /articles/how-to-quote-epoxy-floor-coating/ /articles/how-to-quote-a-fence-installation/; do
  body=$(curl -sS --max-time 25 "$BASE$d")
  code=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}" "$BASE$d")
  canon=$(printf '%s' "$body" | grep -o '<link rel="canonical" href="[^"]*"' | head -1 | sed 's/.*href="//;s/"//')
  printf "%-50s %s canonical=%s\n" "$d" "$code" "$canon"
  chk "$d is 200" "$code" "200"
  chk "$d is self-canonical" "$canon" "$BASE$d"
done

echo
echo "=== 3. Query strings on a redirect (DO replaces the URI — do not assume preservation) ==="
q=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}|%{redirect_url}" "$BASE/articles/how-to-quote-a-concrete-driveway?utm_source=test&gclid=abc")
echo "  with ?utm_source=test&gclid=abc -> $q"

echo
echo "=== 4. Retired URLs absent from the sitemap; destinations present ==="
sm=$(curl -sS --max-time 30 "$BASE/sitemap.xml")
echo "  sitemap URL count: $(printf '%s' "$sm" | grep -c '<loc>')"
for s in how-to-quote-a-concrete-driveway how-to-quote-retaining-wall-installation how-to-quote-an-epoxy-floor-coating how-to-price-a-fence-installation; do
  n=$(printf '%s' "$sm" | grep -c "<loc>$BASE/articles/$s</loc>")
  chk "retired $s absent from sitemap" "$n" "0"
done
for s in how-to-quote-concrete-driveway how-to-quote-a-retaining-wall how-to-quote-epoxy-floor-coating how-to-quote-a-fence-installation; do
  n=$(printf '%s' "$sm" | grep -c "$BASE/articles/$s/")
  chk "destination $s present in sitemap" "$n" "1"
done
echo "  build-time lastmod check: distinct lastmod values = $(printf '%s' "$sm" | grep -o '<lastmod>[^<]*' | sort -u | wc -l | tr -d ' ')"

echo
echo "=== 5. Unrelated pages and app routes still work ==="
for u in / /pricing/ /templates/ /articles/ /trades/ /app /app/ /quotes-for-electrician/ /articles/how-to-quote-a-bathroom-renovation/; do
  code=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}" "$BASE$u")
  printf "  %-44s %s\n" "$u" "$code"
  [ "$code" = "200" ] && pass=$((pass+1)) || { echo "    ^ not 200"; fail=$((fail+1)); }
done

echo
echo "=== 6. Nonexistent URLs still return a genuine 404 ==="
for u in /definitely-not-a-page /articles/not-a-real-article/ /articles/how-to-quote-a-concrete-driveway-extra /templates/nope/; do
  code=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}" "$BASE$u")
  printf "  %-48s %s\n" "$u" "$code"
  chk "$u is 404" "$code" "404"
done

echo
echo "=== 7. All 54 template pages expose working PDF + XLSX ==="
slugs=$(curl -sS --max-time 30 "$BASE/sitemap.xml" | grep -o "$BASE/templates/[a-z0-9-]*/" | sed "s|$BASE/templates/||;s|/$||" | sort -u)
n=0; bad=0
for slug in $slugs; do
  n=$((n+1))
  for ext in pdf xlsx; do
    r=$(curl -sS -o /dev/null --max-time 25 -w "%{http_code}|%{size_download}|%{content_type}" -L "$BASE/assets/quote-templates/$slug.$ext")
    c=${r%%|*}; rest=${r#*|}; sz=${rest%%|*}
    if [ "$c" != "200" ] || [ "$sz" -lt 3000 ]; then echo "  BAD $slug.$ext -> $r"; bad=$((bad+1)); fi
  done
done
echo "  template pages checked: $n; bad downloads: $bad"
chk "every template download is a real file" "$bad" "0"

echo
echo "================ $pass passed, $fail failed ================"
