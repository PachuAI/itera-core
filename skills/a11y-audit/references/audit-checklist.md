# Checklist exhaustivo — a11y-audit

**OBLIGATORIO**: completar **cada item** antes de cerrar el reporte. Si un item no aplica o no se puede evaluar, declararlo como `N/A — razón concreta`. **NUNCA omitir un item en silencio**.

Auto-check al final: releer este archivo punto por punto y confirmar cobertura.

Alcance: accesibilidad **estructural** (foco / teclado / target sizes / landmarks / skip-link / aria estructural). El contraste WCAG de texto (Color), reduced-motion (Motion) y el aria DE ESTADO (States) se chequean en SUS dominios — acá solo se confirma que **no** se redefinen (§8).

---

## 1. Foco visible

| Item | Qué validar |
|---|---|
| 1.1 | ¿Hay un indicador de foco en **todo** interactivo (botones, links, icon-buttons, tabs, ítems de menú, filas operables)? |
| 1.2 | Los interactivos **hechos a mano** (`<a>`/`<button>` con clases propias), ¿tienen `:focus-visible`? (suelen ser los que faltan) |
| 1.3 | ¿Hay `outline:none` / `outline-0` **sin** un `:focus-visible` de reemplazo? (cada uno = finding) |
| 1.4 | ¿El token de foco existente está **aplicado**, o quedó declarado y sin usar / neutralizado por un override de sombra? |
| 1.5 | ¿El indicador se **clipea** dentro de un `overflow-hidden` (sidebar, celda de tabla)? (box-shadow ring vs outline / inset) |
| 1.6 | ¿El indicador es **consistente** (mismo color/grosor/forma) en todos lados, o cada componente inventa el suyo? |
| 1.7 | Contraste del indicador de foco ≥ 3:1 contra el fondo adyacente (WCAG 2.4.11/1.4.11). Visible en light **y** dark. |
| 1.8 | ¿Es `:focus-visible` (no `:focus` a secas) para no mostrarlo en clicks de mouse? |

---

## 2. Navegación por teclado / tab order

| Item | Qué validar |
|---|---|
| 2.1 | ¿Todo lo accionable con mouse se acciona con teclado? (`<div onClick>`/`<span onClick>` sin teclado = finding) |
| 2.2 | Tab order = orden del DOM y lógico (no saltos raros). |
| 2.3 | ¿Hay `tabindex` **positivo** (>0)? Anti-pattern (rompe el orden global). |
| 2.4 | ¿Hay keyboard traps (foco que entra y no sale con Tab)? |
| 2.5 | Activación correcta: `button` con Enter **y** Space; `link` con Enter. |
| 2.6 | Composites (menús, tabs, listbox): ¿navegación con flechas + Home/End donde corresponde? |
| 2.7 | Elementos con `tabindex={-1}` solo como destino programático (no como forma de "operar"). |

---

## 3. Focus management de overlays

| Item | Qué validar |
|---|---|
| 3.1 | Modal/drawer/dialog: ¿**focus trap** (el Tab no se escapa al fondo)? |
| 3.2 | ¿**Escape** cierra el overlay? |
| 3.3 | Al cerrar, ¿el foco **vuelve al disparador** (el botón que lo abrió)? |
| 3.4 | Foco **inicial** sensato al abrir (primer campo / el contenedor, no el último botón). |
| 3.5 | ¿Lo aporta la lib (Radix/Headless UI) o es un overlay hecho a mano? (si es a mano sin trap = finding) |
| 3.6 | Dropdown/popover/select: ¿cierran con Escape y devuelven foco al trigger? |

---

## 4. Target sizes

| Item | Qué validar |
|---|---|
| 4.1 | Icon-buttons y controles: ¿≥ 24×24px (WCAG 2.5.8 AA)? ¿hay un **piso del sistema** definido? |
| 4.2 | ¿CTAs / buscador hero / acciones primarias a 44×44px (WCAG 2.5.5 AAA) donde tenga sentido? |
| 4.3 | Targets chicos pegados: ¿separación suficiente o caen bajo el mínimo por proximidad? |
| 4.4 | ¿El piso de target reusa los **control-heights** del dominio Sizing (no una escala nueva)? |
| 4.5 | El área de **click** ≥ al ícono visible (hit-area, no solo el glyph de 16px). |

---

## 5. HTML semántico + landmarks

| Item | Qué validar |
|---|---|
| 5.1 | ¿Existen `<header>` / `<nav>` / `<main>` / `<aside>` / `<footer>` como landmarks? |
| 5.2 | ¿Un **solo** `<main>` por vista? |
| 5.3 | Si hay varias `<nav>`, ¿cada una con `aria-label` distinto? |
| 5.4 | Headings (`<h1>`–`<h6>`) jerárquicos, sin saltos de nivel; un `<h1>` por vista. |
| 5.5 | `<button>` para acciones, `<a href>` para navegación (no `<div onClick>`). |
| 5.6 | Listas reales (`<ul>/<ol>/<li>`) y tablas reales (`<table>/<th scope>`) donde aplica. |
| 5.7 | ¿Roles ARIA redundantes o incorrectos (`role="button"` sobre un `<button>`, roles inventados)? |

---

## 6. Skip-to-content

| Item | Qué validar |
|---|---|
| 6.1 | ¿Existe un skip-link "Saltar al contenido"? |
| 6.2 | ¿Es el **primer** elemento tabulable de la página? |
| 6.3 | El destino (`<main id>`), ¿es focusable (`tabindex={-1}`) y recibe el foco? |
| 6.4 | ¿Visible al recibir foco (no `display:none`, que lo saca del tab order)? |

---

## 7. Names / labels / roles (aria estructural)

| Item | Qué validar |
|---|---|
| 7.1 | Icon-only (botones/links sin texto): ¿`aria-label` o texto `sr-only`? |
| 7.2 | Inputs: ¿`<label htmlFor>` asociado o `aria-label`? (placeholder no es label) |
| 7.3 | Imágenes/íconos informativos: ¿`alt` / `aria-label`? Decorativos: ¿`alt=""` / `aria-hidden`? |
| 7.4 | Nav activo: ¿`aria-current="page"`? |
| 7.5 | Toggles expand/collapse (sidebar, accordion): ¿`aria-expanded`? |
| 7.6 | Landmarks múltiples del mismo tipo: ¿etiquetados (`aria-label`/`aria-labelledby`)? |

> El aria DE ESTADO (`aria-busy`/`aria-disabled`/`aria-invalid`, `role=status`/`role=alert`) NO se chequea acá — es de **States**. Acá: el aria **estructural** (identidad/rol/relación), no el dinámico.

---

## 8. Reuso / seam

| Item | Qué validar |
|---|---|
| 8.1 | Foco: ¿reusa el focus token de **Color** (color/ancho), o inventa uno? |
| 8.2 | Target floor: ¿reusa los **control-heights** de Sizing? |
| 8.3 | NO redefine el **contraste WCAG de texto** (Color) — solo verifica el del indicador de foco. |
| 8.4 | NO redefine **reduced-motion** (Motion) ni el **aria de estado** (States). |
| 8.5 | Modo de consumo correcto (arbitrary value / clase utilitaria si CSS satélite aislado). |

---

## 9. Verificación con teclado / AT

| Item | Qué validar |
|---|---|
| 9.1 | Recorrido con **Tab real**: foco visible y orden lógico en todo el shell + vistas. |
| 9.2 | Skip-link probado (Tab inicial → Enter → salta al main). |
| 9.3 | Overlays probados (Tab atrapado, Escape cierra, foco vuelve). |
| 9.4 | Foco visible en **light y dark** (el indicador no desaparece sobre ningún fondo). |
| 9.5 | (Si se puede) lector de pantalla: landmarks navegables, names anunciados. High Contrast Mode: el foco sobrevive. |

---

## Auto-check final

- [ ] §1 Foco visible (8 items)
- [ ] §2 Navegación por teclado / tab order (7 items)
- [ ] §3 Focus management de overlays (6 items)
- [ ] §4 Target sizes (5 items)
- [ ] §5 HTML semántico + landmarks (7 items)
- [ ] §6 Skip-to-content (4 items)
- [ ] §7 Names / labels / roles (6 items)
- [ ] §8 Reuso / seam (5 items)
- [ ] §9 Verificación con teclado / AT (5 items)

**Total: 53 items**. Si quedó alguno sin cubrir y sin declarar `N/A — razón`, completarlo antes de presentar.

Atención a los ejes que suelen saltearse:
- **§1.2 / §1.5**: los interactivos hechos a mano sin foco, y el ring **clipeado** en el sidebar — son los hallazgos más comunes y menos obvios.
- **§3**: el focus management de overlays no se infiere del grep; hay que **abrir el modal y tabular**.
- **§5.5**: `<div onClick>` / `<span onClick>` que deberían ser `<button>` — el grep los encuentra, leer cada uno.
- **§8**: el seam explícito (no pisar Color/Motion/States) se OLVIDA y genera scope creep.
- **§9**: la a11y NO se valida leyendo — se valida con el teclado.
