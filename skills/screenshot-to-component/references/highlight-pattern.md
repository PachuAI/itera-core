# Patrón Highlight — hacer cada elemento destacable individualmente

Cada View compuesta debe permitir que el caller destaque un widget específico sin romper el layout. Esto habilita el uso en videos de tour (`remotion-camera-tour`) donde la cámara enfoca un widget y se enciende un ring naranja sobre él.

## Componente `Highlight` (en la biblioteca)

Es un wrapper que recibe `active` y rendea ring + glow sobre el child cuando es true, transparente cuando es false.

```tsx
// lib/highlight/Highlight.tsx
interface HighlightProps {
  active?: boolean;
  pulse?: boolean;
  intensity?: "subtle" | "default" | "strong";
  children: ReactNode;
}
```

Implementation:
- Wrapper con `position: relative`
- Pseudo-elements `::before` (ring) y `::after` (glow) con opacity 0
- Cuando `active=true`, los pseudos van a opacity 1 + animation `pulse` si está activo
- Cuando `active=false`, **transparente** (no ring, no glow, no scale) — verificar que el child se vea idéntico envuelto vs sin envolver

CSS específico vive en `Highlight.module.css`. Cambiar `--hl-radius` (border radius del ring) si el child tiene esquinas distintas al default 14px.

## Highlight IDs

Cada View define un tipo union string con todos sus IDs de highlight:

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

Convenciones:
- kebab-case
- Prefijo común para grupos: `stat-*`, `sidebar-*`, `row-*`
- Nombre descriptivo, no posición (`agenda` ✓, no `widget-1`)

## View con highlights

La View recibe `highlights?: <Type>HighlightId[]`:

```tsx
export interface EscritorioViewProps {
  highlights?: EscritorioHighlightId[];
  highlightPulse?: boolean;
  // ... otros overrides
}

const has = (id: EscritorioHighlightId) => highlights.includes(id);

const HL = (
  active: boolean,
  pulse: boolean,
  children: React.ReactNode,
  intensity: "subtle" | "default" | "strong" = "default"
) => (
  <Highlight active={active} pulse={pulse} intensity={intensity}>
    {children}
  </Highlight>
);

return (
  <div className={styles.layout}>
    <section className={styles.statsArea}>
      <div className={styles.calendarCell}>
        {HL(has("calendar"), highlightPulse, <CalendarWidget />)}
      </div>
      <div className={styles.statCell}>
        {HL(has("stat-audiencias"), highlightPulse, <StatCard ... />)}
      </div>
      {/* ... un HL() por elemento highlightable ... */}
    </section>

    <section className={styles.widgetsArea}>
      <div className={styles.widgetCell}>
        {HL(has("agenda"), highlightPulse, <AgendaProximaWidget />)}
      </div>
      {/* ... */}
    </section>
  </div>
);
```

Helper `HL(active, pulse, children, intensity?)` evita repetir el wrapper.

## Cuándo agregar un highlight ID

Regla: **si el video podría querer destacarlo, ponele highlight ID**.

Concreto:
- Cada widget grande del main → highlight ID
- Cada stat card → highlight ID individual
- Sub-header completo → highlight ID
- Items específicos de listas (días del calendario, filas de tabla) → solo si son protagonistas potenciales del video. Default: no granular hasta que se pida.

Cuando el ID es paramétrico (ej: día del calendario), usar template strings:

```tsx
export type CalendarioHighlightId =
  | "sub-header"
  | "view-toggle"
  | "month-grid"
  | `day-${number}`;
```

Y en el render:

```tsx
{cells.map((cell) => (
  <Cell key={cell.day} highlight={has(`day-${cell.day}`)} />
))}
```

## Animación de highlight

El `Highlight` component tiene 3 modos:
- `intensity="subtle"`: solo ring fino, sin glow
- `intensity="default"`: ring + glow medio (default)
- `intensity="strong"`: ring grueso + glow ancho + scale 1.015

Y la prop `pulse=true` agrega una animation infinite que pulsa el ring (visualmente "respira") — útil cuando es la única cosa pasando en pantalla, distraería en videos rápidos.

**Regla para videos**: en `remotion-camera-tour`, suele convenir `pulse=false` (el zoom + el highlight estático ya bastan). En la gallery, `pulse=true` para que se note que es interactivo.

## Stories que cubren highlights

Por cada View nueva, sumar variants en `gallery/stories.tsx`:

```tsx
{
  id: "shell/escritorio",
  label: "EscritorioView",
  category: "Views",
  description: "Vista del Escritorio...",
  canvasFull: true,
  variants: [
    { name: "Default", render: () => <EscritorioView /> },
    {
      name: "Highlight: Agenda",
      render: () => <EscritorioView highlights={["agenda"]} />,
    },
    {
      name: "Highlight: Causas activas",
      render: () => <EscritorioView highlights={["stat-causas"]} />,
    },
    {
      name: "Highlight múltiple (Calendar + Tareas)",
      render: () => <EscritorioView highlights={["calendar", "tareas"]} />,
    },
    {
      name: "Sin pulso",
      description: "Para frames de video donde el motion ya pasó.",
      render: () => (
        <EscritorioView highlights={["agenda"]} highlightPulse={false} />
      ),
    },
  ],
}
```

Una variant por cada highlight principal + 1-2 variants con combinaciones.

## En videos (Remotion)

El caller del video calcula `highlights` desde `useCurrentFrame`:

```tsx
const getHighlights = (frame: number): EscritorioHighlightId[] => {
  if (frame >= F(3.85) && frame < F(4.96)) return ["agenda"];
  if (frame >= F(5.5) && frame < F(7.02)) return ["stat-tareas"];
  return [];
};

return (
  <Camera keyframes={...}>
    <DashboardShell>
      <EscritorioView highlights={getHighlights(frame)} highlightPulse={false} />
    </DashboardShell>
  </Camera>
);
```

El mismo View, distintos highlights por frame → distintos focos según el guion.

## Anti-patrones

**Mal**: hardcodear el highlight en el widget mismo.

```tsx
// ❌ No: el widget no debería saber que está highlighteado
<AgendaProximaWidget highlighted={true} />
```

**Bien**: el wrapper Highlight separado.

```tsx
// ✓: highlight es composición externa
<Highlight active>
  <AgendaProximaWidget />
</Highlight>
```

**Mal**: highlight IDs sin tipar.

```tsx
// ❌ No: typo-prone, no autocomplete
highlights?: string[];
```

**Bien**: tipo union.

```tsx
// ✓: typecheck + autocomplete
highlights?: EscritorioHighlightId[];
```
