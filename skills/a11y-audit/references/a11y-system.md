# Sistema de accesibilidad — referencia canónica

Patrones canónicos de accesibilidad **estructural** para admin panels del ecosistema (React + Tailwind v4 + shadcn, Next.js o Laravel + Inertia). A11y es un dominio **de composición**: orquesta foco/teclado/landmarks y **reusa** los tokens de los otros dominios. Casi todo es **aplicar**, no crear.

## Tabla de contenidos

1. Principios (no negociables)
2. El seam (qué reusa, qué NO redefine)
3. Foco visible — el indicador del sistema
4. Navegación por teclado / tab order
5. Focus management de overlays
6. Target sizes
7. Landmarks + HTML semántico
8. Skip-to-content
9. Names / labels / roles (aria estructural)
10. Tokens chicos

---

## 1. Principios (no negociables)

1. **Teclado = mouse.** Todo lo accionable con click se acciona con teclado.
2. **Foco visible en TODO interactivo**, consistente, y que **no se clipea**.
3. **Tab order = DOM.** Orden lógico, sin `tabindex` positivo; skip-link para saltar bloques largos.
4. **Overlays: trap + Escape + retorno de foco.** Si lo trae la lib (Radix), verificar; no reimplementar.
5. **Landmarks reales** (`header`/`nav`/`main`), un solo `main`, headings jerárquicos.
6. **Todo interactivo tiene un nombre accesible.** Icon-only con `aria-label`; inputs con label.
7. **Aplicar, no redefinir.** Reusa el focus token (Color) y los control-heights (Sizing). No pisa Color/Motion/States.

## 2. El seam (qué reusa, qué NO redefine)

A11y es la última fundación; su valor es **no duplicar** lo que los otros dominios ya resolvieron.

| A11y… | Dominio | Qué hace A11y |
|---|---|---|
| **reusa** el focus token (color/ancho) | Color | lo **aplica** a todo interactivo (Color suele declararlo y dejarlo sin usar) |
| **reusa** los control-heights | Sizing | fija el **piso** de target size con ellos (no escala nueva) |
| **NO redefine** el contraste WCAG de texto | Color | solo verifica el contraste del **indicador de foco** (≥3:1) |
| **NO redefine** reduced-motion | Motion | el foco no anima nada caro; si transiciona, hereda el self-zeroing |
| **NO redefine** el aria DE ESTADO | States | cubre el aria **estructural** (label/current/expanded/roles), no `aria-busy/disabled/invalid` ni `role=status/alert` |

**aria estructural (A11y)** vs **aria de estado (States)**: estructural = identidad/rol/relación, estable (`aria-label`, `aria-current`, `aria-expanded`, landmarks, roles). De estado = dinámico, cambia con la interacción (`aria-busy`, `aria-disabled`, `aria-invalid`, `role=status`, `role=alert`). La línea: ¿describe **qué es** el elemento o **en qué estado** está?

## 3. Foco visible — el indicador del sistema

Un **único** indicador para todo lo interactivo. Recomendación: **outline token-driven**, no box-shadow ring.

**Por qué outline y no box-shadow ring**:
- **No se clipea.** Un box-shadow ring dentro de un `overflow-hidden` (sidebar, celda de tabla con esquinas redondeadas) se **corta** → el foco desaparece. El outline (con offset negativo) no.
- **Respeta `border-radius`** en los navegadores modernos.
- **Sobrevive a Windows High Contrast Mode** (los box-shadows se pierden; el outline se fuerza).

Dos contextos (la única "variación" admitida, deliberada y documentada):

| Contexto | Tratamiento | Cuándo |
|---|---|---|
| **HALO** | `outline` + `outline-offset` positivo | Botones, controles, links en **espacio abierto** (topbar, contenido, formularios). |
| **INSET** | `outline` con `outline-offset` negativo + realce de superficie | Filas full-width e icon-buttons **dentro de contenedores con `overflow` clip** (sidebar, celdas de tabla, paginación) — donde el halo se cliparía. |

```css
:root, .<scope>-ui {
  --focus-color: var(--primary);   /* reusa la marca = --ring del bridge */
  --focus-width: 2px;
  --focus-offset: 2px;
}
/* Halo — controles del bridge + utilidad para hechos a mano en espacio abierto */
[data-slot="button"]:focus-visible,
[data-slot="tabs-trigger"]:focus-visible,
[data-slot="select-item"]:focus-visible,
.focus-ring:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: var(--focus-offset);
}
/* Inset — filas/icon-buttons en scroll-containers con clip */
.focus-inset:focus-visible {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: calc(-1 * var(--focus-width));
  background-color: var(--surface-2);
}
```

Notas:
- Usar `:focus-visible` (no `:focus`): no muestra el anillo en clicks de mouse, solo con teclado.
- Si el framework de UI (shadcn) trae un ring genérico (`focus-visible:ring-[3px]`) que un override de sombra **neutraliza**, el foco queda invisible → aplicar el outline del sistema con mayor especificidad y **resetear** el box-shadow del ring para no duplicar.
- Los **inputs** pueden tener un foco propio (ej. un underglow definido por Color) — A11y lo **respeta** (es deliberado) y solo verifica que sea visible (≥3:1). Es la única excepción aceptable a "un solo indicador".

## 4. Navegación por teclado / tab order

- **Elemento correcto**: `<button>` para acciones (Enter **y** Space), `<a href>` para navegación (Enter). NUNCA `<div onClick>` / `<span onClick>` sin `role` + `tabindex={0}` + handler de teclado — y si te encontrás agregando los tres, usá un `<button>`.
- **Tab order = DOM**. No reordenar con `tabindex` positivo (rompe el orden global de la página). Si el orden visual difiere del DOM, arreglar el DOM/CSS, no el tabindex.
- **`tabindex={-1}`** solo para destinos programáticos (el `<main>` del skip-link, foco inicial de un overlay), nunca para "hacer operable" algo.
- **Composites** (menús, tabs, listbox, grid): un solo tab-stop al grupo, navegación interna con **flechas** + Home/End. shadcn/Radix ya lo implementan — usar sus primitivas en vez de rehacerlo.

## 5. Focus management de overlays

Todo overlay modal (dialog, drawer, sheet) cumple:
1. **Focus trap**: el Tab cicla dentro del overlay, no se escapa al fondo.
2. **Escape cierra**.
3. **Retorno de foco**: al cerrar, el foco vuelve al elemento que lo abrió.
4. **Foco inicial** sensato: el primer campo, o el contenedor del diálogo — no el último botón.

**Radix (shadcn Dialog/Drawer/Popover/DropdownMenu) trae los 4 gratis.** El trabajo de A11y es **verificar** que se usan esas primitivas (no un overlay hecho a mano con `position:fixed` + un `onClick` de backdrop, que no atrapa el foco ni cierra con Escape). Dropdowns/popovers/selects también cierran con Escape y devuelven el foco al trigger.

## 6. Target sizes

Área mínima de click/táctil, reusando los **control-heights** (no una escala nueva):

| Nivel | Tamaño | Regla |
|---|---|---|
| Piso absoluto | **24×24px** | WCAG 2.5.8 AA. Nada interactivo por debajo (salvo excepción de la spec: inline en texto, o con separación suficiente). |
| **Piso del sistema** | **32×32px** (= `control-sm`) | Icon-buttons de toolbar/tabla. Cómodo en admin denso, por encima del AA. |
| Default | 36×36px (= `control-md`) | Inputs/botones de formulario. |
| CTA / hero | **44×44px** (= `control-lg`) | WCAG 2.5.5 AAA. Acción primaria, buscador hero. |

- El **área de click** (hit-area) ≥ al ícono visible. Un glyph de 16px va en un botón de 32px (padding/grid), no en un `<button>` de 16px.
- Targets chicos pegados (ej. paginación `‹ ›`): separar (`gap`) para no caer bajo el mínimo efectivo.

## 7. Landmarks + HTML semántico

```html
<a class="skip-link" href="#main">Saltar al contenido</a>
<aside><nav aria-label="Navegación principal">…</nav></aside>
<main id="main" tabindex="-1">
  <header>…toolbar de la vista…</header>
  …contenido…
</main>
```

- `<header>` / `<nav>` / `<main>` / `<aside>` / `<footer>` como landmarks. **Un solo `<main>`** por vista.
- Varias `<nav>` (principal + secundaria) → cada una con `aria-label` distinto.
- Headings jerárquicos (un `<h1>`, sin saltar de `h2` a `h4`). Las tablas con `<th scope>`, las listas con `<ul>/<li>`.
- **button vs link**: acción → `<button>`; navegación a otra URL → `<a href>`.

## 8. Skip-to-content

Primer elemento tabulable; oculto hasta el foco; salta al `<main>`.

```css
.skip-link {
  position: absolute; left: 0; top: 0; z-index: 50; margin: .5rem;
  padding: .5rem .875rem; border-radius: var(--radius);
  background: var(--surface-3); color: var(--text); box-shadow: var(--elevation-2);
  transform: translateY(-150%);                 /* oculto fuera de viewport, PERO tabulable */
  transition: transform var(--transition-base);
}
.skip-link:focus { transform: translateY(0); }   /* visible al recibir foco */
```
- **No** usar `display:none` / `visibility:hidden` para ocultarlo: lo saca del tab order. Ocultar por `transform`/posición.
- El destino `<main id>` lleva `tabindex={-1}` para poder recibir el foco programático al activar el link.

## 9. Names / labels / roles (aria estructural)

| Patrón | Atributo |
|---|---|
| Icon-only (botón/link sin texto) | `aria-label="…"` (o texto `sr-only`) |
| Input | `<label htmlFor>` asociado, o `aria-label` (el placeholder NO cuenta) |
| Imagen informativa / decorativa | `alt="…"` / `alt=""`+`aria-hidden` |
| Ítem de nav activo | `aria-current="page"` |
| Toggle expand/collapse (sidebar, accordion) | `aria-expanded={true|false}` |
| Landmark repetido (varias nav) | `aria-label` / `aria-labelledby` |

Esto es el aria **estructural**: identidad y rol, estable. El aria **dinámico** de estado (busy/disabled/invalid/status/alert) es de States.

## 10. Tokens chicos

A11y tokeniza **poco** (es más patrón + reuso):

```css
--focus-color: var(--primary);   /* reusa Color */
--focus-width: 2px;
--focus-offset: 2px;
--target-min: var(--control-sm); /* reusa Sizing: 32px = piso de icon-buttons */
```

Más dos clases utilitarias (`.focus-ring` halo, `.focus-inset` inset) y `.skip-link`. Nada más: ni escala de tamaños nueva, ni color de foco nuevo, ni re-tokenización de lo que ya vive en Color/Sizing.

---

## Implementaciones de referencia (mapa)

| Pieza | Repo · archivo |
|---|---|
| Foco token-driven (halo + inset) + skip-link + target-min | `alquimica-crm/resources/css/alquimica-tokens.css` (bloque A11Y) |
| App Shell con skip-link + landmarks + foco en interactivos hechos a mano | `alquimica-crm/resources/js/components/ui-lab/stories/app-shell.tsx` |
| Story de a11y (catálogo de foco / target sizes / skip-link+landmarks) | `alquimica-crm/resources/js/components/ui-lab/stories/a11y.tsx` |
| Focus trap + Escape + retorno de foco (vía lib) | shadcn/Radix `Dialog`/`DropdownMenu`/`Select` (verificar, no reimplementar) |
