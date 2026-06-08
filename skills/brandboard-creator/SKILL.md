---
name: brandboard-creator
description: Genera un brandboard completo + logo system + web-assets funcionales para una marca nueva, partiendo de un isotipo y opcionalmente paleta/tipografía. Soporta modo rápido (defaults) y modo exploratorio (elegís paleta + fuente viendo previews). Output en el taller `~/projects/itera-social/projects/<slug>/`. Invocar con "brandboard", "nuevo proyecto de branding", "armá un brand kit para X", "/brandboard-creator", o cuando el usuario pida generar el pack visual inicial de un SaaS nuevo.
---

# brandboard-creator

Skill que automatiza lo que hicimos manualmente para shope.ar (2026-04-23): genera el logo system (symbol × wordmark × lockup sobre 5 fondos), web-assets funcionales (favicon family, apple-touch, OG image), y un brandboard HTML como fuente de verdad visual. Todo partiendo de un isotipo y — si hace falta — ayudando a elegir paleta y tipografía con previews visuales.

## Cuándo usar

- Nuevo SaaS de Itera (o cualquier marca) que arranca y necesita identidad visual consolidada rápido.
- Tenés un isotipo (PNG/SVG) y al menos un nombre. Paleta y fuentes pueden ser nuevas o ya definidas.
- Querés: un lockup canónico (symbol + wordmark), favicons listos, OG image decente para previews de link, y una página de branding HTML como referencia para próximas decisiones de diseño.

## Cuándo NO usar

- **Social packs 9:16** (stories, reels, hooks) → usar `social-media-vertical-creator`. Este skill cubre brandboard + web-assets, no piezas sociales.
- **Videos animados** → usar `social-motion`.
- **Tanda 2 de web-assets** (twitter card, linkedin banner, hero web 16:9, youtube cover) → pendiente, se agrega después.
- **Generar el isotipo desde cero**: este skill no crea isotipos. Si el usuario no tiene uno, sugerir la ITERA API de imágenes (ver `~/projects/itera-core/reference_itera_image_api.md`) o activar el modo `wordmark-only` (brand basada sólo en tipografía).
- **Escribir el `brand.md` del SaaS en su repo**: por ahora queda manual. El brandboard HTML generado acá cumple la función de source of truth visual, pero no reemplaza el `brand.md` escrito a mano.

## Flow al ser invocado

Cuando el usuario invoque el skill (por `/brandboard-creator` o mención equivalente), seguir esta secuencia:

### 1. Confirmar scope

Primer mensaje al usuario (en español rioplatense, consistent con el resto del taller):

> "Listo, vamos con un brandboard nuevo. Antes de arrancar dos preguntas:
> 
> 1. ¿Tenés isotipo (PNG/SVG) o arrancamos con **wordmark-only** (marca puramente tipográfica)?
> 2. ¿Preferís **todo-en-uno** (yo elijo defaults razonables y generamos el pack de una) o **paso a paso** (te muestro previews de paleta, fuente, lockup en cada decisión, y vos elegís)?"

Si el usuario responde parcialmente, completar la info con una segunda ronda.

### 2. Según modo elegido, cargar el flow correspondiente

**Si todo-en-uno**: leer `references/flow-all-in-one.md` y seguirlo paso a paso.

**Si paso-a-paso**: leer `references/flow-step-by-step.md` y seguirlo paso a paso.

El contenido de esos archivos tiene el detalle operativo — no hay que repetirlo acá.

### 3. Datos comunes a pedir al usuario (ambos modos)

- **Nombre display** (ej: "shope.ar")
- **Slug** para la carpeta (ej: "shopear") — lowercase, sin dots, sin espacios.
- **Path al isotipo** (si aplica): ruta absoluta al PNG/SVG.
- **Wordmark split**: qué parte del nombre va en `accent`. Ej: `shope` + `.ar` → accent es `.ar`.
- **Punchline**: frase principal de marketing (ej: "ponete a shoppear en tres simples pasos.").

Datos opcionales (el skill ofrece defaults si no se proveen):
- Paleta (7 colores: ink, white, accent, accent-ink, cream, navy, slate)
- Tipografía (2 Google Fonts: display + UI)
- Copy de voice & tone (variaciones + reglas)

## Herramientas del skill

Dentro de `~/.claude/skills/brandboard-creator/`:

### Presets curados (`references/`)

- `palette-presets.json` — 10 paletas con rationale (saas-dark, warm-cream, corporate-trust, playful-punch, editorial-serif, dev-neutral, bio-organic, tech-neon, minimal-mono, latam-warm).
- `font-pairs.json` — 10 pares de Google Fonts (display + UI) con rationale (baloo-poppins, inter-inter, space-grotesk-inter, fraunces-inter, dm-serif-dm-sans, bricolage-inter, nunito-work-sans, playfair-source-sans, archivo-archivo, instrument-serif-geist).

### Scripts (viven en el taller: `~/projects/itera-social/scripts/`)

- `process-isotipo.mjs <input> <out-dir>` — PNG/SVG → `logo-black.png` + `logo-white.png` 512×512 con transparencia via Sharp threshold.
- `extract-colors.mjs <input>` — extrae 6 colores dominantes con node-vibrant (stdout JSON).
- `render-previews.mjs <dir>` — rasteriza HTMLs de un dir a PNG con Playwright (lee `data-width`/`data-height` del body).
- `materialize.mjs <config.json>` — interpola todos los templates con los valores finales y escribe al proyecto target.
- `build-favicons.mjs <slug>` — deriva familia favicon (16/32/48/192/512 + android-chrome + `.ico`) desde el master.

**Invocar siempre con CWD = `~/projects/itera-social/`** (los scripts dependen de `node_modules/` del taller: sharp, node-vibrant, @playwright/test, png-to-ico). Los scripts viven en el taller — así cualquier skill futuro que los necesite (ej. `web-assets-pack`) los reutiliza.

### Templates (`templates/`)

`.hbs` en el filename es indicativo — usamos replace simple de `{{token}}`. Inventario completo en `references/template-anatomy.md`. Cuidado: no inventar placeholders, revisar el archivo.

## Integración con el taller itera-social

El skill genera dentro de `~/projects/itera-social/projects/<slug>/`:

- `assets/logo-black.png` + `assets/logo-white.png` (masters procesados)
- `shared.css` (tokens + fonts del proyecto)
- `pieces/42-62-*.html` (22 HTMLs: 17 logo system + 3 web-assets funcionales + 1 favicon master + 1 brandboard)
- `brand.html` (referencia viva en la raíz del proyecto, no en `pieces/`)
- `manifest.js` (registry para la galería)
- `out/**.png` (renders, después de `render.mjs`)
- `out/webicons/**` (favicons derivados, después de `build-favicons.mjs`)

Y edita:
- `~/projects/itera-social/index.html` — inserta `<script src="projects/<slug>/manifest.js"></script>` dentro del bloque `<!-- PROJECTS -->`.

## Ejemplo de invocación mínima

> Usuario: `/brandboard-creator`
> 
> Skill: "Listo. ¿Tenés isotipo? ¿Modo todo-en-uno o paso a paso?"
> 
> Usuario: "Isotipo en `~/Desktop/mylogo.png`. Todo en uno."
> 
> Skill: "Dale. Nombre, slug y punchline."
> 
> Usuario: "my.proj / myproj / hacé algo fácil."
> 
> Skill: [procesa isotipo, usa defaults saas-dark + baloo-poppins, genera todo, renderiza, muestra 4 outputs inline]
> 
> Skill: "Listo. Pack en `projects/myproj/`. Abrí `index.html` o el brand.html. Si querés cambiar algo, decime."

## Principios

- **Hablar en español rioplatense** (voseo): consistente con el taller y el resto de skills de Itera.
- **Mostrar visualmente lo que puedas**: cada preview/output relevante, leerlo con `Read` y mostrar inline. El usuario decide con la vista, no con descripciones.
- **Modo exploratorio = muchas opciones visibles**, no "elegí una de esta lista" sin previews.
- **Defaults sensatos pero no silenciosos**: cuando uses un default (ej. `saas-dark` + `baloo-poppins`), decilo explícito para que el usuario sepa y pueda overridear.
- **Iteración barata**: si el usuario quiere cambiar algo puntual (proporción del symbol, hex del accent, tamaño del punchline), modificar valores del config + re-materializar + re-render sólo lo afectado. No recomenzar desde cero.
- **Respetar la regla cardinal del taller**: los HTMLs generados no se borran jamás. Si el usuario dice "esta variante no me gusta", se archiva (`status: archive` en manifest.js) — no se elimina el archivo.

## Fuera de scope de este skill

- Generar isotipos nuevos.
- Skills ejecutables desde otros repos (el skill asume CWD = taller).
- Tanda 2 de web-assets.
- Landing page generator (idea longer-term, skill separado).
- Copy de marketing / punchlines: el skill los pide, no los inventa (salvo default genérico).
