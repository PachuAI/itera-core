---
name: iteralex-social-stories
description: Armar stories verticales 9:16 (1080×1920) de ÍTERA Lex para Instagram/redes con el método "reveal-ladder" validado — el mismo lenguaje visual del feed (iteralex-typo.css): wordmark, comillas/acentos naranjas, mocks de laptop/phone, statements tipográficos, y cadenas de 3-4 historias (pocas palabras + mock). Cada pieza es un HTML autocontenido con 3 vistas (pieza final / escalera de reveal `?view=ladder` / paso `?step=N`). Trae el kit (story-kit.css/js), plantillas (tipográfica, con mock, brand-hero, índice de cadenas) y el checklist de criterios de estilo para no repetir correcciones básicas. Usar SIEMPRE que el user pida "story/historia de iteralex", "historia 9:16", "cadena/tira de historias", "story con mock y pocas palabras", "reveal de una historia", "/iteralex-social-stories". NO usar para covers del feed 4:5 (eso es iteralex-typographic-post) ni piezas 9:16 genéricas de otras marcas (social-media-vertical-creator).
---

# ÍTERA Lex — Social Stories (reveal-ladder)

Stories 9:16 para `@itera.lex` y redes. Método validado (2026-06): pocas palabras + mock, montado sobre el **sistema visual del feed** (`iteralex-typo.css`), con un motor de **reveal acumulativo** que sirve para planificar qué animar. Las historias se agrupan en **cadenas** (secuencias de 3-4 para publicar en orden).

Stage de referencia (implementación real): `~/projects/itera-social/projects/iteralex/campañas/stories/`.

## Cuándo usar

- Stories 9:16 de ÍTERA Lex: features, integraciones, narrativa de marca, lanzamientos.
- Cadenas/tiras de historias (3-4) que se publican en secuencia.
- Cuando el objetivo es "pocas palabras + un mock con un pedacito de pantalla" (no sobrecargar).

**Out of scope**: covers del feed 4:5 (`iteralex-typographic-post`), piezas 9:16 genéricas cross-marca (`social-media-vertical-creator`), motion/Remotion (`remotion-vertical-shorts`).

## Cómo está hecho

Cada story es **un HTML autocontenido**. Importa, en orden:

```html
<link rel="stylesheet" href="../../../shared.css" />               <!-- tokens brand del proyecto -->
<link rel="stylesheet" href="../../feed-launch/iteralex-typo.css" /> <!-- sistema del feed -->
<link rel="stylesheet" href="../story-kit.css" />                  <!-- reveal + mocks + escalera -->
```

Root: `<div class="feed is-vertical story" data-max-step="N">`. Tres vistas (las maneja `story-kit.js` leyendo `location.search`):

| URL | Qué muestra | Para qué |
|---|---|---|
| `pieces/NN-slug.html` (sin query) | composición final 1080×1920 | lo que renderiza `render.mjs` → PNG; publicar |
| `…?view=ladder` | la composición clonada por paso, en filas | planificación: ver cómo se construye, decidir animación |
| `…?step=N` | frame único hasta el paso N | export PNG por paso (opcional) |

El DOM estático = la pieza final. El JS es aditivo: sin query (o si falla) la pieza igual se ve completa. `render.mjs` carga `file://` sin query → siempre el frame final limpio. Detalle del contrato `data-step` y el catálogo de primitivos: `references/anatomia.md`.

## CRITERIOS DE ESTILO — chequear en CADA story (no saltárselos)

> Estos criterios nacieron de correcciones reales. La consistencia entre piezas de una cadena es la prioridad. **Antes de dar una story por buena: renderizar y mirar el PNG contra esta lista.**

1. **Sistema del feed**: montar sobre `iteralex-typo.css`. **Cero pills/badges**. El framing honesto (ej "en validación con estudios piloto") va como `.story-note` (texto chico claro), nunca pill.
2. **Acento contiguo**: la frase naranja (`.accent` / `.text-bottom__accent` / `.grad`) va ENTERA en una línea — nunca partida ("en la / web") ni palabra colgada sola abajo ("para / todos"). Controlar con `<br>` para que caiga junta.
3. **Tamaño de título consistente** dentro de la cadena (~72px, `.statement__lead` / `.text-top__headline`). Nada de saltos 108→40. Más chico si hay sub + mock; grande solo si es heading puro.
4. **Todo centrado** (lead Y sub/bajada). Ojo: `.statement__sub` ya trae `text-align:center` — no asumir herencia.
5. **Jerarquía suave** título↔sub (no gigante de golpe + minúscula).
6. **Texto debajo del mock = `.text-bottom`** (peso 600, blanco + acento naranja split), **NO `.statement__sub`** (peso 500 gris queda débil contra el statement de arriba). `.statement__sub` se reserva para subs SIN mock (van pegados al statement como unidad).
7. **Pocas palabras + mock** ("una imagen dice más que mil palabras"); balancear el wrap (líneas parejas).
8. **Opener brand-hero** (opcional para la 1ª de una cadena): wordmark grande centrado (`.brand-hero`) + tagline, en vez de wordmark chico arriba + texto gigante.

## Plantillas (en `templates/`)

- `story-kit.css` + `story-kit.js` — el kit (copiar tal cual al stage; es project-agnostic, solo tokens `--brand-*`).
- `story--brand-hero.html` — opener: wordmark grande + tagline (ref real: `20-patagonia-origen`).
- `story--typografica.html` — statement (lead + sub) sin mock, centrado (ref: `21`, `30`).
- `story--mock.html` — statement + laptop/phone + `.text-bottom` (ref: `22`, `31`, `32`). Device: `.laptop` (web escritorio) o `.phone` (mobile).
- `index.html` — índice del stage agrupado por cadena (`CONFIG.chains`).

## Workflow

1. **Stage** (una vez por proyecto): `projects/<proyecto>/campañas/stories/` con `pieces/`, `out/`, y copiar `story-kit.css`, `story-kit.js`, `index.html` de `templates/`. El `index.html` NO va en `pieces/` (render.mjs lo tomaría).
2. **Texto primero**: cerrar el copy de la cadena ANTES de armar el visual (evita iterar a ciegas). Copy de ÍTERA Lex SIEMPRE por el skill `iteralex-copy-voice` + verificar la feature contra `CAPABILITIES.md` y el doc de posicionamiento que aplique (no prometer lo gateado/piloto; ver "Verdad de producto" abajo).
3. **Numerar por cadena** en bloques de decenas (cadena A = `1x`, B = `2x`, …; el orden de archivo sigue el de publicación).
4. **Armar cada story**: copiar la plantilla del tipo que corresponda a `pieces/NN-slug.html`, ajustar copy + `data-step` + `data-max-step` + `<br>` de acento. Mock con `.mock-ph` (placeholder); el user pega la screenshot después (swap por `<img class="laptop__img" …>`).
5. **Render**: `node render.mjs <proyecto> --campaña stories [NN ...]` → `out/NN-slug.png`.
6. **Verificar**: mirar el PNG contra los 8 criterios. La escalera: abrir `pieces/NN-slug.html?view=ladder`.
7. **Índice**: sumar la entrada a `CONFIG.chains[].stories` (en orden) en `index.html`.

## Verdad de producto (no overpromising)

Antes de prometer una feature en una story, verificar contra `~/projects/saas/iteralex/itera-lex/.planning/product/CAPABILITIES.md` (SSOT fresca) y el doc de posicionamiento que aplique (ej `itera-context/proyectos/itera-lex/PUMA-RN-BETA-POSITIONING.md`). Marcar el framing honesto como `.story-note` cuando algo es piloto/gateado. No decir "jurisprudencia validada por IA", ni prometer Copilot/WhatsApp/cobro como disponibles.

## Voz

Todo el copy pasa por el skill `iteralex-copy-voice` (carga el VOICE-GUIDE + checklist de 11 vicios). Sin manifesto/épico/inspirador, sin metáforas, voseo, "ÍTERA Lex" completo, acentuación rioplatense.

## Idioma

Español rioplatense. Tokens técnicos (clases CSS, `data-step`) en inglés.
