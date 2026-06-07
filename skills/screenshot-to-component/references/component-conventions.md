# Convenciones de componentes

Reglas detalladas para naming, estructura, props, mock data y CSS, validadas iterando la biblioteca de ÍTERA Lex (`projects/iteralex/components/`).

## Naming

### Files

- `<Name>.tsx` — el componente, PascalCase
- `<Name>.module.css` — los styles, mismo nombre
- Sin sufijo "Component" (`Card.tsx`, no `CardComponent.tsx`)
- Sufijo "Widget" SI es un widget concreto del producto: `AgendaProximaWidget.tsx`, `PumaNovedadesWidget.tsx`
- Sufijo "View" SI es una vista compuesta (shell + widgets): `EscritorioView.tsx`, `CalendarioView.tsx`

### Componentes

- PascalCase: `DashboardShell`, `CalendarMonthView`, `EventModal`
- Para iconos: prefix `Icon` + concepto en español: `IconCalendario`, `IconBalanza`, `IconChevronDown`
- Para wrapper de enhancement: `Highlight`, `Tooltip`, `Skeleton`

### Props types

- `<Name>Props` — interface con props del componente
- Exportar siempre el tipo de Props

```tsx
export interface CardProps {
  title?: ReactNode;
  // ...
}
export const Card: React.FC<CardProps> = (...) => ...;
```

### Highlight IDs

- Tipo union string: `<Vista>HighlightId`
- IDs en kebab-case: `"stat-audiencias"`, `"agenda"`, `"day-20"`
- Prefijos cuando hay grupos: `"stat-*"`, `"sidebar-*"`, `"row-*"`

## Estructura de archivos

```
src/lib/
├── index.ts                  ← barrel export
├── shell/
│   ├── DashboardShell.tsx
│   └── EscritorioView.tsx    ← Views compuestas
├── widgets/
│   ├── AgendaProximaWidget.tsx
│   └── ...
├── primitives/
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   └── ...
├── highlight/
│   └── Highlight.tsx
├── screen/
│   └── ScreenFrame.tsx
└── icons/
    └── index.tsx            ← todos los iconos en un solo archivo
```

## Props patterns

### Defaults razonables

Todas las props opcionales con defaults que produzcan output visible:

```tsx
export const AgendaProximaWidget: React.FC<AgendaProximaWidgetProps> = ({
  title = "Agenda próxima — próximos 7 días",
  groups = DEFAULT_GROUPS,
}) => ...;
```

Esto permite `<AgendaProximaWidget />` sin props y ya se ve bien.

### Variantes por prop `kind` / `variant`

Si el componente tiene N variantes visuales:

```tsx
export type BadgeKind = "audiencia" | "reunion" | "plazo" | "critica" | ...;

interface BadgeProps {
  kind?: BadgeKind;
  children: ReactNode;
}
```

NO crear `<AudienciaBadge>`, `<ReunionBadge>` separados — eso explota el árbol.

### Sin estado interno

Los componentes son **controlled**. Si recibe `active`, el caller decide cuándo es true. Si recibe `value`, el caller maneja el state.

Excepción: animaciones puramente visuales (CSS @keyframes de aparición). Esas no son "estado", son estilo.

### Override de mock data por prop

Cada widget acepta override de su mock data:

```tsx
<AgendaProximaWidget
  groups={[
    { label: "Hoy", events: [...] },
    // ...
  ]}
/>
```

## CSS Modules

### Scope local

Cada `.module.css` solo tiene clases del componente. Los class names son hashed automáticamente por Vite (`Card_card__abc123`).

### Variables globales

Usar CSS custom properties para tokens del brand. Vienen de `globals.css`:

```css
.card {
  background: var(--brand-surface);
  border: 1px solid var(--brand-border);
  color: var(--brand-fg);
}
```

NO hardcodear colores hex en `.module.css`. Excepción: animaciones / valores no-brand (ej: `transform: scale(0.94)`).

### Tipografía via tokens

```css
.title {
  font-family: var(--font-display);
  font-weight: 700;
}
```

## Mock data del dominio

### Para ÍTERA Lex (jurídico argentino)

**Términos canónicos** (usar siempre):
- "causa" (no "expediente" en marketing/UI)
- "audiencia", "vencimiento", "plazo", "reunión", "diligencia"
- "presupuesto", "tarea"
- "Cliente", "Causa", "Estudio"
- "Calendario", "Escritorio", "Vista general"

**Nombres argentinos típicos para mock**:
- Apellidos: González, Pérez, Fernández, Méndez, Andreoli, Sosa, Pereyra, Lagos, Suárez, Romero
- Nombres: Martín, Laura, Carolina, Alejandro, Rodrigo, Roberto, Ana, Patricia, Federico, Carlos
- Combinaciones: "Dr. Martín Pérez", "Lic. María González", "Pereyra c/ Aseguradora SRL"

**Términos legales mock**:
- Tipos: "Daños y perjuicios", "Sucesión", "Divorcio", "Cobro de pesos", "Igualdad salarial"
- Movimientos: "Provee pericial médica", "Notificación electrónica", "Auto interlocutorio", "Acuerdo homologado", "Cédula recibida"
- Tribunales: "Juzgado Civil Nº 4", "Cámara Civil · Sala D", "Juzgado Comercial Nº 12"

**Evitar**:
- Nombres extranjeros que no encajen (John Smith, ABC Corp)
- "Lorem ipsum"
- Términos de marketing-speak
- Datos sensibles reales (PII, casos identificables)

### Para otros SaaS

Adaptar al dominio. Para un SaaS de e-commerce: SKUs, productos, órdenes, tiendas con nombres argentinos. Para un SaaS de inmobiliario: propiedades, agentes, distritos del país. Etc.

## Variantes en stories

Por cada componente nuevo, sumar a `gallery/stories.tsx`:

```tsx
{
  id: "<category>/<component>",
  label: "<ComponentName>",
  category: "Shell" | "Views" | "Widgets" | "Primitives" | "Highlight" | "Screen",
  description: "Qué hace + cuándo usarlo.",
  canvasMaxWidth: 480,  // o canvasFull: true si es vista grande
  variants: [
    { name: "Default", render: () => <Component /> },
    { name: "Con datos cargados", render: () => <Component prop="..." /> },
    // ... una variant por estado/configuración relevante
  ],
}
```

Para vistas compuestas con highlights, una variant por highlight principal:

```tsx
{ name: "Highlight: Agenda", render: () => <View highlights={["agenda"]} /> },
{ name: "Highlight: PUMA", render: () => <View highlights={["puma"]} /> },
// ...
```

## Iconos — convención específica

`src/lib/icons/index.tsx` contiene TODOS los iconos. Helper `wrap`:

```tsx
import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "size"> {
  size?: number;
}

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

const wrap =
  (paths: React.ReactNode) =>
  ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      {paths}
    </svg>
  );

export const IconCalendario = wrap(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </>
);
```

Si necesitás icon fill (no outline), cambiar `stroke="currentColor"` por `fill="currentColor"` en ese icono específico (override de `base`).

## Cuándo refactorear vs duplicar

Antes de crear un primitive nuevo, revisar si uno existente puede extenderse:

- Si `Card` tiene `title: string` y necesitás `title: ReactNode` → **extender** Card (cambiar el type, no romper consumers existentes)
- Si necesitás un `Card` con padding muy específico → agregar prop `padding?: "sm" | "md" | "lg"` en vez de crear `BigCard`
- Si necesitás un componente COMPLETAMENTE distinto a Card (no es un container con header + body) → crear primitive nuevo

Regla: prefiero un primitive más flexible que dos primitives "casi iguales".
