---
name: iteralex-device-mockup
description: Insertar un mockup de laptop o de teléfono móvil con una screenshot real del producto ÍTERA Lex dentro de cualquier pieza visual — slide de carrusel, story 9:16, cover de YouTube, frame de animación. Frames consistentes con dimensiones, drop-shadow naranja-itera, dynamic island, topbar simulado y resoluciones de screenshot ya calibradas. Usar siempre que el usuario pida "mockup laptop", "mockup mobile", "frame del producto", "embedear screenshot en laptop/celular", "demo del dashboard en computadora", "/iteralex-device-mockup", o cualquier pedido del estilo "poné el screenshot dentro de un teléfono". Cubre tanto piezas estáticas como secuencias para animar (los frames son componentes autónomos, no piezas completas).
---

# iteralex-device-mockup

Componentes reusables para mostrar el producto ÍTERA Lex dentro de un mockup de laptop o teléfono móvil. Validados en producción en los slides 2 y 3 del carrusel `01-dashboard` (panel del estudio).

**Por qué existe este skill**: cada vez que armamos una pieza con mockup teníamos que reinventar dimensiones, drop-shadow, topbar simulado, dynamic island, ratio del screen, resolución del screenshot a capturar. Ahora todo eso vive en un solo lugar y se reusa en carruseles, stories, animaciones, lo que sea.

**Piezas golden** (referencia visual de fidelidad):
- `projects/iteralex/campañas/feed-launch/piezas/01-dashboard-laptop.html` — laptop frame en pieza 4:5
- `projects/iteralex/campañas/feed-launch/piezas/01-dashboard-mobile.html` — phone frame en pieza 4:5

---

## Cuándo usar

- Slide de un carrusel que muestra "el producto en uso" en desktop o mobile.
- Story / reel cover 9:16 con un mockup central.
- Frame de animación que muestra la app abierta en el dispositivo.
- Cover de video YouTube con la pantalla del producto adentro.
- Cualquier pedido de "mostrá la app en un teléfono / en una compu".

## Cuándo NO usar

- Pieza puramente tipográfica sin mockup → usar `iteralex-typographic-post`.
- Brandboard o web-assets → usar `brandboard-creator`.
- Mockup de impresión, papelería, packaging, vidriera física → este skill es solo para devices digitales.

---

## Anatomía: dos componentes independientes

### Laptop frame (`.laptop`)

| Propiedad | Valor |
|---|---|
| Width default | 740px (ajustable con `.is-sm` 600 / `.is-lg` 880) |
| Aspect ratio del screen | 16 : 10 |
| Bezel | 14px todo alrededor, color `#1a1a1a` |
| Border-radius | 14px (chassis) |
| Topbar simulado | 28px alto, 3 dots + URL fake con dot pulsante naranja |
| Base inferior | 14px alto, sobresale 10% a los lados con notch central |

Estructura:

```
┌─────────────────────────────────────┐
│ ●●●  app.iteralex.com               │  ← topbar (28px)
├─────────────────────────────────────┤
│                                     │
│        [SCREENSHOT IMG]             │  ← screen area (16:10)
│                                     │
└─────────────────────────────────────┘
   ──────  base/lid  ──────              ← lid (14px, sobresale a los lados)
```

### Phone frame (`.phone`)

| Propiedad | Valor |
|---|---|
| Width default | 360px (ajustable con `.is-sm` 280 / `.is-lg` 440) |
| Aspect ratio del screen | 9 : 19.5 (iPhone 13/14/15) |
| Bezel | 10px todo alrededor, color `#1a1a1a` |
| Border-radius | 42px (chassis) |

Estructura:

```
   ┌────────────┐
  │              │
  │              │
  │  [SCREEN-    │                    ← screen area (9:19.5)
  │   SHOT IMG]  │
  │              │
  │              │
   └────────────┘
```

> **Nota:** el frame **no** tiene dynamic island ni status bar simulada. La razón: la app mobile ÍTERA Lex tiene su propio header con el wordmark arriba, y un notch encima lo tapaba. Si en el futuro hace falta indicar "esto es un teléfono", se hace por el border-radius redondeado de 42px y la silueta general — alcanza.

---

## Drop-shadow / glow naranja itera

Ambos frames comparten un sistema de sombras documentado en `:root`:

```css
--device-shadow-color: rgba(255, 115, 30, 0.10);   /* glow naranja-itera muy sutil */
--device-shadow-blur: 38px;
--device-shadow-spread: 2px;
--device-depth-shadow: 0 18px 50px rgba(0, 0, 0, 0.6);
--device-hairline: 0 0 0 1px rgba(255, 255, 255, 0.05);
--device-inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.04);
```

Resultado: glow tirando a naranja itera (mucho menos rojo que un naranja extremo), opacidad muy baja (0.10) — apenas separa el dispositivo del fondo sin gritar. Sombra de profundidad oscura debajo para anclar el dispositivo al espacio.

**Variante `.is-flat`**: si la pieza tiene su propia atmósfera dominante (ej: glow de fondo, gradient pintado), usar `.laptop.is-flat` o `.phone.is-flat` para quitar el glow naranja del frame y dejar solo la sombra de profundidad. Evita doble glow.

---

## Resoluciones de screenshot

**Resumen rápido** (ver detalle completo en `references/screenshot-specs.md`):

| Device | Resolución recomendada | Alternativa retina (preferida) | Captura desde |
|---|---|---|---|
| Laptop | **1440 × 900 px** | **2880 × 1800 px** | Browser real, ventana 1440×900, screenshot del SO. Si el display soporta retina, sacar a 2x para mejor nitidez al rasterizar. |
| Mobile | **390 × 845 px** | **780 × 1690 px** | Chrome DevTools, modo iPhone 13/14/15 (390×844), "Capture screenshot". Para retina, usar device-pixel-ratio 2 o screenshot de iPhone real. |

**Validado en producción** (feed-launch del 03-2026): screenshots retina (2880×1800 + 780×1690) renderizan más nítidas en el slide 1080×1350 que las base. El frame del skill es agnóstico al tamaño exacto — solo importa el ratio (16:10 laptop, 9:19.5 mobile).

**Convención de nombres** en `recursos/`:

```
<feature>-screenshot.png            (desktop)
<feature>-screenshot-mobile.png     (mobile)
<feature>-screenshot--empty.png     (estado vacío del mismo feature)
```

Doble guion `--` para modificadores, guion simple `-` para device.

---

## Workflow

### Paso 1: Capturar la screenshot

Seguir las specs de `references/screenshot-specs.md`. Reglas duras:

- **Modo dark obligatorio**. El frame del skill es dark — un screenshot light rompe el contraste.
- **Zoom 100%**. Cualquier otro zoom desalinea la grilla.
- **Sesión coherente**, no demo vacía. Tenant real (`RER`) o vitrinas demo (`estudio-demo`, `abogado-demo`).
- **Sin datos sensibles**. Si el screenshot va a publicación, usar tenant de demo, no datos reales de clientes.

### Paso 2: Guardar la screenshot

```
projects/iteralex/campañas/<stage>/recursos/<feature>-screenshot.png         # desktop
projects/iteralex/campañas/<stage>/recursos/<feature>-screenshot-mobile.png  # mobile
```

Crear `recursos/` si no existe.

### Paso 3: Cargar el CSS del skill en el stage

El `device-mockup.css` se copia al stage **una sola vez**. Si el stage ya lo tiene, no copies de nuevo.

```bash
TARGET="projects/iteralex/campañas/<stage>/device-mockup.css"
SOURCE="$HOME/.claude/skills/iteralex-device-mockup/templates/device-mockup.css"
[ -f "$TARGET" ] || cp "$SOURCE" "$TARGET"
```

### Paso 4: Insertar el frame en la pieza

Cargar el CSS al `<head>`:

```html
<link rel="stylesheet" href="../../../shared.css" />
<link rel="stylesheet" href="../device-mockup.css" />
```

Para laptop, copiar de `templates/laptop-frame.html` y reemplazar:
- `{{URL_OR_BRAND}}` → `app.iteralex.com` (o la URL puntual)
- `{{SCREENSHOT_PATH}}` → ej `../recursos/dashboard-screenshot.png`
- `{{ALT_TEXT}}` → ej `Panel de ÍTERA Lex`

Para phone, copiar de `templates/phone-frame.html` y reemplazar `{{SCREENSHOT_PATH}}` y `{{ALT_TEXT}}`.

### Paso 5: Renderizar

```bash
node render.mjs iteralex --campaña <stage> <NN>
```

### Paso 6: Verificación visual

- [ ] El screenshot llena el área del screen sin huecos negros (object-fit: cover correcto).
- [ ] El topbar simulado del laptop tiene los 3 dots + la URL con dot pulsante naranja.
- [ ] El dynamic island del phone está centrado arriba, no choca con elementos importantes del screenshot.
- [ ] Hay un drop-shadow naranja-itera muy sutil alrededor del frame, no satura.
- [ ] Hay sombra de profundidad oscura debajo (parece "asentado" en la pieza, no "flotando").
- [ ] El bezel del frame se distingue del fondo (no se mimetiza con el bg de la pieza).
- [ ] **`text-bottom` split blanco/naranja obligatorio** (laptop): línea 1 descriptiva en blanco + línea 2 acentuada en naranja con `text-bottom__accent`. Sin split, el slide rompe la consistencia visual del feed.
- [ ] **`claim` split blanco/naranja obligatorio** (mobile): igual que el bottom del laptop pero con clase `.claim` y `.claim__accent`.
- [ ] **Screenshot del producto sin nombres reales ni datos sensibles**: tenant de demo o datos genéricos. Sidebar de superadmin oculto si lo había. Wordmark del producto correcto ("ÍTERA Lex" si aplica).

---

## Composición en una pieza completa

Este skill **NO compone la pieza entera** — solo el frame. La composición (artboard 1080×1350, texto arriba/abajo, bandas flex, claim final) la hace la pieza concreta.

Para ver una pieza completa que usa este frame:
- Slide laptop con texto sandwich → `02-calendario-laptop.html` (referencia canónica del patrón vertical)
- Slide mobile con claim debajo → `02-calendario-mobile.html`

### Patrón canónico para slide laptop (validado en 01-08, 10-12 del feed-launch)

Estructura del `text-top` (sobre el frame):

1. **Module label** (opcional pero recomendado) — nombre del módulo en blanco peso 500 24px, margin-bottom 6px. Ej: "Calendario", "Causas", "Tareas".
2. **Eyebrow** — descripción en 3 sustantivos en naranja peso 600 22px, margin-bottom 14px. Ej: "Audiencias, plazos, reuniones".
3. **Headline** — claim corto en blanco peso 700 64px. Ej: "En un solo lugar".

Estructura del `text-bottom` (debajo del frame): **siempre split blanco/naranja** (regla canónica desde 2026-05). Línea 1 descriptiva blanca + línea 2 acentuada naranja con `<span class="text-bottom__accent">`. Sin esto, el slide rompe la consistencia visual del feed.

```html
<p class="text-bottom">
  Sincronizado con<br />
  <span class="text-bottom__accent">Google Calendar</span>
</p>
```

CSS local del slide:

```css
.text-bottom {
  flex: 0 0 auto;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 38px;
  line-height: 1.2;
  letter-spacing: -0.018em;
  color: var(--brand-fg);
}
.text-bottom__accent {
  color: var(--brand-accent);
}
```

### Patrón canónico para slide mobile (validado en 01-12 del feed-launch)

`text-top` se omite (la cover viene desde el slide tipográfico previo). Debajo del frame, claim split blanco/naranja igual al laptop pero con clase `.claim` (más grande, weight 700, 44px):

```html
<p class="claim">
  Tu agenda completa,<br />
  <span class="claim__accent">siempre con vos.</span>
</p>
```

```css
.claim {
  flex: 0 0 auto;
  margin-top: 56px;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 44px;
  line-height: 1.15;
  letter-spacing: -0.022em;
  color: var(--brand-fg);
}
.claim__accent {
  color: var(--brand-accent);
}
```

### Patrón vertical completo

```html
<div class="feed">
  <div class="band-top"></div>

  <div class="wordmark-hero">
    <img src="../../../recursos/wordmark-light.png" alt="ÍTERA Lex" />
  </div>

  <!-- Spacer arriba: absorbe la mitad del aire libre — clave para que el
       bloque (text-top + frame + text-bottom) quede centrado entre wordmark
       y band-bottom. Sin este patrón, el bloque queda pegado a un borde. -->
  <div class="flex-spacer"></div>

  <div class="text-top">  <!-- module label + eyebrow + headline (laptop) -->
    <span class="text-top__module">Calendario</span>
    <span class="text-top__eyebrow">Audiencias, plazos, reuniones</span>
    <h2 class="text-top__headline">En un solo lugar</h2>
  </div>

  <div class="flex-mid-top"></div>  <!-- gap fijo (24px) entre headline y frame -->

  <!-- ⬇ Acá va el frame del skill ⬇ -->
  <div class="laptop"> ... </div>
  <!-- o -->
  <div class="phone"> ... </div>

  <div class="flex-mid-bottom"></div>  <!-- gap fijo (24px) entre frame y claim -->

  <p class="text-bottom">  <!-- split blanco/naranja obligatorio -->
    Sincronizado con<br />
    <span class="text-bottom__accent">Google Calendar</span>
  </p>

  <!-- Spacer abajo: la otra mitad del aire libre. -->
  <div class="flex-spacer"></div>

  <div class="band-bottom"></div>
</div>
```

CSS local de la pieza para los gaps fijos:

```css
.flex-mid-top,
.flex-mid-bottom { flex: 0 0 24px; }
```

`.flex-spacer` ya viene definida en `iteralex-typo.css` con `flex: 1 1 auto`. Las bandas `.feed`, `.band-top`, `.wordmark-hero`, `.flex-spacer`, `.band-bottom` también vienen del skill `iteralex-typographic-post`. Si la pieza es solo mockup (sin tipografía), podés definir esas bandas localmente.

**Por qué dos `flex-spacer` en lugar de un `flex-bottom` único**: con un solo spacer abajo el bloque queda pegado al wordmark; con uno solo arriba queda pegado al borde inferior. Los dos spacers iguales (1:1) hacen que el bloque flote en el centro vertical entre wordmark y band-bottom.

**Sin flecha de carrusel**: el sistema removió la flecha "→" que solía ir debajo del bloque. Los slides de IG ya implican navegación. Si una pieza puntual la necesita, se agrega manual.

---

## Uso en animaciones

Los frames son componentes autónomos: el contenedor `.laptop` o `.phone` puede ser child de cualquier estructura. Para animar (skill `social-motion` o Remotion):

- **Animar el frame entero**: aplicar `transform`, `opacity`, `scale` al `.laptop` o `.phone` directamente.
- **Animar el screenshot interno**: cambiar la `src` de `.laptop__img` o `.phone__img` entre frames (cycling de pantallas, "antes/después", scroll up).
- **Hover/parallax**: combinar `transform` con el drop-shadow para ilusión de profundidad.

Recomendación: si la animación va a tener movimiento del frame, usar `.is-flat` para evitar que el drop-shadow se vea "pegado" o "moviéndose detrás" de manera rara.

---

## Archivos del skill

```
~/.claude/skills/iteralex-device-mockup/
├── SKILL.md                       ← este archivo
├── templates/
│   ├── device-mockup.css          ← estilos compartidos (laptop + phone + tokens)
│   ├── laptop-frame.html          ← skeleton HTML para laptop
│   └── phone-frame.html           ← skeleton HTML para phone
└── references/
    └── screenshot-specs.md        ← cómo capturar screenshots con resoluciones exactas
```

## Referencias externas

- `projects/iteralex/campañas/feed-launch/piezas/01-dashboard-laptop.html` — pieza canónica laptop.
- `projects/iteralex/campañas/feed-launch/piezas/01-dashboard-mobile.html` — pieza canónica mobile.
- `iteralex-typographic-post` skill — para piezas tipográficas que pueden complementar el mockup.
- `social-motion` skill — para animar frames (cuando llegue ese caso).
- `~/projects/itera-social/render.mjs` — renderer Playwright.
