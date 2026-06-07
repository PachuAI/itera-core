# Inspección — patrones grep y checks semánticos

Detección sistemática de inconsistencias de color/theme. Estructura paralela al `inspection-grep.md` de `responsive-audit`.

## Orden de inspección

1. Inventario de tokens existentes en `globals.css`.
2. Inventario cuantitativo de colores hardcoded (counts por pattern).
3. Inspección dirigida (top-N archivos de cada categoría).
4. Checks semánticos (no grep — lectura humana de pares dark/light).

---

## A. Tokens declarados en globals.css

**Verificar qué roles ya existen**:

```regex
^\s*--(background|foreground|card|card-foreground|card-base|dialog|popover|popover-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|border|input|ring|primary|primary-foreground|destructive|success|warning|info|sidebar)
```

Glob: `**/globals.css`, `**/*.css`.

Hacer dos passes: uno con `:root` (light) y otro con `.dark` (dark). Verificar que cada token declarado en `:root` tenga su par en `.dark`.

**Tokens del proyecto-específicos**:

```regex
^\s*--(itera|brand|marketing-|folder-|glow-|elevation-|focus-ring|inset-)
```

Estos suelen ser custom. Documentar el rol de cada uno.

## B. Colores hardcoded en utility classes Tailwind

**Tailwind palette directos** (sin pasar por tokens):

```regex
(text|bg|border|fill|stroke|ring|shadow)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)
```

Glob: `**/*.{tsx,jsx,ts}`. Counts por archivo te dice dónde está la deuda.

**Excepción legítima**: colores de chart libraries que necesitan paleta determinada (Recharts, etc). Si surgen, documentar en el reporte.

## C. Arbitrary color values

**Hex literales**:

```regex
(text|bg|border|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]
```

**RGB/RGBA**:

```regex
(text|bg|border|fill|stroke)-\[rgba?\(
```

**HSL/HSLA en arbitrary**:

```regex
(text|bg|border|fill|stroke)-\[hsla?\(
```

**OKLCH en arbitrary**:

```regex
(text|bg|border|fill|stroke)-\[oklch\(
```

Si aparecen muchos `oklch(...)` arbitrary, sospechar que el sistema NO está exponiendo el rol y los componentes lo replican a mano.

## D. Style props inline con color

```regex
style=\{?\s*\{?\s*(color|background|backgroundColor|borderColor|fill|stroke):
```

Estos son los más críticos: rompen completamente el sistema de tokens y NO se ven con la búsqueda de utility classes.

## E. CSS-in-JS o styled-components con color

```regex
(color|background(-color)?|border(-color)?):\s*#[0-9a-fA-F]
```

Glob: `**/*.{css,scss,tsx,jsx,ts}`. Hexadecimales en cualquier archivo de estilos.

## F. Dark mode con utility variant en vez de tokens

**Antipatrón típico**:

```regex
dark:(text|bg|border)-\[?\s*[#a-zA-Z]
```

Si el código tiene `bg-white dark:bg-gray-900`, el sistema NO está usando `--background` con redefinición en `.dark`. Es un parche por componente que NO escala.

**Bien hecho**: `bg-background` y se redefine `--background` en `.dark { --background: ... }`.

Si aparecen muchos `dark:bg-...`, `dark:text-...` literales, flag como deuda crítica.

## G. Sombras hardcoded

```regex
shadow-\[
```

O en CSS-in-JS:

```regex
box-shadow:\s*\d
```

Glob: `**/*.{tsx,jsx,ts,css}`. Sombras inline son red flag — deberían venir de `--elevation-N`, `--inset-N`, `--glow-X`, `--focus-ring`.

## H. Foreground sin background especificado

**Heurística** (no grep simple): grep texto que tenga `text-X-Y` sin el `bg-X` correspondiente cerca. Ejemplo: `text-emerald-600` solo (sin saber sobre qué bg vive). Esos casos requieren chequeo manual de contraste.

```regex
\btext-(emerald|green|red|amber|yellow|blue|orange|sky|indigo|violet|purple|pink)-\d+
```

Para cada match, leer el archivo y verificar qué background hay alrededor. Si no se puede determinar, flag.

## I. Theme transition sin tokens

```regex
transition:\s*(background|color|border)
```

Si hay transitions custom sin token (ej: `--transition-theme`), el theme switch puede verse roto en algunos componentes.

## J. WCAG / accesibilidad implícita

**Buscar texto `placeholder` con clase de color**:

```regex
placeholder:text-
```

Es un punto crítico para WCAG. Placeholders muy claros son ilegibles.

**Buscar text con opacity baja**:

```regex
text-(foreground|muted-foreground|primary).*?\/(2[0-9]|3[0-9])
```

Opacity < 40% sobre texto generalmente rompe WCAG.

---

## Checks semánticos (no grep)

### S1. Pares dark/light desalineados

**Heurística**: para cada token en `:root`, debe existir el mismo nombre en `.dark` con valor distinto.

Cómo verificar:

1. Listar todos los `--token` declarados en `:root` que NO sean para roles "always-fixed" (ej: `--text-on-dark-strong` que es absoluto).
2. Listar todos los `--token` declarados en `.dark`.
3. Diff: tokens en `:root` que no están en `.dark` son **sospechosos** (el dark va a heredar el valor de light, lo cual no es lo deseado para roles de color).

Excepciones legítimas: tokens que son intencionalmente iguales (ej: `--text-on-dark-*` que es valor absoluto sobre superficies always-dark).

### S2. Inversión automática vs calibración

**Heurística**: si los valores de `--background`, `--card`, `--sidebar` en `.dark` son aproximadamente `100 - L_light`, el sistema probablemente fue inversión automática.

Cómo verificar:

1. Tomar 5 tokens de surface (`background`, `card`, `card-base`, `sidebar`, `dialog`).
2. Comparar `L_light` con `L_dark`. Si la suma es ~1.0 consistentemente (ej: light 0.96 + dark 0.04), inversión automática.
3. Una calibración correcta NO mantiene esa simetría — los deltas internos son distintos en cada modo.

Reportar como deuda crítica si se detecta inversión.

### S3. Cards "amarronadas" en dark

**Heurística** (visual): en las capturas dark, las cards que deberían "popear" se ven marrones / luminosas / lavadas.

Causa: `bg-card` usado en info cards de contenido cuando el sistema lo reserva para popovers/dropdowns (capa más alta).

Cómo verificar:

1. Comparar capturas `*__dark.png` con `*__light.png` por vista.
2. En dark, las cards de contenido informativo deberían ser layer `--card-base` (más cerca del bg) con elevation + inset highlight, NO `--card` (popover layer).
3. Si las cards quedan luminosas en dark → flag.

### S4. Muted-foreground ilegible

**Heurística**: el texto secundario (`muted-foreground`) tiene que ser legible en ambos modos.

Cómo verificar:

1. En las capturas, identificar texto que use `muted-foreground` (típicamente: fechas, metadata, descripciones secundarias).
2. Verificar visualmente que sea legible. Si parece "gris fantasma", el contraste está roto.
3. Usar tool de contrast checker (Stark, Polypane, WebAIM) sobre el par `--background` + `--muted-foreground` en cada modo. Mínimo 4.5:1.

Calibración típica:
- **Light**: `--muted-foreground: oklch(0.42-0.50 0 0)` sobre bg cálido `0.96`.
- **Dark**: `--muted-foreground: oklch(0.65-0.75 0 0)` sobre bg `0.105`.

### S5. Semantic colors mezclados con brand

**Heurística**: el `--primary` (brand) y los `--success/--warning/--destructive` deberían ser visualmente distintos.

Cómo verificar:

1. Mirar la paleta resultante: ¿`--primary` y `--warning` tienen hues cercanos (ej: ambos naranjas)?
2. Si sí, hay ambigüedad. Un botón con `--primary` puede confundirse con un warning state.
3. Resolver: cambiar hue del warning a algo más claramente amarillo, o el primary a algo menos naranja, según el peso de marca.

### S6. Sombras invisibles en dark

**Heurística** (visual): en las capturas dark, las elevations no se ven.

Causa: alpha de sombras igual entre modos. En dark se necesita 40-50%, en light 10-22%.

Cómo verificar:

1. Buscar las definiciones de `--elevation-*` en globals.css.
2. Comparar alphas entre `:root` y `.dark`.
3. Si los valores son iguales, flag.

### S7. Focus ring genérico de Tailwind

**Heurística**: el focus visible debe venir de `--focus-ring` token, no de `ring-2` de Tailwind con un color genérico.

Cómo verificar:

1. Grep `ring-2|ring-\[`.
2. Si hay muchos, sospechar que el sistema NO está usando `--focus-ring` consistente.
3. En dark mode, `ring-2` con color brand sólido al 100% se ve agresivo (borde grueso en vez de halo). Por eso se usa `--focus-ring` con 2 capas (contact 1px + diffusion 4px) y alphas calibrados.

---

## Cómo reportar findings

Mismo patrón que `responsive-audit`:

```
- `src/components/foo/bar.tsx:42` — `bg-emerald-500/15 text-emerald-600` hardcoded. Sustituir por `--success` + `--success-foreground`.
- `globals.css:158` — `--elevation-1` con mismo alpha en `:root` y `.dark`. Recalibrar.
- `src/components/layout/header.tsx:18` — `dark:bg-gray-900` en lugar de `bg-sidebar` con token redefinido.
```

**Evidencia o descarte**. Sin `archivo:línea`, el finding no entra.
