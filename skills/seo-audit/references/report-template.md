# SEO Audit Report — Template

Usar este formato al cerrar una auditoria. Adaptar sections segun scope.

---

# SEO Audit — [Nombre del sitio/proyecto]

- **Fecha**: YYYY-MM-DD
- **URL auditada**: `https://ejemplo.com` (y subdomains si aplica)
- **Scope**: [homepage / full site / multi-tenant / solo estructural / solo content]
- **Herramientas usadas**: Rich Results Test, PageSpeed Insights, Lighthouse, Screaming Frog, GSC, curl

## Resumen ejecutivo

- **Score global**: X/10
- **GO/NO-GO**: [GO si criticos = 0, NO-GO si hay criticos]
- **Punch line**: Una frase sobre el estado general (3-5 palabras clave).

## Scores por categoria

| Categoria | Score | Comentario |
|---|---|---|
| Meta tags | X/10 | |
| Open Graph / Twitter | X/10 | |
| Structured Data (JSON-LD) | X/10 | |
| Sitemap | X/10 | |
| Robots.txt | X/10 | |
| Iconos + Manifest | X/10 | |
| Core Web Vitals | X/10 | |
| Performance / Next.js | X/10 | |
| Accesibilidad | X/10 | |
| URL structure | X/10 | |
| Redirects | X/10 | |
| Security | X/10 | |
| E-commerce (si aplica) | X/10 | |
| Multi-tenant (si aplica) | X/10 | |
| AI Search / Crawlers (AEO/GEO) | X/10 | |
| Image SEO | X/10 | |

## Fortalezas

- [Lo que esta bien hecho. 3-5 bullets.]

## Findings

Formato: `[ ] **[Categoria]** descripción — archivo:línea o URL | Severidad: critico/alto/medio/bajo | Esfuerzo: S/M/L`

### CRITICO (afecta indexación, exposición de rutas privadas, penalizaciones Google)

1. [ ] **[Robots/Indexing]** `/admin/*` indexable, deberia tener noindex — `src/app/admin/layout.tsx:10` | Critico | S
2. [ ] **[Canonical]** Canonical cross-tenant en productos — `src/app/producto/[slug]/page.tsx:25` | Critico | M

### ALTO (SEO visible, conversion, trust)

1. [ ] **[OG]** `og:image` 404 cuando SiteConfig.ogImage esta vacio — `src/app/layout.tsx:110` | Alto | S

### MEDIO (optimizaciones)

1. [ ] **[Schema]** `/catalogo` sin ItemList JSON-LD — `src/app/catalogo/page.tsx` | Medio | M

### BAJO (mejoras)

1. [ ] **[Security]** HSTS sin `preload` directive — `next.config.ts:20` | Bajo | S

## Quick wins

Cambios < 1h con impacto alto. Maximo 5.

1. [Cambio 1] — archivo:linea | Esfuerzo: S
2. ...

## Re-auditoria checklist (30 dias)

Items a re-chequear despues del fix:

- [ ] Verificar rich results snippets en SERP (site:URL en Google)
- [ ] GSC Coverage report limpio (index + noindex correctos)
- [ ] PageSpeed Insights mobile CWV todos en `good`
- [ ] Submit sitemap en GSC + verificar indexed count
- [ ] Re-scrape Facebook Debugger si cambio OG
- [ ] Manual test de canonical urls (no cross-tenant, absolute, en head)
- [ ] Robots.txt: política de AI-bots correcta (retrieval allow, Googlebot nunca bloqueado, Google-Extended consciente)
- [ ] Páginas clave indexables y elegibles para snippet (base de AI Overviews / AI Mode)
- [ ] IndexNow pingeando en mutations (si se usa Bing/Yandex)

## Evidencia / scans adjuntos

Referencia archivos o outputs generados:
- `scans/curl-robots-<host>.txt`
- `scans/lighthouse-<url>.html`
- `scans/screaming-frog-report.csv`
- `scans/rich-results-test-<url>.json`

## Comparacion con baseline (si aplica)

Si existe reporte anterior:
- **Resuelto**: findings cerrados
- **Regresion**: nuevos findings en areas que estaban OK
- **Persiste**: findings previos todavia abiertos
- **Nuevo**: findings detectados por primera vez
