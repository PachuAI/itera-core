---
name: concept-to-screen
description: >-
  Construir o extender PANTALLAS de producto (dashboards, listas, fichas, forms) en la
  biblioteca @itera/ui-lab (projects/ui-lab del taller itera-social), para los mocks de
  itera.lat y para sistemas standalone por vertical. Aplica la disciplina de layout:
  full-HD-first (1920 denso → cascada a laptop), tiers de altura, densidad/altura pareja
  por fila, más cajas para no estirar, simetría y line-heights cuadrados, todo en español
  por rubro, y todo como composición REGISTRADA (nada hardcodeado). Es el par visual de
  concept-to-post (ese hace el copy; este hace la pantalla). Usar cuando se pide armar
  una pantalla a partir de un concepto del pool o de una vertical.
---

# Concept → Screen · pantallas de producto en @itera/ui-lab

Construye el **mock React de la pantalla** para un concepto/vertical. El copy lo hace
`concept-to-post`; el PNG final lo hace el pipeline `render-screens.mjs` + `render.mjs`.

## Cuándo usar
- "Hagamos la pantalla de X" (productos/stock, cotizador, ventas, cuenta corriente, agenda, ficha…).
- Un concepto del pool de itera.lat necesita un mock de producto.
- Abrir o extender una vertical de `VERTICALES.md`.

## Cuándo NO usar
- Copy de un post → `concept-to-post`.
- Una primitiva/composición suelta (no una pantalla entera) → `component-lab-builder`.
- Render del PNG / pieza del feed → `render-screens.mjs` + `render.mjs`.

## Antes de codear — LEER SIEMPRE (no improvisar)
1. `projects/ui-lab/VERTICALES.md` — qué pantalla/módulo, qué vertical/audiencia, qué conceptos cubre.
2. `projects/ui-lab/DASHBOARD-STANDARDS.md` — tiers de altura + recetas responsive (la REFERENCIA).
3. El `CARRUSELES.md` del stage — qué módulo pide el concepto.
4. Pantallas existentes como patrón: `stories/screen-panel.tsx` (Escritorio, multi-variante + full-HD-first), `stories/screen-clientes.tsx` (lista + toggles).
5. **El DS REAL del rubro**: Alquímica CRM (`~/projects/clientes/alquimica-crm`), ÍTERA Lex. Relevar el módulo real ANTES de diseñar. **NUNCA inventar el patrón.**

## Método
1. **Ubicar**: concepto → vertical → módulo/pantalla. Elegir rubro + datos creíbles **en español**.
2. **Relevar** cómo es ese módulo en el DS ancla (estructura, columnas, acciones, jerarquía).
3. **Diseñar full-HD-first** (1920 denso, sin estiramiento) y recién después cascada a laptop.
4. **Componer SOLO con piezas registradas**. Si algo se repite o es nuevo → crear composición en `composition/*` + registrarla en su story (Composiciones/Métricas/Shell). Cero markup hardcodeado en la vista.
5. **Bancar variaciones — no negociable.** Por cada concepto, SIEMPRE varias (una sola = entrega incompleta). Apuntar a **2-3 `variants`** = estados/recortes distintos de la MISMA pantalla (lista completa · vista filtrada/alerta · agrupada/acción) + **varios `options`** = toggles baratos (KPIs · etiquetas · selección · densidad). Las opciones se setean sin tocar la pantalla (`Story.options` + `render(opts)`); las variantes son estados deterministas (`Story.variants`). **Cada variante con un concepto de negocio claro** (qué muestra, a quién sirve, qué acción habilita), no una variación cosmética. Lo de más es semilla de un slide o concepto futuro — no se desperdicia.
6. **Verificar**: typecheck + captura 1920 y 1440; bajar a ~1100px para revisar.

## Reglas de layout — NO NEGOCIABLES (el corazón del skill)

Pensar el layout como **grilla de filas/zonas, cada una coherente**:

- **Full-HD-first.** Diseñar 1920×1080 RICO y denso (más KPIs, más columnas, más widgets) para que NO se estire; cascada mobile-first: `base` = laptop, `2xl:` (≥1536 = 1920) AGREGA densidad. Recetas:
  `grid-cols-4 2xl:grid-cols-6` + extras `hidden 2xl:flex` · `grid-cols-3 2xl:grid-cols-4` + columna extra `hidden 2xl:flex` · `grid-cols-1 2xl:grid-cols-2` + segunda `hidden 2xl:block`.
- **Tiers de altura.** sm/md/lg (KPIs, altura FIJA) + block (charts/tablas, flexible que LLENA). **Una fila = un tier.** Jamás mezclar alturas que obliguen a un componente a estirarse y dejar espacio muerto.
- **Misma densidad y altura por fila.** Las cards de una fila deben tener el mismo alto y parecida densidad interna (mismo nº de elementos, mismo peso visual). Si una no calza → a otra fila de su tier.
- **Más cajas para no estirar.** Si un componente queda gigante o estirado, partí la fila en más columnas y sumá widgets, en vez de dejar uno enorme.
- **Simetría y cuadre.** Padding vertical uniforme (arriba = abajo), gaps consistentes, **line-heights parejos** (filas de tabla con alto fijo `h-11` → el badge respira sin desparejar). Que quede todo simétrico y cuadrado.
- **Español + por rubro.** Labels, datos y copy en español rioplatense, con datos creíbles del nicho.
- **Patrones del DS.** Topbar global = solo título + search + notif + perfil; **CTAs SIEMPRE en content** (nunca en el topbar); filtros pegados a la tabla; stat-tiles en grid (no strip estirado).
- **Ban list.** Doble-chevron `ChevronsUpDown`; espacio muerto; componentes estirados; markup hardcodeado en la vista.

## Inventario para componer (ya existe — reusar, no recrear)
- **Shell**: `AppShell` (variantes module/topbar/rail) + piezas `composition/shell/*` (Brand, NavItem, UserChip, SearchBox, Sidebar, Topbar, Rail/ActivityRail).
- **Métricas**: StatTile (sm) · GoalCard (md) · MetricCard / RadialMetric / RankingList / DonutBreakdown (lg) · ChartPanel / BarChart / AreaChart (block) · Sparkline / MiniBars / RadialGauge / DeltaBadge.
- **Tablas/listas**: DataTable (+ Th/Td, fila `h-11`) · TableCard · RecentSales.
- **Filtros**: FilterBar · FilterSelect · SearchField · SortSelect.
- **Otros**: Card · StatusPill · Avatar · Pagination · primitivas shadcn en `components/ui/*`.
- **Ejes globales** (`data-*`): shell · accent (8) · surface (4) · radius (4) · font (4) · dark. **Toggles por pantalla**: `Story.options` + `render(opts)`.

## Verificación
- `pnpm --filter @itera/ui-lab typecheck`.
- Dev server: `pnpm --filter @itera/ui-lab dev` (http://localhost:5174). **NUNCA matarlo.**
- Captura: `node render-screens.mjs --story <id> --variant <id> --shell topbar --w 1920 --h 1080 --out projects/ui-lab/out/x.png` (+ 1440 para chequear cascada). Para revisar: bajar la imagen a ~1100px con PIL antes de leer (hay límite de tamaño/cantidad de imágenes).
- Registrar la pantalla en `registry.tsx` (categoría `screens`) y componer SOLO de piezas registradas.

## Check final anti-AI-slop — OBLIGATORIO antes de dar por terminado
Toda pantalla **y toda composición/primitiva nueva** se revisa contra esta lista MIRANDO EL RENDER (no el código). Si aparece alguno → corregir y volver a capturar. Aplica también a piezas que se reutilizan: si una primitiva existente trae uno de estos patrones, se corrige la primitiva (no se tapa en la vista).

- **Border/barra de acento pintada al costado de una card o KPI** (border-left de color, o "barrita" vertical pegada al valor tipo `| 8`) por estado/categoría → PROHIBIDO. El color va en cabecera de columna, `StatusPill`, badge/tag, o el dato mismo — nunca como borde/barra al lado.
- **Fondo pastel por estado** en cards/filas (tinte suave de color como fondo decorativo). El estado se codifica con pill/punto/badge, no tiñendo la card entera sin función.
- **Espacio muerto / padding vertical vacío**: KPIs o cards altas con un dato chico flotando. Rellenar con `hint`/contenido real o bajar de tier; nunca dejar el número solo en el centro de una card grande.
- **Componente estirado** a una altura que no es la suya (mezclar tiers en una fila). Una fila = un tier.
- **Doble-chevron** `ChevronsUpDown` y decoración sin función (íconos al lado de cada label, gradientes innecesarios, sombras exageradas, avatares de relleno).
- **Markup hardcodeado** en la vista en vez de primitivas registradas (eso es drift: lo mismo resuelto distinto en dos lados de la misma pantalla).

Regla de oro: si un elemento usa color, tiene que ser **funcional** (comunica estado/dato), no cosmético. Ante la duda, quitarlo.
