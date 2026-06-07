# Flow all-in-one · brandboard-creator

Modo rápido: skill toma decisiones default sensatas y genera el pack completo sin checkpoints intermedios.

**Cuándo usarlo**: el usuario tiene todos los inputs (o acepta defaults), quiere ver el pack generado ya, e iterará después si algo no le cerró.

## Pasos

### 1. Intake

Preguntar (una sola ronda, no check por check):

- Path al isotipo (PNG/SVG). Si no hay → offer wordmark-only mode. Si acepta → continuar; si rechaza → cortar y sugerir generar un isotipo antes (ej. vía ITERA API de imágenes).
- `displayName` (ej: "shope.ar"), `slug` (ej: "shopear"), split del wordmark (qué parte va en accent).
- Punchline inicial.
- Si tiene paleta → pedir 3 colores mínimos (accent + 2 cualquiera). Si no → usar preset `saas-dark`.
- Si tiene tipografía → pedir los 2 google fonts (display + UI). Si no → usar par `baloo-poppins`.

### 2. Setup de estructura

```bash
TARGET=~/projects/itera-social/projects/<slug>
mkdir -p $TARGET/{pieces,out,motion-out,assets}
```

### 3. Procesar isotipo (si aplica)

```bash
cd ~/projects/itera-social
node ~/projects/itera-social/scripts/process-isotipo.mjs <input-path> $TARGET/assets/
```

Outputs: `logo-black.png` + `logo-white.png` en 512×512 transparente.

Si modo wordmark-only: saltar este paso.

### 4. Construir config de materialización

Armar JSON con todos los valores finales. Base del `values` (ver `template-anatomy.md` para inventario completo):

- Identidad: `brand-slug`, `brand-name`, `wordmark-first`, `wordmark-accent`, `brand-meta-*`.
- Colores: tomar los 7 del preset elegido (o los 7 provistos por el usuario), derivar los rgba (soft/glow/ring/atmo) del `accent` con alphas estándar:
  - `accent-soft`: alpha 0.12
  - `accent-glow`: alpha 0.42
  - `accent-ring`: alpha 0.22
  - `accent-atmo-mid`: alpha 0.22
  - `accent-atmo-soft`: alpha 0.04
  - `accent-glow-og-mid`: alpha 0.32
  - `accent-glow-og-soft`: alpha 0.06
- Fuentes: del par elegido (display family + query + weight + letter-spacing; ui family + query).
- Copy: punchline + variaciones + voice rules (si no las da el usuario, usar defaults genéricos).
- Technical: `brandboard-height` initial=8900 (se ajusta después si hace falta).

Guardar como `/tmp/brandboard-<slug>-config.json`.

### 5. Materializar

```bash
cd ~/projects/itera-social
node ~/projects/itera-social/scripts/materialize.mjs /tmp/brandboard-<slug>-config.json
```

Output: `projects/<slug>/shared.css`, `manifest.js`, `brand.html`, `pieces/42-62-*.html` (22 archivos).

### 6. Integrar al `index.html` del taller

Editar `~/projects/itera-social/index.html` para agregar dentro del bloque `<!-- PROJECTS -->`:

```html
<script src="projects/<slug>/manifest.js"></script>
```

### 7. Renderizar

```bash
cd ~/projects/itera-social
node render.mjs <slug>
```

22 PNGs en `projects/<slug>/out/`.

### 8. Generar family de favicons

```bash
cd ~/projects/itera-social
node scripts/build-favicons.mjs <slug>
```

Output: `projects/<slug>/out/webicons/favicon.ico` + 5 favicons PNG + 2 android-chrome.

### 9. Verificar altura del brandboard (importante)

```bash
# Medir altura real del brand.html generado
cat <<EOF > /tmp/measure-brand.mjs
import { chromium } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const b = await chromium.launch({ headless: true })
const p = await b.newPage({ viewport: { width: 1920, height: 800 } })
await p.goto(pathToFileURL(path.resolve('projects/<slug>/brand.html')).href, { waitUntil: 'networkidle' })
await p.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
await p.waitForTimeout(800)
console.log(await p.evaluate(() => document.documentElement.scrollHeight))
await b.close()
EOF
cd ~/projects/itera-social && node /tmp/measure-brand.mjs
```

Si la altura real es distinta (ej. 9200 vs 8900 declarado):
1. Update `brandboard-height` en el config JSON.
2. Re-run `materialize.mjs` (sólo regenera el `62-brandboard.html`).
3. Re-run `render.mjs <slug> 62`.

### 10. Mostrar outputs al usuario

Con `Read` sobre 3-4 PNGs clave, mostrar inline:
- `52-lockup-h-on-ink.png` (el lockup canónico).
- `61-og-image.png` (link preview).
- `62-brandboard.png` (brandboard completo).
- `60-apple-touch-180.png` (favicon).

### 11. Reportar y parar

"Listo. Si querés ajustar algo (proporción del symbol, color del accent, punchline), decime qué y re-materializo."

## Errores durante all-in-one

- Si `process-isotipo` falla → preguntar al usuario si puede proveer los `logo-black.png` y `logo-white.png` ya procesados. Si no → cortar.
- Si `render.mjs` falla en una pieza específica → reportar esa pieza y seguir con el resto.
- Si la galería no muestra el proyecto → revisar el insert al `index.html`.

Ver `troubleshooting.md` para casos frecuentes.
