---
name: social-media-vertical-creator
description: Armar packs de piezas verticales 9:16 (1080×1920) para Instagram Story/Reel cover, TikTok, YouTube Shorts usando HTML + CSS + Playwright. Pipeline validado en shope.ar (37 piezas, 2026-04). Usar cuando el usuario pida "pack de stories", "piezas verticales", "contenido para reels", "social pack", "carrusel 9:16" o equivalente.
---

# Social Media Vertical Creator

Pipeline para generar packs de piezas verticales 9:16 (1080×1920) con consistencia de marca, usando HTML + CSS + Playwright. Validado en `shope.ar` (abril 2026, 37 piezas).

## Cuándo usar este skill

- Usuario pide un "pack de stories", "piezas verticales", "social pack", "reel covers"
- Necesitás generar N piezas 1080×1920 con la misma paleta y tipografía que ya define el proyecto
- Hay un brand doc (`docs/brand.md` o equivalente) con paleta, tipografías y tokens listos
- Objetivo: PNG listos para subir a IG Story / Reel cover / TikTok / Shorts

**NO usar** si el pedido es:
- Un único OG image (usar pipeline de `guide_mockups_con_logos.md`)
- Formato horizontal o cuadrado (cambia todo el layout)
- Video animado (este pipeline rasteriza frames estáticos)

## Filosofía del enfoque

**HTML plano + `shared.css` + Playwright**, NO Figma, NO React, NO Canvas API.

Ventajas:
- Cada pieza es un archivo independiente, fácil de iterar
- Los tokens CSS viven en UN solo lugar (`shared.css`) y se replican automáticamente en todas las piezas
- Cambiar acento/tipografía en `:root` y todas las piezas se regeneran consistentes
- El renderer (Node + Playwright) es ~100 líneas
- Editás HTML, abrís en el browser, ves el resultado real al 100% sin exportar nada

## Workflow end-to-end

1. **Bootstrap del workspace** — copiar templates a `<project>/logo-<brand>/social/`
2. **Adaptar tokens** — `:root` vars: colores, fuentes, paleta alternativa
3. **Procesar logos** — PNG transparente negro/blanco (ver `references/adaptation-guide.md` §1)
4. **Brainstorm de piezas** — categorizar: brand / hook / producto / social proof / educativo / feature
5. **Redactar copy** — 1 pieza = 1 mensaje; voice del proyecto (ej. voseo rioplatense en shope.ar)
6. **Crear HTMLs** — `pieces/NN-slug.html`, uno por mensaje, copiando el template base
7. **Preview en navegador** — abrir `index.html` del workspace para ver la grilla
8. **Rasterizar** — `node render-social.mjs` → PNGs 1080×1920 en `out/`
9. **Review + iterar** — ajustar layout, tipografía, copy, volver a rasterizar los que cambian

## Estructura del workspace

```
logo-<brand>/social/
├── shared.css              ← TOKENS + UTILIDADES (editar acá para cambiar marca)
├── index.html              ← Grid preview con iframes de cada pieza
├── gallery.html            ← Viewer más pulido (opcional, se genera al final)
├── render-social.mjs       ← Script de render batch con Playwright
├── assets/
│   ├── logo-black.png      ← Logo master negro transparente
│   └── logo-white.png      ← Logo master blanco transparente
├── pieces/
│   ├── 01-hero-punchline.html
│   ├── 02-wordmark.html
│   └── NN-<slug>.html
└── out/
    └── NN-<slug>.png       ← Output 1080×1920 listo para publicar
```

Este workspace es **dev-only**. Gitignorearlo o borrar antes de deploy.

## Tokens que SIEMPRE se adaptan por proyecto

Viven en `:root` de `shared.css`. Reemplazar estos y el resto del sistema funciona idéntico:

| Variable CSS | Rol | Ejemplo shope.ar |
|---|---|---|
| `--shope-accent` | Color primario de marca (CTA, glow, highlights) | `#25D366` (verde WA) |
| `--shope-accent-ink` | Texto sobre acento (contraste AA) | `#073019` |
| `--shope-accent-soft` | Fondo de badges, hover states | `rgba(37,211,102,0.12)` |
| `--shope-accent-glow` | Box-shadow de CTA y dots | `rgba(37,211,102,0.42)` |
| `--shope-bg` | Canvas default oscuro | `#000000` |
| `--shope-surface` | Card / panel principal | `#0a0a0a` |
| `--shope-surface-raised` | Panel elevado, tile | `#141414` |
| `--shope-border` | Separadores sutiles | `#1f1f1f` |
| `--shope-border-strong` | Bordes tile interactiva, input | `#2e2e2e` |
| `--shope-fg` / `-muted` / `-dim` | Jerarquía texto (4 niveles) | `#fff` / `rgba(255,255,255,0.68)` / `.4` |
| `--shope-cream` / `-navy` / `-ink` | Fondos alternativos para variar pieces | `#f7f3ec` / `#0f172a` / `#111` |
| `--font-display` (ej `--font-baloo`) | Heading / wordmark (redondo, chunky) | Baloo 2 |
| `--font-ui` (ej `--font-poppins`) | Body, eyebrow, CTA, chips | Poppins |

**Regla**: prefijar las variables con el slug del proyecto (`--shope-*`, `--ultimus-*`) para que el skill sea portable cuando el usuario abre varios proyectos en paralelo y no hay colisión de nombres si se mergean estilos.

## Modos de fondo (variedad visual dentro de un mismo pack)

Un pack queda monótono si todo es `mode-dark`. El balance validado en shope.ar (37 piezas):

- **70-75% `mode-dark`** — canvas negro, atmósfera verde (la voz default)
- **15-20% `mode-cream`** — respiro cálido, buenos para mockups
- **5-10% `mode-navy`** — dramático, para wordmarks grandes
- **0-5% `mode-wa` / accent fullbleed** — uso muy puntual, satura rápido

Modos definidos en `shared.css`:

```css
.mode-dark  { background: var(--shope-bg);     color: var(--shope-fg); }
.mode-cream { background: var(--shope-cream);  color: var(--shope-ink); }
.mode-navy  { background: var(--shope-navy);   color: var(--shope-fg); }
.mode-wa    { background: var(--shope-accent); color: var(--shope-accent-ink); }
```

## Fórmula de composición 9:16

Toda pieza respeta este esqueleto (padding outer 96px, altura fija 1920px):

```
┌─ Header ────────────────────────────────┐
│  [brand lockup]            [eyebrow ctx]│
├─────────────────────────────────────────┤
│                                         │
│  eyebrow sección                        │
│                                         │
│  HEADLINE GIGANTE                       │
│  <span class="hl-accent">palabra</span> │
│  EN DOS O TRES LÍNEAS.                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │   VISUAL CENTRAL                │   │
│  │   (mockup / chat / card / SVG)  │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
├─ Footer ────────────────────────────────┤
│  body secundario           [CTA] [pill] │
└─────────────────────────────────────────┘
```

**Escalas tipográficas validadas** (1080×1920):

| Elemento | Tamaño | Font/weight | Line-height |
|---|---|---|---|
| Wordmark hero dramático | 280-340px | display 700 | 0.85-0.9 |
| H1 punchline | 108-148px | display 600 | 0.96 |
| H2 solución/complemento | 64-76px | display 600 | 1.05 |
| Body lead | 26-34px | ui 400 | 1.5 |
| Eyebrow | 18-22px | ui 500, upper, track 0.24em | 1 |
| Body small / hint | 18-22px | ui 400 | 1.5 |
| CTA pill | 26px | ui 600 | 1 |
| Wordmark header | 28px | display 700 | 1 |

## Categorías de piezas (usar todas para balance)

Asignar un `badge` a cada pieza (se muestra en el grid preview):

- **brand** — hero punchline, wordmark dramático, introducción de marca
- **hook** — abre con dolor, pregunta, "antes/después", pain points
- **producto** — mockup admin, checkout, feature visible
- **social proof** — contadores (5 min, X tiendas, X usuarios), testimonios
- **educativo** — cover de carrusel, "3 pasos", explicación
- **feature** — foco en 1 feature específico (dominio propio, multi-celu, sync)

**Regla de mezcla validada**: `pack inicial de 10-12 = 2-3 brand + 3-4 hook + 2-3 producto + 1-2 social proof + 1-2 educativo`. Luego profundizar con 15-25 piezas de feature / hook temático (shope.ar terminó con 37).

## Primitives reusables (vienen en `shared.css`)

Los componentes que tienen que existir en el shared.css de cualquier proyecto adaptado:

- **`.artboard`** + modos — el contenedor 1080×1920
- **`.atmo-glow`**, **`.atmo-particles`**, **`.atmo-grain`** — atmósfera de fondo (copiable tal cual, son genéricos)
- **`.display`**, **`.wordmark`**, **`.body`**, **`.eyebrow`** — tipografía
- **`.hl-accent`** — palabra destacada en color acento + peso extra
- **`.brand-lockup`** — dot + wordmark del proyecto (ajustar wordmark al proyecto)
- **`.cta-primary`** — botón pill con glow
- **`.status-pill`** — pill con dot verde "online / gratis / disponible"
- **`.chip`** — tag de categoría
- **`.iphone`** — frame puro CSS de iPhone (notch + bordes + sombra)
- **`.wa-chat`** + `.wa-bubble.in/.out` — mock de chat WhatsApp
- **`.mock-window`** — frame de browser/app
- **`.divider-h`** — línea con glow

Ver `templates/shared.css` para el código completo.

## Para adaptar a un proyecto nuevo

Leer `references/adaptation-guide.md`. Resumen:

1. Copiar `templates/` entero a `<proyecto>/logo-<brand>/social/`
2. Editar `:root` de `shared.css`: renombrar `--shope-*` → `--<brand>-*`, pegar paleta del proyecto
3. Editar `.brand-lockup` con el wordmark correcto
4. Cambiar fuentes en el `@import` de Google Fonts + `--font-display/--font-ui`
5. Procesar logo a `assets/logo-black.png` + `assets/logo-white.png` (ver guía)
6. Brainstorm de 10-12 piezas iniciales basadas en las categorías
7. Copiar `templates/_template-piece.html` por cada pieza, ajustar copy + modo + visual
8. `pnpm add -D @playwright/test && pnpm exec playwright install chromium` en el proyecto si no está
9. `node logo-<brand>/social/render-social.mjs` → PNGs en `out/`

## Caso de uso validado: shope.ar

Ver `references/shope-ar-case-study.md` para el detalle completo:
- Pack de 37 piezas generadas en 2 tandas (inicial 12 + profundización temática 25)
- Stack: Baloo 2 + Poppins + verde WhatsApp
- Voz: voseo rioplatense, minúsculas sistemáticas, verbos 2da persona presente
- Distribución de modos, categorías, y tipo de visual central por pieza

## Templates disponibles

- `templates/shared.css` — shared.css completo listo para copiar + search/replace del slug
- `templates/_template-piece.html` — HTML base de una pieza con los slots marcados
- `templates/render-social.mjs` — script de render con Playwright (~100 líneas, copiable tal cual)
- `templates/index.html` — preview grid con iframes de todas las piezas

## Guardrails

- **NO empaquetar `logo-<brand>/social/` con el build de producción** — es workspace dev, gitignorear o borrar antes de deploy
- **Playwright debe esperar `document.fonts.ready` + 600ms** antes del screenshot (sin eso: FOUT visible en el PNG)
- **Zona segura IG Story**: primeros 250px verticales los tapan los controles de IG. NO poner texto crítico ahí, usar para atmósfera/glow
- **Nunca mezclar dos fuentes display** en el mismo pack — siempre display (wordmark) + UI (body)
- **Tamaño mínimo de texto en una pieza 1920h**: ~18px. Por debajo no se lee en el preview chico de IG
- **Antes de rasterizar un batch grande**, probar 1-2 piezas primero para validar fonts y layout; un bug en `shared.css` rompe las 37 al mismo tiempo
- **Prompts de copy**: si el proyecto define voice (voseo, lowercase, sin exclamaciones), escribir el copy respetando esa voz; no generar copy genérico y después "ajustarlo"
- **Logos**: el master negro y blanco DEBEN estar en `assets/` antes de abrir las piezas — si faltan, las piezas que los usan van a mostrar íconos rotos en el PNG final
