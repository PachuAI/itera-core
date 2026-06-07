# Patrones de inspección — qué buscar en el código

Patterns concretos para detectar las inconsistencias del sistema actual. Usar el tool `Grep` con `output_mode: "count"` para tener un mapa de magnitud antes de leer archivos uno por uno.

## Orden de inspección sugerido

1. Inventario cuantitativo (counts por pattern, archivo).
2. Inspección dirigida (leer archivos top-N de cada categoría).
3. Verificación visual contra screenshots.

---

## A. App shell — dimensiones rígidas

**Tokens existentes** (verificar nombres y valores actuales):

```regex
--app-header-h|--sidebar-width|--main-max-w
```

Glob: `**/globals.css`, `**/*.css`.

**Cap arbitrario del main**:

```regex
max-w-\[\d+rem\]|max-w-\[\d+px\]
```

Glob: `**/*.{tsx,jsx}`. Sospechosos: `max-w-[82rem]`, `max-w-[1200px]`, etc.

**Sidebar/header heights hardcoded**:

```regex
h-\[(?:3\.5|4|4\.5)rem\]|h-\[(?:56|64|72)px\]
```

## B. Typography ad-hoc

**Arbitrary text sizes** (el más importante):

```regex
text-\[\d+(?:\.\d+)?(?:px|rem)\]
```

Glob: `**/*.{tsx,jsx,ts}`. Sospechosos típicos: `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[12.5px]`, `text-[13px]`.

**Heading patterns**:

```regex
text-(xl|2xl|3xl|4xl|5xl)
```

Buscar cuáles componentes hacen de h1, cuáles de h2.

**Body size dispersos**:

```regex
text-(xs|sm|base|lg)\b
```

Counts ayudan a entender cuál es el "body de facto".

## C. Control heights

**Heights estándar conviviendo**:

```regex
\bh-(8|9|10|11|12)\b
```

Glob: `**/*.{tsx,jsx}`. Count por archivo te dice dónde está la mezcla.

**Min-heights y max-heights arbitrary**:

```regex
(min|max)-h-\[
```

## D. Icon sizes y stroke

**Icon size**:

```regex
\bsize-(3|3\.5|4|5|6)\b
```

**Stroke width inconsistente**:

```regex
strokeWidth=\{(?:1\.5|1\.7|1\.8|2|2\.2|2\.5)
```

Mismatch típico: misma marca con 3 stroke widths en distintos componentes.

## E. Spacing arbitrary

**Padding y margin arbitrary**:

```regex
(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-\[
```

**Gap arbitrary**:

```regex
gap-\[|space-(x|y)-\[
```

**Section spacing dispersos** (no arbitrary, mezcla de valores):

```regex
space-y-(3|4|5|6|7|8)\b
```

Counts ayudan a ver qué número predomina.

## F. Grids que topean

**Cards grids**:

```regex
grid-cols-(\d+)|(?:sm|md|lg|xl|2xl|3xl|4xl):grid-cols-\d
```

Counts por archivo. Top page files (`(tools)/*/page.tsx`, etc.) son los críticos.

## G. Container queries (deberían ser cero al arrancar)

```regex
container-type|@container
```

Si aparecen, ver si están bien aplicadas o son leftover de un experimento.

## H. Tailwind config

**Breakpoints custom existentes**:

```regex
--breakpoint-(3xl|4xl|5xl)
```

Glob: `**/globals.css`, `**/tailwind.config.*`.

Si no existen, agregar es Fase 1.

## I. Anti-patterns para flaggear

**`vw` puro fuera de clamp**:

```regex
w-\[\d+vw\]|h-\[\d+vh\]
```

Excepción: alto sticky del sidebar. Cualquier otro uso es candidato a refactor.

**Font-size override en `html`** (zoom global):

```regex
html\s*\{[^}]*font-size:
```

Si existe, advertir: puede romper `px` arbitrary del resto y `oklch`.

**Tokens duplicados o paralelos**:

```regex
--(?:font|text)-(?:size|sm|md|lg|xl)
```

Si hay tokens locales que paralelizan a Tailwind, ver si conviene unificar.

## J. Mismatch entre features hermanas

Buscar componentes con nombres similares en distintos features (`search-bar`, `rio-negro-search-panel`, etc.) y comparar:
- Heights del input + botón.
- Variant del input usado.
- Spacing entre input y botón.

Heurística: si dos componentes hacen "buscar en X" pero con dimensiones distintas, hay deuda visual.

---

## Cómo reportar findings al usuario

Por cada inconsistencia detectada, registrar en el reporte con formato:

```
- `src/components/foo/bar.tsx:42` — `h-11` en SearchBar SAIJ.
- `src/components/baz/qux.tsx:77` — `h-9` en SearchPanel RN (mismo dominio, alto distinto).
```

**Evidencia o descarte**. Si no podés apuntar a `archivo:línea`, el finding no entra al reporte.

---

## Checks semánticos (no grep simple)

Algunos diagnósticos no resuelven con un solo pattern: requieren leer padre + hijos y aplicar criterio. Estos van DESPUÉS del inventario grep cuantitativo.

### S1. Proximity (espacio interno < espacio externo)

**Heurística**: dentro de un componente con `space-y-X` en el padre, los hijos no deberían tener `gap-Y` con `Y >= X`. Si pasa, el usuario pierde la pista de "qué pertenece junto".

Cómo verificar:

1. Listar componentes con `space-y-{3,4,5,6}` (Grep).
2. Para los top 5 más densos, leer el archivo y comparar los `gap-X` interno contra el `space-y-X` del padre.
3. Flag si `gap >= space-y` consistentemente.

Ejemplo de finding:

```
- `src/components/foo/bar.tsx:42` — Card con padre `space-y-3` (12px) contiene fila `gap-4` (16px). Espacio interno > externo: proximidad rota.
```

### S2. Flex vs Grid según comportamiento

**Heurística** (video 07):

- **Flex** apropiado: barras de toolbar, filas que negocian espacio, agrupaciones con anchos distintos, alineaciones de un set de controles.
- **Grid** apropiado: cards comparables, columnas repetidas, tablas visuales, áreas con span definido.

Sospechosos:

- `flex flex-wrap` con `gap-X` y children de ancho similar (probablemente debería ser grid).
- `grid grid-cols-N` con un solo hijo (probablemente debería ser flex).
- `flex justify-between` con 3+ hijos asimétricos (revisar si grid con `[auto_1fr_auto]` no es más claro).

Cómo verificar:

1. Grep `flex flex-wrap` + leer cada ocurrencia.
2. Flag los que parecen "grid disfrazada de flex".

NO migrar como parte del audit; sólo señalar como deuda visual en categoría F del reporte.

### S3. Breakpoints sin condición nombrada

**Heurística**: cada media query custom debe estar precedida por un comentario que nombre la condición observable que resuelve. "tablet" / "desktop" no cuentan.

Cómo verificar:

1. Grep `@media \(min-width: 1[0-9]{3}px\)` o `@media \(min-width: \d+rem\)`.
2. Para cada ocurrencia, leer las 3 líneas anteriores: si no hay comentario que describa la condición, flag.

Ejemplo de finding:

```
- `globals.css:240` — `@media (min-width: 1920px)` sin comentario de condición. Riesgo: media query no explicable.
```

### S4. Árbol parent-child de secciones críticas

**Heurística**: antes de proponer cualquier token nuevo, documentar el árbol de las secciones críticas. Este check no es de grep — es de **lectura estructurada**.

Para cada vista capturada en el baseline:

1. Identificar el shell (header + sidebar + main + footer).
2. Para cada sección dentro del main, listar:
   - **Parent**: tipo de container + display (`<main>` flex / `<section>` grid / `<div>` block).
   - **Children**: hijos inmediatos con su rol funcional.
   - **Relación con el viewport**: el parent tiene `max-w`/`min-w` definido? los children negocian o están fijos?

Ejemplo de árbol (de itera-lex-tools `/jurisprudencia/saij`):

```
<ToolsMain> (max-w-[82rem], px+py)
├── <Breadcrumb> + <SourceStatusPill> (grid auto+auto)
├── <SearchHero compact> (PageHeader: h1 + lede)
├── <SearchTabsBar> (flex border-b)
└── <SearchPanel> (space-y-5)
    ├── <SearchBar> (grid [1fr_auto], h-11)
    ├── <details Filtros> (grid 3-col en md+)
    └── <OrderToggle> + <ActiveFilterChips> (flex wrap border-b)
```

Esto va al reporte en la sección 1 (Diagnóstico).

### S5. Mismatch entre features hermanas

**Heurística**: si dos features hacen variantes de la misma tarea (buscar en X / buscar en Y) pero con dimensiones distintas, hay deuda visual.

Cómo verificar:

1. Listar pares obvios: SAIJ vs Río Negro, dashboard vs settings, etc.
2. Para cada par, comparar:
   - Altura del input
   - Altura del botón "Buscar"
   - Variant del input
   - Spacing del bloque

Flag los mismatches significativos.
