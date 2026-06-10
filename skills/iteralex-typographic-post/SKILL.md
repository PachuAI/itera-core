---
name: iteralex-typographic-post
description: Generar la primera imagen de un carrusel de Instagram para ÍTERA Lex con el patrón tipográfico validado — fondo casi negro, wordmark arriba, frase grande del abogado entre comillas naranjas (con palabra clave en gradiente), divider naranja, "Cómo lo resolvemos" + texto explicativo con "ÍTERA Lex" inline. Usar siempre que el usuario pida una "cover de carrusel iteralex", "primera imagen del carrusel iteralex", "post tipográfico iteralex", "tarjeta tipográfica iteralex", "/iteralex-typographic-post", o cualquier pedido del estilo "hacé otra cover de pain point como la 01-dashboard". Soporta 4:5 (1080×1350, feed) y 9:16 (1080×1920, story/reel cover) con el mismo sistema de bandas verticales. NO usar para piezas con mockup de producto, carruseles slide 2/3, ni para otras marcas (shopear, itera) — esto es específico de iteralex.
---

# iteralex-typographic-post

Sistema reproducible para generar la **imagen 1 de un carrusel** de Instagram (`@itera.lex`) con el patrón tipográfico que se validó iterando la pieza canónica `projects/iteralex/campañas/feed-launch/pieces/01-dashboard.html`.

**Por qué existe este skill**: armar la pieza desde cero costó muchas iteraciones (centrado vertical, dónde va el wordmark, qué color tiene cada elemento, qué prohíbe el VOICE-GUIDE). Este skill captura ese sistema en bandas verticales explícitas para que cualquier pieza nueva salga consistente sin volver a iterar.

**Pieza golden** (referencia visual de fidelidad): `projects/iteralex/campañas/feed-launch/pieces/01-dashboard.html` y su PNG en `out/01-dashboard.png`.

---

## Cuándo usar

- El usuario pide la **imagen 1 / cover** de un carrusel de iteralex (las imágenes 2 y 3 son mockups, no van por este skill).
- El usuario referencia "como la 01" o "como la cover de Panel".
- Pieza tipográfica para feed (`4:5`) o story/reel cover (`9:16`).
- Marca: **únicamente iteralex** (otras marcas usan otros skills).

## Cuándo NO usar

- Imágenes 2/3 del carrusel (mockup laptop, mockup mobile) — son piezas distintas, requieren otro patrón.
- Piezas para shopear / itera-estudio / cualquier otra marca.
- Pack de stories que no son cover de carrusel — usar `social-media-vertical-creator`.
- Brandboards / web-assets — usar `brandboard-creator`.

---

## Anatomía: 8 bandas verticales

El artboard se divide en 8 bandas que se acomodan automáticamente con `display: flex; flex-direction: column` y dos espacios `flex: 1 1 auto` que centran el bloque entre el wordmark y el borde inferior.

| # | Banda | Tipo | Tamaño | Función |
|---|---|---|---|---|
| 1 | `band-top` | fija | 110px | Aire reservado arriba antes del wordmark |
| 2 | `wordmark-hero` | auto | ~64px (image height) | Wordmark imagen, centrado horizontal |
| 3 | `flex-top` | flex (1fr) | absorbe aire | **Crece para centrar el bloque** |
| 4 | `hook` | auto | ~290–360px | Frase grande con comilla apertura+cierre |
| 5 | margin-top: 52px | fija | 52px | Gap quote → hinge |
| 6 | `hinge` | auto | ~210–280px | Divider naranja + eyebrow + body |
| 7 | `flex-bottom` | flex (1fr) | absorbe aire | **Crece para centrar el bloque** |
| 8 | `band-bottom` | fija | 100px | Aire reservado abajo |

**Centrado automático**: las bandas 3 y 7 (`flex-top` y `flex-bottom`) reparten el aire sobrante en partes iguales (1:1 simétrico). Si el contenido del bloque (4+5+6) crece, los flex se reducen proporcionalmente. Si el artboard cambia de 1350 a 1920 (4:5 → 9:16), los flex absorben los 570px extra. **Esto resuelve el problema de "todo quedó muy abajo / muy arriba" que apareció en las primeras iteraciones.**

**Sin flecha de carrusel**: el sistema original tenía una banda CTA con flecha "→" debajo del hinge. Se removió porque los slides de IG ya implican navegación y la flecha agregaba ruido visual; además, su peso forzaba un balance asimétrico (`flex-top:flex-bottom = 5:3`) que se descalibraba al cambiar el largo del bloque. Si una pieza puntual la necesita, se reagrega caso por caso.

**Variantes de anclaje** (override del centrado por defecto):
- `.feed.is-anchor-top` — bloque pegado al wordmark (aire abajo)
- `.feed.is-anchor-bottom` — bloque pegado al borde inferior (aire arriba)

---

## Tokens y colores

Los tokens del brand viven en `projects/iteralex/shared.css`. El skill **importa** ese archivo, no redefine los colores. Lo único específico del skill:

| Token | Valor | Dónde se usa |
|---|---|---|
| Fondo del artboard | `#0a0a0a` (apenas más claro que el `#000` puro del bg de IG en dark mode) | `.feed` background |
| Acento | `var(--brand-accent)` = `#F27A1A` | comillas, divider, eyebrow, gradiente, "Lex" en `.brand-text` |
| Foreground | `var(--brand-fg)` = `#fff` | quote, body, "ÍTERA" en `.brand-text` |
| Tipografía | Plus Jakarta Sans 400-800 | toda la pieza |
| Gradiente `.grad` | `linear-gradient(125deg, #F27A1A 0%, #FFB061 45%, #FF8A2E 100%)` | palabra clave del quote |

**Reglas no-negociables** (lecciones aprendidas en iteración):

- ❌ **NO** usar `.atmo-glow` ni gradients radiales que pinten el fondo. El contraste fuerte del brand exige negro casi puro.
- ❌ **NO** poner el isotipo top-right ni un foot con texto recreado en CSS. El branding ya está en el wordmark hero.
- ❌ **NO** hacer "ÍTERA Lex" en highlight naranja a secas dentro del cuerpo del texto. Usar `.brand-text` (peso 800, ÍTERA blanco + Lex naranja) o el wordmark image inline.
- ❌ **NO** olvidar la comilla de cierre. El quote SIEMPRE tiene `::before` (apertura) y `::after` (cierre).
- ✅ Sí cerrar siempre las comillas tipográficas (apertura + cierre).
- ✅ Sí usar `.grad` sobre una palabra clave del quote para darle énfasis (ej "priorizar", "responder", "decidir").
- ✅ Sí cerrar el `hinge_body` con una frase corta en `<span class="hinge__accent">` (naranja peso 700) que sintetice el valor — patrón canónico desde 2026-05. Sin esto, el slide pierde punch y se ve inacabado vs los demás del feed. Ejemplos validados: "De entrada." (01 Panel), "todo conectado." (02 Calendario), "En un solo lugar." (03 Clientes).
- ❌ **NO dejar el `hinge__accent` partido en 2 líneas con palabras sueltas**. Si por flujo natural la primera palabra del accent quedaría sola al final de la línea anterior (ej: `Sin / buscar.` o `En / minutos.`), **forzar `<br />` antes del `<span class="hinge__accent">`** para que la frase entera quede en línea propia. Aplica especialmente cuando el accent tiene 2-3 palabras cortas. Caso histórico (2026-05-09): el carrusel 08 Transcriptor se publicó con `En / minutos.` partido — error que ya no se puede corregir post-publicación. Defaultear a meter el `<br />` siempre antes del accent es más seguro que evaluar caso por caso.

---

## Inputs requeridos

Cuando el usuario invoque este skill, pedile estos campos. Si alguno no está claro, hacé una sola tanda de preguntas con `AskUserQuestion` antes de generar.

| Input | Tipo | Default | Notas |
|---|---|---|---|
| `ratio` | `4:5` o `9:16` | `4:5` | 4:5=1080×1350 feed; 9:16=1080×1920 story/reel cover |
| `output_dir` | path | — | Ej: `projects/iteralex/campañas/feed-launch/pieces/` |
| `file_name` | string | — | Ej: `01-dashboard.html` (sin path, formato `NN-slug.html`) |
| `module` | string | — | Nombre del módulo en humano: "Panel", "Causas", "Avisos". Va en `<title>`. |
| `quote` | string | — | Frase del abogado. Pasala por `references/voice-checklist.md` antes de aceptarla. |
| `highlight` | string \| null | null | Palabra(s) del quote a wrappear con `.grad`. Si null, no hay gradiente. |
| `hinge_eyebrow` | string | `Cómo lo resolvemos` | El "label" que arranca el hinge. |
| `hinge_body` | string | — | Texto explicativo. Usar el marker `[brand]` donde vaya "ÍTERA Lex" — el skill lo expande a `<strong class="brand-text">ÍTERA<span class="brand-text__lex"> Lex</span></strong>`. |
| `hinge_accent` | string \| null | **requerido en covers de feed** | Frase corta de cierre que va en naranja peso 700 al final del `hinge_body`. Sintetiza el valor en 2-4 palabras. Ej: "De entrada.", "todo conectado.", "En un solo lugar.", "Antes de empezar." Solo opcional si la pieza es un cover suelto fuera del feed-launch. |
| `anchor` | `center` \| `top` \| `bottom` | `center` | Posición vertical del bloque dentro del flex container. |

---

## Workflow

### Paso 1: Verificar que el `iteralex-typo.css` existe en el proyecto

El template HTML importa `../iteralex-typo.css` (relativo a `pieces/`). El skill **debe** asegurarse de que ese archivo está copiado al stage:

```bash
TARGET_CSS="projects/iteralex/campañas/<stage>/iteralex-typo.css"
SKILL_CSS="$HOME/.claude/skills/iteralex-typographic-post/templates/iteralex-typo.css"

if [ ! -f "$TARGET_CSS" ]; then
  cp "$SKILL_CSS" "$TARGET_CSS"
fi
```

Si el stage es nuevo, también copiar a `projects/iteralex/campañas/<stage>/iteralex-typo.css` y al `pieces/` directorio.

### Paso 2: Validar el copy contra el voice-checklist

Antes de generar el HTML, leé `references/voice-checklist.md` y revisá que el `quote` y el `hinge_body` cumplen las reglas duras:

- Voseo en `hinge_body`
- "ÍTERA Lex" en el body (usar `[brand]`)
- Sin anglicismos prohibidos
- Quote sin redundancias ("empezar / arrancar"), sin "arrancar" informal
- Test del abogado de 55 en Neuquén

Si algo falla, **proponé al usuario una reformulación** antes de escribir el archivo.

### Paso 3: Generar el HTML

Tomá `templates/piece.html` y reemplazá los placeholders. Reemplazos:

| Placeholder | Valor |
|---|---|
| `{{TITLE}}` | `feed NN · <module> · <ratio>` (ej: `feed 01 · panel · 4:5`) |
| `{{RATIO}}` | `4:5` o `9:16` |
| `{{WIDTH}}` | `1080` |
| `{{HEIGHT}}` | `1350` (4:5) o `1920` (9:16) |
| `{{SHARED_CSS_PATH}}` | path relativo a `pieces/` → `../../../shared.css` (3 niveles arriba para llegar a `projects/iteralex/`) |
| `{{TYPO_CSS_PATH}}` | path relativo a `pieces/` → `../iteralex-typo.css` |
| `{{WORDMARK_PATH}}` | `../../../assets/wordmark-light.png` |
| `{{ANCHOR_CLASS}}` | ` is-anchor-top` / ` is-anchor-bottom` / `` (string vacío para center) |
| `{{VERTICAL_CLASS}}` | ` is-vertical` para 9:16, vacío para 4:5 |
| `{{QUOTE_HTML}}` | quote con `<span class="grad">palabra</span>` aplicado a la palabra de `highlight` (case-sensitive) |
| `{{HINGE_EYEBROW}}` | el eyebrow textual |
| `{{HINGE_BODY_HTML}}` | hinge_body con `[brand]` reemplazado por `<strong class="brand-text">ÍTERA<span class="brand-text__lex"> Lex</span></strong>`. **Si `hinge_accent` está definido, agregar al final del HTML body**: `<br /><span class="hinge__accent">{hinge_accent}</span>`. El `<br />` antes del span es **obligatorio** — sin esto el accent puede quedar partido entre dos líneas con palabras sueltas (ver "Reglas no-negociables" arriba). |

### Paso 4: Renderizar a PNG

Detectar el stage del path de salida y correr:

```bash
node render.mjs iteralex --campaña <stage-slug> <NN>
```

(El renderer está en `~/projects/itera-social/render.mjs` y soporta `--campaña` y filtros por prefijo numérico.)

### Paso 5: Verificación visual

Leer el PNG generado y chequear contra esta checklist:

- [ ] Wordmark centrado horizontal arriba, con buen respiro al borde superior.
- [ ] Hook en el medio vertical, comilla apertura naranja arriba-izquierda visible, comilla cierre naranja al final del texto.
- [ ] Si hay `highlight`, la palabra está en gradiente naranja.
- [ ] Divider naranja sutil entre quote y hinge.
- [ ] Eyebrow "Cómo lo resolvemos" (o el que sea) en naranja, mixed case.
- [ ] Body con "ÍTERA" blanco peso 800 + " Lex" naranja peso 800 + respiro extra a los lados (margin 0.08em).
- [ ] **Hinge body cierra con frase corta en naranja peso 700** (`hinge__accent`). Si falta, agregarla — sin esto el slide se ve inacabado.
- [ ] **El `hinge__accent` está en línea propia**, no partido entre dos líneas con palabras sueltas. Si quedó partido, agregar `<br />` antes del `<span class="hinge__accent">`.
- [ ] Sin elementos en las esquinas (no isotipo top-right, no foot con URL).
- [ ] Aire arriba (entre wordmark y hook) y abajo (entre body y borde) balanceados (1:1).

Si alguna falla, ajustar y re-renderizar.

---

## Ejemplo end-to-end

**Pedido**: "Hacé otra cover como la 01 pero para Causas. Hook: cuando un cliente me pregunta cómo va su causa, abro 4 carpetas. Highlight la palabra 'reconstruir'."

**Inputs derivados**:

```
ratio: 4:5
output_dir: projects/iteralex/campañas/feed-launch/pieces/
file_name: 03-causas.html
module: Causas
quote: "Cuando un cliente me pregunta cómo va su causa, tengo que reconstruir todo."
highlight: reconstruir
hinge_eyebrow: Cómo lo resolvemos
hinge_body: Cuando entrás a la causa en [brand], ves la ficha completa: estado procesal, partes, movimientos, documentos y tareas del equipo.
hinge_accent: Sin reconstruir nada.
anchor: center
```

**HTML resultante** (extracto del cuerpo, ya con placeholders reemplazados):

```html
<body data-width="1080" data-height="1350">
  <div class="feed">
    <div class="band-top"></div>
    <div class="wordmark-hero">
      <img src="../../../assets/wordmark-light.png" alt="ÍTERA Lex" />
    </div>
    <div class="flex-top"></div>
    <div class="hook">
      <p class="hook__quote">Cuando un cliente me pregunta cómo va su causa, tengo que <span class="grad">reconstruir</span> todo.</p>
    </div>
    <div class="hinge">
      <span class="hinge__eyebrow">Cómo lo resolvemos</span>
      <span class="hinge__body">
        Cuando entrás a la causa en <strong class="brand-text">ÍTERA<span class="brand-text__lex"> Lex</span></strong>,
        ves la ficha completa: estado procesal, partes, movimientos, documentos y tareas del equipo.<br />
        <span class="hinge__accent">Sin reconstruir nada.</span>
      </span>
    </div>
    <div class="flex-bottom"></div>
    <div class="band-bottom"></div>
  </div>
</body>
```

**Render**:

```bash
node render.mjs iteralex --campaña feed-launch 03
```

**Validación visual**: leer `out/03-causas.png` y aplicar checklist del Paso 5.

---

## Cómo se escala a 9:16

Si el usuario pide la misma pieza para Story/Reel cover:

1. Cambiar `data-height="1920"` en el `<body>`.
2. Agregar la clase `is-vertical` al `.feed` div.

Eso es todo. El sistema de bandas absorbe los 570px extra en `flex-top` y `flex-bottom`. El bloque (hook + hinge) **no cambia de tamaño** — solo se centra en un canvas más alto.

Si querés más respiro arriba o abajo en 9:16, ajustar en el HTML:

```html
<style>.feed { --band-top: 180px; --band-bottom: 160px; }</style>
```

---

## Archivos del skill

```
~/.claude/skills/iteralex-typographic-post/
├── SKILL.md                      ← este archivo
├── templates/
│   ├── piece.html                ← skeleton HTML con placeholders
│   └── iteralex-typo.css         ← sistema de bandas + plantilla CSS
└── references/
    └── voice-checklist.md        ← filtro rápido del VOICE-GUIDE
```

## Referencias externas

- `projects/iteralex/campañas/feed-launch/pieces/01-dashboard.html` — pieza canónica de fidelidad visual.
- `projects/iteralex/shared.css` — tokens del brand (no editar acá).
- `~/projects/itera-context/proyectos/itera-lex/VOICE-GUIDE.md` — filtro completo de voz.
- `~/projects/itera-context/proyectos/itera-lex/PAIN-POINTS-MAP.md` — fuente de copy de cada módulo.
- `~/projects/itera-social/render.mjs` — renderer Playwright para PNG.
