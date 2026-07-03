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

## 3b. Volcar un módulo REAL (cableado a backend) al lab

Cuando el módulo YA existe en prod (no se prototipa de cero) y se quiere su UI **fiel** para retocarla:
reusar los componentes PRODUCTIVOS con mock data → propaga al SaaS, cero drift. Decisión POR componente:

- **Hoja presentacional** (props in → JSX, acciones por callback): reusar tal cual con mock props/datos.
- **Orquestador cableado** (importa server actions / hooks de datos en su módulo): dos caminos —
  1. **Montarlo** si en reposo NO pollea/fetchea y solo dispara backend **on-click** (ej: un viewer en
     estado "completado" no pollea; las acciones fallan suave al click). Pasale mock data en el estado
     *settled*.
  2. **Replicar el armado** (layout/header) con las hojas reales si el ensamblador importa server actions
     al tope del módulo o no es montable. Bonus: libertad para iterar el placement sin tocar prod.

**Footgun #1 — el recurrente: `server-only` rompe el test de paridad del registry.** Importar componentes
de dominio arrastra services/actions con `import 'server-only'` al grafo. En prod el bundler lo resuelve;
el grafo plano del test (Vitest/Node) lo evalúa y revienta. → **Diferir TODOS los renderers del módulo con
import lazy** (`next/dynamic` `ssr:false` en el `index.tsx`/renderers de la categoría; `React.lazy` en
otros stacks). Así `registry/renderers` queda liviano en module-eval y el grafo real solo carga al
renderizar la story en el lab.

**Orquestador-at-render**: si en reposo hace polling/`refresh`/efectos (ej: un estado "procesando" que
`router.refresh()` cada N s) → montarlo SOLO en el estado *settled*; los OTROS estados, vía la hoja
presentacional directa (sin el orquestador), que recibe el estado por prop y no pollea.

**Providers de context-hooks**: una pieza que usa un context-hook (demo-mode, sidebar, page-title…)
necesita su provider. Dentro del shell (AppShellFrame) ya están; una primitiva AISLADA hay que envolverla
(`<XProvider>`).

**Controller con estado**: para un orquestador que recibe el retorno de un hook real (ej:
`ConversationManagement`), armar un hook lab-local que **satisface esa interfaz** con estado local +
handlers no-op. Se mockea el CONTRATO del hook, no el componente.

**Invariante de render del dato**: al reusar un renderer real con mock data, mirar CÓMO consume la
estructura (no asumir). Ej real: un transcript que dibuja palabra-por-palabra toma los espacios de tokens
`spacing` intercalados → sin ellos el texto sale pegoteado. Replicá el **shape EXACTO** que produce el
backend (tipos importados del service, nunca redefinidos; los `GetPayload` exigen TODOS los scalars).

Checklist: reuse-vs-replicate decidido ✔ · renderers diferidos (no rompe paridad) ✔ · orquestadores en
estado settled ✔ · providers de los hooks ✔ · mock = shape real del backend ✔.

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
- **`server-only` en el grafo del test** (al reusar componentes de dominio) → diferir los renderers con
  import lazy (`next/dynamic`/`React.lazy`). Ver §3b.
- **Mock const exportada sin consumir cross-file** → el gate de dead-code (fallow/knip) la marca; mantené
  las consts de mock LOCALES salvo que otro archivo las importe.
- **Categoría nueva = 3+ ediciones** (tipo `StoryCategory` + `CATEGORY_ORDER` + `CATEGORY_LABELS` + metas);
  si falta una, el test de paridad meta↔renderers lo caza.
- Footguns **específicos de stack** (`@theme` inerte, spinners de inputs, etc.) → en el adapter.

## Verificación

```bash
npx tsc --noEmit -p tsconfig.json   # o el typecheck del repo
npx eslint <archivos tocados>
```
HMR toma los cambios (no rebuild). Validación visual en la ruta del lab, dark+light. NUNCA matar el dev server del usuario. Cierre significativo → `.planning/STATE.md` (vía `/save`).
