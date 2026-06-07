# Guía de UI — Admin panels SaaS (estilo ÍTERA)

Sistema de diseño base para **paneles de administración multi-tenant** de cualquier SaaS de ITERA. Nace de la práctica en `shope-ar` (admin dark + emerald, branding v7) y está generalizado para reusarse en `alquimica`, `itera-link` y futuros proyectos.

> **Antes de copiar este doc al repo nuevo**: definir las 4 decisiones de la sección "Variables del SaaS" abajo. Sin esas decisiones tomadas, el sistema queda ambiguo y se vuelve a generar drift.

---

## Variables del SaaS (decidir antes de codear)

Cada SaaS instancia este sistema con valores propios. El esqueleto es el mismo, los inputs cambian.

| Variable                | Ejemplo shope-ar                       | Hay que decidirlo                                                |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| **Scope CSS class**     | `.shope-app`                           | Una clase única que envuelve todo el admin (y `<body>` via injector). |
| **Color primary**       | `wa-green #25d366` (oklch 0.745 0.185 148) | El acento de marca. Se mantiene en light y en dark.            |
| **Display font**        | Baloo 2 (rounded, friendly)            | Solo para wordmark + headings. Cargar via `next/font`.           |
| **UI font**             | Poppins (geometric)                    | Body, nav, CTA, labels. Cargar via `next/font` y aplicarla como `font-family` default del scope. |
| **Token prefix**        | `--shope-*`                            | Prefijo de las CSS vars de marca (surface, border, fg, accent).  |

Las **5 decisiones obligatorias** son: scope class, primary color, display font, UI font, token prefix. El resto del sistema (zinc neutral, layout sidebar+topbar, microinteracciones, charts) se mantiene fijo.

---

## Filosofía

- **Dark-first con light fallback opcional**: la marca se ve en oscuro. Light, si existe, es secundario y no se enableSystem por defecto.
- **Primary fijo entre light/dark**: el color de marca no cambia con el tema. Se mantiene la identidad.
- **Zinc como neutral**: todo el layout (background, card, borders, muted) usa `zinc-*` en distintos pesos. **Nunca** `slate`, `gray`, `stone`, `neutral`.
- **Contraste por superficie, no por borde**: card `zinc-900` sobre background `zinc-950` + border `white / 0.12`. El borde no compite con la superficie.
- **Radios medianos**: `rounded-xl` es la norma (cards, botones primarios). `rounded-lg` para chicos. `rounded-full` para pills/avatars. `rounded-2xl` solo en auth/empty states. **Prohibido** `rounded-3xl`.
- **Microinteracciones sutiles**: `transition-colors`, `transition-[width]`, `hover:bg-accent/60`, arrow `group-hover:translate-x-0.5`. Nada bouncy.

---

## Scope CSS

El admin override los tokens de shadcn vía una clase CSS aplicada al wrapper raíz **y** al `<body>` (via injector). El injector es necesario para que los Radix Portals (modales, popovers, dropdowns) hereden las CSS vars desde el primer paint.

```tsx
// (admin)/layout.tsx
<div className="<scope> dark">
  <ScopeInjector />
  {children}
</div>

// scope-injector.tsx (Client Component)
'use client'
import { useEffect } from 'react'
export function ScopeInjector() {
  useEffect(() => {
    document.body.classList.add('<scope>', 'dark')
    return () => document.body.classList.remove('<scope>', 'dark')
  }, [])
  return null
}
```

> Si hay light fallback, el bloque `<scope>` define vars light y `.dark <scope>` (anidado) define vars dark. Si no hay light fallback, definir directo en `<scope>` y forzar `dark` siempre.

### Regla de font-family heredada

El bloque CSS del scope **debe** declarar `font-family` apuntando a la UI font. Sin esto, Tailwind v4 cae a `ui-sans-serif/system-ui` y todo lo que no aplique font inline se ve con la fuente del sistema (drift silencioso, muy fácil de pasar por alto).

```css
.<scope> {
  font-family: var(--font-poppins), ui-sans-serif, system-ui, sans-serif;
  /* ... resto de tokens ... */
}
```

Una vez declarado, NO redeclarar `style={{ fontFamily: 'var(--font-poppins)...' }}` inline en componentes — es ruido y crea drift. Para la display font (Baloo) sí se declara explícito en wordmark y headings grandes.

---

## Color tokens

Definidos en `globals.css`. El esquema mínimo (dark mode):

```css
.<scope> {
  --background:   oklch(0.141 0.005 285.823); /* zinc-950 */
  --foreground:   oklch(0.985 0 0);            /* near white */
  --card:         oklch(0.21 0.006 285.885);  /* zinc-900 */
  --card-foreground: oklch(0.985 0 0);
  --popover:      oklch(0.21 0.006 285.885);
  --popover-foreground: oklch(0.985 0 0);
  --primary:      <PRIMARY>;                   /* color de marca */
  --primary-foreground: <PRIMARY_INK>;         /* texto sobre primary, contraste AA */
  --secondary:    oklch(0.274 0.006 286.033); /* zinc-800 */
  --secondary-foreground: oklch(0.985 0 0);
  --muted:        oklch(0.274 0.006 286.033); /* zinc-800 */
  --muted-foreground: oklch(0.705 0.015 286.067); /* zinc-400 */
  --accent:       oklch(0.274 0.006 286.033); /* zinc-800 */
  --accent-foreground: oklch(0.985 0 0);
  --destructive:  oklch(0.704 0.191 22.216);  /* red-500 */
  --border:       oklch(1 0 0 / 0.12);         /* white @ 12% */
  --input:        oklch(1 0 0 / 0.18);         /* white @ 18% */
  --ring:         <PRIMARY>;
  --sidebar:      oklch(0.141 0.005 285.823); /* same as background */
  --sidebar-border: oklch(1 0 0 / 0.08);       /* más sutil que el border común */
  --chart-1:      <PRIMARY>;                   /* primary */
  --chart-2:      <PRIMARY_LIGHT>;
  --chart-3:      <PRIMARY_DARK>;
  --chart-4:      oklch(0.45 0.008 286);      /* zinc-600 */
  --chart-5:      oklch(0.6 0.012 286);       /* zinc-500 */
}
```

### Familias de color autorizadas

| Familia          | Uso                                                           |
| ---------------- | ------------------------------------------------------------- |
| `zinc`           | Todo el layout (background, card, border, muted)              |
| `<primary>`      | Acciones, activo, icon nav activo, link `hover`, charts       |
| `emerald-500/10 + emerald-600/400` | **Delta positivo** en métricas (independiente del primary, así si la marca cambia el delta+ no se rompe) |
| `red-500/10 + red-600/400`         | Destructivo, delta negativo, egreso, error          |
| **Warning/pending** | **Decisión por SaaS**. shope-ar no usa amber. Si tu SaaS necesita un estado warning, definí ahora cuál color es y mantenelo cerrado. No empezar a hardcodear `amber-*` en componentes individuales. |

> Fuera de zinc + primary + emerald (delta+) + red (delta-) **no usar** otros colores. No `blue`, `purple`, `violet`, `pink`, `indigo`, `cyan`, `teal`, `lime`, `orange`, `fuchsia`, `rose`, `sky`.
> No mezclar familias neutras: `zinc-*` only. No `slate-*`, `stone-*`, `gray-*`, `neutral-*`.

---

## Layout

### Admin root

```tsx
<div className="<scope> dark">
  <ScopeInjector />
  <AdminLayoutShell>{children}</AdminLayoutShell>
</div>
```

`AdminLayoutShell` compone: sidebar (sticky left) + main column (topbar + contenido + bottom-nav opcional en mobile).

### Sidebar desktop

```
hidden md:flex h-screen sticky top-0 bg-sidebar border-r border-border
transition-[width] duration-200 ease-out z-40 relative
w-[60px] (colapsado) | w-[220px] (expandido)
```

Estructura interna:

- **Header logo**: `h-16 border-b border-border/60 shrink-0 flex items-center px-4 gap-3`
  - Icon box: `h-9 w-9 rounded-lg overflow-hidden` + `Image src="/icon.png"`
  - Wordmark: `text-[15px] font-bold tracking-tight` con `font-family: var(--font-display)` (Baloo 2 o equivalente)
  - Subtítulo (nombre tienda / contexto): `text-[11px] text-muted-foreground/80`
- **Nav scrolleable**: `flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6 no-scrollbar`
  - Label de grupo: `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5`
  - Items: `space-y-0.5`
- **Footer**: `border-t border-border/60 shrink-0 px-2 py-3` (link "ver tienda", "ayuda", lo que aplique)
- **Toggle collapse**: botón flotante `absolute top-7 right-0 h-6 w-6 rounded-full border bg-background`

### Nav item

```
group/item flex items-center w-full rounded-lg transition-colors duration-150 border-l-2
px-3 py-2 (expandido) | justify-center px-2 py-2.5 (colapsado)

Activo:    bg-accent text-foreground font-medium border-primary     (icon: text-primary)
Inactivo:  text-muted-foreground hover:text-foreground hover:bg-accent/60 border-transparent
```

**Badge en item**: `ml-auto text-xs bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center`. En sidebar colapsado, mostrar como dot rojo `absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500`.

### Topbar

```
sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4
```

Contenido típico:

- **Izquierda**: toggle sidebar (8×8 rounded-lg) + breadcrumbs (`text-sm`, separador `IconChevronRight h-3.5 w-3.5 text-border`, último en `text-foreground font-medium`).
- **Derecha**: `IconBell` con badge rojo circular absoluto (`-top-0.5 -right-0.5 h-4 min-w-[16px] bg-red-500 text-[10px] font-bold text-white animate-in zoom-in-50`) + link externo opcional (ver storefront/marketing) + theme toggle si hay light fallback + separator `h-6 w-px bg-border` + user dropdown con avatar (iniciales sobre `bg-muted border border-border`).

### Main content

Cada página: `<div className="flex flex-col gap-8">`. Secciones internas usan `gap-4` o `gap-6`.

No hay `max-w-6xl` centrado por default: el contenido usa el ancho completo del área disponible. Si una página puntual necesita constraint, lo aplica localmente.

### Sheets laterales operativos

Para paneles admin, usar un **sheet lateral custom** cuando una tarea secundaria debe conservar el contexto de la pantalla principal: revisar un registro, traer datos, confirmar una operación, inspeccionar señales o editar una configuración corta.

Este patrón brilla en SaaS porque mantiene la lista/dashboard visible, no obliga a navegar a otra página para una acción puntual y evita varios problemas prácticos de `Sheet`/`Dialog` genéricos cuando el layout ya tiene sidebar, topbar sticky y portales con scope de tema.

Casos buenos:

- Detalle o edición corta de una fila sin abandonar la lista.
- Wizard operacional de pocos pasos: `dry-run -> revisar -> confirmar`.
- Acciones con target explícito: corpus/año, pedido, cliente, producto, job.
- Panel de inspección técnica o auditoría.

No usar para:

- Formularios largos que necesitan pantalla completa.
- Flujos destructivos sin confirmación dedicada.
- Contenido que merece URL propia, navegación profunda o breadcrumbs.

Contrato visual/técnico:

- Renderizar con `createPortal(..., document.body)`.
- Backdrop propio `fixed inset-0`, con fade suave.
- Panel `fixed inset-y-0 right-0`, ancho estable (`w-[38rem]` o equivalente) y `max-w-[calc(100vw-1rem)]`.
- Animar solo `transform` y `opacity`: `translate-x-full -> translate-x-0`, 240-320ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Estructura interna `flex h-full flex-col`; header fijo arriba; body `min-h-0 flex-1 overflow-y-auto`.
- Cierre por backdrop, botón `X` y `Esc`.
- Bloquear scroll del `body` mientras está abierto y restaurarlo al desmontar.
- `role="dialog"`, `aria-modal="true"` y `aria-label`/título real.
- Si el estado vive en URL, abrir/cerrar con router (`router.push(closeHref)`), preservando params de contexto.
- Si el estado es transitorio mobile/history-backed, usar un hook tipo `useHistoryBackedSheet`.

Reglas de data flow:

- El target de la operación debe viajar explícito en URL o state: no depender de defaults implícitos.
- Al abrir desde filtros, pasar los filtros actuales completos (`tipo`, `ambito`, `anio`, `id`, etc.).
- Al cerrar, conservar el plano/vista/section actual salvo que el flujo pida volver a otro lugar.
- Las mutaciones siguen saliendo por server actions/API protegida; el sheet no conoce secretos.

Evitar:

- Overlay `absolute` dentro del contenido: queda como una capa rara dentro del layout y no como sheet real.
- `window.location` para cerrar o abrir.
- `md:hidden`/`hidden` sobre `SheetContent` Radix para controlar responsive: si se usa Radix, condicionar el render entero; si hay dudas, usar custom portal.
- Cards anidadas dentro del sheet. Usar secciones simples con borde/superficie.
- Defaults silenciosos cuando falta target. Mejor deshabilitar la acción o pedir seleccionar.

Referencia implementada:

- `shope-ar/src/components/storefront/mobile-overlay.tsx`: portal custom, backdrop y drawer animado.
- `shope-ar/src/hooks/use-history-backed-sheet.ts`: sheet integrado con historial del navegador.
- `itera-lex-tools/web/src/components/rio-negro-admin/rio-negro-admin-drawer-shell.tsx`: sheet admin desktop con URL params y cierre por router.

Esqueleto base:

```tsx
'use client'

export function AdminSheet({ open, closeHref, title, children }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => setVisible(true))
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function close() {
    setVisible(false)
    window.setTimeout(() => router.push(closeHref), 260)
  }

  if (!open) return null

  return createPortal(
    <>
      <button
        aria-label="Cerrar"
        className={cn('fixed inset-0 z-50 bg-black/35 transition-opacity', visible ? 'opacity-100' : 'opacity-0')}
        onClick={close}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[38rem] max-w-[calc(100vw-1rem)] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out',
          visible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="shrink-0 border-b border-border bg-surface-2 px-6 py-5">
          {/* title + close */}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </>,
    document.body,
  )
}
```

---

## Tipografía

- **Display font** (Baloo 2 o equivalente friendly/rounded): wordmark, H1/H2 grandes, headings de hero/overlay/empty-state.
- **UI font** (Poppins o equivalente geometric): default del scope, heredada por todos. Body, nav, CTA, labels, eyebrow.
- **Tabular nums**: todo número (KPIs, totales, deltas, ticket promedio) lleva `tabular-nums` para que no baile al actualizarse.

### Jerarquía de texto base

| Rol                  | Clase                                                                                         | Uso                                        |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Page title**       | `text-2xl font-semibold tracking-tight text-foreground`                                       | H1 de page ("Resumen general", "Pedidos")  |
| **Section title**    | `text-sm font-semibold text-foreground`                                                       | Header de card/tabla ("Últimas consultas") |
| **Hero metric**      | `text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums leading-none` | Número grande en KPI card                  |
| **Secondary metric** | `text-lg font-semibold text-foreground tabular-nums`                                          | Número mediano (footer stats del funnel)   |
| **KPI label**        | `text-xs font-medium uppercase tracking-wider text-muted-foreground`                          | Label arriba del hero number               |
| **Small label**      | `text-[10px] uppercase tracking-wider text-muted-foreground`                                  | Labels en grids de stats                   |
| **Nav group label**  | `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60`                | "MI NEGOCIO", "CATÁLOGO"                   |
| **Inline hint**      | `text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground`                     | "Siguiente paso", "Acceso admin"           |
| **Status tag**       | `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground`                    | Chip "Activo" junto al title               |
| **Body primario**    | `text-sm font-medium text-foreground`                                                         | Nombre de cliente, título de pedido        |
| **Body secundario**  | `text-sm text-muted-foreground`                                                               | Descripción debajo del page title          |
| **Meta**             | `text-xs text-muted-foreground`                                                               | Fecha relativa, subtexto en links          |
| **Pill / badge**     | `text-[11px] font-medium`                                                                     | Status pills, delta badges                 |

---

## Radios

| Token          | Uso                                                             |
| -------------- | --------------------------------------------------------------- |
| `rounded-full` | Pills, badges, avatars, dots de status                          |
| `rounded-lg`   | Botones chicos de topbar, items de sidebar, botones secundarios |
| `rounded-xl`   | **Card principal**, botón primario de CTA, dropdown menus       |
| `rounded-2xl`  | Auth screens, empty states, paneles grandes aislados            |
| `rounded-3xl`  | **NO USAR** (estilo legacy zinc)                                |

---

## Microinteracciones

> **Canon de motion consolidado** (route transitions, `<FadeIn>`, footguns cross-repo): `guides/guia-de-motion-y-transiciones.md`. Esta sección es la tabla de microinteracciones; el resto del sistema de motion vive allá.

Siempre `transition-*`, nunca cambios abruptos.

| Elemento            | Clase                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Botón primary       | `transition-colors hover:bg-primary/90`                                   |
| Botón secundario    | `transition-colors hover:bg-accent`                                       |
| Botón icon (8×8)    | `transition-colors duration-150 hover:bg-accent/60 hover:text-foreground` |
| Item sidebar        | `transition-colors duration-150`                                          |
| Sidebar collapse    | `transition-[width] duration-200 ease-out`                                |
| Link "Ver todos"    | `group` + arrow `group-hover:translate-x-0.5 transition-transform`        |
| Row tabla           | `hover:bg-accent/30 transition-colors`                                    |
| Card KPI            | `hover:shadow-sm transition-shadow duration-200`                          |
| Status dot "activo" | `animate-pulse rounded-full bg-foreground/40`                             |
| Notification badge  | `animate-in zoom-in-50 duration-200`                                      |

---

## Charts (Recharts + shadcn)

Los colores de chart se leen de `--chart-1..5`. El wrapper es `ChartContainer` de `@/components/ui/chart` (shadcn) con un `chartConfig` que mapea nombre → `var(--chart-N)`.

### AreaChart (trend)

- Fill: `linearGradient` vertical con `var(--color-{key})` opacidad `0.35` → `0.02`
- Stroke: `var(--color-{key})` `strokeWidth={2}`
- `type="monotone"`
- Grid: `<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />`
- Axis: `<XAxis tickLine={false} axisLine={false} tickMargin={10} interval={0} fontSize={11} className="fill-muted-foreground" />`
- Tooltip custom: card `rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-xl`

### Funnel / progress bar horizontal

```tsx
<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
  <div
    className="h-full rounded-full bg-primary transition-all duration-500"
    style={{ width: `${pct}%`, opacity: 0.4 + (pct / 100) * 0.6 }}
  />
</div>
```

El truco de opacidad (`0.4 + pct/100 * 0.6`) hace que barras más cortas se vean más tenues → drop-off visualmente claro sin cambiar el color.

---

## Scrollbar

Override global en `globals.css`:

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: oklch(0.55 0 0 / 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: oklch(0.45 0 0 / 0.5);
}
* {
  scrollbar-width: thin;
  scrollbar-color: oklch(0.55 0 0 / 0.3) transparent;
}
```

Utility `.no-scrollbar` oculta completamente (útil en el nav del sidebar).

---

## Checklist al instanciar este sistema en un SaaS nuevo

1. **Decidir las 5 variables**: scope class, primary color (oklch), display font, UI font, token prefix.
2. Cargar las 2 fonts via `next/font/google` en `app/layout.tsx`. Aplicar las CSS vars en `<body>` (`${displayFont.variable} ${uiFont.variable}`).
3. Crear el bloque CSS del scope en `globals.css` con todos los tokens de la sección "Color tokens" + la regla `font-family` con la UI font.
4. Crear `<ScopeInjector />` (Client Component) que agrega la clase del scope al `<body>` para que los Radix Portals hereden vars.
5. Aplicar `<div className="<scope> dark">` en el layout del grupo `(admin)`.
6. Implementar sidebar + topbar siguiendo "Layout" arriba.
7. Si hay light fallback, definir el bloque `<scope>` para light y `.dark <scope>` para dark. Si no, forzar `dark` siempre y un solo bloque.
8. **Nunca** usar `rounded-3xl`, ni `slate/gray/stone/neutral`, ni colores fuera de la paleta autorizada.
9. Para patrones de composición específicos (KPI cards, tablas, dialogs, dropdowns), tener un doc adicional en el repo del SaaS (ej. `docs/admin-patterns.md`) que extienda este.
10. Antes de mergear UI nueva: grep `amber-|yellow-|blue-|purple-|violet-|pink-|indigo-|slate-|gray-|stone-|neutral-` en el repo. Cero hits = limpio.

---

## Apéndice: por qué este sistema y no otro

- **Por qué dark-first**: paneles de admin se usan en sesiones largas; el dark reduce fatiga visual. Light fallback queda para usuarios que lo pidan explícito, no como default.
- **Por qué zinc y no slate**: zinc tiene chroma 0 puro (gris perfecto), slate y stone tienen chroma residual hacia azul/marrón que pelea con el primary verde/marca. En oklch se nota más que en HSL.
- **Por qué `rounded-xl` y no `rounded-2xl` por default**: 12px es el sweet spot entre "cuadrado serio" y "redondo amigable" para tablas y cards densas. `rounded-2xl` (16px) se siente caricaturesco a esa escala. Auth screens y empty states sí toleran 16px porque tienen padding amplio.
- **Por qué prohibir `rounded-3xl`**: marca legacy de admins zinc/Gemini-like. Si lo ves en código, es residuo a refactorizar.
- **Por qué herencia de fuente y no inline**: declarar `style={{ fontFamily: ... }}` en cada componente genera drift inevitable — a la primera vez que alguien copy-pastea sin leer el style, queda con system font. La herencia desde el scope CSS es a prueba de copy-paste.

---

_Este doc nace de la práctica en `shope-ar` (admin v7, dark+emerald, branding 2026-04). Última revisión: 2026-04-26 tras consolidar el bug de fuente heredada y la regla de drift cerrada de paleta._
