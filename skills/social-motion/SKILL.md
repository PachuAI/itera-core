---
name: social-motion
description: Animar piezas cortas 9:16 (stories, reels, hooks, teasers, outros) con HTML + CSS keyframes + Playwright frame-by-frame + ffmpeg → MP4 H.264. Pipeline determinístico sin lag, independiente del repo destino. Usar cuando el usuario pida "animar una pieza", "hacer un teaser en video", "story animado", "reel de X segundos", "convertir esta pieza estática en video", "secuencia de imágenes con lockup final" o equivalentes. Complementa a `social-media-vertical-creator` (que es la versión estática).
---

# social-motion

Skill para diseñar y renderizar **piezas animadas cortas** (3–10s, 9:16 por default) con HTML + CSS + Playwright. Output: MP4 H.264 + galería de frames + visor standalone para review.

> Pipeline validado en shope.ar (abril 2026, teaser 40 "pregunta", 6s, 336 KB).

## Cuándo usar este skill

- Usuario pide "animar", "motion", "video corto", "story animada", "reel", "teaser 6s", "hook 3s"
- Ya hay branding definido en el repo (docs/brand, tokens CSS, logos) o se puede rellenar en el momento
- La pieza es corta (<10s) y el foco es un mensaje, no narrativa compleja
- No hay audio sincronizado crítico (esta V1 no maneja timestamps de voz aún)

**NO usar** si:

- El pedido es video largo con escenas (usar After Effects / Premiere)
- Hace falta sync preciso con voz/música (V2, aún no soportado)
- El output es animación 3D / con motion blur real (fuera de scope HTML)
- Es un GIF → este pipeline hace MP4; conversión a GIF es paso extra con ffmpeg

## Filosofía

**HTML plano + CSS `@keyframes` + Playwright frame-by-frame + ffmpeg**. Sin Remotion, sin After Effects, sin React.

Ventajas:

- Cada pieza es UN archivo HTML que abre en el browser y ves el resultado idéntico al MP4
- Los keyframes son CSS estándar, editables sin re-aprender una API
- El renderer pausa todas las `getAnimations()` y setea `currentTime` por frame → pixel-perfect, sin drops
- Portable: mismo pipeline corre en cualquier repo con `motion.config.json` + `@playwright/test` + `ffmpeg-static`

Trade-offs:

- 30–45s de render por pieza de 6s (CPU bound, vale la pena vs lag real-time)
- No hay timeline visual tipo Figma → el timing se edita en CSS (`animation-delay`)
- Sin audio en V1

## Requisitos previos del repo destino

Al invocar el skill, verificar en orden:

1. **Node.js** disponible (no sirve si el proyecto es solo PHP/Python puro)
2. **Dependencias**: `@playwright/test` + `ffmpeg-static` instaladas como devDeps
   - Si faltan: pedir al user correr `pnpm add -D @playwright/test ffmpeg-static` (o `npm`/`yarn` equivalente)
   - Si `ffmpeg-static` no tiene binario descargado: `node node_modules/ffmpeg-static/install.js`
3. **`motion.config.json`** en la raíz del repo
   - Si no existe: hacer **onboarding** (ver sección siguiente)
4. **Logos y assets** referenciados en el config existen en disco

## Workflow end-to-end

### Fase 0 · Onboarding (solo primer uso en un repo)

Si no existe `motion.config.json` en el cwd:

1. **Detectar branding automático**: leer en orden:
   - `docs/brand.md`, `docs/branding.md`, `BRAND.md`
   - `tailwind.config.{js,ts,mjs}` → extraer colores y fonts custom
   - `app/globals.css` o `styles/globals.css` → extraer `--color-*`, `@theme` vars
   - `package.json` → `name` sugerido como proyecto
2. **Buscar logos**: glob para `**/logo-{black,dark}.{png,svg}` y `**/logo-{white,light}.{png,svg}` en `public/`, `assets/`, `logo-*/`
3. **Proponer config inicial** rellenando lo detectado y marcando lo faltante
4. **Confirmar con el usuario**: mostrar el JSON propuesto, preguntar ajustes
5. **Escribir `motion.config.json`** en la raíz del repo (ver `assets/motion.config.example.json`)
6. **Agregar a `.gitignore`** (si existe): `motion-out/`, `motion-pieces/_staging_*`
7. **Crear dirs**: `motion-pieces/`, `motion-out/`

### Fase 1 · Preguntas de diseño (cada pieza nueva)

Hacer las 4 preguntas base, en este orden. Proponer opciones para que el user elija rápido en vez de tipear:

1. **Tipo de pieza** (propone duración default):
   - `teaser` (6s) · mensaje + outro de marca
   - `hook` (3s) · impacto rápido
   - `anuncio` (8s) · mensaje + beneficio + CTA
   - `outro` (4s) · lockup de marca puro
   - `custom` (pedir duración)
2. **Formato**: `9:16 story/reel` (default 1080×1920) · `1:1 feed` (1080×1080) · `16:9 horizontal` (1920×1080) · `custom`
3. **Mensaje central** (texto libre, 1–3 líneas máx para 9:16)
4. **Frame final / end-state**: `lockup marca` (silueta + wordmark + fecha) · `CTA texto` · `custom` · `sin outro` (la pieza termina en el mensaje)

Opcional en V1 (preguntar solo si el user lo menciona):

- Paleta alternativa (cream / dark / custom)
- Highlight de una palabra específica con el color accent

### Fase 2 · Proponer timeline

En base a tipo + duración, elegir receta de `references/timing-recipes.md`. Mostrar al user el timeline propuesto en una tabla tipo:

```
0.0–1.2s  intro fade-in línea 1
1.2–2.5s  build: staggered linea 2 + 3 + highlight
2.5–3.5s  hold + subtitle
3.5–4.5s  crossfade a dark
4.5–6.0s  outro lockup
```

**No avanzar si el user quiere ajustes**. Iterar el timeline antes de generar HTML.

### Fase 3 · Generar pieza HTML

1. Copiar `assets/piece.html.template` → `<repo>/motion-pieces/<NN>-<slug>-motion.html`
2. Sustituir placeholders con:
   - Viewport del config
   - Tokens de marca inyectados en `:root`
   - Contenido de las líneas del mensaje
   - Keyframes y animation-delays según timeline aprobada
   - Outro según end-state elegido
3. **Todo el CSS inline en el HTML** — no depender de `shared.css` externo del repo (portabilidad)
4. Rutas de assets (logos) resueltas relativo al HTML generado

### Fase 4 · Render

```
node <skill-path>/assets/render-motion.mjs <piece-name>
```

El script:

- Lee `motion.config.json` del cwd
- Abre la pieza en chromium headless
- Pausa `document.getAnimations()`, itera frames (0..N), toma screenshot
- Ejecuta ffmpeg (H.264, CRF 18, yuv420p, +faststart)
- Extrae 6 frames @1fps para el visor

Output:

- `motion-out/<piece>.mp4`
- `motion-out/_frames/<piece>/frame-{01..06}.png`

### Fase 5 · Regenerar visor

1. Leer `motion.config.json` → branding del visor
2. Listar todas las piezas en `motion-pieces/*.html` y sus MP4 correspondientes
3. Llenar `assets/viewer.html.template` con la lista
4. Escribir `motion-out/viewer.html`
5. Sugerir al user: `cd motion-out && python3 -m http.server 4010` → `http://localhost:4010/viewer.html`

### Fase 6 · Iteración

Pedir feedback tipo "¿cómo lo ves?". Mapeá feedback común a acciones (ver `references/iteration-playbook.md`):

- "Muy rápido" → subir `animation-duration`
- "Se superponen" → correr `animation-delay` del elemento conflictivo
- "Falta ritmo" → split en palabras/spans individuales (ver teaser 40 `.l3-en`/`.l3-hl`/`.l3-q`)
- "El outro entra muy tarde" → ajustar fase 4 y 5 del timeline

Tras cada ajuste: re-render de ESA pieza (no todas), re-check del frame clave, preguntar de nuevo.

## Estructura del skill

```
~/.claude/skills/social-motion/
├── SKILL.md                          ← este archivo
├── assets/
│   ├── render-motion.mjs             ← renderer genérico portable
│   ├── motion.config.example.json    ← ejemplo de config de repo
│   ├── piece.html.template           ← esqueleto HTML con placeholders
│   └── viewer.html.template          ← visor standalone con placeholders
├── references/
│   ├── keyframe-library.md           ← 6 keyframes base canonizados
│   ├── timing-recipes.md             ← recetas por tipo de pieza
│   └── iteration-playbook.md         ← feedback → acción
└── examples/
    └── teaser-40-pregunta/           ← ejemplo canónico validado (shope.ar)
        ├── piece.html
        └── README.md
```

## Estructura que el skill crea en el repo destino

```
<repo>/
├── motion.config.json                ← branding + defaults (commiteado)
├── motion-pieces/
│   ├── 40-teaser-pregunta-motion.html
│   └── NN-<slug>-motion.html
└── motion-out/                       ← gitignored
    ├── viewer.html
    ├── NN-<slug>-motion.mp4
    └── _frames/
        └── NN-<slug>-motion/
            └── frame-01..06.png
```

## Placeholders del viewer y piece

Ver `assets/viewer.html.template` y `assets/piece.html.template` para la lista exacta. Resumen:

**piece**: `{{VIEWPORT_W}}`, `{{VIEWPORT_H}}`, `{{DURATION_S}}`, `{{BRAND_*}}`, `{{TITLE_TAG}}`, `{{BODY}}`.

**viewer**: `{{PROJECT_NAME}}`, `{{ACCENT}}`, `{{INK_DARK}}`, `{{PIECES_JSON}}` (array con `{name, number, videoSrc, duration, timeline, frames[]}`).

## Ejemplo canónico (dogfooding)

`examples/teaser-40-pregunta/` contiene la pieza que validó este pipeline. Leerla cuando haya dudas sobre cómo estructurar el HTML, cómo nombrar classes, cómo segmentar spans para reveal escalonado.

## Roadmap V2 (fuera de este release)

- Sync con voz/audio: timestamps de palabra → animation-delay auto
- Formatos adicionales (square, horizontal) con templates propios
- Biblioteca extendida de keyframes (glitch, typewriter, kenburns)
- Generar GIF además de MP4
- Frame de referencia (imagen) → skill deriva timeline hacia ese end-state

## Referencias cruzadas

- `social-media-vertical-creator` → piezas **estáticas** 9:16. Si ya existe una pieza estática aprobada, este skill puede "darle vida" copiando el HTML + agregando keyframes.
- `docs/brand.md` del repo destino → fuente canónica de tokens (lo lee el onboarding)
