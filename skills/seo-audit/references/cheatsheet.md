# SEO Cheatsheet — Tamaños y Valores Canónicos

Referencia rápida de valores exactos. Para contexto/validacion completa, ver `checklist.md`.

## Meta tags básicos

| Item | Valor canónico |
|---|---|
| `<title>` | 50-60 chars (truncation varies by device) |
| `<meta description>` | 150-160 chars |
| `lang` attribute | BCP 47 (`es-AR`, `en-US`) |
| `charset` | `utf-8` |
| Viewport | `width=device-width, initial-scale=1` |
| Canonical URL | Absoluta, con `https://`, en `<head>` (NO `<body>`) |

## Open Graph (Facebook, LinkedIn, WhatsApp preview)

| Item | Valor canónico |
|---|---|
| `og:image` recomendado | **1200x630** (aspect 1.91:1), < 8MB |
| `og:image:secure_url` | Mismo URL con HTTPS |
| `og:image` formato | JPG, PNG, WebP (NO SVG) |
| `og:locale` | `es_AR` (**underscore**, NO guion) |
| `og:type` valores | `website`, `article`, `product`, `profile`, `video`, `music`, `book` |

## Twitter / X Cards

| Item | Valor canónico |
|---|---|
| `summary_large_image` | **1200x675** (16:9) o 1200x600 (2:1) |
| `summary` thumbnail | **240x240** (1:1) |
| `twitter:image` min | 300x157 |
| `twitter:image` max | 4096x4096, < 5MB |
| `twitter:title` | ≤ 70 chars |
| `twitter:description` | ≤ 200 chars |
| Formatos | JPG, PNG, WebP, GIF |

## Favicons e iconos

| Item | Valor canónico |
|---|---|
| Favicon mínimo Google (SERP) | 8x8 (recomendado ≥ 48x48, multiplos de 48) |
| `favicon.ico` | Multisize ICO (16x16 + 32x32) |
| `icon.png` (Next.js) | 32x32 tipico (Next: cualquier tamaño valido, debe MATCHEAR manifest) |
| `apple-icon.png` | **180x180** |
| PWA icon mínimo | 192x192 + 512x512 |
| PWA icons recomendados | 48, 72, 96, 128, 144, 152, 192, 384, 512 |
| Maskable icon | ≥ 512x512, safe zone 72% central |
| Formato icons | PNG (raster) o SVG con `sizes="any"` |

## Core Web Vitals 2026 (p75)

> Sin cambios respecto a 2024-2025: siguen LCP/INP/CLS. NO hay métrica sucesora oficial (el "VSI/Visual Stability Index" de algunos blogs no existe en web.dev).

| Métrica | Good | Needs Improvement | Poor |
|---|---|---|---|
| **LCP** | ≤ 2500ms | 2501–4000ms | > 4000ms |
| **INP** (reemplazo FID Mar 2024) | ≤ 200ms | 201–500ms | > 500ms |
| **CLS** | ≤ 0.1 | 0.11–0.25 | > 0.25 |
| **TTFB** (supplementary) | ≤ 800ms | 801–1800ms | > 1800ms |
| **FCP** (supplementary) | ≤ 1800ms | 1801–3000ms | > 3000ms |

## Sitemap

| Item | Valor canónico |
|---|---|
| Max URLs per sitemap | **50,000** |
| Max file size | **50MB** uncompressed |
| Encoding | UTF-8 |
| `lastmod` format | W3C datetime (`2026-04-17` o `2026-04-17T10:00:00-03:00`) |
| `changefreq`/`priority` | **Ignorados por Google** (mantener solo si otros crawlers los usan) |

## Robots.txt

| Item | Valor canónico |
|---|---|
| Max size | 500KB |
| Location | Root: `https://host/robots.txt` (NO subdir) |
| Scope | Protocol + host + port (por subdomain en multi-tenant) |
| `Crawl-delay` | Ignorado por Google (Bing/Yandex lo respetan) |

## AI crawlers (robots.txt, 2026)

> Retrieval/search bots = traen tráfico de citas (allow) · training bots = decisión de negocio. Verificá el token exacto en la doc oficial del proveedor (cambian seguido).

| Proveedor | Token robots.txt | Tipo | Política típica |
|---|---|---|---|
| OpenAI | `GPTBot` | Training | Decisión de negocio |
| OpenAI | `OAI-SearchBot` | Retrieval (ChatGPT search) | **Allow** |
| OpenAI | `ChatGPT-User` | User-triggered fetch | **Allow** |
| OpenAI | `OAI-AdsBot` | Validación landing de ads | Allow |
| Anthropic | `ClaudeBot` | Training | Decisión de negocio |
| Anthropic | `Claude-User` | User-triggered fetch | **Allow** |
| Anthropic | `Claude-SearchBot` | Retrieval (indexing) | **Allow** |
| Anthropic | `Claude-Web`, `anthropic-ai` | **DEPRECADOS** | — |
| Google | `Googlebot` | Search + AI Overviews | **NUNCA bloquear** |
| Google | `Google-Extended` | Training Gemini | Decisión (NO afecta Search) |
| Perplexity | `PerplexityBot`, `Perplexity-User` | Retrieval | **Allow** |
| Apple | `Applebot-Extended` | Training | Decisión de negocio |
| Amazon | `Amazonbot` | Crawl | Decisión |
| Meta | `Meta-ExternalAgent` | Training | Decisión |
| Common Crawl | `CCBot` | Training (dataset) | Decisión |
| ByteDance | `Bytespider` | Training (ignora reglas) | **Block** (WAF/CDN) |

**Footgun**: `Google-Extended` ≠ `Googlebot`. Bloquear Google-Extended NO afecta indexación/ranking en Google Search; bloquear Googlebot saca de Search **y** de AI Overviews.

## IndexNow (motores no-Google)

| Item | Valor canónico |
|---|---|
| Soportan | Bing, Yandex, Naver, Seznam, Yep (**Google NO**, feb-2026) |
| Key file | `{key}.txt` accesible en root del host |
| Endpoint ping | `https://api.indexnow.org/indexnow?url={url}&key={key}` |
| Cuándo pingear | create / update / delete de contenido |
| Para Google | Seguir con sitemap + GSC (IndexNow no aplica) |
| Relevancia IA | ChatGPT/Copilot search usan índice de Bing → IndexNow acelera presencia |

## Structured data (JSON-LD)

| Item | Valor canónico |
|---|---|
| `Organization.logo` min | 112x112px |
| `Article.image` min | 50K pixels (width × height) |
| `Article.image` aspect ratios | 16:9, 4:3, 1:1 (tres variantes ideal) |
| `Product.image` min | 1200x800 (recomendado) |
| `Event.image` min | 720px ancho (ideal 1920px) |
| `LocalBusiness.geo` precision | 5+ decimal places |
| `priceRange` max chars | 100 |
| `priceCurrency` | ISO 4217 (`ARS`, `USD`, `EUR`) |
| `addressCountry` | ISO 3166-1 Alpha-2 (`AR`) |
| `lang` / `locale` | BCP 47 (`es-AR`) |
| Date fields | ISO 8601 con timezone (`2026-04-17T10:00:00-03:00`) |
| `BreadcrumbList` position | Empieza en 1, sequential |
| `BreadcrumbList` min items | 2 |

## Deprecados — NO usar

| Item | Nota |
|---|---|
| `WebSite.potentialAction` SearchAction | Deprecado Nov 2024, sitelinks search box ya no se renderiza |
| `<meta name="keywords">` | Ignorado por Google desde 2009 |
| `rel=next/prev` en pagination | Deprecado, usar canonical al listing principal |
| `msapplication-*` meta tags | Edge Chromium no los necesita |
| Safari `mask-icon` para pinned tabs | Safari moderno no lo requiere |
| `FID` como CWV | Reemplazado por INP en Mar 2024 |
| `nositelinkssearchbox` | Deprecado con el search box |
| `FAQPage` rich results | **No renderiza desde 7-may-2026** (deprecado). Schema válido pero sin rich result; inocuo dejarlo |
| `HowTo` rich results | Deprecado 2023, no renderiza |
| Course info / Estimated salary / Learning video / Special announcement / Vehicle listing | Removidos sep-2025 |
| Practice problem | Removido ene-2026 |
| `llms.txt` como señal SEO | Google no lo usa (Illyes/Mueller ~ `keywords` meta); solo DX para IDEs con IA |
| `Claude-Web`, `anthropic-ai` (AI crawlers) | Tokens deprecados; usar `ClaudeBot`/`Claude-User`/`Claude-SearchBot` |
| "VSI/Visual Stability Index" como CWV | NO existe en web.dev — especulación de blogs |

## Imágenes Next/image

| Item | Valor canónico |
|---|---|
| Quality default | 75 |
| Default loading | `lazy` (excepto `priority={true}`) |
| `sizes` prop | **Required** con `fill` |
| Width/Height | **Required** si no `fill` |

## Accesibilidad (WCAG 2.1 AA)

| Item | Valor canónico |
|---|---|
| Contrast text AA | ≥ 4.5:1 |
| Contrast large text (18pt+) | ≥ 3:1 |
| Touch target | ≥ 44x44px |
| Font size mobile | ≥ 16px (evita zoom forzado iOS) |
| Heading hierarchy | h1 único, sin skip h1→h3 |

## Redirects

| Item | Valor canónico |
|---|---|
| Permanent | **301** o 308 |
| Temporary | 302 o 307 |
| Gone (removed permanent) | **410** |
| Max redirect hops (Google) | 10 |
| Recomendado | 0-1 hops |

## Hreflang

| Item | Valor canónico |
|---|---|
| Language codes | ISO 639-1 (`es`, `en`) |
| Region codes | ISO 3166-1 Alpha-2 (`AR`, `US`, `GB`) |
| Formato | `es-AR` (**guión**, NO underscore — atención: og:locale si usa underscore) |
| Fallback | `x-default` |
| Script variations | ISO 15924 (`zh-Hans`, `zh-Hant`) |

## HTTP status codes

| Code | Uso SEO |
|---|---|
| 200 | OK, indexable |
| 301 | Permanent redirect (canonical signal pass) |
| 302 | Temporary redirect (NO canonical signal pass) |
| 307 | Temp redirect, preserve method |
| 308 | Permanent, preserve method |
| 404 | Not found (frequency decrease) |
| 410 | Gone (faster deindex) |
| 429 | Too many requests (rate limit) |
| 503 | Service unavailable + Retry-After |

## Currencies ARS (Argentina)

| Item | Valor canónico |
|---|---|
| ISO 4217 code | `ARS` |
| Formato visible | `$1.500` (punto miles, sin decimales) |
| Formato schema (price) | `1500` (integer) |
| Timezone | `America/Argentina/Buenos_Aires` (GMT-3) |

## Limites caracter Google SERP (truncation guidelines)

| Item | Desktop | Mobile |
|---|---|---|
| Title link | ~50-60 chars | ~40-50 chars |
| Meta description | ~155-160 chars | ~120 chars |

## Security headers esenciales

| Header | Valor canónico |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` o CSP `frame-ancestors 'none'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | No bloquear Googlebot; permitir CDN own + `'self'` |
