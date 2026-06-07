# Sistema de tokens responsive — referencia canónica

Sistema de tokens desktop-first validado contra ÍTERA Lex Tools (Next.js 16 + Tailwind v4 + shadcn). Soporta 1366 → 3840 sin colapsar abajo ni dejar vacío arriba.

## Tabla de contenidos

1. Principios de diseño
2. Los 6 protagonistas con `clamp()`
3. Tokens estáticos (sin clamp)
4. Control heights
5. Breakpoints custom Tailwind
6. Mapeo `@theme inline`
7. Reglas de aplicación por eje
8. Grids por tipo de ruta
9. Container queries opt-in

---

## 1. Principios

1. **`rem` por defecto** para tipografía y la mayoría del spacing. Raíz queda en 16px estándar.
2. **`clamp(min, preferred-vw, max)` SÓLO en los 6 protagonistas**. No expandir.
3. **Breakpoints discretos para grids y layout estructural**. Columnas y wrap se controlan con `lg`/`xl`/`2xl`/`3xl`/`4xl`, no con clamp.
4. **Container queries opt-in** para piezas que cambian según su contenedor (no según viewport).
5. **NO escalar todo con `vw`**. `vh`/`dvh` sólo donde tiene sentido.
6. **`min` de cada `clamp` = valor actual** o muy cercano. Esto garantiza cero regresión visible en el target dulce (1440/1920).

## 2. Los 6 protagonistas con `clamp()`

Estos son los UNICOS lugares donde se usa `clamp(min, vw, max)`. Cualquier expansión debe justificarse y discutirse con el usuario antes de meterla al token-system.

```css
:root {
  /* App shell escalable */
  --app-header-h:  clamp(3.25rem, 0.5rem + 1.8vw, 4.5rem);   /* 52 → 72px */
  --sidebar-width: clamp(15rem,  12rem  + 4vw,   18rem);     /* 240 → 288px */
  --main-max-w:    clamp(60rem,  50rem  + 50vw,  110rem);    /* 960 → 1760px */
  --main-pad-x:    clamp(1rem,   0.5rem + 0.8vw, 2rem);
  --main-pad-y:    clamp(1rem,   0.4rem + 0.8vw, 2rem);

  /* Typography fluida (sólo h1 y body, el resto estático) */
  --text-display:  clamp(1.5rem,   1.1rem  + 0.9vw,  2.25rem);   /* h1: 24 → 36 */
  --text-body:     clamp(0.875rem, 0.78rem + 0.18vw, 1.0625rem); /* 14 → 17 */
}
```

Notas:
- `--text-display` y `--text-body` cuentan como UN protagonista cada uno → 7 totales, pero typography son hermanos. El espíritu de "6 protagonistas" es: 4 del shell (header, sidebar, max-w, padding) + 2 tipográficos (h1, body).
- `--text-h2` también es fluido pero su rango es chico — opcional ponerlo fluido o estático según preferencia del proyecto. Default fluido leve.

## 3. Tokens estáticos (sin clamp)

```css
:root {
  --text-h2:      clamp(1.125rem, 0.95rem + 0.4vw, 1.5rem); /* opcional fluido */
  --text-mono-xs: 0.6875rem;  /* 11px — eyebrows, labels mono uppercase tracking-wider */
  --text-meta:    0.75rem;    /* 12px — fecha, tribunal, metadata */
  --text-label:   0.8125rem;  /* 13px — sidebar items, labels de inputs */

  --space-section:  clamp(1.25rem, 0.9rem + 0.6vw, 2rem);
  --space-grid-gap: clamp(0.875rem, 0.65rem + 0.4vw, 1.5rem);
}
```

## 4. Control heights — 3 niveles canónicos

```css
:root {
  --control-h-sm: 2rem;     /* 32px — secondary inputs, tabs strip si va denso */
  --control-h-md: 2.25rem;  /* 36px — DEFAULT para inputs, buttons, tabs, segments */
  --control-h-lg: 2.75rem;  /* 44px — SearchBar hero, CTA principal */
}
```

**Reglas**:
- `md` es el default. Si un componente está en h-9/h-10/h-11 sin justificación, baja a `md`.
- `lg` se reserva para el hero search principal y CTAs primarios. Máximo 2 por vista.
- `sm` sólo si el contexto es densidad alta y el usuario lo pide explícito. Default: no usar.

## 5. Breakpoints custom Tailwind

Tailwind v4 incluye `sm:640 md:768 lg:1024 xl:1280 2xl:1536`. Falta cobertura para 2K y 4K:

```css
@theme inline {
  --breakpoint-3xl: 1920px;
  --breakpoint-4xl: 2560px;
}
```

Esto habilita `3xl:grid-cols-4 4xl:grid-cols-5` sin tocar tokens. NO agregar un 5xl para 3840 — el `--main-max-w` se encarga.

## 6. Mapeo `@theme inline`

```css
@theme inline {
  --spacing-app-header: var(--app-header-h);
  --spacing-sidebar:    var(--sidebar-width);
  --spacing-main-max:   var(--main-max-w);

  --font-size-display:  var(--text-display);
  --font-size-h2:       var(--text-h2);
  --font-size-body:     var(--text-body);
  --font-size-label:    var(--text-label);
  --font-size-meta:     var(--text-meta);
  --font-size-mono-xs:  var(--text-mono-xs);

  --spacing-control-sm: var(--control-h-sm);
  --spacing-control-md: var(--control-h-md);
  --spacing-control-lg: var(--control-h-lg);

  --breakpoint-3xl: 1920px;
  --breakpoint-4xl: 2560px;
}
```

Uso en componentes:
- `h-control-md` reemplaza `h-9` en la inmensa mayoría de casos.
- `h-control-lg` para SearchBar hero / Buscar principal.
- `text-body` reemplaza `text-sm` body-level.
- `text-display` reemplaza `text-xl sm:text-2xl` en page headers.
- `text-mono-xs` reemplaza `text-[10px]` / `text-[11px]` / `text-[12.5px]` arbitrary en eyebrows / labels mono.
- `max-w-main-max` reemplaza `max-w-[82rem]` o similares.
- `px-main-pad-x py-main-pad-y` reemplaza paddings ad-hoc del `<main>`.

## 7. Reglas de aplicación por eje

| Eje | Regla |
|---|---|
| Typography | `rem` siempre. `clamp()` SÓLO en `--text-display` y `--text-body` (`--text-h2` opcional). El resto (labels, meta, mono-xs) estático. |
| Control heights | `rem` fijo (32/36/44). NO usar clamp. Ergonomía de click no debe variar con viewport. |
| Spacing | `rem` para gaps internos a componentes. `clamp()` para `--space-section` y `--space-grid-gap` que son padding/gap a nivel layout. |
| App shell | `clamp()` en `--app-header-h` y `--sidebar-width` con mín = valor actual y máx con margen para 4K. |
| `vh`/`dvh` | SÓLO en alto del sidebar sticky y rail derecho sticky. `dvh` preferido para mobile Safari, `vh` aceptable en proyectos desktop-first. |
| `vw` puro | CERO usos fuera de los `clamp()` ya definidos. Nada de `w-[50vw]`. |
| `px` arbitrary | Permitido sólo en valores < 8px (ej: `mb-px`, `gap-1.5`) o en casos justificados (anchos de elementos específicos como pickers). Ningún `text-[Npx]` arbitrary. |
| Container queries | Opt-in, no default. Ver §9. |

## 8. Grids por tipo de ruta

Adaptar según el contenido. Pauta:

| Tipo de vista | Grid recomendada |
|---|---|
| Home / hub con 3 cards | `sm:grid-cols-2 lg:grid-cols-3 4xl:grid-cols-4` |
| Hub con 4 sub-corpus | `sm:grid-cols-2 lg:grid-cols-4` (más temprano que `xl`) |
| Dashboard de valores (4-8 items) | `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 4xl:grid-cols-5` |
| Listado de resultados | columna única, no grid. Si quisiera grid de cards, `lg:grid-cols-2 3xl:grid-cols-3`. |

**No usar `auto-fit`/`minmax(Xrem, 1fr)`** para grids semánticas con N cards conocidas. Reservar `auto-fit` para listados verdaderamente abiertos (catálogos de >50 items con cards equivalentes).

## 9. Container queries opt-in

Habilitar solo en 2 lugares concretos:

```css
.app-content {
  container-type: inline-size;
  container-name: content;
}

.tabs-strip {
  container-type: inline-size;
  container-name: tabs;
}
```

Uso típico:
- `@container content (max-width: 60rem) { .result-card { /* layout compacto */ } }` — densifica result cards cuando la columna principal se encoge por aparición del rail.
- `@container tabs (max-width: 40rem) { /* labels truncados */ }`.

**Cuándo NO usar container queries**:
- Para layouts globales del viewport — eso es media query.
- En descendientes con `position: sticky` (en algunos navegadores rompe).
- "Por las dudas" — agrega complejidad de render. Opt-in donde la decisión depende REAL del padre.

## 10. Tokens del SaaS canónico (si aplica)

Si el repo target convive con un SSOT externo (ej: `itera-lex-tools` ⟵ `itera-lex`), respetar:
- Estos tokens responsive deben subir primero al SSOT (`itera-lex/docs/brand.md` + `globals.css` del SSOT) y luego clonarse al repo target.
- Mantener nombres canónicos. No renombrar `--text-display` a `--font-display` por preferencia local.
- Si el SSOT tiene tokens incompatibles, abrir discusión antes de divergir.

Documentar la coexistencia en el anexo del reporte final.

---

## 11. Spacing scale discreta — la base del sistema

El `clamp()` de `--space-section` y `--space-grid-gap` resuelve spacing a nivel layout. **Falta una escala discreta para padding interno y gaps internos a componentes**. Tomada del video 02 (Whosajid), validada como mínimo viable:

```css
:root {
  --space-close: 0.5rem;  /* 8px — pares cercanos: icono+texto, label+input */
  --space-group: 1rem;    /* 16px — padding interno de cards, gap entre controles de un grupo */
  --space-break: 1.5rem;  /* 24px — separación entre secciones de un mismo bloque */
  --space-area:  2rem;    /* 32px — corte mayor entre áreas distintas */
}
```

**Regla de oro de proximidad (espacio interno < espacio externo)**:

El gap dentro de una unidad **debe ser menor** que el padding que la contiene. Si dentro de un card el `gap-3` interno iguala o supera el `space-y-3` del padre, el usuario pierde la pista de "qué pertenece junto". Esta regla aplica a icono+texto, label+input, card+contenido, sección+sección.

**Peso óptico en text buttons** (video 02):

El texto ocupa más ruido horizontal que vertical. Botones con sólo texto piden **padding-horizontal ~2× padding-vertical**. Para los control heights canónicos:

| Control | Altura | Padding horizontal típico | Padding vertical implícito |
|---|---|---|---|
| `h-control-sm` (32px) | 2rem | `px-2.5` (10px) | ~6-7px |
| `h-control-md` (36px) | 2.25rem | `px-3` (12px) | ~7-8px |
| `h-control-lg` (44px) | 2.75rem | `px-4` o `px-5` (16-20px) | ~10-12px |

Si un botón se ve "cuadrado" o "apretado horizontalmente", es señal de que rompió este ratio.

**Empezar amplio y reducir**:

En interfaces densas, partir desde el valor más grande del rango razonable y bajar si hace falta. Es más fácil detectar exceso que acostumbrarse a una UI tensa. No es un token, es metodología: cuando dudes entre `--space-group` (1rem) y `--space-break` (1.5rem), probá primero el más grande.

**Border radius derivado del spacing**:

Los mismos valores generan radios opticamente balanceados. Si el padding interno típico es 1rem, el radius cómodo suele ser `0.5rem` (= padding / 2). Esto NO se codifica como token nuevo: es una pauta de calibración cuando se introduce un nuevo componente.

---

## 12. Line-height tokens — el spacing tipográfico

El video 11 (Whosajid) insiste: el line-height no es propiedad cosmética. Es **spacing vertical implícito del texto**, parte del sistema de respiración del layout.

```css
:root {
  --leading-tight:  1.15;  /* Headings grandes — display, h1, h2 */
  --leading-snug:   1.35;  /* UI densa — botones, tabs, labels, single-line items */
  --leading-normal: 1.55;  /* Body — párrafos, descripciones, listas readables */
  --leading-loose:  1.75;  /* Prosa larga — blog, docs (cuando aplique) */
}
```

Mapeo Tailwind:

```css
@theme inline {
  --line-height-tight:  var(--leading-tight);
  --line-height-snug:   var(--leading-snug);
  --line-height-normal: var(--leading-normal);
  --line-height-loose:  var(--leading-loose);
}
```

**Regla de aplicación**:

- `--text-display` (h1) → `--leading-tight`. Cuanto más grande el texto, más apretado el leading.
- `--text-h2` → `--leading-snug` o `--leading-tight` según contexto.
- `--text-body` → `--leading-normal`.
- `--text-meta`, `--text-label`, `--text-mono-xs` → `--leading-snug` (single-line típico).

**Por qué importa para responsive**: cuando `--text-body` escala con `clamp()` de 14 → 17px, el line-height ratio (1.55) escala con él. La distancia perceptual entre líneas crece proporcionalmente. NO usar line-heights en `px` (ej: `leading-[24px]`) porque rompen ese escalado.

---

## 13. Icon sizes y stroke widths — sistema de íconos

Los íconos son parte del sistema dimensional. Mezclar `size-3`, `size-3.5`, `size-4`, `size-5` con strokes `1.5`, `1.7`, `2.2` produce ruido visual sin función.

**Tamaños canónicos** (atados a control heights):

```css
:root {
  --icon-xs: 0.75rem;  /* 12px — inline en chips, tabs cerrar */
  --icon-sm: 0.875rem; /* 14px — botones secondary, hint inline */
  --icon-md: 1rem;     /* 16px — default; dentro de h-control-md */
  --icon-lg: 1.25rem;  /* 20px — íconos representativos en card titles */
}
```

Tailwind tiene `size-3` (12), `size-3.5` (14), `size-4` (16), `size-5` (20). El sistema propuesto **usa los Tailwind nativos**, NO redefine. La regla es: **elegir uno de los 4 y justificar por contexto**.

**Stroke widths canónicos** (Lucide / Heroicons / Tabler):

| Stroke | Cuándo usar |
|---|---|
| `1.5` | Default para íconos representativos (ToolCard icons, hero icons, large UI). Estética ÍTERA. |
| `1.75` | Default para íconos pequeños inline (h-control-md y abajo). Compromiso entre legibilidad y peso visual. |
| `2` | Sólo si el ícono es CTA principal (ej: lupa en botón "Buscar" gradient). |

**Regla**: máximo 2 stroke widths conviviendo en una vista. Si surgen 3+, declarar deuda visual en el reporte.

**Espacio icono-texto** (aplicación de §11):

El gap interno de un par icono+texto debe ser menor que el padding horizontal del control:

| Control | Gap icono+texto | Padding horizontal |
|---|---|---|
| `h-control-sm` | `gap-1.5` (6px) | `px-2.5` (10px) |
| `h-control-md` | `gap-2` (8px) | `px-3` (12px) |
| `h-control-lg` | `gap-2` o `gap-2.5` (8-10px) | `px-4` o `px-5` (16-20px) |

Esto preserva la regla de proximidad: el ícono se siente "parte del texto", no un elemento separado.
