# Anti-patrones — qué NO conviene hacer

Lista canónica de errores comunes de accesibilidad estructural. Cada uno con su razón.

## 1. No dejar interactivos sin foco visible

```tsx
/* MAL: <a>/<button> hechos a mano, solo hover, sin :focus-visible */
<a href="#" className="rounded-md hover:bg-accent">Clientes</a>
```

**Razón**: el usuario de teclado no ve dónde está parado → no puede navegar. Es el hallazgo más común: los componentes shadcn traen foco, pero los interactivos **hechos a mano** del shell (nav rows, icon-buttons) se olvidan.

**Regla**: `:focus-visible` con el indicador del sistema en TODO interactivo (clase utilitaria `.focus-ring` / `.focus-inset`).

## 2. No matar el outline sin reemplazo

```css
/* MAL */
button:focus { outline: none; }
```

**Razón**: `outline:none` sin un `:focus-visible` propio borra el foco para todos los usuarios de teclado. Es la causa #1 de inaccesibilidad por teclado.

**Regla**: si quitás el outline nativo, reemplazalo por un `:focus-visible` visible. `outline:none` solo es válido acompañado.

## 3. No usar un indicador que se clipea

```tsx
/* MAL: box-shadow ring dentro de un sidebar overflow-hidden */
<aside className="overflow-hidden">
  <a className="focus-visible:shadow-[0_0_0_4px_var(--ring)]">…</a>  {/* se corta */}
</aside>
```

**Razón**: el box-shadow ring se dibuja **fuera** del elemento y un ancestro con `overflow-hidden` (sidebar, celda de tabla con esquinas redondeadas) lo **clipea** → el foco desaparece justo donde más navega el teclado.

**Regla**: `outline` (token-driven). En contenedores con clip, la variante **inset** (`outline-offset` negativo + realce de superficie). Bonus: el outline respeta border-radius y sobrevive a High Contrast Mode.

## 4. No usar `<div onClick>` para acciones

```tsx
/* MAL */
<div onClick={editar} className="cursor-pointer">Editar</div>
```

**Razón**: un `<div>` no es focusable ni operable con teclado, no anuncia su rol al lector de pantalla, y no responde a Enter/Space. Parchearlo con `role="button"` + `tabIndex={0}` + `onKeyDown` reimplementa mal lo que `<button>` ya hace.

**Regla**: `<button>` para acciones (Enter **y** Space gratis), `<a href>` para navegación (Enter). Si te encontrás agregando `role`+`tabindex`+`onKeyDown` a un div, usá un `<button>`.

## 5. No usar `tabindex` positivo

```tsx
/* MAL */
<button tabIndex={3}>…</button>
```

**Razón**: cualquier `tabindex > 0` saca el elemento del flujo natural y rompe el orden de tabulación **global** de la página (todos los positivos van primero, en su orden numérico). Imposible de mantener.

**Regla**: tab order = orden del DOM. `tabindex={0}` solo para hacer focusable algo no-nativo (raro); `tabindex={-1}` solo como destino programático (skip-link, foco inicial de overlay). Nunca positivo.

## 6. No olvidar el skip-to-content

**Razón**: sin skip-link, el usuario de teclado tiene que tabular **todo el sidebar** (10+ stops) en cada página para llegar al contenido.

**Regla**: skip-link como primer tabulable, oculto hasta el foco (por `transform`, NO `display:none`), que salta al `<main id tabindex=-1>`.

## 7. No dejar icon-only sin nombre

```tsx
/* MAL */
<button><Trash2 /></button>   {/* el lector anuncia "botón", sin más */}
```

**Razón**: un botón con solo un ícono no tiene texto que anunciar → para un lector de pantalla es un "botón" anónimo.

**Regla**: `aria-label` (o texto `sr-only`) en todo interactivo icon-only. El `title` ayuda al mouse pero no siempre lo anuncian los lectores → usar `aria-label`.

## 8. No confiar en el placeholder como label

```tsx
/* MAL */
<input placeholder="Buscar clientes" />
```

**Razón**: el placeholder desaparece al escribir, no lo anuncian todos los lectores como nombre, y tiene contraste pobre. No es un label.

**Regla**: `<label htmlFor>` asociado, o `aria-label` si el label visible no cabe (ej. buscador de toolbar).

## 9. No reimplementar el focus trap de los overlays

```tsx
/* MAL: overlay a mano sin trap ni Escape */
<div className="fixed inset-0" onClick={close}>
  <div className="modal">…</div>
</div>
```

**Razón**: un overlay hecho a mano no atrapa el foco (el Tab se va al fondo), no cierra con Escape, y no devuelve el foco al disparador. Reimplementar el focus management bien es difícil y propenso a bugs.

**Regla**: usar la primitiva de la lib (shadcn/Radix `Dialog`/`Drawer`), que trae trap + Escape + retorno de foco gratis. A11y **verifica** que se use, no la reescribe.

## 10. No romper los landmarks (varios `main`, nav sin label)

**Razón**: varios `<main>` confunden la navegación por landmarks; varias `<nav>` sin `aria-label` son indistinguibles para el lector ("navegación", "navegación", "navegación").

**Regla**: un solo `<main>` por vista; cada `<nav>` repetida con su `aria-label`; headings jerárquicos sin saltos.

## 11. No redefinir lo que es de otro dominio (scope creep)

**Razón**: A11y es composición. Si definís un contraste de texto, un timing de reduced-motion o un `aria-busy`/`aria-invalid` DENTRO de A11y, duplicás Color / Motion / States y se desincronizan.

**Regla**: el seam es ley. Contraste de texto → Color. reduced-motion → Motion. aria DE ESTADO → States. A11y cubre foco/teclado/targets/landmarks/skip-link/aria **estructural**. Si te encontrás tocando contraste de texto o `aria-busy`, parate.

## 12. No auditar la a11y solo leyendo el código

**Razón**: el grep encuentra candidatos, pero el foco visible, el tab order, el focus trap y el comportamiento de Escape solo se confirman **interactuando**.

**Regla**: validar con el teclado de verdad — tabular todo el shell, abrir cada overlay, probar Escape y el retorno de foco, en light y dark (y, si se puede, con lector de pantalla / High Contrast Mode).
