# Troubleshooting · brandboard-creator

## `process-isotipo` devuelve PNG en blanco o negro sólido

**Causa**: el threshold de luminancia a 128 no distingue el logo del fondo. Pasa si el input es un PNG ya transparente (silueta sobre alpha) o si el logo es muy claro / muy oscuro sobre un fondo ambiguo.

**Fix**:
- Si el input tiene alpha: el script lo detecta con `metadata.hasAlpha` y extrae el canal directo. Verificar que el input tenga transparencia real (no solo "background: transparent" en CSS).
- Si el input es JPEG u opaco: pre-procesarlo manualmente (ej. con GIMP) para asegurarte que el logo esté en tonos claramente oscuros sobre fondo claro (o vice versa). Luego reintentar.
- Alternativa rápida: tener el usuario provea ambos (`logo-black.png` + `logo-white.png` ya procesados) y saltear `process-isotipo`.

## `extract-colors` devuelve todos null o colores inesperados

**Causa**: `node-vibrant` quantiza el PNG buscando colores dominantes. Si el isotipo es monocromo (solo negro + transparente), no hay "vibrant" a extraer.

**Fix**:
- En ese caso, omitir la opción "(a) extraer del isotipo" y ofrecer sólo los presets curados.
- Si el usuario forzosamente quiere una paleta "desde el isotipo", usar el preset neutral (`saas-dark` o `minimal-mono`) como default.

## Preview de paleta o fuente sale en negro o con texto roto

**Causa 1**: Google Fonts no cargó a tiempo.

**Fix**: `render-previews.mjs` ya espera `document.fonts.ready` y un `waitForTimeout(400)`. Si la red está lenta, aumentá el timeout (modificar script).

**Causa 2**: placeholder no fue reemplazado y quedó `{{color-x}}` como texto literal.

**Fix**: revisá el input pasado al script de render de previews — el HTML en `explore/` debe tener los `{{}}` ya materializados antes de rasterizar. Si falta un valor, queda como texto literal y rompe el CSS. Ver `template-anatomy.md` para el inventario de placeholders esperados.

## `materialize.mjs` no genera algunos archivos

**Causa**: estás en modo `wordmark-only` y el script está saltando los symbol + lockup templates porque no hay variante `-wordmark-only.hbs` definida.

**Fix** (por ahora): el modo `wordmark-only` está parcialmente implementado. Genera solo:
- `shared.css`
- `manifest.js` (sin entries para symbol/lockup)
- `brand.html` (con ajustes mínimos, el symbol queda roto)
- wordmarks 47-51
- favicon master degradado a "primera letra en cuadrado accent"

Para full support de wordmark-only, agregar templates `-wordmark-only.hbs` que sean variantes sin `<img>` y con el wordmark escalado. Pendiente.

## La galería no muestra el proyecto nuevo

**Causa**: el `<script src="projects/<slug>/manifest.js">` no se agregó al `index.html`.

**Fix**: el skill debe insertar la línea dentro del bloque `<!-- PROJECTS -->` ... `<!-- /PROJECTS -->` del `index.html` del taller. Si `materialize.mjs` no lo hace, agregar manualmente:

```html
<!-- PROJECTS -->
<script src="projects/shopear/manifest.js"></script>
<script src="projects/<slug>/manifest.js"></script>
<!-- /PROJECTS -->
```

## El `brand.html` renderiza pero `62-brandboard.png` queda cortado o con padding negro

**Causa**: el `data-height` del iframe en `62-brandboard.html` no coincide con la altura real del `brand.html`.

**Fix**: medir la altura real con un script quick:
```js
const h = await page.evaluate(() => document.documentElement.scrollHeight)
```
Actualizar `{{brandboard-height}}` al valor real y re-materializar + re-renderizar. El skill debe incluir este paso de medición en el flow, después de generar brand.html y antes de renderizar el 62.

## `favicon.ico` no se genera o está vacío

**Causa**: falta `png-to-ico` o el `59-favicon-master.png` no existe todavía.

**Fix**: el flow correcto es:
1. `materialize.mjs` → escribe `pieces/59-favicon-master.html`
2. `render.mjs <slug>` → genera `out/59-favicon-master.png`
3. `scripts/build-favicons.mjs <slug>` → deriva `webicons/favicon.ico` y los demás PNGs

Si saltás del 1 al 3 sin renderizar, falla porque el master PNG no existe. Asegurate de ejecutar los 3 pasos en orden.

## Google Fonts no cargan (offline o detrás de proxy)

**Causa**: los previews y piezas dependen de acceso a `fonts.googleapis.com`.

**Fix**:
- Online: verificar conectividad.
- Offline: hay que bajar las fuentes y cambiar `@import url(...)` del `shared.css` a un `@font-face` con `.woff2` local en `assets/fonts/`. Esto no está implementado en el skill — queda manual.

## El punchline del OG image se desborda (2+ líneas o cortado)

**Causa**: `{{og-punchline-html}}` muy largo para 50px de font-size con max-width 920px.

**Fix**:
- Acortar el punchline del OG para que entre en una o dos líneas.
- O modificar `pieces/61-og-image.html.hbs` para bajar `font-size` (ej. 42px) y/o aumentar max-width.
