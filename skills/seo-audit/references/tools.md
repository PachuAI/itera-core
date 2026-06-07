# Herramientas de validación SEO

Agrupadas por objetivo. Para cada audit, usar las relevantes y dejar link/output en el reporte como evidencia.

## Meta tags y renderizado

| Herramienta | URL | Para qué |
|---|---|---|
| Google Rich Results Test | https://search.google.com/test/rich-results | JSON-LD, rich snippets eligibility, rendered HTML |
| Schema Markup Validator | https://validator.schema.org/ | Schema.org puro (más estricto que Rich Results) |
| URL Inspection (GSC) | Search Console UI | Rendered HTML Googlebot, coverage status, indexability |
| `curl` + grep | CLI | Raw HTML inspection. Ej: `curl -s URL \| grep -E '(canonical\|og:\|twitter:)'` |
| View Source / DevTools | Browser | Meta tags, DOM, canonical location (head vs body) |

## Open Graph y Twitter Cards

| Herramienta | URL | Para qué |
|---|---|---|
| Facebook Sharing Debugger | https://developers.facebook.com/tools/debug/ | OG preview FB/Instagram/WhatsApp. Re-scrape cache |
| Twitter Card Validator | https://cards-dev.twitter.com/validator | (requiere login) Twitter card preview |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | LinkedIn share preview |
| OpenGraph.xyz | https://www.opengraph.xyz/ | Preview multi-plataforma sin login |

## Core Web Vitals y performance

| Herramienta | URL | Para qué |
|---|---|---|
| PageSpeed Insights | https://pagespeed.web.dev/ | CrUX field data + Lighthouse lab. Mobile/Desktop |
| Lighthouse (DevTools o CLI) | `pnpm exec lighthouse URL --view` | Lab data detallado. Accessibility/SEO/PWA/Best Practices |
| Chrome UX Report (CrUX) | https://developer.chrome.com/docs/crux | Dashboard real user metrics |
| web-vitals JS library | `pnpm add web-vitals` | RUM custom. Enviar a GA4/Axiom/etc |
| WebPageTest | https://www.webpagetest.org/ | Waterfall, filmstrip, multiple locations |
| Chrome DevTools > Performance | DevTools | LCP element, long tasks, layout shifts |

## Sitemap y robots.txt

| Herramienta | URL | Para qué |
|---|---|---|
| GSC Sitemaps | Search Console | Submit + coverage report |
| GSC Robots.txt tester | https://support.google.com/webmasters/answer/6062598 | Test URLs bloqueadas/permitidas |
| XML Sitemap Validator | https://www.xml-sitemaps.com/validate-xml-sitemap.html | Sintaxis XML |
| `curl host/robots.txt` + `host/sitemap.xml` | CLI | Raw inspection por host (crítico multi-tenant) |

## Accesibilidad (factor SEO 2025)

| Herramienta | URL | Para qué |
|---|---|---|
| Lighthouse Accessibility | DevTools o CLI | Score A11Y + issues específicos |
| axe DevTools | Browser extension | Automated + manual a11y testing |
| WAVE | https://wave.webaim.org/ | Visual a11y overlay |
| WebAIM Contrast Checker | https://webaim.org/resources/contrastchecker/ | WCAG AA/AAA contrast ratio |
| NVDA / VoiceOver / JAWS | Native | Manual screen reader testing |

## Crawling y site audit

| Herramienta | URL | Para qué |
|---|---|---|
| Screaming Frog SEO Spider | https://www.screamingfrog.co.uk/seo-spider/ | Crawl full site. 500 URLs free. Duplicate titles/descriptions, redirect chains, broken links |
| Sitebulb | https://sitebulb.com/ | Visual crawler, hint engine |
| Ahrefs Site Audit | https://ahrefs.com/site-audit | Cloud crawler + backlinks (pago) |
| SEMrush Site Audit | https://www.semrush.com/ | Idem (pago) |

## Multi-plataforma search consoles

| Herramienta | URL | Para qué |
|---|---|---|
| Google Search Console | https://search.google.com/search-console | Property verification, performance, coverage, CWV, sitemaps, URL inspection |
| Bing Webmaster Tools | https://www.bing.com/webmasters | Bing + Yahoo + DuckDuckGo indirect |
| Yandex Webmaster | https://webmaster.yandex.com/ | Yandex (Rusia, si aplica) |

## AI search / AEO / GEO (2026)

| Herramienta | URL | Para qué |
|---|---|---|
| Google AI features guide | https://developers.google.com/search/docs/fundamentals/ai-optimization-guide | Postura OFICIAL de Google sobre IA en Search (qué sí / qué no — anti-humo GEO) |
| Bing Webmaster Tools + IndexNow | https://www.bing.com/webmasters · https://www.bing.com/indexnow | Índice de Bing (alimenta ChatGPT/Copilot search) + envío instantáneo |
| IndexNow.org | https://www.indexnow.org/ | Spec + key file + endpoint de ping (Bing/Yandex/Naver/Seznam/Yep) |
| OpenAI bots docs | https://developers.openai.com/api/docs/bots | Tokens exactos GPTBot/OAI-SearchBot/ChatGPT-User/OAI-AdsBot |
| Anthropic crawler docs | https://support.claude.com/en/articles/8896518 | Tokens ClaudeBot/Claude-User/Claude-SearchBot |
| Cloudflare AI Audit / Radar | https://radar.cloudflare.com/ | Tráfico real de AI crawlers + gestión de acceso (Content Signals) |
| AI visibility trackers (3rd party, pago) | Profound · Otterly.ai · Peec AI · Semrush AI Toolkit | Trackear citas/menciones en ChatGPT/Perplexity/AI Overviews |
| llms.txt (informativo) | https://llmstxt.org/ | Spec del archivo — recordar: NO es señal SEO para Google |

## Analytics y tracking

| Herramienta | URL | Para qué |
|---|---|---|
| GA4 | https://analytics.google.com/ | Behavior + conversions. Link con GSC |
| GTM | https://tagmanager.google.com/ | Centralizar scripts 3rd party |
| Plausible/Umami/Fathom | Self-host o SaaS | Privacy-first analytics alternativas |

## Security y SSL

| Herramienta | URL | Para qué |
|---|---|---|
| SSL Labs Test | https://www.ssllabs.com/ssltest/ | TLS config, cert chain, protocols |
| Security Headers | https://securityheaders.com/ | HSTS, CSP, X-Frame-Options, etc. |
| Mozilla Observatory | https://observatory.mozilla.org/ | Security scorecard |
| HSTS Preload list | https://hstspreload.org/ | Submit para HSTS preload |

## Multi-tenant y host inspection

| Comando | Para qué |
|---|---|
| `curl -sI https://host/robots.txt` | Headers + body robots por host |
| `curl -sI https://host/sitemap.xml` | Idem sitemap |
| `curl -sA "Googlebot/2.1" URL` | Fake user-agent Googlebot (verifica CSP no bloquea) |
| `curl -sA "facebookexternalhit/1.1" URL` | Fake FB crawler (OG scraping) |
| `curl -sA "Twitterbot" URL` | Fake Twitter crawler |
| `curl -sIA "OAI-SearchBot/1.0; +https://openai.com/searchbot" URL` | Verificar acceso del retrieval bot de ChatGPT |
| `curl -sIA "PerplexityBot/1.0" URL` | Verificar acceso de Perplexity |
| `dig host` / `dig host AAAA` | DNS resolution |

## Next.js específico

| Comando | Para qué |
|---|---|
| `pnpm build` | Ver cuáles rutas son static vs dynamic |
| `grep -r "generateMetadata"` | Auditar dynamic metadata |
| `grep -r "'use client'"` | Buscar client components donde podrían ser server |
| `grep -r "application/ld+json"` | Encontrar JSON-LD inyectado |
| `ls app/**/opengraph-image.*` | OG images dinámicas por route |
| `ls app/**/not-found.*` | Custom 404 per segment |

## Checklist completo de tools por audit

### Audit inicial (nuevo sitio / pre-launch)
1. Rich Results Test en homepage + páginas críticas
2. PageSpeed Insights mobile + desktop
3. `curl` robots.txt + sitemap.xml + favicon por cada host
4. Facebook Sharing Debugger homepage
5. SSL Labs + Security Headers
6. Lighthouse accessibility full run
7. Screaming Frog crawl (500 URLs free si es chico)

### Monitoring continuo (producción)
1. GSC semanal: coverage, CWV, manual actions
2. GA4 bounce rate + conversions
3. Lighthouse CI en PRs críticos
4. Uptime monitoring (sintetico)

### Post-deploy de cambios estructurales
1. URL Inspection GSC en pages afectadas
2. Re-scrape Facebook Debugger si OG cambio
3. Lighthouse diff pre/post
4. Screaming Frog redirect chains audit
