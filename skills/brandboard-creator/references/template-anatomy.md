# Template anatomy · brandboard-creator

Los templates viven en `templates/` con sufijo `.hbs` en el filename (puro indicativo — no usamos Handlebars, sólo replace de `{{token}}`).

## Inventario

| Template | Output | Notas |
|---|---|---|
| `shared.css.hbs` | `shared.css` | tokens + reset + font imports |
| `manifest.js.hbs` | `manifest.js` | registry del proyecto para la galería |
| `brand.html.hbs` | `brand.html` | brandboard referencia viva (raíz del proyecto) |
| `pieces/42-46-symbol-on-*.html.hbs` (5) | `pieces/*.html` | 1080×1080, 5 fondos |
| `pieces/47-51-wordmark-on-*.html.hbs` (5) | `pieces/*.html` | 1500×500, 5 fondos |
| `pieces/52-56-lockup-h-on-*.html.hbs` (5) | `pieces/*.html` | 1800×600, 5 fondos |
| `pieces/57-58-lockup-stacked-on-*.html.hbs` (2) | `pieces/*.html` | 1080×1080, 2 fondos |
| `pieces/59-favicon-master.html.hbs` | `pieces/*.html` | 512×512 |
| `pieces/60-apple-touch-180.html.hbs` | `pieces/*.html` | 180×180 |
| `pieces/61-og-image.html.hbs` | `pieces/*.html` | 1200×630 |
| `pieces/62-brandboard.html.hbs` | `pieces/*.html` | 1920×{{brandboard-height}} |
| `explore/palette-candidate.html.hbs` | — | preview interactivo (no va al target) |
| `explore/font-candidate.html.hbs` | — | preview interactivo (no va al target) |

## Placeholders

### Identidad

| Token | Tipo | Ejemplo | Notas |
|---|---|---|---|
| `{{brand-slug}}` | string | `shopear` | carpeta del proyecto |
| `{{brand-name}}` | string | `shope.ar` | display name |
| `{{wordmark-first}}` | string | `shope` | parte pre-accent del wordmark |
| `{{wordmark-accent}}` | string | `.ar` | parte en accent del wordmark |
| `{{brand-meta-version}}` | string | `v1` | versión del brand |
| `{{brand-meta-established}}` | date | `2026-04-23` | fecha YYYY-MM-DD |
| `{{brand-source-doc}}` | string | `brandboard-creator` | procedencia del brandboard |

### Colores (usados en CSS var declarations + hex literales en brand.html)

| Token | Ejemplo |
|---|---|
| `{{color-ink}}` | `#111111` |
| `{{color-white}}` | `#ffffff` |
| `{{color-accent}}` | `#25D366` |
| `{{color-accent-ink}}` | `#073019` |
| `{{color-cream}}` | `#F7F3EC` |
| `{{color-navy}}` | `#0F172A` |
| `{{color-slate}}` | `#1F2937` |
| `{{color-accent-soft}}` | `rgba(37,211,102,0.12)` |
| `{{color-accent-glow}}` | `rgba(37,211,102,0.42)` |
| `{{color-accent-ring}}` | `rgba(37,211,102,0.22)` |
| `{{color-accent-atmo-mid}}` | `rgba(37,211,102,0.22)` | para el glow del brand.html |
| `{{color-accent-atmo-soft}}` | `rgba(37,211,102,0.04)` | para el glow suave del brand.html |
| `{{color-accent-glow-og-mid}}` | `rgba(37,211,102,0.32)` | para el glow del og-image |
| `{{color-accent-glow-og-soft}}` | `rgba(37,211,102,0.06)` | idem suave |

Nota: los rgba() del accent se derivan del `{{color-accent}}`. El skill al materializar toma el hex, extrae RGB, y genera las variantes con distintos alphas.

### Fuentes

| Token | Ejemplo |
|---|---|
| `{{font-display-family}}` | `Baloo 2` |
| `{{font-display-google-query}}` | `Baloo+2:wght@500;600;700;800` |
| `{{font-display-weight-display}}` | `700` |
| `{{font-display-letter-spacing}}` | `-0.02em` |
| `{{font-ui-family}}` | `Poppins` |
| `{{font-ui-google-query}}` | `Poppins:wght@400;500;600;700` |

### Copy (punchline + voice)

| Token | Ejemplo |
|---|---|
| `{{punchline-html}}` | `ponete a <b>shoppear</b> en tres simples pasos.` (HTML permitido: `<b>` para highlight) |
| `{{og-eyebrow}}` | `whatsapp-first · argentina` |
| `{{og-punchline-html}}` | versión del punchline para el OG image (idem o más corta) |
| `{{og-tagline}}` | `tu catálogo online · pedidos por whatsapp` (footer OG) |
| `{{voice-variation-1..3}}` | variaciones autorizadas del punchline |
| `{{voice-rule-1..4}}` | reglas de tono (voseo, minúsculas, etc.) |
| `{{voice-highlights}}` | palabras a destacar en 800 (coma-separadas o `<code>`-envueltas) |

### Otros

| Token | Ejemplo |
|---|---|
| `{{brandboard-height}}` | `8900` (entero en px, altura del iframe del brandboard) |
| `{{preset-label}}`, `{{preset-rationale}}`, `{{preset-index}}` | usados en `explore/palette-candidate.html.hbs` |
| `{{pair-label}}`, `{{pair-rationale}}`, `{{pair-index}}` | usados en `explore/font-candidate.html.hbs` |
| `{{isotipo-white-path}}` | `../assets/logo-white.png` (en explore previews: path absoluto file:// o relativo) |

## Reglas de interpolación

- `materialize.mjs` hace `.replaceAll('{{key}}', value)` — no interpreta HTML, no hay escaping especial. Si tu valor contiene `{{`, se inserta tal cual.
- Placeholders no resueltos (sin valor en `values`) se dejan tal cual en el output. Si ves `{{something}}` en un archivo generado, falta ese valor.
- Los `.hbs` en el filename se strippean: `foo.html.hbs` → `foo.html`.

## Cómo agregar un template nuevo

1. Crear `templates/<path>/foo.html.hbs` con el contenido.
2. Documentar los placeholders que usa en este archivo.
3. Actualizar `manifest.js.hbs` si la pieza va al registry de la galería (o no, si es puro asset funcional).
4. Testear con el smoke test (ver `flow-all-in-one.md`).
