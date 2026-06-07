Tengo material más que suficiente. Ahora armo el checklist exhaustivo en un solo documento markdown completo.

# SEO Checklist Exhaustivo 2025/2026 - SaaS Multi-Tenant E-commerce (Next.js 16 + React 19)

> Target: Shopear — SaaS multi-tenant de catálogos online con checkout a WhatsApp. Argentina, locale es-AR, tenancy por subdominio (`*.shope.ar`).

---

## Tabla de contenidos

1. [Meta tags / Head básico](#1-meta-tags--head-básico)
2. [Open Graph](#2-open-graph)
3. [Twitter / X Cards](#3-twitter--x-cards)
4. [Structured Data / JSON-LD](#4-structured-data--json-ld)
5. [Sitemap XML](#5-sitemap-xml)
6. [Robots.txt](#6-robotstxt)
7. [Iconos y manifest](#7-iconos-y-manifest)
8. [Core Web Vitals 2025](#8-core-web-vitals-2025)
9. [Performance / Next.js específico](#9-performance--nextjs-específico)
10. [Accesibilidad como factor SEO](#10-accesibilidad-como-factor-seo)
11. [URL structure y arquitectura](#11-url-structure-y-arquitectura)
12. [Redirects y status codes](#12-redirects-y-status-codes)
13. [Internacionalización](#13-internacionalización)
14. [Mobile-first](#14-mobile-first)
15. [Security / trust](#15-security--trust)
16. [E-commerce SEO específico](#16-e-commerce-seo-específico)
17. [Next.js 16 App Router / Metadata API](#17-nextjs-16-app-router--metadata-api)
18. [Google Search Console](#18-google-search-console)
19. [Analytics / Tag Manager](#19-analytics--tag-manager)
20. [Indexing directives](#20-indexing-directives)
21. [E-E-A-T y trust content](#21-e-e-a-t-y-trust-content)
22. [404 y error pages](#22-404-y-error-pages)
23. [Crawl budget](#23-crawl-budget)
24. [RSS / Atom feeds](#24-rss--atom-feeds)
25. [Multi-tenant SEO (crítico Shopear)](#25-multi-tenant-seo-crítico-shopear)
26. [Image SEO](#26-image-seo)
27. [Video SEO](#27-video-seo)
28. [Local SEO](#28-local-seo)
29. [AI Search & Crawlers (AEO/GEO)](#29-ai-search--crawlers-aeogeo)
30. [Cheatsheet de tamaños / valores canónicos](#cheatsheet-de-tamaños--valores-canónicos)

---

## 1. Meta tags / Head básico

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 1.1 | `<meta charset="utf-8">` presente | crítico | Primer tag del `<head>`. En Next.js 16 se agrega automáticamente | DevTools → Elements → `<head>`. `curl -s URL \| head -20` | [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) |
| 1.2 | `<meta name="viewport" content="width=device-width, initial-scale=1">` | crítico | Tag viewport presente en todas las páginas. Next.js 16 lo agrega default | DevTools Elements. Search Console → Mobile Usability | [Next.js generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) |
| 1.3 | `<html lang="es-AR">` en root layout | crítico | Atributo `lang` en tag `<html>` con BCP 47 correcto | `curl -s URL \| grep '<html'` | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 1.4 | `<title>` único por página, 50-60 chars | crítico | Cada ruta tiene title distinto, descriptivo, no genérico ("Home", "Profile") | Screaming Frog, manual. Rich Results Test | [Google Title Link](https://developers.google.com/search/docs/appearance/title-link) |
| 1.5 | `title.template` en root con `%s \| Marca` | alto | Brand al final via template, permite overrides con `absolute` | Revisar layout root: `title: { template: '%s \| Shopear', default: 'Shopear' }` | [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 1.6 | `<meta name="description">` único, 150-160 chars | crítico | No duplicada entre páginas, match con search intent | Screaming Frog duplicate descriptions report | [Google snippets](https://developers.google.com/search/docs/appearance/snippet) |
| 1.7 | `<link rel="canonical">` en cada página | crítico | URL absoluta, self-referencing, coherente cross-method | `curl -s URL \| grep canonical`. Rich Results Test | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| 1.8 | Canonical en `<head>`, no `<body>` | crítico | Debe estar en head o Google lo ignora | DevTools Elements | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| 1.9 | Canonical absoluto con `https://` | crítico | NO usar paths relativos `/producto/x`. SIEMPRE `https://tienda.shope.ar/producto/x` | Regex: `rel="canonical"[^>]*href="https?://` | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| 1.10 | Canonical NO apunta a redirect/noindex | alto | Chain canonical→301→200 confunde Google | Crawler tipo Sitebulb muestra chains | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| 1.11 | `metadataBase: new URL(...)` en root layout | alto | Next.js usa base para paths relativos en `images`, `canonical`, `alternates` | Leer `app/layout.tsx`. Build error si falta | [Next.js metadataBase](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase) |
| 1.12 | `theme-color` via `Viewport` export, soporta dark mode | medio | `themeColor: [{ media: '(prefers-color-scheme: light)', color: '#...' }, ...]` | DevTools → meta[name="theme-color"] | [Next.js Viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) |
| 1.13 | `color-scheme` declarado si corresponde | bajo | `viewport: { colorScheme: 'light dark' }` para modo oscuro | DevTools Elements | [Next.js Viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) |
| 1.14 | NO usar `<meta name="keywords">` | bajo | Google lo ignora desde 2009, ocupa espacio sin valor | `curl -s URL \| grep keywords` — si aparece, remover | [Google special tags](https://developers.google.com/search/docs/crawling-indexing/special-tags) |
| 1.15 | `referrer` policy declarado si necesario | bajo | `referrer: 'origin-when-cross-origin'` o stricter para privacidad | DevTools → meta[name="referrer"] | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 1.16 | `format-detection` deshabilita auto-detect | bajo | `formatDetection: { telephone: false, email: false, address: false }` — evita que iOS auto-linkee teléfonos | DevTools → meta[name="format-detection"] | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 1.17 | No múltiples `<title>` ni `<meta description>` por página | crítico | Solo uno de cada por página | Rich Results Test. `curl -s \| grep -c '<title'` | [Google title-link](https://developers.google.com/search/docs/appearance/title-link) |
| 1.18 | Title no usa solo "\| Marca" vacío | alto | Evitar `<title>\| Shopear</title>` sin contenido específico | Screaming Frog muestra short titles | [Google title-link](https://developers.google.com/search/docs/appearance/title-link) |
| 1.19 | Title NO keyword stuffing | alto | No repetir la misma palabra 3+ veces | Manual review | [Google title-link](https://developers.google.com/search/docs/appearance/title-link) |
| 1.20 | Title matches heading h1 visible | medio | Google chequea visual title match del page | Comparar title vs h1 en DevTools | [Google title-link](https://developers.google.com/search/docs/appearance/title-link) |

---

## 2. Open Graph

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 2.1 | `og:title` en todas las páginas | crítico | Presente y distinto de title cuando convenga | Facebook Sharing Debugger | [OGP spec](https://ogp.me/) |
| 2.2 | `og:type` correcto (`website`, `article`, `product`) | crítico | Landing `website`, blog `article`, producto `product` | Facebook Sharing Debugger | [OGP spec](https://ogp.me/) |
| 2.3 | `og:url` canonical absoluto | crítico | Match con `<link rel="canonical">` | DevTools | [OGP spec](https://ogp.me/) |
| 2.4 | `og:description` 2-4 frases | alto | Único por página, no copy-paste de meta description | Facebook Sharing Debugger | [OGP spec](https://ogp.me/) |
| 2.5 | `og:site_name` en root layout | alto | `Shopear` o nombre de tienda en multi-tenant | DevTools | [OGP spec](https://ogp.me/) |
| 2.6 | `og:locale` con BCP 47 underscore | medio | `es_AR` (underscore, no guion) | DevTools | [OGP spec](https://ogp.me/) |
| 2.7 | `og:image` 1200x630 absoluta | crítico | URL absoluta, dimensiones 1200x630 (aspect 1.91:1) | [Facebook Debugger](https://developers.facebook.com/tools/debug/) | [Next.js OG](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) |
| 2.8 | `og:image:width` y `og:image:height` declarados | alto | Números, permiten render preview sin re-fetch | DevTools | [OGP spec](https://ogp.me/) |
| 2.9 | `og:image:alt` descriptivo | medio | Alt para accesibilidad de imagen OG | DevTools | [OGP spec](https://ogp.me/) |
| 2.10 | `og:image:type` declarado | bajo | `image/png`, `image/jpeg`, `image/webp` | DevTools | [OGP spec](https://ogp.me/) |
| 2.11 | `og:image:secure_url` si HTTPS | bajo | Duplicado en HTTPS; algunos crawlers aún lo leen | DevTools | [OGP spec](https://ogp.me/) |
| 2.12 | Imagen OG < 8MB (FB limit) | alto | File size cap para Facebook crawler | `curl -I IMAGE_URL \| grep -i content-length` | [FB sharing docs](https://developers.facebook.com/docs/sharing/webmasters/images/) |
| 2.13 | `og:image` formato JPG/PNG/WebP | medio | Evitar SVG (algunos crawlers no lo soportan) | DevTools | [OGP spec](https://ogp.me/) |
| 2.14 | `article:published_time` ISO-8601 en tipo article | medio | Date con timezone: `2026-04-17T10:00:00-03:00` | DevTools → `meta[property='article:published_time']` | [OGP article](https://ogp.me/#type_article) |
| 2.15 | `article:modified_time` en updates | medio | Actualizar cuando se edita contenido | DevTools | [OGP article](https://ogp.me/#type_article) |
| 2.16 | `article:author` URL o nombre | medio | Autor del artículo para blog content | DevTools | [OGP article](https://ogp.me/#type_article) |
| 2.17 | `product:price:amount` y `product:price:currency` (OGP product) | medio | ARS / número para e-commerce | DevTools | [OGP product](https://ogp.me/) |
| 2.18 | `og:image` con dominio servidor propio (no user-uploaded sin validar) | medio | Evitar CORS/CDN bloqueado para crawlers | `curl -I` con `User-Agent: facebookexternalhit/1.1` | [FB debugger](https://developers.facebook.com/tools/debug/) |
| 2.19 | `og:image` se genera con ImageResponse dinámico por ruta | alto | Cada producto/categoría tiene OG único (`opengraph-image.tsx`) | Ver archivos en `app/**/opengraph-image.tsx` | [Next.js OG images](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) |
| 2.20 | Fallback `opengraph-image.png` en root layout | alto | Default OG para rutas sin imagen específica | `ls app/opengraph-image.*` | [Next.js OG images](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) |

---

## 3. Twitter / X Cards

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 3.1 | `twitter:card` definido (`summary_large_image` preferido) | crítico | Valores: `summary`, `summary_large_image`, `app`, `player` | Twitter Card Validator | [Moda Twitter card guide](https://moda.app/resources/sizes/twitter-card) |
| 3.2 | `twitter:title` ≤ 70 chars | alto | Breve, descriptivo | Twitter Card Validator | [Twitter cards spec](https://developer.x.com/en/docs/x-for-websites/cards/overview/markup) |
| 3.3 | `twitter:description` ≤ 200 chars | alto | Match intent, complementa title | Twitter Card Validator | [Twitter cards spec](https://developer.x.com/en/docs/x-for-websites/cards/overview/markup) |
| 3.4 | `twitter:image` 1200x675 (16:9) o 1200x600 (2:1) | crítico | Min 300x157, max 4096x4096, < 5MB | Twitter Card Validator | [Moda Twitter card](https://moda.app/resources/sizes/twitter-card) |
| 3.5 | `twitter:image:alt` descriptivo | alto | Accesibilidad | DevTools | [Twitter cards spec](https://developer.x.com/en/docs/x-for-websites/cards/overview/markup) |
| 3.6 | `twitter:site` @handle si aplica | bajo | @handle de la marca (no imprescindible) | DevTools | [Twitter cards spec](https://developer.x.com/en/docs/x-for-websites/cards/overview/markup) |
| 3.7 | `twitter:creator` si hay autor específico | bajo | @autor para articles | DevTools | [Twitter cards spec](https://developer.x.com/en/docs/x-for-websites/cards/overview/markup) |
| 3.8 | `twitter:image` puede ser JPG/PNG/WebP/GIF | medio | Sin SVG, < 5MB | `curl -I` | [Moda Twitter card](https://moda.app/resources/sizes/twitter-card) |
| 3.9 | `twitter:image` puede reutilizar `og:image` 1200x630 | alto | Si no se genera separada, funciona como fallback | DevTools | [Moda Twitter card](https://moda.app/resources/sizes/twitter-card) |
| 3.10 | `twitter-image.tsx` en app dir para dinámico | medio | Archivo análogo a `opengraph-image.tsx` en Next 16 | `ls app/twitter-image.*` | [Next.js twitter-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) |

---

## 4. Structured Data / JSON-LD

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 4.1 | JSON-LD embebido en `<script type="application/ld+json">` | crítico | Formato preferido por Google (vs microdata/RDFa) | [Rich Results Test](https://search.google.com/test/rich-results) | [Google structured data](https://developers.google.com/search/docs/appearance/structured-data) |
| 4.2 | `Organization` schema en homepage | crítico | `@type: Organization` con `name`, `url`, `logo`, `sameAs`, `contactPoint` | Rich Results Test | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 4.3 | `Organization.logo` min 112x112px, crawlable | alto | URL absoluta, formato PNG/JPG, indexable | Rich Results Test | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 4.4 | `Organization.sameAs` con URLs de perfiles sociales | medio | Array de URLs: Instagram, Facebook, YouTube, etc. | Rich Results Test | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 4.5 | `Organization.contactPoint` con telephone y contactType | medio | `{ telephone: '+54-11-...', contactType: 'customer service' }` | Rich Results Test | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 4.6 | `WebSite` schema en root | alto | `name` canonical del sitio, `url` root | Rich Results Test | [Google site-names](https://developers.google.com/search/docs/appearance/site-names) |
| 4.7 | `WebSite.alternateName` si hay abreviaturas | bajo | Útil para nombres genéricos | Rich Results Test | [Google site-names](https://developers.google.com/search/docs/appearance/site-names) |
| 4.8 | NO implementar `WebSite.potentialAction` SearchAction | medio | **Deprecado en Nov 2024** — sitelinks search box ya no se renderiza | [Google deprecation notice](https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox) | [Google sitelinks deprecation](https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox) |
| 4.9 | `BreadcrumbList` en todas las páginas con jerarquía | alto | Min 2 `ListItem`, cada uno con `position`, `name`, `item` (URL) | Rich Results Test | [Google BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| 4.10 | `BreadcrumbList` position sequential starting at 1 | crítico | Position: 1, 2, 3... (enteros) | Rich Results Test | [Google BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| 4.11 | `Product` schema en cada producto | crítico | `@type: Product` con `name` required | Rich Results Test | [Google Product](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) |
| 4.12 | `Product.offers` con `price` y `priceCurrency` (ARS) | crítico | `priceCurrency: 'ARS'` ISO 4217 | Rich Results Test | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 4.13 | `Product.offers.availability` ItemAvailability | crítico | Valores: `InStock`, `OutOfStock`, `BackOrder`, `Discontinued`, `LimitedAvailability`, `PreOrder`, `SoldOut` | Rich Results Test | [Schema Offer](https://schema.org/Offer) |
| 4.14 | `Product.image` URL absoluta y alta resolución | crítico | Min 1200x800. Múltiples aspect ratios recomendado | Rich Results Test | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 4.15 | `Product.brand.name` declarado | alto | `brand: { '@type': 'Brand', name: '...' }` | Rich Results Test | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 4.16 | `Product.sku` único por variante | alto | Identificador propio | Rich Results Test | [Schema Product](https://schema.org/Product) |
| 4.17 | `Product.gtin` si disponible (EAN/UPC) | medio | 8, 12, 13 o 14 dígitos | Rich Results Test | [Schema Product](https://schema.org/Product) |
| 4.18 | `Product.mpn` manufacturer part number | bajo | Identificador del fabricante | Rich Results Test | [Schema Product](https://schema.org/Product) |
| 4.19 | `Product.description` 50-5000 chars | alto | Texto único describiendo producto | Rich Results Test | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 4.20 | `Product.aggregateRating` si hay reseñas | alto | `ratingValue` + `reviewCount` o `ratingCount`, `bestRating`, `worstRating` | Rich Results Test | [Google review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |
| 4.21 | `Product.review` individual opcional | medio | Array de Review con author, reviewRating, datePublished | Rich Results Test | [Google review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |
| 4.22 | NO usar self-review en Organization/LocalBusiness | crítico | Google filtra reviews autogestionadas; solo third-party | Manual audit | [Google review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |
| 4.23 | `Product.offers.priceValidUntil` si precio temporal | medio | ISO-8601 date | Rich Results Test | [Schema Offer](https://schema.org/Offer) |
| 4.24 | `Product.offers.url` canonical del producto | medio | URL absoluta del producto | Rich Results Test | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 4.25 | `Product.offers.itemCondition` para usados/refurbished | bajo | `NewCondition` (default), `UsedCondition`, `RefurbishedCondition`, `DamagedCondition` | Rich Results Test | [Schema Offer](https://schema.org/Offer) |
| 4.26 | `LocalBusiness` schema para tiendas con local físico | alto | Extiende Organization con `address`, `geo`, `openingHoursSpecification`, `priceRange` | Rich Results Test | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 4.27 | `LocalBusiness.address` con PostalAddress completa | alto | `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry` (ISO 3166-1 alpha-2: `AR`) | Rich Results Test | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 4.28 | `LocalBusiness.geo.latitude/longitude` con 5+ decimales | medio | `{ '@type': 'GeoCoordinates', latitude: -34.60361, longitude: -58.38156 }` | Rich Results Test | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 4.29 | `LocalBusiness.openingHoursSpecification` array | medio | Días, `opens`, `closes` en HH:MM | Rich Results Test | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 4.30 | `LocalBusiness.priceRange` max 100 chars | bajo | `$$`, `$$$`, o texto descriptivo | Rich Results Test | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 4.31 | `FAQPage` ya NO da rich result | medio | **FAQ rich results removidos 7-may-2026** (deprecados; soporte en Rich Results Test se cae jun-2026, API GSC ago-2026). El schema sigue válido e inocuo, pero NO esperes snippet. `QAPage` (Q&A genuino user-generated) sigue acotado | Rich Results Test | [Google FAQ deprecation](https://developers.google.com/search/docs/appearance/structured-data/faqpage) |
| 4.32 | `Article` con `headline`, `image`, `datePublished`, `author`, `publisher` | alto | Para blog/content con timezone ISO-8601 | Rich Results Test | [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article) |
| 4.33 | `Article.image` min 50K pixels (width × height), múltiples aspect ratios (16x9, 4x3, 1x1) | alto | Ej: 1200x675 = 810K pixels | Rich Results Test | [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article) |
| 4.34 | `Article.author.@type` Person u Organization | alto | No string plano; objeto con `name` y `url` | Rich Results Test | [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article) |
| 4.35 | `Article.dateModified` si actualizado | medio | Solo si real; falso si no hubo cambios | Rich Results Test | [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article) |
| 4.36 | `ItemList` con `itemListElement` y positions | medio | Para carousels/listings; todos los items mismo `@type` | Rich Results Test | [Google Carousel](https://developers.google.com/search/docs/appearance/structured-data/carousel) |
| 4.37 | Structured data match con contenido visible | crítico | Google penaliza schema "invisible" (info solo en JSON-LD) | Manual comparison | [Google carousel](https://developers.google.com/search/docs/appearance/structured-data/carousel) |
| 4.38 | JSON-LD valida en Schema.org Validator | crítico | Syntax correcta, sin errores | [Schema Markup Validator](https://validator.schema.org/) | [Google structured data](https://developers.google.com/search/docs/appearance/structured-data) |
| 4.39 | JSON-LD idéntico mobile/desktop | crítico | Sin content parity romperia mobile-first | Rich Results Test con ambos modos | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 4.40 | Schema nested vs separate scripts — ambos válidos | medio | Preferir `@graph` o múltiples scripts; ambos OK | Rich Results Test | [Google structured data](https://developers.google.com/search/docs/appearance/structured-data) |
| 4.41 | NO depender de tipos de rich result removidos | medio | Removidos: FAQ (may-2026), HowTo (2023), Course info / Estimated salary / Learning video / Special announcement / Vehicle listing (sep-2025), Practice problem (ene-2026). Schema válido pero sin rich result — no urge removerlo del HTML | [Google updates](https://developers.google.com/search/updates) | [Google updates](https://developers.google.com/search/updates) |
| 4.42 | Schema NO es requisito para features de IA | medio | Guía oficial Google: no hay markup especial para AI Overviews. El schema SÍ sirve para rich results clásicos vivos (Product, Article, Breadcrumb, Review, Recipe, Video, Organization, LocalBusiness) | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |

---

## 5. Sitemap XML

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 5.1 | `sitemap.xml` generado por `app/sitemap.ts` | crítico | File convention Next 16 retorna `MetadataRoute.Sitemap` | `ls app/sitemap.*`. `curl https://host/sitemap.xml` | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 5.2 | UTF-8 encoding del sitemap | crítico | Google requiere UTF-8 | `file app/sitemap.xml` o headers response | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.3 | Max 50,000 URLs o 50MB uncompressed por sitemap | crítico | Split con sitemap index si excede | `wc -l sitemap.xml`. `du -h` | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.4 | URLs absolutas en `<loc>` | crítico | `https://tienda.shope.ar/producto/x`, NO `/producto/x` | XML inspect | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.5 | Solo incluir URLs canonical indexables | crítico | No URLs con noindex, 404, o redirect | Screaming Frog XML sitemap audit | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.6 | `<lastmod>` en formato W3C/ISO-8601 | alto | `2026-04-17` o `2026-04-17T10:00:00-03:00`. Solo si reflecta cambio real | XML inspect | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.7 | `<changefreq>` y `<priority>` son IGNORADOS por Google | bajo | Mantener solo si otros crawlers los usan; no optimización Google | [Google docs confirman](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.8 | Sitemap index para sitios grandes (`generateSitemaps`) | alto | En Next 16 usar `generateSitemaps()` para split por tienda/categoría | `ls app/**/sitemap.ts` | [Next.js generateSitemaps](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps) |
| 5.9 | Image sitemap con `images: [url1, url2]` | medio | Útil para catálogos; Google indexa imágenes más rápido | XML inspect: `<image:image>` | [Next.js sitemap images](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 5.10 | Video sitemap con `videos: [{ title, thumbnail_loc, description }]` | bajo | Solo si hay videos | XML inspect: `<video:video>` | [Next.js sitemap videos](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 5.11 | News sitemap si aplica (publicaciones recientes 2 días) | bajo | Requiere Google News publisher | [Google News sitemap](https://support.google.com/news/publisher-center/answer/9606710) | Google News |
| 5.12 | Referenciado en robots.txt con `Sitemap:` directive | crítico | URL absoluta en robots.txt | `curl https://host/robots.txt \| grep -i sitemap` | [Next.js robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) |
| 5.13 | Submitted en Google Search Console | crítico | Search Console → Sitemaps → Submit | GSC UI | [Google sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |
| 5.14 | Submitted en Bing Webmaster Tools | medio | Bing/Yahoo/DuckDuckGo alternative | Bing WMT UI | Bing WMT docs |
| 5.15 | Hreflang alternates en sitemap si multi-idioma | medio | `<xhtml:link rel="alternate" hreflang="es-AR" href="..."/>` | XML inspect | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 5.16 | `sitemap.ts` cacheado por default (Next 16) | alto | No usa request-time API, se generará estático | Logs de build | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 5.17 | Solo produce URLs que responden 200 | crítico | Un sitemap con 404/500 quema crawl budget | `curl -I` sample URLs | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 5.18 | Gzip comprimido si archivo grande (`.xml.gz`) | bajo | Reduce ancho de banda; soporta `.gz` | HTTP headers `content-encoding` | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |

---

## 6. Robots.txt

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 6.1 | `robots.txt` en root del dominio | crítico | `https://host/robots.txt` accesible; NO en subdir | `curl https://host/robots.txt` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.2 | Generado por `app/robots.ts` (Next 16) | crítico | Return `MetadataRoute.Robots` | `ls app/robots.*` | [Next.js robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) |
| 6.3 | UTF-8 encoding | crítico | File es text/plain UTF-8, NO Word/BOM | `file app/robots.txt` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.4 | `User-agent: *` definido | crítico | Regla genérica para todos los bots | `curl \| grep User-agent` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.5 | `Allow: /` explícito (default pero claro) | medio | Permite crawl general | robots.txt inspect | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.6 | `Disallow: /admin/`, `/api/`, `/_next/data/` | crítico | Bloquear rutas privadas/internas | robots.txt audit | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.7 | NO bloquear `.css`, `.js`, `/_next/static/` | crítico | Google necesita CSS/JS para renderizar. Bloquearlo = penalización seria | robots.txt audit manual | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.8 | `Sitemap: https://host/sitemap.xml` directive | crítico | URL absoluta del sitemap | `curl robots.txt \| grep Sitemap` | [Next.js robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) |
| 6.9 | Paths case-sensitive | alto | `/Admin/` != `/admin/` | Audit rutas reales | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.10 | Wildcards `*` y `$` soportados | medio | `Disallow: /*?sort=` bloquea filtros. `$` indica fin: `.pdf$` | robots.txt tester GSC | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.11 | User-agents específicos cuando necesario | medio | Array de rules en `robots.ts` de Next 16 | `app/robots.ts` | [Next.js robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) |
| 6.12 | NO usar robots.txt para noindex | crítico | Bloquear crawl no evita aparezca en search si hay backlinks. Usar `<meta robots noindex>` | Manual audit | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| 6.13 | Comments con `#` para documentar | bajo | Doc inline | robots.txt inspect | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.14 | `Crawl-delay:` Google NO lo usa | bajo | Funciona en Bing/Yandex; Google ignora — usar Search Console crawl rate settings | GSC crawl stats | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.15 | File ≤ 500KB | alto | Google corta despues de 500KB | `du -h robots.txt` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 6.16 | Testeado en GSC robots.txt Tester | alto | Verificar URLs clave se permiten/bloquean como esperado | [GSC robots tester](https://support.google.com/webmasters/answer/6062598) | GSC |
| 6.17 | robots.txt por subdominio (multi-tenant) | crítico | Cada subdominio necesita su propio robots.txt. En Next.js resolver por host | `curl tiendaX.shope.ar/robots.txt` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |

---

## 7. Iconos y manifest

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 7.1 | `favicon.ico` en `app/` root | crítico | File detection convention Next 16. 16x16 + 32x32 multisize ICO | `ls app/favicon.ico` | [Next.js app-icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) |
| 7.2 | Google favicon min 8x8, recomendado múltiplo de 48 (48, 96, 144...) | alto | Min para aparecer en SERP mobile. 48x48 mínimo útil | [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search) | [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search) |
| 7.3 | `icon.png` 32x32 en app root | alto | Browser tabs | `ls app/icon.png` | [Next.js app-icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) |
| 7.4 | `icon-192.png` y `icon-512.png` para Android/PWA | alto | Referenciados en manifest | Manifest → icons array | [PWA icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) |
| 7.5 | `apple-icon.png` 180x180 | alto | iOS home screen (`rel="apple-touch-icon"`) | `ls app/apple-icon.png` | [Next.js app-icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) |
| 7.6 | Maskable icon 512x512 con safe zone 72% | medio | `purpose: 'maskable'` en manifest. Safe zone circular central | [Maskable.app](https://maskable.app/) | [MDN icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) |
| 7.7 | Monochrome icon si notificaciones | bajo | `purpose: 'monochrome'` para PWA notifications | Manifest inspect | [MDN icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) |
| 7.8 | `manifest.webmanifest` o `manifest.json` | alto | Generado por `app/manifest.ts` en Next 16 | `ls app/manifest.*` | [Next.js manifest](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest) |
| 7.9 | Manifest `name` presente | alto | Nombre completo de la app | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.10 | Manifest `short_name` ≤ 12 chars | alto | Para home screens con espacio limitado | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.11 | Manifest `start_url` set a `/` | alto | Entry point cuando se abre PWA | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.12 | Manifest `display: 'standalone'` | medio | App-like experience sin browser chrome | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.13 | Manifest `theme_color` | medio | Color barra superior en PWA | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.14 | Manifest `background_color` | medio | Splash screen color | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.15 | Manifest `icons` array con múltiples sizes | alto | Min: 192x192 + 512x512. Ideal: 48, 72, 96, 128, 144, 152, 192, 384, 512 | Manifest inspect | [MDN icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) |
| 7.16 | Manifest `scope` define subtree PWA | medio | Default: `/`. Restringir si app en subpath | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.17 | Manifest `id` único y estable | medio | URL que identifica la PWA; no cambiar despues del launch | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.18 | Manifest `lang: 'es-AR'` | bajo | BCP 47 locale | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.19 | Manifest `orientation` si aplica | bajo | `any` por default. No forzar sin razón UX | Manifest inspect | [W3C manifest](https://www.w3.org/TR/appmanifest/) |
| 7.20 | Lighthouse PWA audit pasa `maskable-icon` check | medio | Un icon con `purpose: maskable` presente | [Lighthouse docs](https://developer.chrome.com/docs/lighthouse/pwa/maskable-icon-audit) | Lighthouse |
| 7.21 | NO usar `msapplication-*` meta tags | bajo | Chromium Edge no los necesita; deprecado | DevTools | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#icons) |
| 7.22 | NO usar Safari mask-icon para pinned tabs | bajo | Safari moderno no lo requiere; legacy | DevTools | [Evil Martians favicon 2021](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) |
| 7.23 | Favicon URL estable (no hashear) | alto | Google cachea favicon; URL cambiante = refetch constante | `curl -I /favicon.ico` | [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search) |
| 7.24 | Favicon por tienda en multi-tenant | alto | Cada subdominio puede tener su favicon (hostname-scoped para Google) | `curl tiendaX/favicon.ico` | [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search) |

---

## 8. Core Web Vitals 2025

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 8.1 | LCP ≤ 2500ms (p75) | crítico | Good threshold. 2501-4000 needs improvement, >4000 poor | [PageSpeed Insights](https://pagespeed.web.dev/), Search Console CWV report | [web.dev thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds) |
| 8.2 | INP ≤ 200ms (p75) | crítico | Reemplazó FID en Mar 2024. 201-500 needs, >500 poor | PageSpeed Insights, CrUX | [web.dev INP](https://web.dev/articles/inp) |
| 8.3 | CLS ≤ 0.1 (p75) | crítico | 0.11-0.25 needs, >0.25 poor | PageSpeed Insights | [web.dev CLS](https://web.dev/articles/cls) |
| 8.4 | TTFB ≤ 800ms (supplementary, no es CWV) | alto | Good threshold. >1800ms poor | WebPageTest, Lighthouse | [web.dev TTFB](https://web.dev/articles/ttfb) |
| 8.5 | FCP ≤ 1800ms (supplementary) | alto | Good threshold. >3000ms poor | Lighthouse | [web.dev FCP](https://web.dev/articles/fcp) |
| 8.6 | 75th percentile measurement estándar | crítico | 75% de pageloads deben pasar threshold | Search Console CWV report | [web.dev thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds) |
| 8.7 | Field data (CrUX) como primary source | crítico | Real user monitoring, no solo lab | Chrome UX Report dashboard, CrUX API | [web.dev vitals](https://web.dev/articles/vitals) |
| 8.8 | Lab data con Lighthouse para pre-release checks | alto | Lighthouse mide TBT (Total Blocking Time) en lugar de INP en lab | Lighthouse CLI o DevTools | [web.dev vitals](https://web.dev/articles/vitals) |
| 8.9 | `web-vitals` JS library para RUM custom | medio | Library oficial de Google para capturar en prod | `npm i web-vitals` | [web-vitals lib](https://github.com/GoogleChrome/web-vitals) |
| 8.10 | Segmentar CWV por mobile vs desktop | alto | Google evalúa separadamente | Search Console → Core Web Vitals | [Google CWV](https://support.google.com/webmasters/answer/9205520) |
| 8.11 | LCP element es imagen above-the-fold con priority | crítico | Setear `priority` en `<Image>` del hero | DevTools → Performance → LCP event | [web.dev LCP](https://web.dev/articles/optimize-lcp) |
| 8.12 | LCP image con `fetchpriority="high"` | alto | Browser prioriza descarga (next/image con `priority` lo hace auto) | DevTools Network → Priority column | [web.dev fetch-priority](https://web.dev/articles/fetch-priority) |
| 8.13 | NO `loading="lazy"` en LCP element | crítico | Bug común: lazy loading del hero → LCP malo | `grep -r 'loading="lazy"' app/` ante elementos above-fold | [web.dev LCP](https://web.dev/articles/optimize-lcp) |
| 8.14 | CLS: imágenes con `width`/`height` explícitos | crítico | next/image requiere esto (o `fill` + container sized) | Manual audit `<Image>` props | [web.dev CLS](https://web.dev/articles/cls) |
| 8.15 | CLS: `next/font` con `display: 'swap'` | crítico | Evita FOIT/FOUT. Next self-hostea fonts con font-display swap | Revisar config fonts | [Next.js font](https://nextjs.org/docs/app/api-reference/components/font) |
| 8.16 | CLS: reservar espacio para ads/iframes | alto | `min-height`/`aspect-ratio` en contenedores dinámicos | DevTools layout shift events | [web.dev CLS](https://web.dev/articles/cls) |
| 8.17 | INP: dividir tareas largas (> 50ms) | alto | Usar `setTimeout`, `scheduler.yield()` o `requestAnimationFrame` | DevTools Performance → Long Tasks | [web.dev optimize-inp](https://web.dev/articles/optimize-inp) |
| 8.18 | INP: evitar layout thrashing (read-write-read) | alto | Batchear reads, luego writes | Profiler | [web.dev optimize-inp](https://web.dev/articles/optimize-inp) |
| 8.19 | INP: reducir DOM size | medio | < 1500 nodes idealmente | Lighthouse `dom-size` audit | [web.dev optimize-inp](https://web.dev/articles/optimize-inp) |
| 8.20 | `content-visibility: auto` para secciones offscreen | medio | Skip rendering hasta visible | DevTools | [web.dev optimize-inp](https://web.dev/articles/optimize-inp) |

---

## 9. Performance / Next.js específico

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 9.1 | `<Image>` con `width`/`height` o `fill` | crítico | next/image requiere dimensiones | `grep -r "from 'next/image'"` | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.2 | `<Image fill>` requiere `sizes` prop | crítico | Sin sizes, responsive loading se rompe | Manual audit fill components | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.3 | `<Image priority>` solo para LCP above-fold | crítico | Preload implícito + fetchpriority=high. Uno por página | `grep -r "priority" app/` | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.4 | `<Image alt="...">` descriptivo no vacío | crítico | Accesibilidad + SEO | Manual audit | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.5 | `<Image alt="">` solo para decorativos | medio | Alt vacío es válido para imágenes decorativas | Manual audit | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.6 | `next.config.ts` `images.remotePatterns` configurado | alto | External images (R2, CDN) permitidas explícitamente | `cat next.config.ts` | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.7 | Formato imágenes: WebP/AVIF served auto por next/image | alto | Next convierte on-the-fly. Verificar headers response | `curl -I -H "Accept: image/webp"` | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 9.8 | `next/font` con `display: 'swap'` | crítico | Previene FOIT. Default en next/font/google | Config en `app/layout.tsx` | [Next.js font](https://nextjs.org/docs/app/api-reference/components/font) |
| 9.9 | `next/font/google` self-hostea fonts | crítico | Cero requests a fonts.googleapis.com | DevTools Network → filter fonts | [Next.js font](https://nextjs.org/docs/app/api-reference/components/font) |
| 9.10 | `next/font` `subsets: ['latin']` especificado | alto | Sin esto warning en build | Font config | [Next.js font](https://nextjs.org/docs/app/api-reference/components/font) |
| 9.11 | `adjustFontFallback: true` para reducir CLS | alto | Default true, fabrica fallback font metrics | Font config | [Next.js font](https://nextjs.org/docs/app/api-reference/components/font) |
| 9.12 | ReactDOM.preconnect para origins críticos | medio | En client component: `ReactDOM.preconnect('https://cdn...')` | DevTools → link[rel=preconnect] | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints) |
| 9.13 | ReactDOM.prefetchDNS para CDNs | bajo | `ReactDOM.prefetchDNS('https://analytics...')` | DevTools → link[rel=dns-prefetch] | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints) |
| 9.14 | ReactDOM.preload para recursos críticos | medio | `ReactDOM.preload(url, { as: 'image' })` | DevTools → link[rel=preload] | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints) |
| 9.15 | Server Components maximizados (menos JS) | alto | Client components solo para interactividad | `grep -r "'use client'"` y minimizar | [Next.js RSC](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| 9.16 | Streaming con Suspense en data pesada | alto | Boundary wrap `<Suspense fallback={...}>` | Manual audit pages | [Next.js Streaming](https://nextjs.org/docs/app/getting-started/partial-prerendering) |
| 9.17 | `loading.tsx` para pages con queries pesadas | medio | Skeleton durante streaming | `ls app/**/loading.tsx` | [Next.js loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading) |
| 9.18 | Static generation por default (`fetch cache`) | alto | Pages prerender en build time cuando posible | `pnpm build` logs | [Next.js caching](https://nextjs.org/docs/app/getting-started/caching) |
| 9.19 | `generateMetadata` memoize con React `cache()` | alto | Deduplica fetches entre page y metadata | Revisar imports `import { cache } from 'react'` | [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 9.20 | Streaming metadata default Next 16 | medio | Metadata fluye separada del body para HTML-limited bots recibe en head | [Next.js streaming metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata) | [Next.js streaming](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata) |
| 9.21 | Bundle splitting por route (automático) | alto | Next splits automatically por route segment | `pnpm build` bundle analysis | [Next.js caching](https://nextjs.org/docs/app/getting-started/caching) |
| 9.22 | Tree shaking: import named `{ x }`, no default * | alto | Babel/SWC shake unused code | Bundle analyzer | — |
| 9.23 | `next/script` con `strategy="afterInteractive"` | medio | Scripts 3rd party no bloquean LCP | `grep -r "next/script"` | [Next.js Script](https://nextjs.org/docs/app/guides/scripts) |
| 9.24 | GA/GTM loaded con `strategy="afterInteractive"` o `lazyOnload` | alto | No bloquear render inicial | Manual check Script components | [Next.js Script](https://nextjs.org/docs/app/guides/scripts) |

---

## 10. Accesibilidad como factor SEO

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 10.1 | Todas las imágenes tienen `alt` descriptivo | crítico | WCAG 1.1.1 Level A. No descriptive = text "" para decorativas | Lighthouse accessibility audit | [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.2 | Un solo `<h1>` por página | alto | Jerarquía H1 > H2 > H3... | Manual audit + Lighthouse | [WCAG 2.4.6](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.3 | Heading hierarchy sin skips (h1→h3 salteando h2) | alto | Accessible heading order | Lighthouse `heading-order` | [WCAG 1.3.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.4 | `<button>` icon-only tiene `aria-label` | crítico | Icon buttons sin label = invisibles a screen readers | `grep -r 'size="icon"'` → verificar aria-label | CLAUDE.md project rule |
| 10.5 | Contrast ratio texto ≥ 4.5:1 (Level AA) | alto | Tailwind colors validados para contrast | [Contrast checker](https://webaim.org/resources/contrastchecker/) | [WCAG 1.4.3](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.6 | Contrast ratio texto grande (18pt+) ≥ 3:1 | medio | Headings pueden tener ratio menor | Contrast checker | [WCAG 1.4.3](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.7 | Focus visible en elementos interactivos | alto | `focus-visible:ring-2` o equivalente | Keyboard navigation test | [WCAG 2.4.7](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.8 | Forms: cada `<input>` con `<label>` asociado | crítico | Label explícito o `aria-label`/`aria-labelledby` | Lighthouse | [WCAG 3.3.2](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.9 | Skip link "Skip to main content" | medio | `<a href="#main">` primer elemento focusable | DevTools → focus first element | [WCAG 2.4.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.10 | `<html lang="es-AR">` con BCP 47 | crítico | Atributo lang obligatorio | Manual | [WCAG 3.1.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.11 | Touch targets ≥ 44x44px (WCAG AA) | alto | Botones mobile min size | DevTools mobile emulation | [WCAG 2.5.5](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.12 | Keyboard operable todas las features | crítico | No keyboard traps | Tab through entire page | [WCAG 2.1.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.13 | Semantic HTML (no divs para todo) | alto | `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>` | Manual | [WCAG 1.3.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.14 | Form error messages asociados via `aria-describedby` | medio | Screen readers anuncian errors | Test con NVDA/VoiceOver | [WCAG 3.3.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.15 | `aria-live` regions para updates dinámicos | medio | Toast notifications, cart updates | Manual audit | [WCAG 4.1.3](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.16 | Prefers-reduced-motion respetado | medio | `@media (prefers-reduced-motion: reduce)` | CSS audit | [WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.17 | Lang diferente en fragments: `<span lang="en">` | bajo | Texto en otro idioma declarado | Manual audit | [WCAG 3.1.2](https://www.w3.org/WAI/WCAG21/quickref/) |
| 10.18 | Lighthouse Accessibility score ≥ 95 | alto | Lighthouse como baseline | `pnpm exec lighthouse URL` | Lighthouse |

---

## 11. URL structure y arquitectura

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 11.1 | URLs legibles con palabras, no IDs | crítico | `/producto/remera-logo-blanca` NO `/product/42` | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.2 | Kebab-case (hyphens) separador de palabras | crítico | `/mis-productos` NO `/mis_productos` | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.3 | URLs lowercase consistente | crítico | `/producto/x` NO `/Producto/X`. Case sensitive | 301 lowercase redirects | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.4 | Trailing slash consistencia (con o sin, no mixto) | alto | `next.config.ts` `trailingSlash: true` o `false` — NO mixed | Config + audit | [Next.js config](https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash) |
| 11.5 | URLs cortas y descriptivas | medio | < 75 chars idealmente | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.6 | No stop words excesivas (de, la, el) | bajo | Slug limpio, aunque Google entiende ambas | Slug generator | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.7 | NO query params para contenido principal | alto | URLs path-based (`/categoria/remeras`), no `?cat=remeras` | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.8 | UTF-8 encoding, percent-encoded cuando necesario | alto | `/categoría/ñandú` → `/categor%C3%ADa/%C3%B1and%C3%BA` (o usar ASCII) | URL inspection | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.9 | Estructura jerárquica en directorios | alto | `/categoria/subcategoria/producto-slug` | Site map audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.10 | NO fragment (#) para contenido distinto | crítico | Fragments no indexables. Use path o History API | Manual audit | [Google JS SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) |
| 11.11 | Breadcrumb visual + BreadcrumbList schema | alto | Visible a user + datos estructurados | Manual + Rich Results Test | [Google BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| 11.12 | Session IDs fuera de URL | crítico | Session ID en cookies, nunca en query string | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 11.13 | Pagination con `?page=2` + canonical a primera | alto | rel=next/prev **DEPRECADO** por Google. Usar canonical a página principal si contenido redundante | Manual audit | [Search Engine Journal pagination](https://www.searchenginejournal.com/seo/canonicalization/) |
| 11.14 | Faceted navigation con canonical al padre | crítico | `/remeras?color=negro&talle=m` → canonical `/remeras` | URL audit + canonical inspect | [Search Engine Journal facets](https://www.searchenginejournal.com/technical-seo/faceted-navigation/) |
| 11.15 | NO indexar combinaciones de filtros | alto | `Disallow: /*?color=` o `noindex` en filtered pages | robots.txt + meta robots audit | [Google faceted nav](https://developers.google.com/crawling/docs/faceted-navigation) |
| 11.16 | URLs consistentes con internal links | crítico | Internal links apuntan a canonical version (no al redirect) | Screaming Frog internal links | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |

---

## 12. Redirects y status codes

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 12.1 | 301 para cambios permanentes | crítico | Transfere signals canonical | `curl -I URL \| grep HTTP` | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| 12.2 | 302 solo para temporal moves | alto | Google no transfere canonical signal con 302 | Audit redirect type | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| 12.3 | 308 equivalente a 301 | medio | Preserve HTTP method; Google trata igual | — | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.4 | 307 equivalente a 302 | medio | Preserve method, temporary | — | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.5 | No redirect chains (max 10 hops, idealmente 0-1) | alto | Google follows hasta 10. Cada hop degrada signal | Screaming Frog redirect chains | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| 12.6 | No redirect loops | crítico | A→B→A = error | Screaming Frog | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| 12.7 | Server-side redirects preferidos sobre JS | crítico | Next.js `redirect()` en Server Components o config `redirects()` | `next.config.ts` redirects | [Next.js redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects) |
| 12.8 | Meta refresh 0-second = permanente para Google | bajo | Legacy workaround; preferir 301 real | `grep -r "http-equiv=.refresh"` | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| 12.9 | HTTPS: HTTP → HTTPS con 301 | crítico | Force all traffic a HTTPS | `curl -I http://host` | [Google HTTPS](https://developers.google.com/search/docs/advanced/security/https) |
| 12.10 | www vs non-www: elegir uno + 301 | crítico | Canonical entre `www.shope.ar` y `shope.ar` | Redirects audit | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/canonicalization) |
| 12.11 | 404 explícito para páginas realmente ausentes | crítico | Status code 404, no 200 con mensaje "not found" | `curl -I /does-not-exist` | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.12 | 410 Gone para contenido removido permanente | medio | Más rápido deindex que 404 | Use en API delete confirmations | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.13 | No soft 404 (200 + contenido "no encontrado") | crítico | Search Console flaggea. Devolver 404 real | GSC → Coverage → Soft 404 | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.14 | 500 solo en errores reales server | alto | Google reduce crawl rate ante 5xx | Monitoring alerts | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.15 | 503 con Retry-After para maintenance | medio | Google entiende temporary unavailability | HTTP header audit | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.16 | 429 Too Many Requests si rate-limiting | medio | Google reduce crawl sin deindex | Rate limit logic | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 12.17 | Internal links actualizados tras 301 | alto | No dejar internal links apuntando a URL vieja | Screaming Frog internal links | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| 12.18 | Sitemap updated tras migrations | crítico | URLs viejas fuera, nuevas adentro | Sitemap diff | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |

---

## 13. Internacionalización

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 13.1 | `<html lang="es-AR">` en root layout | crítico | BCP 47 locale | DevTools | [WCAG 3.1.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 13.2 | Hreflang si multi-idioma | alto | Link alternate por locale + self-referential | `curl \| grep hreflang` | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.3 | Hreflang formato: language (ISO 639-1) + region (ISO 3166-1 Alpha-2) | crítico | `es-AR` correcto; `EU`, `UN`, `UK` inválidos | Validator | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.4 | `x-default` para fallback language | alto | Para cuando no matchea otro locale | `<link hreflang="x-default">` | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.5 | Bidirectional hreflang links | crítico | Si A link a B, B debe link a A | hreflang.info checker | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.6 | URLs absolutas en hreflang (https://) | crítico | Relativas no válidas | Manual audit | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.7 | Self-referential hreflang | crítico | La página debe listarse a sí misma en sus alternates | Manual audit | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.8 | `alternates.languages` en Next.js metadata | alto | `{ 'es-AR': '/', 'en-US': '/en' }` | `app/layout.tsx` | [Next.js alternates](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 13.9 | Hreflang en sitemap si muchas variantes | medio | `<xhtml:link rel="alternate" hreflang="es-AR">` en cada `<url>` | XML sitemap inspect | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.10 | ccTLD vs subdomain vs subdir — elegir uno consistente | alto | `.com.ar` (ccTLD), `ar.sitio.com` (subdomain), `/ar/` (subdir) | Decision doc | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.11 | Geo-targeting en Search Console si generic TLD | medio | Search Console → Settings → International Targeting | GSC UI | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 13.12 | Idioma local en URLs | medio | `/productos` (es) vs `/products` (en) | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 13.13 | Currency según locale | alto | ARS en es-AR, USD en en-US | Frontend i18n | — |

---

## 14. Mobile-first

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 14.1 | Viewport meta tag correcto | crítico | `width=device-width, initial-scale=1` | DevTools | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.2 | Responsive design funcional | crítico | Layout fluido en 320px-1920px | Chrome device emulation | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.3 | Content parity mobile vs desktop | crítico | Mismo texto/imágenes/structured data | Manual side-by-side | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.4 | Touch targets ≥ 44x44px | alto | WCAG AA + mobile usability | DevTools mobile | [WCAG 2.5.5](https://www.w3.org/WAI/WCAG21/quickref/) |
| 14.5 | Font size ≥ 16px en mobile | alto | Evita zoom forzado iOS | CSS audit | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.6 | Tap targets con suficiente espacio | medio | 8px spacing mínimo entre botones | UX audit | [WCAG 2.5.5](https://www.w3.org/WAI/WCAG21/quickref/) |
| 14.7 | NO intrusive interstitials | crítico | Popups cover > 30% viewport mobile = penalización. OK: cookie banner, age verification | Mobile visual audit | [Google page experience](https://developers.google.com/search/docs/appearance/page-experience) |
| 14.8 | Content no requiere hover (touch-friendly) | alto | Dropdowns, tooltips con click en mobile | Mobile interaction test | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.9 | Lazy load NO requiere user interaction | crítico | Google no hace swipe/click para load content (primary) | Scroll automático test | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.10 | Images con mobile-appropriate resolution | alto | `sizes` prop en `<Image>` para variants | Next/image `sizes` audit | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 14.11 | Horizontal scroll = BAD (except carousels) | alto | Overflow audit | Mobile visual check | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 14.12 | Search Console Mobile Usability report limpio | alto | GSC → Mobile Usability | GSC | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |

---

## 15. Security / trust

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 15.1 | HTTPS en toda la aplicación | crítico | Ranking signal desde 2014 | `curl -I https://host` | [Google HTTPS](https://developers.google.com/search/docs/advanced/security/https) |
| 15.2 | Certificado TLS válido + renovación auto | crítico | Let's Encrypt, Coolify auto-renew | [SSL Labs test](https://www.ssllabs.com/ssltest/) | — |
| 15.3 | HSTS header `Strict-Transport-Security` | alto | `max-age=31536000; includeSubDomains; preload` | `curl -I \| grep -i strict` | [MDN HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) |
| 15.4 | HSTS preload list submission | medio | [hstspreload.org](https://hstspreload.org/) | HSTS list | — |
| 15.5 | CSP (Content Security Policy) bien configurada | alto | No demasiado restrictiva (no bloquear Googlebot) | `curl -I \| grep -i content-security` | [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) |
| 15.6 | No mixed content (HTTP assets en HTTPS page) | crítico | Browsers bloquean, Google penaliza | DevTools Console warnings | — |
| 15.7 | X-Content-Type-Options: nosniff | medio | Previene MIME sniffing attacks | `curl -I \| grep -i x-content` | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options) |
| 15.8 | X-Frame-Options o CSP frame-ancestors | medio | Previene clickjacking | `curl -I \| grep -i x-frame` | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) |
| 15.9 | Referrer-Policy configurada | bajo | `strict-origin-when-cross-origin` por default | `curl -I \| grep -i referrer` | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy) |
| 15.10 | Permissions-Policy para feature restrictions | bajo | Desactivar APIs no usadas | `curl -I \| grep -i permissions` | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy) |
| 15.11 | CSP NO bloquea Googlebot user-agent | crítico | Test con fake Googlebot | `curl -A "Googlebot/2.1"` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| 15.12 | No secrets en client bundle | crítico | Variables `NEXT_PUBLIC_*` solo para no-sensitive | `grep -r "NEXT_PUBLIC_"` audit | CLAUDE.md |
| 15.13 | Rate limiting en endpoints públicos | medio | Evita abuse que genere crawl issues | Middleware/proxy rate limit | — |

---

## 16. E-commerce SEO específico

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 16.1 | Product schema en cada producto (ver sección 4) | crítico | JSON-LD con `name`, `image`, `offers` | Rich Results Test | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 16.2 | Product URLs limpias sin query params | crítico | `/producto/remera-logo` NO `/product?id=42` | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 16.3 | Cada variante (color/talle) URL única o canonical al padre | alto | Decision: ¿variants indexable independiente o canonical al producto? Usualmente canonical al padre | Rich Results Test per variant | [Google variants](https://developers.google.com/search/docs/appearance/structured-data/product-variants) |
| 16.4 | Out-of-stock: mantener página + `availability: OutOfStock` | crítico | NO noindex ni 404 para stockouts temporales | Schema audit | [Yoast out-of-stock](https://yoast.com/out-of-stock-products-ecommerce-seo/) |
| 16.5 | Discontinued products: 410 Gone o 301 a similar | alto | 410 para permanentes, 301 si hay reemplazo claro | Audit post-delete flows | [Matthew Edgar handling](https://www.matthewedgar.net/handling-out-of-stock-removed-product-pages/) |
| 16.6 | BreadcrumbList en cada producto | crítico | Home > Categoría > Producto | Rich Results Test | [Google BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| 16.7 | Related products / upsells (internal linking) | medio | Internal link equity | Manual audit | [Ahrefs SEO checklist](https://ahrefs.com/blog/seo-checklist/) |
| 16.8 | Unique product descriptions (no duplicate vendor text) | alto | Copy-paste manufacturer desc = duplicate content | Copyscape / manual | [Google quality](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 16.9 | Product images min 1200x800 | alto | Alta resolución para rich results | Image audit | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 16.10 | Product images múltiples angles | medio | Google Shopping eligibility | Schema array `image: [url1, url2, url3]` | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 16.11 | Category pages con descriptive intro text | alto | 100-300 palabras intro arriba de listing | Manual audit | — |
| 16.12 | Pagination con canonical al listing principal (o self) | alto | `/categoria?page=2` → canonical self, o al `/categoria` | Audit canonical en paginated pages | [Search Engine Journal](https://www.searchenginejournal.com/) |
| 16.13 | Faceted nav con `noindex` en filtered URLs | crítico | Evita index bloat | robots meta audit | [Google faceted nav](https://developers.google.com/crawling/docs/faceted-navigation) |
| 16.14 | `Product.offers.priceCurrency: 'ARS'` | crítico | ISO 4217 code | Schema audit | [Schema Offer](https://schema.org/Offer) |
| 16.15 | Precios consistentes: schema match UI visible | crítico | Google cruza visible price con schema | Manual comparison | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 16.16 | Reviews/ratings auténticos (no auto-reviewed) | crítico | Self-reviews descalifican | Audit review sources | [Google review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |
| 16.17 | Estructura URL categorías jerárquica | alto | `/categoria/subcategoria` | URL audit | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 16.18 | Schema `hasMerchantReturnPolicy` si aplica | medio | Return policy details for Google Shopping | Schema audit | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 16.19 | Schema `shippingDetails` si aplica | medio | Shipping rates en structured data | Schema audit | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 16.20 | Sin precios decimales con coma en ARS (Argentina) | medio | Schema: `price: 1500` (integer), visible: `$1.500` | CLAUDE.md price rule | CLAUDE.md |
| 16.21 | Carrito client-side NO indexable | alto | `/carrito` con `noindex` o solo JS-rendered | Manual audit | CLAUDE.md (carrito localStorage) |
| 16.22 | Checkout a WhatsApp tracked (no server-side page) | medio | Link `wa.me/...` con pre-filled message | Manual | CLAUDE.md |

---

## 17. Next.js 16 App Router / Metadata API

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 17.1 | `metadata` export en layouts/pages estáticas | crítico | Static metadata object type-safe | Manual audit | [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.2 | `generateMetadata` para dinámicas | crítico | Async function retorna Metadata | `grep -r "generateMetadata"` | [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.3 | `metadataBase: new URL(...)` en root layout | crítico | Absolute URLs para canonical/OG | `app/layout.tsx` | [Next.js metadataBase](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase) |
| 17.4 | `title.template` pattern con default | alto | `%s \| Shopear` + default | Root layout | [Next.js title template](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.5 | `title.absolute` cuando override completo | medio | Homepage con brand only | Audit | [Next.js title](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.6 | `alternates.canonical` declarado | crítico | Una por page. Path relativo OK si `metadataBase` set | Audit | [Next.js alternates](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.7 | `robots` metadata para indexing directives | alto | `{ index: true, follow: true, googleBot: {...} }` | Audit | [Next.js robots metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#robots) |
| 17.8 | `openGraph` metadata por page importante | alto | No solo root; categorías y productos | Audit | [Next.js OG](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#opengraph) |
| 17.9 | `twitter` metadata para shareability | alto | Card type + image | Audit | [Next.js Twitter](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#twitter) |
| 17.10 | `icons` via file convention (preferido) | alto | `icon.png`, `apple-icon.png` files in `app/` | `ls app/icon.* app/apple-icon.*` | [Next.js icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) |
| 17.11 | `sitemap.ts` con `MetadataRoute.Sitemap` | crítico | `app/sitemap.ts` default export | `ls app/sitemap.*` | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 17.12 | `robots.ts` con `MetadataRoute.Robots` | crítico | `app/robots.ts` | `ls app/robots.*` | [Next.js robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) |
| 17.13 | `manifest.ts` con `MetadataRoute.Manifest` | alto | `app/manifest.ts` | `ls app/manifest.*` | [Next.js manifest](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest) |
| 17.14 | `opengraph-image.tsx` dinámico con ImageResponse | alto | Por page/segment, genera imagen única | `ls app/**/opengraph-image.*` | [Next.js OG image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) |
| 17.15 | `twitter-image.tsx` paralelo a opengraph-image | medio | Similar pattern | `ls app/**/twitter-image.*` | [Next.js Twitter image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) |
| 17.16 | `export const size = { width: 1200, height: 630 }` en OG image | crítico | Size config en opengraph-image.tsx | Manual audit | [Next.js OG image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) |
| 17.17 | ImageResponse CSS subset (flexbox OK, grid NO) | alto | Layouts limitados | Test `pnpm build` | [Next.js ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response) |
| 17.18 | Viewport export separado (NO en metadata) | crítico | `themeColor`, `width`, `initialScale` via Viewport type | Audit layout root | [Next.js Viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) |
| 17.19 | `generateMetadata` y page dedupe con `cache()` | alto | React `cache()` para queries compartidas | `import { cache } from 'react'` | [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.20 | `params` y `searchParams` son Promises en Next 16 | crítico | Siempre `await params` | CLAUDE.md guardrail | [Next.js 16 breaking changes](https://nextjs.org/docs/app/api-reference/file-conventions/page) |
| 17.21 | `generateMetadata` solo en Server Components | crítico | No usar en `'use client'` | Build error si violado | [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 17.22 | Streaming metadata: HTML-limited bots reciben en head | alto | Default behavior Next 16. Twitterbot/Slackbot/Bingbot detectados | [Next.js streaming](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata) | [Next.js htmlLimitedBots](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots) |
| 17.23 | Metadata merge: parent + child shallow merge | alto | Child sobrescribe parent en keys coincidentes | Testing metadata inheritance | [Next.js metadata merging](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging) |
| 17.24 | Route groups `(public)` `(admin)` no afectan URL | medio | SEO-transparent organization | `app/(public)/...` | [Next.js route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) |
| 17.25 | `generateStaticParams` para prerendering | alto | SSG de productos/categorías | `grep -r "generateStaticParams"` | [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) |
| 17.26 | ISR / `revalidate` configurado | alto | Productos cacheados con revalidation time | `export const revalidate = 3600` | [Next.js caching](https://nextjs.org/docs/app/getting-started/caching) |
| 17.27 | `revalidatePath` / `revalidateTag` en mutations | crítico | Server actions deben revalidar tras write | CLAUDE.md project rule | CLAUDE.md |

---

## 18. Google Search Console

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 18.1 | Property verified (DNS TXT recomendado) | crítico | Domain property (cubre todos subdomains) | GSC settings | [Google GSC start](https://developers.google.com/search/docs/monitor-debug/search-console-start) |
| 18.2 | Sitemap submitted | crítico | GSC → Sitemaps | GSC | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |
| 18.3 | URL Inspection para páginas críticas | alto | Verificar rendering correcto | GSC URL inspect | [Google GSC start](https://developers.google.com/search/docs/monitor-debug/search-console-start) |
| 18.4 | Performance report monitoreado | alto | Queries, impressions, clicks, CTR | GSC Performance | — |
| 18.5 | Coverage report sin errors | crítico | Index Coverage → Errors = 0 | GSC Coverage | — |
| 18.6 | Core Web Vitals report limpio | crítico | GSC → Core Web Vitals | GSC | — |
| 18.7 | Mobile Usability report limpio | alto | GSC → Mobile Usability | GSC | [Google mobile-first](https://developers.google.com/search/mobile-sites/mobile-first-indexing) |
| 18.8 | Enhancements: structured data types OK | alto | Products, Breadcrumbs, Logo, etc. | GSC → Enhancements | — |
| 18.9 | Security Issues clean | crítico | Manual Actions clean | GSC → Security & Manual Actions | — |
| 18.10 | Links report: internal + external | medio | Anchor text diversity | GSC → Links | — |
| 18.11 | Change of Address si migras dominio | alto | Notifica Google del move | GSC Change of Address | — |
| 18.12 | Geo-targeting si ccTLD generic | medio | Argentina si gTLD | GSC Settings International | — |
| 18.13 | Crawl stats para budget audit | medio | Response codes, avg response time | GSC Crawl Stats | — |
| 18.14 | Alert configured (email notifications) | medio | Notifications preferences | GSC settings | — |
| 18.15 | Robots.txt tester | medio | Test URLs críticas | GSC robots.txt tester | [Google robots tester](https://support.google.com/webmasters/answer/6062598) |
| 18.16 | Verify Bing Webmaster Tools también | bajo | Bing no es Google pero es tráfico extra | Bing WMT | — |

---

## 19. Analytics / Tag Manager

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 19.1 | GA4 installed + GSC linked | alto | Cross-pollinate data Search + Behavior | GA4 UI | — |
| 19.2 | GA4/GTM loaded con `strategy="afterInteractive"` | crítico | No bloquea LCP | `grep -r "next/script"` + strategy | [Next.js Script](https://nextjs.org/docs/app/guides/scripts) |
| 19.3 | Event tracking setup para conversiones | alto | WhatsApp checkout click, add-to-cart | GA4 Events | — |
| 19.4 | NO analytics en servidor (primaria cliente-side) | medio | GA4 fires from browser tras hydration | Analytics mode | — |
| 19.5 | GTM si múltiples scripts — centraliza | medio | GTM container ID vía env var | Env config | — |
| 19.6 | IP anonymization en GA4 | bajo | Cumple GDPR/privacidad | GA4 settings | — |
| 19.7 | Cookie consent banner no intrusivo | crítico | Google no penaliza banner, pero interstitial full-screen sí | Mobile audit | [Google page experience](https://developers.google.com/search/docs/appearance/page-experience) |
| 19.8 | Script tag con `async`/`defer` | alto | No render-blocking | DevTools Network waterfall | — |

---

## 20. Indexing directives

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 20.1 | `index, follow` default en public pages | crítico | Explícito en root layout o omitir (default) | `meta[name="robots"]` inspect | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.2 | `noindex, nofollow` en admin routes | crítico | `/admin/*` + login pages | `curl /admin \| grep noindex` | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.3 | `noindex` vía Next.js metadata | alto | `robots: { index: false, follow: false }` | Metadata audit | [Next.js robots](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#robots) |
| 20.4 | `max-snippet`, `max-image-preview`, `max-video-preview` | medio | Control preview si necesario. Default `max-image-preview: large` | metadata googleBot settings | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.5 | `unavailable_after:` para contenido con fecha expiración | bajo | Offers con deadline | Metadata custom | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.6 | `noimageindex` si imágenes privadas | bajo | Evita indexar images | metadata custom | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.7 | X-Robots-Tag HTTP header para non-HTML | medio | PDFs, downloads: `X-Robots-Tag: noindex` via Next middleware | `curl -I file.pdf` | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.8 | `data-nosnippet` en sensitive content | bajo | Excluir sections de snippets | Manual HTML | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.9 | `notranslate` si no querés traducción | bajo | `<meta name="google" content="notranslate">` | `grep -r "notranslate"` | [Google special tags](https://developers.google.com/search/docs/crawling-indexing/special-tags) |
| 20.10 | `nopagereadaloud` si no querés text-to-speech | bajo | Para contenido sensible (precios, ofertas) | Manual | [Google special tags](https://developers.google.com/search/docs/crawling-indexing/special-tags) |
| 20.11 | NO robots.txt Disallow + meta noindex juntos | crítico | Si crawl bloqueado, Google nunca ve el noindex | Manual audit lógica | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| 20.12 | `nositelinkssearchbox` deprecado — no usar | bajo | Google ya no lo aplica | — | [Google robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |

---

## 21. E-E-A-T y trust content

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 21.1 | Página "Acerca de / About Us" | alto | Transparencia sobre quién maneja el sitio | `/acerca-de` o `/nosotros` | [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 21.2 | Página "Contacto" con data real | alto | Email, teléfono, dirección (si LocalBusiness) | `/contacto` | [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 21.3 | Política de privacidad | alto | GDPR/LGPD/Argentina data protection | `/privacidad` | — |
| 21.4 | Términos y condiciones | alto | Legal + trust | `/terminos` | — |
| 21.5 | Política de devoluciones (e-commerce) | alto | Consumer rights + trust | `/devoluciones` | [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 21.6 | Author bylines en content (blog) | alto | Person schema con bio/credentials | Article schema | [Google E-E-A-T](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 21.7 | datePublished + dateModified visible + schema | alto | Freshness signal | Manual + schema | [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article) |
| 21.8 | Experiencia first-hand demostrada en content | alto | Reviews, opinions, casos reales | Content audit | [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 21.9 | Source citations / references | medio | Outbound links a fuentes autoritativas | Content audit | — |
| 21.10 | Trust signals: certificados, membresías, premios | medio | Logos de certificaciones en footer | Visual audit | — |
| 21.11 | Testimonios / reviews | medio | Review schema + visible | Schema audit | [Google review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |
| 21.12 | SSL certificate visible (padlock) | crítico | HTTPS enforced | Browser check | — |
| 21.13 | No AI-generated content sin disclosure | medio | Google 2024+ prefiere transparencia | Content review | [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 21.14 | Social proof: social media links | medio | Organization.sameAs | Schema | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |

---

## 22. 404 y error pages

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 22.1 | `app/not-found.tsx` custom | alto | UX + SEO friendly | `ls app/not-found.*` | [Next.js not-found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) |
| 22.2 | HTTP status code 404 real | crítico | NO 200 con mensaje "not found" (= soft 404) | `curl -I /invalid-url` | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |
| 22.3 | 404 page tiene links útiles (home, categorías) | alto | Retención de usuario | Visual audit | — |
| 22.4 | Search box en 404 page | medio | Auto-recovery UX | Visual audit | — |
| 22.5 | `app/error.tsx` para runtime errors | alto | Global error boundary per segment | `ls app/**/error.tsx` | [Next.js error](https://nextjs.org/docs/app/api-reference/file-conventions/error) |
| 22.6 | 500 error page user-friendly | medio | No expose stack traces en prod | Manual | — |
| 22.7 | 403 Forbidden con UX clara | medio | Access denied messaging | Manual | — |
| 22.8 | Search Console Coverage report: 404 bajo control | alto | Muchos 404 indican issue | GSC | [Google HTTP codes](https://developers.google.com/search/docs/crawling-indexing/http-network-errors) |

---

## 23. Crawl budget

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 23.1 | Robots.txt disallow en admin/api/privados | crítico | No desperdiciar crawl en no-SEO pages | `robots.txt` audit | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| 23.2 | Canonical para evitar crawl de duplicates | crítico | Reduce crawl overhead | Canonical audit | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/canonicalization) |
| 23.3 | `nofollow` en links no-SEO (admin, filters) | alto | No pasa equity a paginas sin valor SEO | Audit anchors | — |
| 23.4 | Sitemap solo con URLs canonical indexables | crítico | No perder crawl en URLs que terminan en 404/redirect | Sitemap audit | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |
| 23.5 | Infinite crawl traps avoidance | crítico | Calendar URLs, session IDs, inf filters → bloquear | Audit URL patterns | [Google URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) |
| 23.6 | Monitoring GSC Crawl Stats | alto | Promedio response time, 2xx rate | GSC Crawl Stats | — |
| 23.7 | Robots.txt bloquea `/search?` o query params | alto | Internal search result URLs no indexables | robots.txt | [Google faceted nav](https://developers.google.com/crawling/docs/faceted-navigation) |
| 23.8 | `lastmod` accurate en sitemap | medio | Google crawlea más si content cambió | Sitemap inspect | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| 23.9 | Fast server response (TTFB < 800ms) | alto | Google crawlea más cuando servidor rápido | Monitoring | [web.dev TTFB](https://web.dev/articles/ttfb) |
| 23.10 | No redirect chains (ver sección 12) | alto | Cada redirect = crawl extra | Screaming Frog | [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |

---

## 24. RSS / Atom feeds

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 24.1 | RSS feed si hay blog/content frequent | medio | `/rss.xml` o `/feed.xml`. Ayuda discovery | `curl /rss.xml` | [Google discovery feeds](https://developers.google.com/search/blog/2009/10/using-rssatom-feeds-to-discover-new) |
| 24.2 | Atom feed alternativo | bajo | Algunos aggregators lo prefieren | — | — |
| 24.3 | Feed referenciado en `<head>` | medio | `<link rel="alternate" type="application/rss+xml" href="/rss.xml">` | DevTools | — |
| 24.4 | `alternates.types` en Next.js metadata | medio | `types: { 'application/rss+xml': '/rss.xml' }` | Next.js alternates | [Next.js alternates](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| 24.5 | Feed valida en validator | medio | [W3C Feed Validator](https://validator.w3.org/feed/) | W3C validator | — |
| 24.6 | Submitted en GSC como sitemap alternativo | bajo | GSC acepta RSS/Atom como sitemap | GSC | [Google discovery feeds](https://developers.google.com/search/blog/2009/10/using-rssatom-feeds-to-discover-new) |
| 24.7 | `<guid>` único por item | alto | RSS unique IDs | Feed inspect | — |
| 24.8 | Full content vs summary en feed | bajo | Decision: preview vs full article | Content decision | — |

---

## 25. Multi-tenant SEO (crítico Shopear)

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 25.1 | Subdomain per tenant (`tienda.shope.ar`) | crítico | Google trata subdomain como entity separada pero inherits del dominio raíz | URL config | [Reddit multi-tenant SEO](https://www.reddit.com/r/nextjs/comments/18rbttg/) |
| 25.2 | Canonical NUNCA cross-tenant | crítico | `tienda1.shope.ar/producto` NO canonical a `tienda2.shope.ar/producto` | Canonical audit cross-host | [Google canonical](https://developers.google.com/search/docs/crawling-indexing/canonicalization) |
| 25.3 | Sitemap per tenant (separado por subdomain) | crítico | Cada `tienda.shope.ar/sitemap.xml` solo URLs de esa tienda | `curl tiendaX/sitemap.xml` | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |
| 25.4 | Robots.txt per tenant | crítico | Cada subdomain con su robots.txt | `curl tiendaX/robots.txt` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 25.5 | Tenant resolution por host (no path) | crítico | CLAUDE.md: "path prefix NO soportado" | Middleware/resolve-active-store audit | CLAUDE.md |
| 25.6 | Structured data `@id` único por tenant | alto | No conflicto de IDs cross-tenant | Schema audit per tenant | [Google structured data](https://developers.google.com/search/docs/appearance/structured-data) |
| 25.7 | Organization schema distinto por tienda | alto | Cada tenant su Organization con su name/logo/url | Schema audit | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 25.8 | OG images y metadata scopeadas por tenant | crítico | `generateMetadata` resuelve tenant desde host | Manual per subdomain | CLAUDE.md |
| 25.9 | Verify cada subdomain en GSC | crítico | Domain property `shope.ar` cubre all, pero URL prefix recomendado per tenant | GSC | [Google GSC start](https://developers.google.com/search/docs/monitor-debug/search-console-start) |
| 25.10 | Tenant activo desde host SIEMPRE (no query/body) | crítico | Aislamiento seguridad + SEO | CLAUDE.md guardrail | CLAUDE.md |
| 25.11 | `admin.shope.ar` con noindex global | crítico | Panel admin nunca indexable | robots.ts per host | CLAUDE.md |
| 25.12 | TLS wildcard para `*.shope.ar` | crítico | Cada subdomain HTTPS válido | SSL Labs per subdomain | — |
| 25.13 | Brand consistency per tenant (logo, theme-color) | alto | SiteConfig per tenant controla | SiteConfig audit | CLAUDE.md |
| 25.14 | Favicon per tenant (hostname-scoped Google) | alto | Cada subdomain su favicon desde SiteConfig | Per-tenant favicon | [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search) |
| 25.15 | No SEO content cross-tenant leakage | crítico | Tenant A datos NO aparecen en `robots.txt`/`sitemap.xml` de B | Host-scoped audit | CLAUDE.md |
| 25.16 | Title template per tenant | alto | `%s \| ${tenantName}` en root layout resuelto por host | `generateMetadata` root | CLAUDE.md |
| 25.17 | Canonical siempre con host tenant | crítico | `alternates.canonical` usa `metadataBase` con host correcto | Audit per subdomain | [Next.js metadataBase](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase) |
| 25.18 | Cache tags scopeadas por `storeId` | crítico | Revalidation tenant-scoped | `revalidateTag(${storeId}_products)` | CLAUDE.md |
| 25.19 | Per-tenant structured data no duplica Organization cross-tenant | medio | Evita que GSC considere all tenants = same org | Schema audit | [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| 25.20 | Hreflang cross-tenant NO (cada tenant es entidad separada) | crítico | Nunca usar hreflang para cross-tenant mismo producto | Audit | [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| 25.21 | `admin.shope.ar` NO en sitemaps de tenants | crítico | Admin host aparte, excluido | Audit sitemaps | CLAUDE.md |
| 25.22 | Platform host NO en robots.txt publico | crítico | `admin.shope.ar/robots.txt` = Disallow: / | `curl admin.shope.ar/robots.txt` | CLAUDE.md |

---

## 26. Image SEO

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 26.1 | Alt descriptivo en todas las imágenes | crítico | Nombre del producto + detalle | Lighthouse A11Y | [WCAG 1.1.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 26.2 | Alt vacío en decorativas (`alt=""`) | alto | Decoración no es información | Manual audit | [WCAG 1.1.1](https://www.w3.org/WAI/WCAG21/quickref/) |
| 26.3 | Filename descriptivo | medio | `remera-logo-blanca.jpg` NO `IMG_1234.jpg` | Audit naming | [Google image SEO](https://developers.google.com/search/docs/appearance/google-images) |
| 26.4 | WebP/AVIF preferido sobre JPG/PNG | alto | next/image lo hace automáticamente | DevTools Network | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 26.5 | `srcset` generado por next/image auto | crítico | Responsive images múltiples tamaños | DevTools inspect img | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 26.6 | `sizes` prop correcta en `<Image fill>` | crítico | Sin sizes, Next sirve imagen largest | Audit `fill` components | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 26.7 | Lazy loading default (excepto LCP) | alto | `loading="lazy"` default, `priority` para above-fold | Audit `priority` prop | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 26.8 | Image sitemap para catálogo grande | alto | `images: [url1, url2]` en sitemap.ts | Sitemap inspect | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 26.9 | Product schema `image` absoluta URL | crítico | Para Google Shopping eligibility | Schema audit | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 26.10 | Imágenes de alta resolución (min 1200px ancho) | alto | Google Shopping requirement | Audit | [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) |
| 26.11 | Imágenes crawlables (no robots.txt bloqueado) | crítico | Images y CSS/JS siempre accesibles | Manual audit | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| 26.12 | Imágenes CDN con correct caching headers | medio | `Cache-Control: public, max-age=31536000` | `curl -I` | — |
| 26.13 | Images compressed (< 200KB típico) | alto | Unbloated images = mejor LCP | Audit sizes | [web.dev optimize-lcp](https://web.dev/articles/optimize-lcp) |
| 26.14 | `Image` con `quality` razonable (default 75) | medio | Balance quality/size | Next.js prop | [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image) |
| 26.15 | Context cerca de imagen (texto explicativo) | medio | Google indexa imágenes por contexto | Manual | [Google image SEO](https://developers.google.com/search/docs/appearance/google-images) |

---

## 27. Video SEO

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 27.1 | VideoObject schema si videos | alto | `name`, `description`, `thumbnailUrl`, `uploadDate` | Rich Results Test | [Google Video](https://developers.google.com/search/docs/appearance/structured-data/video) |
| 27.2 | `contentUrl` preferido sobre `embedUrl` | alto | Direct URL para Google fetch | Schema audit | [Google Video](https://developers.google.com/search/docs/appearance/structured-data/video) |
| 27.3 | `duration` en ISO-8601 (`PT1M54S`) | medio | 1 min 54 sec | Schema audit | [Google Video](https://developers.google.com/search/docs/appearance/structured-data/video) |
| 27.4 | `thumbnailUrl` único por video | alto | No reusar mismo thumbnail | Schema audit | [Google Video](https://developers.google.com/search/docs/appearance/structured-data/video) |
| 27.5 | Video sitemap si múltiples videos | medio | Next.js sitemap con `videos` prop | [Google video sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps) | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| 27.6 | `<video>` element con `poster` attribute | medio | Preview antes de play | HTML audit | — |
| 27.7 | Lazy load videos (pero no LCP videos) | medio | `preload="metadata"` o `none` salvo hero | HTML audit | — |
| 27.8 | Transcripts visibles si aplicable | bajo | Accessibility + SEO (más texto indexable) | Manual | — |

---

## 28. Local SEO

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 28.1 | LocalBusiness schema completo si local físico | crítico | Name, address, geo, openingHours, priceRange, telephone, url | Rich Results Test | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 28.2 | NAP consistency (Name-Address-Phone) cross web | alto | Mismo formato en sitio, GBP, directorios | Manual audit | — |
| 28.3 | Google Business Profile claimed + verified | crítico | Manejo por tenant si aplica | [GBP](https://business.google.com/) | — |
| 28.4 | GBP categorías correctas | alto | Main category + secondary | GBP dashboard | — |
| 28.5 | GBP photos uploaded regularmente | medio | Exterior, interior, products | GBP | — |
| 28.6 | GBP reviews monitoreadas/respondidas | alto | Response time + quality = signal | GBP | — |
| 28.7 | Local citations en directorios AR | medio | Páginas amarillas, Mercado Libre shops, directorios locales | Citations audit | — |
| 28.8 | Address with ISO-3166-1 Alpha-2 country code | crítico | `addressCountry: 'AR'` | Schema audit | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 28.9 | Opening hours con day-of-week correcto | alto | `Monday`, `Tuesday`... o array días | Schema audit | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 28.10 | Currency ARS en priceRange | medio | `priceRange: '$$'` o `ARS 500-2000` | Schema audit | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 28.11 | Timezone `America/Argentina/Buenos_Aires` | alto | Para openingHours/events accurate | CLAUDE.md docker TZ | CLAUDE.md |
| 28.12 | GeoCoordinates con 5+ decimals precision | medio | Lat/long accurate | Schema audit | [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business) |
| 28.13 | "How to find us" page con mapa embebido | medio | Google Maps iframe | Manual | — |

---

## 29. AI Search & Crawlers (AEO/GEO)

> Categoría agregada 2026. Cubre visibilidad en motores de IA (Google AI Overviews / AI Mode, ChatGPT, Perplexity, Claude) y gestión de crawlers de IA. **Regla madre**: la guía oficial de Google dice que la visibilidad en IA se gana con SEO clásico + contenido people-first, NO con gimmicks. No prometer resultados de "GEO" que Google desmiente.

### Crawlers de IA (robots.txt)

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 29.1 | Política AI-bots decidida: training vs retrieval | alto | Retrieval/search bots (`OAI-SearchBot`, `ChatGPT-User`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`) → **Allow** (traen tráfico de citas). Training (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Meta-ExternalAgent`, `Applebot-Extended`) → decisión de negocio | `robots.ts`/`robots.txt` audit por host | [OpenAI bots](https://developers.openai.com/api/docs/bots) · [Claude crawler](https://support.claude.com/en/articles/8896518) |
| 29.2 | `Google-Extended` ≠ `Googlebot` (footgun) | crítico | Bloquear `Google-Extended` (training Gemini) NO afecta indexación ni ranking en Search. Bloquear `Googlebot` SÍ saca de Search **y de AI Overviews** | Audit robots.txt + GSC | [Google crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) |
| 29.3 | AI Overviews / AI Mode se nutren del índice de Googlebot | alto | Para aparecer: estar indexable + elegible para snippet. NO requiere markup, llms.txt ni chunking | GSC URL Inspection | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |
| 29.4 | Tokens exactos (no inventar) | alto | OpenAI: `GPTBot`/`OAI-SearchBot`/`ChatGPT-User`/`OAI-AdsBot`. Anthropic: `ClaudeBot`/`Claude-User`/`Claude-SearchBot` (`Claude-Web` y `anthropic-ai` **DEPRECADOS**). Perplexity: `PerplexityBot`/`Perplexity-User` | Doc oficial de cada proveedor | [OpenAI bots](https://developers.openai.com/api/docs/bots) · [Claude crawler](https://support.claude.com/en/articles/8896518) |
| 29.5 | `Bytespider` (ByteDance) bajo control | medio | Históricamente ignora `Disallow` y consume ancho de banda. Si abusa, bloquear a nivel WAF/CDN, no solo robots | Logs de crawl / CDN | [Cloudflare AI crawlers](https://blog.cloudflare.com/control-content-use-for-ai-training/) |
| 29.6 | robots.txt de AI-bots scopeado por subdominio | medio | Multi-tenant: mismo scoping por host que el resto del robots | `curl tiendaX/robots.txt` | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt) |
| 29.7 | Content Signals Policy (emergente, opcional) | bajo | Cloudflare propone `search`/`ai-input`/`ai-train` en robots.txt para expresar uso permitido. AÚN no estandarizado (IETF en curso) — forward-looking, no requisito | robots.txt comments | [Cloudflare Content Signals](https://blog.cloudflare.com/content-signals-policy/) |

### AEO / GEO (contenido que la IA cita)

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 29.8 | Answer-first: respuesta directa en las primeras 2-3 frases | alto | Patrón más consistente en páginas citadas por AI Overviews. No "construir hacia" la respuesta | Manual review | [SEL GEO 2026](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142) |
| 29.9 | Formatos extraíbles (tablas, listas numeradas, definiciones) | alto | Chunks pre-empaquetados y citables; la IA los extrae mejor | Manual review | [SEL GEO 2026](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142) |
| 29.10 | Frescura: refresh de contenido clave (≥ trimestral) | medio | La IA pondera recencia; fecha 2023-2024 sin update pierde frente a 2026. `dateModified` real, no falso | datePublished/dateModified | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |
| 29.11 | "Information gain": datos propios, quotes de expertos, estadísticas | medio | Original research atrae citas (estudio Princeton: quotes +41%, stats ~+30%). Re-hash de lo que ya rankea no se cita | Content audit | [SEL GEO 2026](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142) |
| 29.12 | E-E-A-T para IA: autoría verificable + fuentes citadas | alto | La IA asume riesgo reputacional al citar → transparencia, autor con credenciales, outbound a fuentes (ver §21) | Content audit | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |
| 29.13 | Contenido no-commodity, people-first | alto | Punto de vista único; lo que rinde en IA = buen SEO + contenido original, NO volumen genérico | Content audit | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |
| 29.14 | NO crear gimmicks para IA | medio | Google: no hace falta `llms.txt`, chunking artificial, markup especial ni estilo de escritura especial. No vender humo de "GEO" | — | [Google AI guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) |
| 29.15 | Spam policies aplican a respuestas generativas | alto | Contenido IA escalado sin revisión humana / sin valor = penalizable también en features de IA | Content review | [Google updates](https://developers.google.com/search/updates) |
| 29.16 | Presencia multi-plataforma (UGC) | bajo | Reddit, YouTube, LinkedIn aparecen seguido como fuentes citadas en ChatGPT/Perplexity/AI Mode. No es on-site pero afecta visibilidad IA | Off-site audit | [SEL GEO 2026](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142) |

### Archivos y protocolos

| # | Item | Criticidad | Qué validar | Cómo validar | Referencia |
|---|---|---|---|---|---|
| 29.17 | `llms.txt` es OPCIONAL, NO señal SEO | bajo | Google NO lo usa ni planea (Illyes/Mueller lo comparan con `keywords` meta). ~10% adopción; crawlers no lo leen en prod. Útil solo como DX (docs para IDEs con IA). **No sobre-recomendar** | `curl host/llms.txt` | [llms.txt realidad 2026](https://www.linkbuildinghq.com/blog/should-websites-implement-llms-txt-in-2026/) |
| 29.18 | IndexNow para motores no-Google | medio | Bing/Yandex/Naver/Seznam/Yep indexan al instante vía ping. Relevante porque ChatGPT/Copilot se apoyan en el índice de Bing. Google NO lo soporta (feb-2026) | Bing WMT o key file | [IndexNow.org](https://www.indexnow.org/) · [Bing IndexNow](https://www.bing.com/indexnow) |
| 29.19 | Key file de IndexNow en root + ping en mutations | bajo | `{key}.txt` accesible en raíz del host; ping a `api.indexnow.org` en create/update/delete | `curl host/{key}.txt` | [IndexNow.org](https://www.indexnow.org/) |
| 29.20 | Para Google: seguir con sitemap + GSC | alto | IndexNow NO reemplaza sitemap/GSC para Google; son canales separados | — | [Google sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |

---

## Cheatsheet de tamaños / valores canónicos

### Meta tags

| Item | Valor canónico |
|---|---|
| `<title>` | 50-60 chars (truncation varies by device) |
| `<meta description>` | 150-160 chars |
| `lang` attribute | BCP 47 (e.g., `es-AR`, `en-US`) |
| `charset` | `utf-8` |
| Viewport | `width=device-width, initial-scale=1` |
| Canonical URL | Absoluta, con `https://`, en `<head>` |

### Open Graph

| Item | Valor canónico |
|---|---|
| `og:image` recomendado | **1200x630** (aspect 1.91:1), < 8MB |
| `og:image:secure_url` | Mismo URL HTTPS |
| `og:image` formato | JPG, PNG, WebP (NO SVG) |
| `og:locale` | `es_AR` (underscore, NO guion) |
| `og:type` valores | `website`, `article`, `product`, `profile`, `video`, `music`, `book` |

### Twitter Cards

| Item | Valor canónico |
|---|---|
| `summary_large_image` | **1200x675** (16:9) o 1200x600 (2:1) |
| `summary` thumbnail | **240x240** (1:1) |
| `twitter:image` min | 300x157 |
| `twitter:image` max | 4096x4096, < 5MB |
| `twitter:title` | ≤ 70 chars |
| `twitter:description` | ≤ 200 chars |
| Formatos | JPG, PNG, WebP, GIF |

### Favicons e iconos

| Item | Valor canónico |
|---|---|
| Favicon mínimo Google | 8x8 (recomendado ≥ 48x48, múltiplos de 48) |
| `favicon.ico` | Multisize ICO (16x16 + 32x32) |
| `icon.png` (Next.js) | 32x32 |
| `apple-icon.png` | **180x180** |
| PWA icon mínimo | 192x192 + 512x512 |
| PWA icons recomendados | 48, 72, 96, 128, 144, 152, 192, 384, 512 |
| Maskable icon | ≥ 512x512, safe zone 72% central |
| Formato icons | PNG (raster) o SVG con `sizes="any"` |

### Core Web Vitals (p75)

| Métrica | Good | Needs Improvement | Poor |
|---|---|---|---|
| **LCP** | ≤ 2500ms | 2501–4000ms | > 4000ms |
| **INP** (reemplazó FID Mar 2024) | ≤ 200ms | 201–500ms | > 500ms |
| **CLS** | ≤ 0.1 | 0.11–0.25 | > 0.25 |
| **TTFB** (supplementary) | ≤ 800ms | 801–1800ms | > 1800ms |
| **FCP** (supplementary) | ≤ 1800ms | 1801–3000ms | > 3000ms |

### Sitemap

| Item | Valor canónico |
|---|---|
| Max URLs per sitemap | **50,000** |
| Max file size | **50MB** uncompressed |
| Encoding | UTF-8 |
| `lastmod` format | W3C datetime (`2026-04-17` o `2026-04-17T10:00:00-03:00`) |
| `changefreq`/`priority` | **Ignorados por Google** |

### Robots.txt

| Item | Valor canónico |
|---|---|
| Max size | 500KB |
| Location | Root: `https://host/robots.txt` |
| Scope | Protocol + host + port |
| `Crawl-delay` | Ignorado por Google (Bing/Yandex OK) |

### Structured data (JSON-LD)

| Item | Valor canónico |
|---|---|
| `Organization.logo` min | 112x112px |
| `Article.image` min | 50K pixels (width × height) |
| `Article.image` aspect ratios | 16:9, 4:3, 1:1 |
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

### Imágenes Next/image

| Item | Valor canónico |
|---|---|
| Quality default | 75 |
| Default loading | `lazy` (excepto `priority={true}`) |
| `sizes` prop | Required con `fill` |
| Width/Height | Required si no `fill` |

### Accesibilidad

| Item | Valor canónico |
|---|---|
| Contrast text WCAG AA | ≥ 4.5:1 |
| Contrast large text (18pt+) | ≥ 3:1 |
| Touch target | ≥ 44x44px |
| Font size mobile | ≥ 16px |

### Redirects

| Item | Valor canónico |
|---|---|
| Permanent | 301 o 308 |
| Temporary | 302 o 307 |
| Gone (removed permanent) | 410 |
| Max redirect hops (Google) | 10 |
| Recomendado | 0-1 hops |

### Hreflang

| Item | Valor canónico |
|---|---|
| Language codes | ISO 639-1 (`es`, `en`) |
| Region codes | ISO 3166-1 Alpha-2 (`AR`, `US`, `GB`) |
| Formato | `es-AR` (guión, no underscore) |
| Fallback | `x-default` |
| Script variations | ISO 15924 (`zh-Hans`, `zh-Hant`) |

### HTTP status codes

| Code | Uso |
|---|---|
| 200 | OK, indexable |
| 201, 202 | Wait, process later |
| 204 | No content, not indexed |
| 301 | Permanent redirect (canonical signal pass) |
| 302 | Temporary redirect (no canonical pass) |
| 307 | Temp redirect, preserve method |
| 308 | Permanent, preserve method |
| 404 | Not found (frequency decrease) |
| 410 | Gone (faster deindex) |
| 429 | Too many requests (rate limit) |
| 503 | Service unavailable + Retry-After |

### Currencies ARS (Argentina)

| Item | Valor canónico |
|---|---|
| ISO 4217 code | `ARS` |
| Formato visible | `$1.500` (punto miles, sin decimales) |
| Formato schema (price) | `1500` (integer, sin formato) |
| Timezone | `America/Argentina/Buenos_Aires` (GMT-3) |

### Limites caracter Google (truncation guidelines)

| Item | Típico (puede variar por device/query) |
|---|---|
| Title link SERP | ~50-60 chars desktop, ~40-50 mobile |
| Meta description SERP | ~155-160 chars desktop, ~120 mobile |

---

**Total items del checklist: 320+**

Cubre 29 categorías (incl. AI Search & Crawlers / AEO-GEO) con referencias específicas a la documentación oficial de Google Search Central (incl. la guía oficial de IA en Search, 2026), web.dev, Next.js 16, Schema.org, W3C WCAG, Open Graph Protocol, y las docs de crawlers de OpenAI/Anthropic/Google. Cada item tiene criticidad, criterio de "done", método de validación concreto (Lighthouse, Rich Results Test, curl, GSC, DevTools, Screaming Frog, etc.), y referencia.