# Estructura del reporte — plantilla canónica

Las 7 secciones que todo reporte de `responsive-audit` debe tener, en este orden. Cada sección con guías de qué incluir y qué evitar.

Path destino: `<repo>/.planning/RESPONSIVE-AUDIT.md` (o suffix `-vN.md` si ya existe).

---

## Encabezado mínimo

```markdown
# Auditoría responsive — <Nombre del proyecto>

**Fecha**: <YYYY-MM-DD>
**Scope**: sistema CSS / tokens / layout responsive del frontend
**Stack**: <Next.js X, React Y, Tailwind vZ, shadcn/ui ...>
**Calibración actual**: <ej: ~1440x900 y ~1920x1080>
**Objetivo**: que el portal trabaje cómodo en 1366×768, 1440×900, 1536×864, 1920×1080, 2560×1440 y 3840×2160 sin colapso ni espacio muerto.

**Capturas baseline**: `<path al OUT_DIR>` — N PNG, ~M MB — 5 resoluciones × K rutas, capturadas con Playwright contra `localhost:<puerto>`.

**Estado**: no se modificó código. Este documento es el plan previo a tocar.
```

---

## 1. Diagnóstico general

Una o dos oraciones para el diagnóstico de fondo + tabla por resolución.

```markdown
## 1. Diagnóstico general

El portal tiene **tokens visuales sólidos** (... lo que ya está bien) pero **el sistema de dimensiones es estático**: ... (causa raíz en una oración).

| Resolución | Comportamiento observado |
|---|---|
| 1366×768 | <qué se ve concretamente> |
| 1440×900 y 1536×864 | "Punto dulce" — todo respira. |
| 1920×1080 | <qué se ve> |
| 2560×1440 | <qué se ve> |
| 3840×2160 | <qué se ve, en términos absolutos: "X% del viewport vacío"> |

**Causa raíz**: hay 4 ejes que se mezclan y no comparten escala:

1. Tokens de shell rígidos.
2. Tipografía ad-hoc.
3. Control heights conviviendo (N alturas distintas).
4. Grids sin breakpoints superiores.
```

### 1.1 Árbol parent-child de secciones críticas

Antes de la tabla de findings, documentar la estructura de las vistas relevantes. Sin árbol, las propuestas de tokens quedan sin anclaje estructural. Tomado del video 07 (Whosajid): "responsive es mover cajas entre filas y columnas sin que el contenido pierda jerarquía".

```markdown
### 1.1 Árbol parent-child de secciones críticas

Para cada vista clave, el árbol del DOM relevante:

**`/` Home (`(tools)/page.tsx`)**:
```
<ToolsMain> (max-w-[82rem], px+py)
├── <PageHeader> (eyebrow + h1 + lede)
└── <section> (mt-7 grid sm:cols-2 lg:cols-3 gap-4)
    ├── <ToolCard "Jurisprudencia">
    ├── <ToolCard "Valores">
    └── <ToolCard "Próximamente" state="soon">
```

**`/jurisprudencia/saij?q=alimentos`** (`(tools)/jurisprudencia/saij/page.tsx`):
```
<ToolsMain>
├── <Breadcrumb + SourceStatusPill> (grid auto+auto)
├── <SearchHero compact>
├── <SearchTabsBar> (border-b, h-9 tabs)
└── <SearchPanel> (space-y-5)
    ├── <SearchBar> (grid [1fr_auto], h-11 input + h-11 botón)
    ├── <details Filtros> (md:grid-cols-3 cuando abierto)
    └── <OrderToggle + ActiveFilterChips> (flex wrap)
```

Y así para las vistas restantes capturadas.
```

Esto sirve para:
- Anclar las propuestas dimensionales a estructura observable.
- Detectar mismatches (ej: dos `<SearchBar>` con alturas distintas → deuda visual).
- Mostrar al lector del reporte qué está bajo análisis sin que tenga que abrir el código.

Evitar: análisis sin datos concretos, "se ve raro", adjetivos sin medición.

---

## 2. Problemas concretos (archivo:línea)

Findings agrupados por categorías A–J (las que apliquen). Cada finding lleva `archivo:línea`.

```markdown
## 2. Problemas concretos (archivo:línea)

### A. App shell — dimensiones rígidas

- `src/app/globals.css:108-109` — `--app-header-h: 3.5rem` y `--sidebar-width: 248px` fijos.
- `src/components/layout/tools-main.tsx:13-14` — `max-w-[82rem]` cap único.
- ...

### B. Tipografía — escala ad-hoc

- `src/components/shared/page-header.tsx:15-18` — h1: `text-xl sm:text-2xl`.
- `src/components/...` — `text-[12.5px]` arbitrary.
- ...

### C. Control heights — N alturas conviviendo

| Componente | Altura | Archivo |
|---|---|---|
| SAIJ SearchBar | `h-11` | `search/search-bar.tsx:71` |
| RN SearchPanel | `h-9` | `rio-negro/rio-negro-search-panel.tsx:77` |
| Filtros SAIJ | `h-10` | múltiples archivos |
| ... | ... | ... |

### D. Icon sizes — sin escala
### E. Spacing vertical — plano
### F. Cards y grids — no escalan en ≥ 2xl
### G+. <Patrones específicos del repo>
```

Evitar: findings sin `archivo:línea`, findings de cosas que NO son responsive (color, copy, semántica HTML, accesibilidad sólo afín a contraste, etc.).

---

## 3. Tabla resumen de inconsistencias

Tabla compacta para que el usuario tenga el panorama de un vistazo.

```markdown
## 3. Tabla resumen de inconsistencias

| Eje | Estado actual | Magnitud | Impacto en responsive |
|---|---|---|---|
| Font size body | `text-sm` (14px) rígido | 1 size | Microscópico en 4K |
| Heading h1 | `text-xl sm:text-2xl` | 2 sizes (sin 2xl/3xl) | Apenas escala en 4K |
| Control heights | h-8 / h-9 / h-10 / h-11 conviviendo | N alturas | Visual disonante |
| App header height | `3.5rem` fijo | 1 valor | Muy fino en 2K/4K |
| Sidebar width | `248px` fijo | 1 valor | X% del 4K viewport |
| Main max-width | `max-w-[82rem]` plano | 1 cap | Aire muerto severo en 2K/4K |
| Grid de cards | `lg:grid-cols-3` topea | sin 2xl/3xl | 4K queda en 3 cols centradas |
| Spacing vertical | mezcla `space-y-4/5` | N valores | Sin criterio |
| Container queries | no usadas | 0 | Cero adaptación intrínseca |
```

---

## 4. Sistema de tokens responsive recomendado

Copiar/adaptar de `references/token-system.md`. Cuatro sub-secciones:

```markdown
## 4. Sistema de tokens responsive recomendado

### 4.1 Principios

1. `rem` por defecto.
2. `clamp()` SÓLO en los 6 protagonistas.
3. Breakpoints discretos para grids.
4. Container queries opt-in.
5. NO escalar todo con `vw`.

### 4.2 Tokens nuevos a agregar a `globals.css`

<copiar del token-system.md>

### 4.3 Mapeo a Tailwind v4 `@theme`

<copiar del token-system.md>

### 4.4 Reglas de aplicación por eje

<tabla del token-system.md §7>

### 4.5 Grids — ajuste por ruta

| Ruta | Actual | Propuesto |
|---|---|---|
| ... | ... | ... |
```

---

## 5. Qué NO conviene hacer

Lista de 10 anti-patrones, copiados o adaptados de `references/anti-patterns.md`. Mantener el por qué corto pero explícito en cada uno.

```markdown
## 5. Qué NO conviene hacer

1. **No escalar TODO con `vw`/`clamp()`**. <razón en una oración>
2. **No usar zoom global** (`html { font-size: clamp(...) }`). <razón>
3. **No mover `--sidebar-width` a `vw` puro**. <razón>
4. **No agregar container queries por defecto**. <razón>
5. **No introducir density mode ahora**. <razón>
6. **No cambiar paleta ni tokens semánticos existentes**. <razón>
7. **No tocar `next-themes`, `oklch` ni theme transition**.
8. **No subir el `max-w` del main sin escalar grids**.
9. **No reemplazar `text-sm` global por una sola constante**.
10. **No deprecar `text-[10px]`/`text-[11px]` con find/replace ciego**.
```

---

## 6. Plan de implementación por fases (bajo riesgo)

Cada fase es independiente, testeable y revertible. Cada fase termina con `pnpm typecheck && pnpm lint && pnpm build && pnpm test:smoke` (o equivalente del stack) como gate.

```markdown
## 6. Plan de implementación por fases

### Fase 0 — Snapshot pre-cambios (≤ 1h)
- Correr el script de captura guardando en `<repo>/.planning/visual-baseline/<fecha-o-commit>/<res>__<route>.png`.
- Output: N imágenes baseline para diff visual contra cada fase.

### Fase 1 — Tokens base, sin tocar componentes (≤ 2h)
- Agregar los 13 tokens nuevos a `globals.css`.
- Convertir `--app-header-h`, `--sidebar-width`, `--main-max-w` a `clamp()`.
- Exponer en `@theme inline`.
- Agregar breakpoints `3xl: 1920px`, `4xl: 2560px`.
- NO tocar componentes.
- Verificación: snapshot diff vs Fase 0 a 1440/1920 ≈ idéntico.

### Fase 2 — Migrar shell + grids (≤ 3h)
- `tools-main.tsx`: `max-w-[82rem]` → `max-w-main-max`, padding → `px-main-pad-x py-main-pad-y`.
- Pages: añadir `2xl`/`3xl`/`4xl` faltantes según §4.5.
- `ToolCard.min-h-[180px]` → fluido.
- Verificación: en 2560/3840 ya no hay espacio muerto.

### Fase 3 — Unificar control heights (≤ 3h)
- `h-control-md` baseline, `h-control-lg` sólo en SearchBar hero.
- `ui/input.tsx`, `ui/button.tsx` alineados.
- Componentes feature alineados.
- Verificación: alturas consistentes; en 1440 la fila del buscador tiene una sola línea de techo.

### Fase 4 — Tipografía fluida en protagonistas (≤ 2h)
- `PageHeader` h1 → `text-display`.
- `text-sm` body-level → `text-body` (caso por caso).
- `text-[Npx]` arbitrary → `text-mono-xs` / `text-meta` / `text-label`.
- Verificación: en 4K headings y body cómodos; en 1366 sin cambio percibido.

### Fase 5 — Spacing escalable + cleanup (≤ 2h)
- `space-y-{4,5}` → `space-section`.
- `gap-4` de grids → `gap-grid-gap`.
- Cleanup arbitrary values restantes.
- Verificación: build + lint + smoke + snapshot diff.

### Fase 6 (opcional)
- Container queries en `app-content` para densificar result cards con rail.
- Density toggle si el usuario lo pide después.

**Riesgo total**: bajo. Fases 1-2 no tocan componentes, Fase 3 puede regresionar visualmente en el strip de búsqueda (mitigado por snapshot diff), Fase 4 cambios mínimos en breakpoints intermedios.
```

---

## 7. Checks visuales sugeridos por resolución

Para cada resolución, qué validar después de cada fase.

```markdown
## 7. Checks visuales por resolución

### 1366×768 (laptop chica)
- <listas concretas, ej: "3 cards entran en una fila sin scroll horizontal">
- <ej: "espacio inferior del shell no se siente vacío">

### 1440×900 (target dulce)
- Punto de referencia. Cualquier regresión visible aquí es bloqueante.
- `clamp` en valores `min` o muy cerca.
- `text-body` en 14-15px.

### 1920×1080 (desktop estándar)
- `--main-max-w` empieza a expandir suavemente.
- Body `~15-15.5px`, headings `~1.6rem`.

### 2560×1440 (2K)
- Sin bloque visible de vacío muerto.
- Sidebar ~10% del viewport.
- Body ~16-17px.

### 3840×2160 (4K)
- Main usa ~85-90% del ancho.
- Cards: 3-4 columnas según breakpoints.
- Body legible a distancia normal.
- Test ergonómico: cursor del SO al lado de un botón "Buscar" — debe sentirse del mismo orden.

### Validaciones cross-resolución
- Diff visual Fase 0 vs Fase N en 1440 ≈ 0 píxeles relevantes.
- Diff en 1366: contenido no se vuelve más grande.
- Diff en 4K: aprovechamiento ≥ 80% del viewport.

### Validaciones por contenido (no por viewport)

Estos checks no son sobre resolución sino sobre **datos extremos**. Tomado del video 11 (Whosajid): la jerarquía visual no sirve si ignora datos reales.

- **Título largo**: probar una vista con un título de 200+ caracteres (ej: un fallo SAIJ con nombre completo). El layout no debe colapsar.
- **Número grande**: dashboards con números de 9-10 dígitos. Las cards no se cortan.
- **Lista densa**: 50+ resultados consecutivos. El `space-y` elegido no se siente excesivo ni apretado.
- **Label más largo del sidebar**: el item con el texto más largo (ej: "Fallos jurisdiccionales", "Sumarios jurisdiccionales") cabe sin truncar en `--sidebar-width` mínimo.
- **Empty states**: las vistas que pueden quedar sin resultados (búsqueda sin matches, lista vacía) tienen mensaje claro y no dejan grandes vacíos.

### Validación de theme

- Repetir las capturas en `dark` además de `light`. La inversión visual no debe romper jerarquía ni introducir cards "amarronadas" o "lavadas".
- Si el repo tiene `--theme-transition`, validar que no rompa con `prefers-reduced-motion`.
```

---

## Anexo opcional — Coexistencia con SSOT externo

Si el repo target clona tokens de otro repo (caso ITERA: `itera-lex-tools` ⟵ `itera-lex`), agregar al final:

```markdown
## Anexo — Coexistencia con el SaaS <Nombre>

Este portal clona 1:1 los tokens del SaaS principal (`<path al SSOT>`) según la regla del `CLAUDE.md`: **reglas y tokens nuevos suben primero al SSOT** y después se clonan acá.

Implicancia: los tokens propuestos en §4 **no son específicos** del repo target. El SaaS tiene los mismos ejes potenciales. Antes de la Fase 1, definir:

- Si la auditoría debe replicarse en el SaaS (alcance mayor: vistas extra).
- Si conviene partir Fase 1 (tokens al SSOT) → propagar al repo target → aplicar componentes en paralelo.
- Si el repo target puede actuar como laboratorio (más simple) y el SaaS recibe la migración después.

Decisión fuera del scope de esta auditoría; queda documentada para que la elección no se pierda.
```

---

## Notas finales sobre redacción

- **Español rioplatense** si el repo target lo usa (chequear CLAUDE.md). Caso ÍTERA: sí. Otros proyectos: adaptar.
- **Inglés en código** (variables, identificadores, comentarios técnicos), español en narrativa.
- **Cada finding cita `archivo:línea`**. Si no se puede, descartarlo.
- **Tono pragmático, sin marketing-speak**. El lector es alguien que va a ejecutar el plan, no un decisor que necesita ser convencido.
- **Tamaño objetivo del reporte**: 300-500 líneas markdown. Si pasa 600, revisar si hay redundancia.

---

## Auto-check final OBLIGATORIO

Antes de presentar el reporte, releer `references/audit-checklist.md` y confirmar que **cada uno de los 92 items** aparece en el reporte. Si un eje no aplica al proyecto o no se puede evaluar (ej: solo análisis visual sin código, sin acceso al repo), **declararlo explícitamente como `N/A — razón concreta`** en la sección correspondiente. **NUNCA omitir un item en silencio**.

Especial atención a los ejes que suelen saltearse:

- **§2 Árbol parent-child**: este eje siempre se cubre, con bullets por sección crítica. NO se infiere desde otros findings.
- **§5 Line-height**: a menudo se omite por pensar que es "spacing tipográfico secundario". Es eje propio.
- **§7 Icon system**: gap icono-texto + stroke widths suelen pasarse por alto.
- **§10 Breakpoints**: cada breakpoint custom debe nombrar la condición que resuelve, NO solo declararse.
- **§12 Validación contenido extremo**: probar con datos reales, no con lorem ipsum.
- **§13 Mismatch entre features hermanas**: comparar inputs/buttons/spacing entre features con función similar.

Si el reporte queda sin un eje, NO está completo. Volver al workflow §5 y cubrirlo antes de presentar.
