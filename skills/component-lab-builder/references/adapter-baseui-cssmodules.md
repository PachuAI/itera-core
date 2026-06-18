# Adapter: base-ui + CSS Modules (STUB — completar al trabajar en itera-ui)

> **Estado: STUB honesto.** El core (lab-anatomy.md, recipes.md) ya aplica acá — la galería/registry/canvas e iframe-portal son el ancestro común. Lo que falta relevar es la **capa de estilo** (cómo se consumen tokens y cómo se tematiza/compone una primitiva con este stack). NO inventar: cuando toque construir en itera-ui, abrir el repo, relevar los puntos de abajo y reemplazar este stub por el adapter real.

## Lo que YA sabemos (verificado, 2026)

Referencia: **itera-ui** (`~/projects/itera-ui`).

- Stack: **`@base-ui/react`** (Base UI, headless — NO shadcn/Radix) + **CSS Modules** (`*.module.css`) + `lucide-react`. Vite + Vitest. **Sin Tailwind, sin `data-slot` bridge.**
- Tokens: `src/lib/tokens/tokens.css` (+ `src/lib/tokens/themes/`). Se consumen vía **CSS Modules** (clases que leen `var(--token)`), NO por arbitrary value de Tailwind.
- Estructura: `src/lib/{primitives,domain,tokens}` + `src/gallery/{registry,canvas,stories,shell}`. Primitives ya existentes: `button`, `text-field`, `text`, `card`, `status-badge`, `money-text`. Domain: `resumen-pedido`, `saldo-cliente`, `indicador-stock`.
- Galería: misma forma que el core (registry + canvas + iframe-host + mode-toggle + sidebar/toolbar). `build:lib` (Vite library mode) → `dist`, para consumir desde Remotion.
- Propósito de la lib: componentes reutilizables para **mocks/maquetas/video** (la complementa `screenshot-to-component` para "screenshot → componentes" y `brandboard-creator` para bootstrap).

## Qué relevar antes de escribir el adapter real

1. **Consumo de tokens**: cómo un `*.module.css` referencia `tokens.css` (¿import? ¿global?), convención de nombres, cómo se hace dark/light (themes/).
2. **Cómo se tematiza/compone una primitiva base-ui**: patrón de un primitive existente (ej. `primitives/button`, `text-field`) — wrapper de base-ui + CSS Module + types. ¿Hay un equivalente al "bridge"? (probablemente NO: el estilo va por className del module, no por `data-slot`).
3. **Portal con base-ui**: base-ui tiene sus propios `Portal`/`Positioner` (Dialog/Select/Menu/Popover). Confirmar **si existe el footgun de iframe** acá y cuál es el prop equivalente a `container` para pasarle el body del iframe (¿`<X.Portal container={…}>`? ¿`Positioner`?). Si la lib no se previsualiza en iframe, puede no aplicar.
4. **Modos de canvas / categorías**: confirmar el `types`/`registry` reales de itera-ui (pueden diferir del enum de Alquímica).
5. **build:lib**: cómo se exporta (`lib/index.ts`), para que lo que se agregue quede consumible desde Remotion.

## Hasta entonces

- El **core** (recetas primitiva→composición→pantalla→registry + disciplina de fundaciones) se aplica igual; solo cambiá "tokens por arbitrary value / bridge data-slot" por "CSS Modules + base-ui" cuando estilices.
- Para "screenshot → componentes" en esta lib, usar **`screenshot-to-component`** (ya cubre el flujo CSS-Modules; nota: ese skill es anterior a la movida a base-ui — al actualizarlo, alinear ambos).
