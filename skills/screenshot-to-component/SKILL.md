---
name: screenshot-to-component
description: Convertir el screenshot de una UI (vista de un producto SaaS — dashboard, calendario, tabla, modal, settings page) en componentes React reutilizables dentro de una biblioteca Vite + CSS Modules. El skill descompone la vista en (1) primitives reutilizables (Card, Badge, Button, etc.), (2) iconos SVG inline, (3) widgets concretos (cada sección/widget como componente independiente con mock data), (4) una View grande que compone el shell + los widgets, (5) un tipo `<Vista>HighlightId` para destacar partes individualmente desde el caller, (6) entradas en `gallery/stories.tsx` con variants Default + variants por highlight. Pixel-perfect estéticamente pero NO data-perfect (mock data genérica del dominio). Cada elemento highlightable está envuelto en `<Highlight>` con `active` controlable por prop. El output queda listo para consumir desde la gallery (HMR) y desde proyectos Remotion (vía build:lib). Usar SIEMPRE cuando hay un screenshot de UI que se quiere reproducir como componentes para mocks de video, maquetas o demos. Triggers: "componetizá este screenshot", "armá los componentes de esta vista", "convertí esta UI a React components", "esta sección como componentes", "componentes para usar en video", "/screenshot-to-component". Complementa `brandboard-creator` (que arranca la biblioteca) y `remotion-camera-tour` (que usa los componentes en video).
---

# Screenshot to Component

Método validado para convertir el screenshot de una UI de producto en componentes React reutilizables dentro de una biblioteca Vite + CSS Modules, listos para usar en mocks visuales, maquetas y videos de tour.

> **Variante específica de ÍTERA Lex**: para la biblioteca `projects/iteralex/components` existe `iteralex-componentizacion-ui` (skill de Codex en `.agents/skills/`), que extiende este método con el contrato propio de ese repo (ACTION_FLOWS.md, gallery `flows`, ScreenFrame stories, shell spacing, timings de typewriter validados, highlight/viewKey). Si trabajás sobre la biblioteca de ÍTERA Lex, usá esa variante; este skill canónico es el método genérico para cualquier otro proyecto/marca.

## Cuándo invocar

Invocar siempre que:
- Hay un **screenshot** de una vista del producto (dashboard, calendario, tabla, modal, settings, etc.)
- El producto tiene biblioteca de componentes ya inicializada (Vite + React + CSS Modules, estructura `src/lib/{primitives,widgets,shell,icons}`)
- Se quiere reproducir esa UI como mocks visuales para alguno de estos casos:
  - Videos de tour del producto (consumido por `remotion-camera-tour`)
  - Maquetas estáticas (consumido por la gallery)
  - Eventual reuso en el repo del producto real

**Pre-requisito**: biblioteca de componentes inicializada en `projects/<slug>/components/` (default del taller `itera-social`: `projects/iteralex/components/`). Si no existe, ver `brandboard-creator` primero. El Paso 0 del workflow detalla cómo identificar la biblioteca destino.

**Out of scope**:
- UIs que no son del dominio del producto (no es para componetizar UIs random del internet)
- Reproducir UIs con backend real (esto es solo mock visual)
- Componentes single-shot sin biblioteca alrededor (esto asume estructura `lib/`)

## Workflow

### 0. Identificar la biblioteca destino

Antes de cualquier cosa, fijar el path absoluto de la biblioteca donde van a vivir los componentes nuevos.

**Default del taller `itera-social`** (la mayoría de los casos):

```
/home/pachu/projects/itera-social/projects/iteralex/components/
```

Estructura esperada:

```
<biblioteca>/
├── package.json (Vite + React + TypeScript)
├── vite.config.ts          (gallery dev)
├── vite.config.lib.ts      (build:lib para Remotion)
├── src/
│   ├── lib/
│   │   ├── index.ts        ← barrel export
│   │   ├── primitives/
│   │   ├── widgets/
│   │   ├── shell/
│   │   ├── highlight/
│   │   └── icons/
│   ├── gallery/
│   │   └── stories.tsx     ← donde se suman variants nuevas
│   ├── tokens.ts
│   └── globals.css
```

**Verificación** (correr antes de codear):
1. `ls <biblioteca>/src/lib/index.ts` — si existe, esa es la lib.
2. `cat <biblioteca>/src/lib/index.ts` — leer qué ya está exportado para no duplicar.

**Otros SaaS del taller**: si en el futuro hay más bibliotecas (ej: `projects/shopear/components/`, `projects/itera/components/`), el path cambia pero la estructura se mantiene. El user debería indicarlo explícitamente en la invocación (ej: "componetizá esto en `shopear`").

**Si no hay biblioteca**: invocar primero `brandboard-creator` para inicializarla con tokens + globals + shell + gallery. NO crear componentes "sueltos" fuera de la estructura.

### 1. Análisis del screenshot

Antes de generar código, hacer un inventario mental:

**Shell** (si lo hay):
- ¿Sidebar? Items, secciones, footer
- ¿Topbar? Título de página, search, acciones derecha, avatar
- ¿Greeting header?
- ¿Sub-header específico de la vista? (ej: calendario tiene su propio sub-header)

**Zonas/secciones del main**:
- Grid: cuántas filas, cuántas columnas
- Widgets/cards: cada uno qué muestra
- Lista/tabla: cuántas filas, qué columnas

**Primitives reusables**:
- ¿Hay cards? `Card`
- ¿Pills/labels? `Badge`
- ¿Botones primarios y secundarios? `Button`
- ¿Chips de selección? `Chip`
- ¿Modal? `Modal`
- ¿Popover? `Popover`
- ¿Stat con valor grande + label + icono? `StatCard`

**Iconos**:
- Listar todos los iconos visibles (sidebar nav, stats, actions, etc.)
- Asignarles un nombre descriptivo (ej `IconCalendario`, `IconBalanza`, `IconChevronDown`)

**Highlights potenciales**:
- ¿Qué partes podría querer destacar un video?
- Cada widget grande debería ser highlightable
- Cada stat card individual
- Sub-header completo si tiene sentido narrativamente
- Items específicos del sidebar
- Días específicos del calendario (si aplica)

### 2. Mapping a componentes existentes vs nuevos

Inventariar `src/lib/` actual:
- ¿Qué primitives ya existen? (`Card`, `Badge`, `Button`, etc.)
- ¿Qué iconos ya hay?
- ¿Qué widgets están definidos?

Decidir:
- **Reusar**: primitives e iconos existentes que sirven
- **Crear nuevos**: primitives específicos que faltan + iconos nuevos + widgets concretos + la View
- **Refactorear**: si un primitive existente está cerca pero le falta una variante (ej: `Card` que necesita aceptar ReactNode en title), extenderlo en vez de duplicar

### 3. Crear iconos nuevos

Agregar a `src/lib/icons/index.tsx`. Convención del taller:
- SVG inline monocromo estilo Lucide
- Usar `currentColor` (heredan color del parent)
- `wrap` helper con viewBox 0 0 24 24
- Export como `IconNombre` con props `{ size?: number }`

Ejemplo:
```tsx
export const IconMartillo = wrap(
  <>
    <path d="M14 4l6 6-2 2-6-6 2-2z" />
    <path d="M11 7l-7 7a2 2 0 0 0 0 3l1 1a2 2 0 0 0 3 0l7-7" />
  </>
);
```

### 4. Crear primitives nuevos (si hace falta)

Ubicación: `src/lib/primitives/<Name>.tsx` + `<Name>.module.css`.

Convenciones:
- Props todas opcionales con defaults razonables
- Una variante visual = una prop `kind`/`variant` con tipo union
- Sin estado interno (controlled component por defecto)
- Si tiene mount/unmount visible (Modal, Popover), agregar CSS @keyframes `appear` para fade+scale en `0.32s cubic-bezier(0.22, 1, 0.36, 1)` — ver `references/highlight-pattern.md` para por qué CSS keyframes y no animation JS
- Exportar el componente + el tipo de Props desde el archivo

Ver `assets/component-template.tsx` para el shell de un componente nuevo.

### 5. Crear widgets concretos

Ubicación: `src/lib/widgets/<Name>Widget.tsx` + `.module.css`.

Cada widget:
- Es un wrapper sobre uno o más primitives (típicamente sobre `Card`)
- Recibe props para customizar valores + mock data como default
- Mock data **realista al dominio** del producto (ej: para ÍTERA Lex usar nombres y términos jurídicos argentinos: causas, audiencias, expedientes, "Pérez c/ Aseguradora", etc.)
- Spanish rioplatense en labels
- Exporta props + types

Ver `references/component-conventions.md` para reglas detalladas sobre mock data + naming + estructura.

### 6. Crear la View completa

Ubicación: `src/lib/shell/<Vista>View.tsx` + `.module.css`.

La View:
- Compone el `DashboardShell` (o equivalente) + los widgets en su layout específico
- Si la vista tiene su propio sub-header (calendario, settings), incluirlo
- **Cada elemento highlightable** está envuelto en `<Highlight active={highlights?.includes(id)} pulse={highlightPulse}>`
- Acepta props `highlights?: <Vista>HighlightId[]` y `highlightPulse?: boolean`
- Acepta overrides de valores específicos (stats counts, datos mock, etc.) — útil para variants

### 7. Definir tipo `<Vista>HighlightId`

Type union con todos los IDs de highlight de esa vista:

```tsx
export type EscritorioHighlightId =
  | "calendar"
  | "stat-audiencias"
  | "stat-reuniones"
  | "stat-plazos"
  | "stat-vencimientos"
  | "stat-tareas"
  | "stat-causas"
  | "agenda"
  | "puma"
  | "tareas";
```

Permite autocomplete + typecheck en stories y proyectos Remotion.

### 8. Actualizar `lib/index.ts`

Agregar exports:
- El componente nuevo
- Los types asociados (Props + HighlightId si corresponde)
- Iconos nuevos (re-export desde `./icons`)

Patrón:
```tsx
export { EscritorioView } from "./shell/EscritorioView";
export type {
  EscritorioViewProps,
  EscritorioHighlightId,
} from "./shell/EscritorioView";
```

### 9. Sumar story a `gallery/stories.tsx`

Por cada vista nueva, agregar entry al array `STORIES`:

```tsx
{
  id: "shell/escritorio",
  label: "EscritorioView",
  category: "Shell" | "Views" | "Widgets" | "Primitives",
  description: "...",
  canvasFull: true,
  variants: [
    { name: "Default", render: () => <View /> },
    {
      name: "Highlight: Agenda",
      description: "Destaca el widget de Agenda Próxima.",
      render: () => <View highlights={["agenda"]} />,
    },
    // ... una variant por highlight relevante
  ],
}
```

También sumar stories aisladas de cada widget nuevo (no solo de la vista compuesta) — útil para iterar visualmente sin scroll-bombing el shell entero.

## Reglas de calidad

### Pixel-perfect visual, NO data-perfect

El objetivo es que **se vea** como el screenshot. Los datos exactos NO importan:
- Si el screenshot real tiene "Pereyra c/ Supermercado Norte SRL", el mock puede usar otro nombre similar realista del dominio
- Si el real tiene 21 causas activas, el mock puede tener 21 o 47 — el número es decoración
- **NUNCA** copiar literal datos sensibles del screenshot (PII, casos reales, nombres de clientes)

### Cada componente es independientemente reutilizable

El widget `AgendaProximaWidget` debería renderearse solo (en gallery) Y dentro del `EscritorioView`. Si lo único que cambia es que en el shell tiene contexto del Card alrededor, está bien — pero el widget en sí no depende del shell.

### Highlight wrapper es transparente

`<Highlight active={false}>` debe renderear el child sin alterarlo visualmente. Cuando `active=false`, no debe haber ring, glow, scale ni nada. Verificar que el widget queda idéntico envuelto vs sin envolver.

### Iconos heredan color

Todos los SVG icons usan `stroke="currentColor"` (o `fill="currentColor"` si es solid). Eso permite que el caller controle el color via `color: ...` en CSS.

### Mock data en español rioplatense

Si el producto está en español rioplatense (taller default), los labels y mock data también. Ejemplos para iteralex: "Audiencias", "Vencimientos", "Causas activas", "Pereyra c/ Aseguradora", "Lic. María González".

### CSS Modules locales, no globals

Cada `<Name>.module.css` solo tiene clases del componente, no globals. Si necesitás una variable global (token brand), usar `var(--brand-accent)` que viene de `globals.css`.

### Animaciones de aparición en componentes con mount/unmount

Para Modal, Popover, Toast (cualquier cosa que aparece/desaparece): usar **CSS @keyframes en el `.module.css`** disparados por `animation: appear ...` en la clase principal. NO usar JS para animar el mount, porque eso obliga al caller a manejar progress.

Ejemplo en `Modal.module.css`:
```css
.modal {
  animation: modalAppear 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Cross-references

- `brandboard-creator` — si la biblioteca aún no existe, este skill la inicializa primero
- `remotion-camera-tour` — para usar los componentes generados en un video de tour
- `frontend-design` — si querés ayuda con el diseño cuando el screenshot no es claro

## Pointers

- `assets/component-template.tsx` — shell de un componente nuevo (props + CSS modules + types)
- `references/component-conventions.md` — naming + estructura + mock data del dominio
- `references/highlight-pattern.md` — cómo hacer highlightable + tipo union + integración en stories

## Idioma

Componentes generados con labels en **español rioplatense** (default del taller). Mock data realista al dominio (ej: para SaaS jurídico argentino, términos legales argentinos). Types y props en inglés (lenguaje del código).

## Para usar con Codex / otra IA

El SKILL.md y references están en markdown estándar — copiables como prompt augmentation a cualquier IA. La IA destino necesita tools de:
- Read (leer screenshot + archivos existentes)
- Write/Edit (crear archivos nuevos)
- Bash (mkdir + ls)
- Visión multimodal (para interpretar el screenshot)

El flujo es el mismo independiente de qué IA lo ejecute. Si llegás con el screenshot a Codex, abrir el SKILL.md y los references como contexto, después pedirle que componetice siguiendo el método.
