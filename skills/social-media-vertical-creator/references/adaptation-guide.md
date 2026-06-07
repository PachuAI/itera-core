# Guía de adaptación a un proyecto nuevo

Cómo llevar el pipeline del caso shope.ar a otro proyecto con su propio branding.

---

## 1. Prerequisitos del proyecto destino

Antes de generar piezas, el proyecto debe tener resuelto:

- **Paleta de marca** — mínimo 5-6 colores con roles claros (accent, accent-ink, fondo, borde, texto)
- **2 fuentes** — una display (redonda/chunky, para wordmark y headings) + una UI (sans neutra, para body)
- **Logo PNG** transparente en negro y blanco (si no existe, generar primero con el pipeline de `~/projects/itera-claude-system/guide_mockups_con_logos.md`)
- **Voice & tone** — reglas de copy (ej. voseo, lowercase sistemático, sin exclamaciones)
- **Punchline / value prop** — 1-2 líneas que resuman el producto
- **CTA canónico** — qué decirle al usuario al final de cada pieza ("entrá a X", "probá gratis", "escribinos", etc.)

Si alguno de estos falta, **NO empezar el pack**. Primero resolver el branding (typicamente viviendo en `docs/brand.md` o equivalente).

---

## 2. Bootstrap del workspace

Ubicación estándar dentro del proyecto:

```
<proyecto>/logo-<brand>/social/
```

Copiar los 4 templates:

```bash
PROJECT=~/projects/<proyecto>
BRAND=<slug-del-proyecto>   # ej "shope", "ultimus"
SKILL=~/.claude/skills/social-media-vertical-creator

mkdir -p "$PROJECT/logo-$BRAND/social"/{pieces,out,assets}

cp "$SKILL/templates/shared.css"         "$PROJECT/logo-$BRAND/social/"
cp "$SKILL/templates/render-social.mjs"  "$PROJECT/logo-$BRAND/social/"
cp "$SKILL/templates/index.html"         "$PROJECT/logo-$BRAND/social/"
cp "$SKILL/templates/_template-piece.html" "$PROJECT/logo-$BRAND/social/pieces/"
```

Agregar a `.gitignore` o `.dockerignore`:

```
logo-*/social/out/
logo-*/social/pieces/
```

---

## 3. Renombrar los prefijos del slug

Todo el CSS usa `--shope-*`. Reemplazar por el slug del proyecto (ej `--ultimus-*`, `--mirel-*`):

```bash
SLUG=<slug-proyecto>
sed -i "s/--shope-/--$SLUG-/g" "$PROJECT/logo-$BRAND/social/shared.css"
```

**Alternativa simple**: dejar los prefijos `--shope-*` tal cual si el proyecto es single-deploy y no va a mezclarse con código de shope.ar. Funciona igual. El renombre es opcional pero recomendado para claridad.

---

## 4. Adaptar tokens en `:root`

Editar `shared.css`, bloque `:root`. Reemplazar cada grupo:

### 4.1 Acento principal

```css
/* Antes (shope.ar, verde WhatsApp) */
--shope-accent: #25d366;
--shope-accent-ink: #073019;
--shope-accent-soft: rgba(37, 211, 102, 0.12);
--shope-accent-glow: rgba(37, 211, 102, 0.42);

/* Después (ejemplo: proyecto con naranja #ff6a1a) */
--brand-accent: #ff6a1a;
--brand-accent-ink: #3a1500;       /* texto contrastante sobre accent, WCAG AA */
--brand-accent-soft: rgba(255, 106, 26, 0.12);
--brand-accent-glow: rgba(255, 106, 26, 0.45);
```

**Reglas para derivar `-soft` y `-glow`** desde el accent:
- `-soft` = mismo RGB del accent, alpha **0.10-0.14**
- `-glow` = mismo RGB del accent, alpha **0.40-0.48**
- `-ink` = color de texto con contraste WCAG AA sobre el accent. Típicamente muy oscuro con tinte del accent (ej. accent verde → ink verde-muy-oscuro)

### 4.2 Fondos

Decidir si el proyecto es:

- **Dark-first** (como shope.ar): `--bg: #000` + surface `#0a0a0a` + raised `#141414`
- **Light-first**: `--bg: #fff` o `#f7f3ec` + surface blanco o cream + raised más oscuro

Si es light-first, INVERTIR los tokens `--fg-*` (negros con alpha en vez de blancos).

### 4.3 Fuentes

En el `@import` de Google Fonts + en las variables:

```css
/* Cambiar la línea @import para que solo traiga las fuentes que usás */
@import url('https://fonts.googleapis.com/css2?family=<DISPLAY>:wght@...&family=<UI>:wght@...&display=swap');

:root {
  --font-display: '<DISPLAY>', system-ui, sans-serif;
  --font-ui: '<UI>', system-ui, sans-serif;
}
```

**Criterios de selección de display** (heredados de la guía mockups):
- Redondez: Fredoka, Baloo 2, Nunito → más "vecino"
- Peso: Nunito 900, Baloo 2 800, Chewy → más presencia
- Single-story "a": Comfortaa, Sniglet, DynaPuff → más friendly/quirky
- Double-story "a": Baloo, Nunito, Fredoka → más convencional

**Criterios de UI**:
- Legibilidad en 18-22px (tamaño body en 1920h)
- Mínimo 3 pesos: 400, 500, 600
- Mood consistente con el display

### 4.4 Fondos alternativos

Los `-cream`, `-navy`, `-ink` dan variedad al pack. Si el proyecto tiene alternativas propias (ej. un "marrón cálido", un "azul oscuro corporativo"), cambiarlos:

```css
--brand-cream: #f4ebe0;   /* tu fondo cálido alternativo */
--brand-navy: #10162b;    /* tu fondo oscuro alternativo */
--brand-ink: #181818;     /* tu texto "casi negro" */
```

---

## 5. Adaptar el brand lockup

El componente `.brand-lockup` está hardcodeado con `shope.ar`. Ajustar el wordmark HTML en cada pieza (o crear tu propia clase `.brand-lockup-<proyecto>` si preferís):

```html
<div class="brand-lockup" style="color: var(--brand-fg)">
  <span class="dot"></span>
  <span>MIPROYECTO<span class="accent">.com</span></span>
</div>
```

---

## 6. Procesar logos a PNG transparente

Si el proyecto todavía no tiene los masters, generar usando el script de Sharp de `~/projects/itera-claude-system/guide_mockups_con_logos.md` §6.

Resultado esperado:

```
assets/
├── logo-black.png   (master negro transparente, ~1000×1000)
└── logo-white.png   (master blanco transparente, ~1000×1000)
```

Los usamos en piezas que muestran el logo como imagen (no como texto). Ej. hero piece con silueta gigante de fondo al 10% opacity.

---

## 7. Brainstorm de piezas

**Pack inicial recomendado: 10-12 piezas.**

Distribución validada (shope.ar primera tanda):

| # | Categoría | Qué comunica | Visual central |
|---|---|---|---|
| 01 | brand | hero punchline principal | silueta de fondo + texto gigante |
| 02 | brand | wordmark dramático | sólo el nombre a 300px+ |
| 03 | educativo | los 3 pasos del producto | numbers 1-2-3 + icons |
| 04 | hook | dolor #1 (el más común) | visual del problema |
| 05 | hook | dolor #2 (variante) | mock de la fricción actual |
| 06 | hook | antes / después | split horizontal del artboard |
| 07 | producto | mockup del admin/app | iPhone con captura |
| 08 | producto | feature estrella | card zoomed-in |
| 09 | producto | multi-variante / templates | grid de variantes |
| 10 | social proof | "en 5 minutos" / contador | número gigante |
| 11 | educativo | cover de carrusel | "3 cosas que podés hacer con X" |
| 12 | feature | feature #2 destacada | visual específico |

**Después de los 12 iniciales**, profundizar con una tanda de **dolor específico + feature específico**:

- Por cada dolor: "no sabés HTML", "publicaste una foto borrosa", "se te colgó WiFi"
- Por cada feature: "dominio propio", "sync multi-celu", "horarios", "abrir al toque"

shope.ar llegó a 37 piezas totales (12 + 25 de profundización).

---

## 8. Brief de copy por pieza

Antes de escribir HTML, definir el copy. Template mental:

```
Pieza NN: <slug>
──────────────────────────
Categoría: brand | hook | producto | social proof | educativo | feature
Modo:      dark | cream | navy | wa
Eyebrow:   "EL DOLOR" / "FEATURE" / "3 PASOS" / ...
H1:        <2-3 líneas, palabra destacada entre comillas>
Visual:    <qué mockup / chat / card va en el centro>
H2/body:   <linea de solución o refuerzo>
CTA:       <el CTA canónico del proyecto>
Pill:      <opcional: "gratis", "online ahora", etc>
```

**Respetar el voice del proyecto**: si la marca es voseo lowercase sin exclamaciones, no escribir "¡ARMA tu TIENDA!". Escribir "armá tu tienda.".

---

## 9. Implementar cada pieza

Por cada pieza del brief:

```bash
cp pieces/_template-piece.html pieces/NN-<slug>.html
```

Editar:
1. `<title>NN · slug</title>`
2. Clase `mode-*` del artboard
3. `.brand-lockup` con el wordmark del proyecto
4. Eyebrows (contexto + sección)
5. H1 display con el copy
6. Bloque VISUAL CENTRAL — reemplazar el placeholder con el mockup real
7. Footer body + CTA + pill

**Para el visual central**, los patrones reutilizables del caso shope.ar:

- **Chat WhatsApp standalone**: `<div class="wa-chat">` con 4-8 `<div class="wa-bubble in/out">`. Bueno para hooks ("te escribieron hola 14 veces").
- **iPhone + chat dentro**: `<div class="iphone"><div class="iphone-screen"><div class="wa-chat">...`. Bueno para "mira, así ve tu cliente".
- **Product card zoom**: card con imagen+título+precio+CTA, simulando un producto del catálogo.
- **Browser mockup**: `.mock-window` con chrome bar (3 dots + URL bar) + contenido. Bueno para "así se ve el admin".
- **SVG custom**: dibujar con divs+CSS (el papelito de shope.ar, un contador gigante, un reloj, etc).
- **Laptop + celu superpuesto**: para "en la compu y en el celu". Ver pieza 29 del caso shope.ar.

---

## 10. Preview y rasterizar

```bash
cd $PROJECT

# Abrir el preview en el navegador (requiere dev server corriendo en el proyecto
# con acceso a /logo-<brand>/social/index.html, o abrir file:// directo)
open "file://$(realpath logo-<brand>/social/index.html)"

# Instalar playwright si no está
pnpm add -D @playwright/test
pnpm exec playwright install chromium

# Rasterizar todas las piezas
node logo-<brand>/social/render-social.mjs

# O un subset
node logo-<brand>/social/render-social.mjs 01 05 12
```

Output: `logo-<brand>/social/out/NN-<slug>.png` (1080×1920).

---

## 11. Iterar

Ver los PNG en `out/`. Si alguna pieza no quedó bien:

1. Abrir el `pieces/NN-<slug>.html` en el navegador (en 1080×1920 real o con zoom out)
2. Ajustar copy, tamaños tipográficos, mockup interno
3. Re-rasterizar esa pieza sola: `node render-social.mjs NN`

**Bugs comunes**:
- Fonts no cargan → falta `@import` o el `document.fonts.ready` del renderer (el template ya lo tiene)
- Texto cortado por los controles de IG → mover visual hacia el centro, los primeros 250px verticales son zona tapada
- Contraste bajo en mode-cream → usar `--brand-ink` en el texto, no `--brand-fg` (éste asume fondo oscuro)
- Mockup fuera de proporción → revisar `width`/`height` explícitos en el visual central; flex+grow puede estirar demasiado

---

## 12. Entrega

Opciones:

- **Directo de `out/`**: copiar PNGs a la compu del usuario / enviar ZIP
- **Upload a CDN del proyecto**: si hay bucket (ej R2 de ITERA), subir y documentar URLs
- **Doc en `docs/social-pack.md`**: índice de piezas con captions sugeridos para IG, hashtags, y fecha de generación

---

## 13. Mantenimiento

El pack envejece. Revisar cada 3-6 meses:

- ¿Cambió la paleta o el logo? → regenerar TODO re-tocando `shared.css` (no hace falta editar pieza por pieza)
- ¿Cambió el CTA o el wordmark? → search/replace en `pieces/*.html`
- ¿Nuevos features del producto? → agregar piezas nuevas a la tanda de profundización

**Versioning**: si vale la pena, mover pacs históricos a `out-archive/2026-04/` y mantener `out/` con la tanda vigente.
