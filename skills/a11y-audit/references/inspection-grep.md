# Patrones de inspección — qué buscar en el código

Patterns para inventariar la accesibilidad estructural. Usar `Grep` con `output_mode: "count"` o correr `scripts/a11y-inventory.mjs` que automatiza esto.

**Importante**: el grep encuentra **candidatos**, no veredictos. La a11y se confirma **con el teclado** (tabular, abrir overlays, probar Escape). Varios ejes (§3 overlays, §2 tab order, §9) NO se infieren del grep.

## Orden de inspección

1. Inventario cuantitativo (counts por patrón).
2. Inspección dirigida (leer los archivos top-N: el shell, los listados, los modales).
3. Verificación CON TECLADO (foco visible, orden, skip-link, Escape en overlays).

---

## A. Foco visible — aplicado vs anulado

```regex
focus-visible:|:focus-visible|outline-none|outline-0|focus:outline
```

Glob: `**/*.{tsx,jsx,css}`. Contar `:focus-visible` (foco aplicado) vs `outline-none`/`outline-0` (foco anulado). **Cada `outline-none` sin un `:focus-visible` cercano = finding** (§1.3). Buscar el token de foco (`--focus-ring`/`--ring`) y ver si se **usa** o quedó declarado.

## B. Interactivos NO semánticos (teclado roto)

```regex
<div[^>]*onClick|<span[^>]*onClick|role="button"
```

Glob: `**/*.{tsx,jsx}`. Cada `<div onClick>`/`<span onClick>` es candidato a finding (§2.1, §5.5): debería ser `<button>`. `role="button"` sobre un div delata el parche (falta `tabindex` + handler de teclado). Leer cada hit.

## C. Names / labels / roles (aria estructural)

```regex
aria-label|aria-labelledby|aria-current|aria-expanded|aria-hidden|htmlFor|\balt=
```

Ver: icon-only con `aria-label`, inputs con `htmlFor`, nav activo con `aria-current`, toggles con `aria-expanded`. **Si `aria-current` o `aria-expanded` cuentan casi 0 → hallazgo** (§7).

## D. Landmarks + semántica

```regex
<main|<nav|<header|<aside|<footer|role="(main|navigation|banner|complementary)"
```

Contar. **0 `<main>` o varios `<main>` → finding** (§5.1/§5.2). Varias `<nav>` sin `aria-label` → finding (§5.3).

## E. Skip-to-content

```regex
skip-to|skip-link|saltar al contenido|sr-only.*content|#main\b|#content
```

Si no aparece → falta el skip-link (§6). Si hay `sr-only`, ver si es realmente un skip-link al inicio del shell.

## F. Target sizes chicos

```regex
\b(?:h-6 w-6|w-6 h-6|size-6|h-7 w-7|w-7 h-7|size-7)\b
```

Glob: `**/*.{tsx,jsx}`. Cada hit es un control de 24–28px → candidato a subir al piso (§4). Confirmar que sea **interactivo** (botón/link), no un ícono decorativo.

## G. Tabindex positivo / traps

```regex
tabIndex=\{?["']?[1-9]|tabindex="[1-9]
```

Cualquier `tabindex` > 0 es anti-pattern (§2.3). `tabIndex={-1}` es OK solo como destino programático.

## H. Overlays — fuente del focus trap

```regex
DialogContent|@radix-ui/react-dialog|DrawerContent|role="dialog"|aria-modal|position:\s*fixed
```

Identificar si los modales usan Radix/shadcn (trap+Escape **gratis**) o un overlay hecho a mano (`position:fixed` + backdrop onClick = sin trap → finding §3.5). **Confirmar abriendo el modal y tabulando.**

## I. Token de foco existente

```regex
--[\w-]*(?:focus|ring)[\w-]*
```

Glob: `**/*.css`. Ver si el token de foco existe y si está **aplicado** en algún `:focus-visible` (cruzar con A).

---

## Cómo reportar findings

```
- `resources/js/components/ui-lab/stories/app-shell.tsx:90` — NavLink <a> sin :focus-visible → invisible al teclado.
- `resources/js/.../Index.tsx:412` — <div onClick> abre el detalle → debería ser <button> (no operable con teclado).
- `resources/css/tokens.css:92` — `--focus-ring` declarado pero NUNCA aplicado.
- `resources/js/.../Topbar.tsx:42` — <Input> de búsqueda sin aria-label (solo placeholder).
```

**Evidencia o descarte**. Sin `archivo:línea`, el finding no entra.

---

## Checks semánticos (no grep simple)

### S1. Mapa de foco/teclado de cada superficie
Leer el shell y cada vista y mapear: tab order (¿= DOM?), qué interactivos NO muestran foco, dónde se **clipea** el indicador (ancestros con `overflow-hidden`), comportamiento de cada overlay. No es grep — es leer el render + tabular. Documentar en §1.1 del reporte.

### S2. Foco clipeado en scroll-containers
Para cada interactivo dentro de un `overflow-hidden`/`overflow-y-auto` (sidebar, card de tabla), confirmar si el indicador es un box-shadow ring (se clipea) o un outline/inset (no). Es el hallazgo menos obvio (§1.5).

### S3. Token de foco declarado pero sin aplicar
Si el grep I encuentra `--focus-ring`/`--ring` pero el grep A no lo halla en ningún `:focus-visible` (o un override de sombra lo pisa), el foco está **muerto**. Finding de §1.4.

### S4. `<div onClick>` vs `<button>`
Por cada hit de B, leer: ¿es accionable con teclado (`tabindex`+`onKeyDown`+`role`)? Si no, finding §2.1. La recomendación es casi siempre `<button>`, no parchar el div.

### S5. Overlay sin trap
Por cada hit de H que NO sea Radix/shadcn, abrir el overlay y tabular: ¿el foco se escapa al fondo? ¿Escape cierra? ¿vuelve el foco? Finding §3.

### S6. Tab order ≠ orden visual
Si el CSS reordena (flex `order`, grid placement, float) interactivos, el tab order (DOM) puede no coincidir con el visual → confunde al teclado. Leer el layout. No `tabindex` positivo para "arreglarlo".
