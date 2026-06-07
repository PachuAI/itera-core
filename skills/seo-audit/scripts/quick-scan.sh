#!/usr/bin/env bash
# quick-scan.sh — scan deterministico SEO
#
# Uso:
#   ./quick-scan.sh <url>
#   ./quick-scan.sh https://shope.ar
#   ./quick-scan.sh https://admin.shope.ar
#
# Genera /tmp/seo-scan-<host>/ con:
#   - index.html (curl HEAD + body head)
#   - robots.txt
#   - sitemap.xml
#   - favicon-check.txt
#   - meta-tags.txt (canonical, og:, twitter:, jsonld)
#   - security-headers.txt
#   - response-times.txt
#   - ai-signals.txt (directivas AI-bots + content-signals)
#   - llms-txt-check.txt (presencia de /llms.txt — informativo)

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "uso: $0 <url>"
  exit 1
fi

URL="$1"
HOST=$(echo "$URL" | sed -E 's|https?://||; s|/.*||')
OUT="/tmp/seo-scan-${HOST}"
mkdir -p "$OUT"

echo "==> SEO scan: $URL"
echo "==> Output: $OUT"

# 1. Response code + timing
echo "==> 1/7 Response code + timing..."
curl -sI -o "$OUT/headers.txt" -w "status=%{http_code}\ntime_total=%{time_total}\nsize=%{size_download}\nredirect=%{redirect_url}\n" "$URL" > "$OUT/response-times.txt"
cat "$OUT/response-times.txt"

# 2. robots.txt
echo "==> 2/7 robots.txt..."
curl -sSf "https://${HOST}/robots.txt" -o "$OUT/robots.txt" 2>/dev/null || echo "(not found)" > "$OUT/robots.txt"

# 3. sitemap.xml
echo "==> 3/7 sitemap.xml..."
curl -sSf "https://${HOST}/sitemap.xml" -o "$OUT/sitemap.xml" 2>/dev/null || echo "(not found)" > "$OUT/sitemap.xml"

# 4. favicon.ico
echo "==> 4/7 favicon..."
curl -sI "https://${HOST}/favicon.ico" > "$OUT/favicon-check.txt" 2>&1 || true
curl -sI "https://${HOST}/icon.png" >> "$OUT/favicon-check.txt" 2>&1 || true
curl -sI "https://${HOST}/apple-icon.png" >> "$OUT/favicon-check.txt" 2>&1 || true

# 5. HTML body (head only) + meta tags
echo "==> 5/7 meta tags..."
curl -sS "$URL" -o "$OUT/index.html"

{
  echo "=== TITLE ==="
  grep -oE '<title[^>]*>[^<]*</title>' "$OUT/index.html" | head -3

  echo ""
  echo "=== DESCRIPTION ==="
  grep -oE '<meta[^>]+name="description"[^>]*>' "$OUT/index.html" | head -3

  echo ""
  echo "=== CANONICAL ==="
  grep -oE '<link[^>]+rel="canonical"[^>]*>' "$OUT/index.html" | head -3

  echo ""
  echo "=== VIEWPORT ==="
  grep -oE '<meta[^>]+name="viewport"[^>]*>' "$OUT/index.html" | head -3

  echo ""
  echo "=== HTML LANG ==="
  grep -oE '<html[^>]*lang=[^>]*>' "$OUT/index.html" | head -1

  echo ""
  echo "=== OG TAGS ==="
  grep -oE '<meta[^>]+property="og:[^"]+"[^>]*>' "$OUT/index.html"

  echo ""
  echo "=== TWITTER TAGS ==="
  grep -oE '<meta[^>]+name="twitter:[^"]+"[^>]*>' "$OUT/index.html"

  echo ""
  echo "=== ROBOTS META ==="
  grep -oE '<meta[^>]+name="robots"[^>]*>' "$OUT/index.html" | head -3

  echo ""
  echo "=== MANIFEST ==="
  grep -oE '<link[^>]+rel="manifest"[^>]*>' "$OUT/index.html" | head -1

  echo ""
  echo "=== JSON-LD SCRIPTS (count) ==="
  grep -c 'application/ld+json' "$OUT/index.html" || echo "0"

  echo ""
  echo "=== H1 COUNT ==="
  grep -oE '<h1[^>]*>' "$OUT/index.html" | wc -l
} > "$OUT/meta-tags.txt"

cat "$OUT/meta-tags.txt"

# 6. Security headers
echo "==> 6/7 security headers..."
{
  echo "=== HSTS ==="
  grep -i "strict-transport-security" "$OUT/headers.txt" || echo "MISSING"
  echo ""
  echo "=== CSP ==="
  grep -i "content-security-policy" "$OUT/headers.txt" || echo "MISSING"
  echo ""
  echo "=== X-Content-Type-Options ==="
  grep -i "x-content-type-options" "$OUT/headers.txt" || echo "MISSING"
  echo ""
  echo "=== X-Frame-Options ==="
  grep -i "x-frame-options" "$OUT/headers.txt" || echo "(may be in CSP frame-ancestors)"
  echo ""
  echo "=== Referrer-Policy ==="
  grep -i "referrer-policy" "$OUT/headers.txt" || echo "MISSING"
} > "$OUT/security-headers.txt"

cat "$OUT/security-headers.txt"

# 7. Crawler simulation (Googlebot UA check)
echo "==> 7/8 googlebot simulation..."
curl -sIA "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "$URL" > "$OUT/googlebot-headers.txt"
STATUS=$(grep -oE 'HTTP/[0-9.]+ [0-9]+' "$OUT/googlebot-headers.txt" | head -1 | grep -oE '[0-9]+$')
echo "Googlebot status: $STATUS"
if [ "$STATUS" != "200" ]; then
  echo "  WARNING: Googlebot got non-200 status"
fi

# 8. AI crawler directives + llms.txt (2026)
echo "==> 8/8 AI signals (AI-bot directives + llms.txt)..."
{
  echo "=== AI-BOT DIRECTIVES EN robots.txt ==="
  grep -iE "GPTBot|OAI-SearchBot|ChatGPT-User|Google-Extended|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|CCBot|Bytespider|Applebot-Extended|Amazonbot|Meta-ExternalAgent" "$OUT/robots.txt" || echo "(ningun AI-bot mencionado — politica = Allow por defecto para todos)"
  echo ""
  echo "=== CONTENT-SIGNALS (Cloudflare, emergente) ==="
  grep -iE "ai-train|ai-input|Content-Signal" "$OUT/robots.txt" || echo "(sin content-signals)"
} > "$OUT/ai-signals.txt"

# llms.txt presence (informativo — NO es senal SEO para Google)
curl -sI "https://${HOST}/llms.txt" > "$OUT/llms-txt-check.txt" 2>&1 || true
{
  echo ""
  echo "=== llms.txt (informativo, NO senal SEO) ==="
  grep -iE "^HTTP/|content-type" "$OUT/llms-txt-check.txt" | head -2 || echo "(no encontrado)"
} >> "$OUT/ai-signals.txt"

cat "$OUT/ai-signals.txt"

echo ""
echo "==> Scan complete. Output: $OUT"
echo "==> Next steps:"
echo "   1. Revisar $OUT/meta-tags.txt para canonical, OG, Twitter, JSON-LD"
echo "   2. Revisar $OUT/security-headers.txt para HSTS, CSP, etc."
echo "   3. Correr PageSpeed Insights: https://pagespeed.web.dev/report?url=$URL"
echo "   4. Correr Rich Results Test: https://search.google.com/test/rich-results?url=$URL"
echo "   5. Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/?q=$URL"
echo "   6. Revisar $OUT/ai-signals.txt (politica AI-bots + llms.txt). Guia IA: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide"
