---
name: seo-audit
description: Audit exhaustivo SEO de un sitio web (Next.js preferido pero aplica a cualquier stack). Verifica meta tags, Open Graph, Twitter Cards, structured data (JSON-LD), sitemap, robots.txt, iconos/manifest, Core Web Vitals, accesibilidad, URL structure, redirects, i18n, mobile-first, security, e-commerce SEO, indexing directives, E-E-A-T, crawl budget, multi-tenant SEO, image/video/local SEO, AI Search & crawlers (AEO/GEO, AI Overviews, GPTBot/Claude/Perplexity, llms.txt, IndexNow) y más. Usar cuando el usuario pide auditoría SEO, quiere preparar el sitio para indexación o para búsqueda con IA, chequear rich results, o validar best practices de Google 2026.
---

# SEO Audit

Auditoría exhaustiva de SEO tecnico + on-page basada en docs oficiales de Google Search Central (incl. la guia oficial de IA en Search, 2026), web.dev Core Web Vitals, Next.js Metadata API, Schema.org y OGP.

## Cuando usar

- Usuario pide "auditoria SEO", "chequear SEO", "preparar para indexar", "rich results"
- Antes de un launch publico o migracion de dominio
- Despues de cambios grandes en arquitectura (URLs, redirects, multi-tenant)
- Para validar que structured data, meta tags y Core Web Vitals estan en `good`
- Cross-repo: es un skill global, aplica a cualquier stack (Next.js, SvelteKit, Astro, Rails, etc.)

## Bootstrap

1. Leer `CLAUDE.md` si existe (reglas de proyecto, guardrails).
2. Detectar stack del sitio:
   - Next.js: buscar `next.config.*`, `app/` dir
   - Otros: buscar `package.json`, `Gemfile`, `pyproject.toml`
3. Stack-assumed reads (si Next.js):
   - `src/app/layout.tsx` o `app/layout.tsx` (root metadata + fonts)
   - `src/app/sitemap.ts` (o legacy `public/sitemap.xml`)
   - `src/app/robots.ts` (o legacy `public/robots.txt`)
   - `src/app/manifest.ts` (o `public/manifest.json`)
   - `src/app/icon.*`, `src/app/apple-icon.*`, `src/app/opengraph-image.*`, `src/app/twitter-image.*`
   - `next.config.*` (security headers, remotePatterns)
4. Project-specific reads (skip silently si no existen):
   - Componentes JSON-LD (`grep -r "application/ld+json"`)
   - Archivos con `generateMetadata` (`grep -r "generateMetadata"`)
   - Middleware/proxy (redirects, CSP)
   - Directivas de crawlers de IA en `robots.ts`/`robots.txt` (`grep -iE "GPTBot|OAI-SearchBot|Google-Extended|ClaudeBot|PerplexityBot|CCBot"`) — ver categoria 29
   - `/llms.txt` y `/llms-full.txt` si existen (informativo — NO es señal SEO para Google)
5. URL canonica: si es multi-tenant, correr audit por cada subdomain relevante (apex + tenant + admin).

## Workflow

1. **Cargar checklist**: leer `references/checklist.md` (300+ items en 29 categorias, incl. AI Search & Crawlers + cheatsheet con valores canonicos).
2. **Opcional — scan rapido**: correr `scripts/quick-scan.sh <url>` para recopilar senales deterministicas (curl de meta tags, favicon, robots, sitemap, status code, headers security) antes de abrir fuentes.
3. **Aplicar checklist por categoria**: priorizar `critico` > `alto` > `medio` > `bajo`. Verificar cada item con el metodo de validacion que indica el checklist (Lighthouse, Rich Results Test, `curl`, DevTools, GSC, etc.).
4. **Reportar con `references/report-template.md`**: findings con formato unificado, agrupados por severidad.

## Output

- Findings con formato: `[ ] **[Categoria]** descripción — archivo:línea o URL | Severidad: critico/alto/medio/bajo | Esfuerzo: S/M/L`
- Agrupar en 4 secciones: `CRITICO`, `ALTO`, `MEDIO`, `BAJO`.
- Maximo 10 findings por severidad en el cuerpo; resto referenciar como "ver scan file".
- Incluir al final:
  - **Score global** `/10` (10 = todos critico + alto OK)
  - **Score por categoria** (meta, OG/Twitter, schema, sitemap, robots, icons, CWV, security, multi-tenant, AI Search/crawlers)
  - **Quick wins**: cambios < 1h con impacto alto
  - **Re-auditoria checklist**: items para re-chequear en 30 dias

## Guardrails

- **Evidencia o descarte**. Si no podes apuntar a `archivo:linea` concreto o URL especifica con response, el finding NO entra.
- **Cualquier critico ==`NO-GO` para launch**. Critical = tokens indexables, canonical cross-tenant, CWV poor, CSP bloquea Googlebot, robots.txt bloquea CSS/JS, admin indexable.
- **No recomendar patrones deprecados**. `WebSite.potentialAction` SearchAction (Nov 2024). `rel=next/prev`. `keywords` meta (2009). **FAQ rich results removidos 7-may-2026** (+ HowTo 2023; Course/Estimated salary/Learning video/Special announcement/Vehicle listing sep-2025; Practice problem ene-2026): el schema sigue siendo válido e inocuo, pero NO renderiza rich result — no prometer snippets que ya no existen.
- **Core Web Vitals 2026**: siguen LCP/INP/CLS a p75. INP reemplazo a FID en Mar 2024. NO hay métrica sucesora oficial — descartá "VSI/Visual Stability Index" y similares (especulación de blogs, no está en web.dev).
- **No sobre-recomendar GEO/IA**. La guía oficial de Google (2026) dice explícito: NO hace falta `llms.txt`, ni "chunking", ni schema especial, ni estilo de escritura especial para aparecer en features de IA. Visibilidad en IA = SEO clásico + contenido people-first no-commodity + indexable con snippet. Tratar `llms.txt` como opcional/DX, nunca como señal SEO.
- **AI crawlers ≠ Googlebot**. Bloquear `Google-Extended` (training de Gemini) NO afecta indexación ni ranking en Google Search. Bloquear `Googlebot` SÍ saca de Search Y de AI Overviews. Distinguir retrieval bots (allow: `OAI-SearchBot`, `Claude-User`/`Claude-SearchBot`, `PerplexityBot`) de training bots (decisión de negocio). Tokens deprecados: `Claude-Web`, `anthropic-ai`.
- **No inventar tamanos**. Si dudas, consultar `references/cheatsheet.md`.
- **Multi-tenant**: canonical NUNCA cross-tenant. Sitemap/robots/favicon/Organization scopeados por host.

## Resources

- Checklist exhaustivo (29 categorias, 300+ items, con referencias oficiales): `references/checklist.md`
- Cheatsheet de tamanos y valores canonicos: `references/cheatsheet.md`
- Herramientas de validacion: `references/tools.md`
- Template de reporte: `references/report-template.md`
- Scan deterministico: `scripts/quick-scan.sh`
