# Recetas (CORE — agnósticas de stack)

La **forma** de cada receta es compartida. Los detalles de **estilo** (cómo se consumen tokens / se tematiza una primitiva / se hace el espejo de portal) se resuelven con el **adapter del stack** (`adapter-shadcn-tailwind.md` o `adapter-baseui-cssmodules.md`). Verificar siempre con `tsc` + `eslint`; el lab corre por HMR (sin rebuild).

## 0. Antes de empezar: detectar stack

Mirar `package.json` + cómo se estilan los componentes existentes → abrir el adapter correcto. shadcn+Tailwind+`data-slot` → `adapter-shadcn-tailwind.md`. base-ui+CSS-Modules → `adapter-baseui-cssmodules.md`.

## 1. Agregar una primitiva

Una primitiva = un control tematizado (no se reimplementa la lógica a mano: se reusa la del stack — shadcn/Radix o base-ui).

1. Reusar el control del stack. Si tiene portal → usar/crear el espejo iframe-aware (receta en el adapter).
2. Tematizarlo según el adapter (bridge `[data-slot]` en shadcn; CSS Module en base-ui).
3. Story en categoría `primitives`. Si portalea y la story es suelta → `canvas:'flat'`.
4. Aplicar disciplina: tokens (no hardcode), íconos al tamaño-token, hit-area `target-min` + foco visible.

Checklist: tematizado ✔ · dark+light ✔ · foco visible ✔ · estados con transición ✔.

## 2. Agregar un componente de composición

Composición = pieza que combina primitivas (DataTable, FilterToolbar, FormDialog, BulkBar, EmptyState…). Vive en `composition/` (o el dir equivalente).

1. **Estructural, no config genérica**: exponer sub-piezas (`DataTable`/`DataTableRow`/`DataTableCell`…) para que cada pantalla componga SUS columnas/campos con fidelidad — no una tabla "column-config".
2. Tokens (no colores/tamaños hardcodeados); color del DATO con tinte, no fills saturados.
3. A11y: icon-buttons con `target-min` + foco-inset (van en contenedores con clip), labels/aria.
4. Si envuelve una primitiva con portal → espejo iframe-aware.
5. Story de demo en `compositions`, o usarla directo en una pantalla.

Checklist: sub-piezas reusables ✔ · sin hardcode ✔ · A11y ✔ · portal resuelto ✔.

## 3. Agregar una pantalla / flujo entero (screen story)

1. `stories/<pantalla>.tsx`, categoría `screens`, `canvas:'shell'`, **una sola variante**.
2. Envolver TODO en `<IframePortalProvider>` (para que modales/selects/menús abran dentro del iframe).
3. Armar shell + cuerpo con las primitivas de layout (`AppShellFrame`, `<PageBody>`, `<PageWidth>` o equivalentes) y las composiciones reales.
4. **Datos mock fieles al dominio** (productos/clientes reales del negocio), NO KPIs/columnas inventadas.
5. Estados de vista con la máquina `error→loading→empty→content` (toggle de demo opcional).
6. Overlays vía los espejos iframe-aware.

Checklist: IframePortalProvider ✔ · overlays iframe-aware ✔ · datos fieles ✔ · estados ✔ · dark+light + 2 resoluciones ✔.

## 4. Conectar al registry

1. Exportar `export const <x>Stories: Story[] = [ … ]` desde el story-file.
2. Importar y spreadear en `STORIES` (registry).
3. Categoría nueva → agregar a `StoryCategory`, `CATEGORY_ORDER` y `CATEGORY_LABELS`.
4. Si la lib se consume afuera (build:lib) → exportar lo nuevo en `lib/index.ts`.

## 5. Patrones de motion (agnósticos — CSS)

- **Reveal condicional** (un campo/hint que aparece): collapsible grid-rows.
  ```tsx
  <div className="grid" style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows var(--*-duration-moderate) var(--*-ease-in-out)' }}>
    <div style={{ overflow: 'hidden' }}>{/* margen adentro del clip */}</div>
  </div>
  ```
  El alto del contenedor padre (height:auto) sigue suave solo. NO usar para swap de dos contenidos distintos.
- **Swap de contenido de distinta altura** (ej: tabs producto↔combo): **FLIP de altura** — medir altura actual en vivo, cambiar contenido, medir nueva, animar `height` from→to (`duration-moderate`/`ease-in-out`), `overflow:hidden` durante la transición y `height:auto`/`overflow:visible` en reposo. **Sin** `key`+fade (flashea: el remount arranca en opacity:0 y muestra la superficie de atrás).
- **Cambio de estado de un control**: que la transición cubra `opacity/bg/border/color/box-shadow`, no solo lo que trae el componente del stack por default.

## Footguns transversales

- **Portal escaping** en iframe → espejo iframe-aware (provider en el core, espejo en el adapter).
- **Campo en contenedor de la misma superficie** → no popea; respetar la escalera de elevación.
- **`key`+fade en swap** → flash; usar FLIP de altura.
- **Dead code**: al quitar un patrón, quitar también su keyframe/clase/componente (drift).
- Footguns **específicos de stack** (`@theme` inerte, spinners de inputs, etc.) → en el adapter.

## Verificación

```bash
npx tsc --noEmit -p tsconfig.json   # o el typecheck del repo
npx eslint <archivos tocados>
```
HMR toma los cambios (no rebuild). Validación visual en la ruta del lab, dark+light. NUNCA matar el dev server del usuario. Cierre significativo → `.planning/STATE.md` (vía `/save`).
