# Estructura del reporte — plantilla canónica

Las 7 secciones que todo reporte de `color-theme-audit` debe tener, en este orden.

Path destino: `<repo>/.planning/COLOR-THEME-AUDIT.md` (o suffix `-vN.md` si ya existe).

---

## Encabezado mínimo

```markdown
# Auditoría de color y theme — <Nombre del proyecto>

**Fecha**: <YYYY-MM-DD>
**Scope**: sistema de color, roles, dark/light mode y elevation/surfaces del frontend
**Stack**: <Next.js X, React Y, Tailwind vZ, shadcn/ui ...>
**Calibración actual del color**: <ej: oklch surfaces v4.x, dark mode shell-receding, ...>
**Objetivo**: que el sistema de color sea funcional (roles), calibrado por par (no inversión), con elevation declarada y semantic colors diferenciados de brand.

**Capturas baseline**: `<path al OUT_DIR>` — N PNG (light + dark por ruta) en `<resolución>`, capturadas con Playwright contra `localhost:<puerto>`.

**Estado**: no se modificó código. Este documento es el plan previo a tocar.
```

---

## 1. Diagnóstico general

Narrativa breve por modo + causa raíz en 4 ejes.

```markdown
## 1. Diagnóstico general

El proyecto tiene <descripción del estado de partida en 2-3 oraciones>.

**Comparativa light vs dark**:

| Vista | Light | Dark |
|---|---|---|
| `/` Home | <obs específica> | <obs específica> |
| `/jurisprudencia/saij` | <obs> | <obs> |
| ... | ... | ... |

**Causa raíz**: 4 ejes:

1. **Roles ausentes**: el sistema no declara <X token canónico>, lo cual obliga a los componentes a inventar el color cada vez.
2. **Colores hardcoded sin función**: N ocurrencias de `text-emerald-500` / `bg-amber-500/15` / etc. en M archivos.
3. **Dark mode por inversión sin criterio**: <descripción del problema observable: cards amarronadas, sombras invisibles, muted ilegible>.
4. **Surfaces planas sin elevation**: <descripción de la falta de capa>.
```

Evitar: "queda feo", adjetivos sin medición, propuestas sin justificación.

---

## 2. Inventario de tokens actuales

Listar qué tokens están declarados, agrupados por familia.

```markdown
## 2. Inventario de tokens actuales

### Declarados en `:root` (light) — N tokens

- `--background`, `--foreground`, `--card`, `--card-foreground`, ...

### Declarados en `.dark` — M tokens

- `--background`, `--foreground`, `--card`, ...

### Roles canónicos AUSENTES (vs `color-system.md`)

- `--card-base` (contenedor de grilla) — no existe.
- `--dialog` — no existe; los modales usan `--card` directo.
- `--text-on-dark-*` — no existe; los heros usan colores hardcoded.

### Tokens declarados pero NO usados

- `--legacy-X` — declarado pero 0 referencias en código. Candidato a deprecar.

### Tokens duplicados o paralelos

- `--gray-100` y `--muted` apuntan a valores cercanos. Decidir cuál es canónico.
```

---

## 3. Findings concretos (archivo:línea)

Findings agrupados por categorías A-G (las que apliquen). Cada finding lleva `archivo:línea`.

```markdown
## 3. Findings concretos (archivo:línea)

### A. Roles ausentes o sin uso

- `src/app/globals.css:NN` — falta `--card-base` declarado. Usado en `src/components/shared/tool-card.tsx:96` como `bg-card-base/50` que apunta a token inexistente.

### B. Colores hardcoded Tailwind

| Patrón | Ocurrencias | Top archivos |
|---|---|---|
| `text-emerald-500/600` | 12 | `valores/status-badge.tsx`, `sidebar-primitives.tsx`, ... |
| `bg-amber-500/15` | 8 | `status-pill.tsx`, ... |
| `text-red-500` | 6 | `error-banner.tsx`, `result-card.tsx`, ... |

Cada uno con `archivo:línea`.

### C. Hex/RGB/OKLCH arbitrary en componentes

- `src/components/x/y.tsx:42` — `text-[#F27A1A]` hardcoded; debería ser `text-itera`.
- `src/components/z.tsx:18` — `style={{ background: "rgba(0,0,0,0.5)" }}` inline.

### D. Dark mode con utility variant (anti-patrón)

- `src/components/foo.tsx:55` — `bg-white dark:bg-gray-900`. Reemplazar por `bg-background` con token redefinido.

### E. Sombras hardcoded

- `src/components/card.tsx:14` — `shadow-[0_4px_8px_rgba(0,0,0,0.1)]` inline. Reemplazar por `shadow-elevation-1`.

### F. Foregrounds sin contraste validado

- `src/components/badge.tsx:22` — `text-warning bg-warning/10` sin medir contraste sobre `--background` en dark. Validar.

### G. Otros patrones específicos del repo

- ...
```

---

## 4. Tabla resumen de inconsistencias

Vista compacta para que el lector tenga el panorama de un vistazo.

```markdown
## 4. Tabla resumen

| Eje | Estado actual | Magnitud | Impacto |
|---|---|---|---|
| Roles canónicos declarados | M/N (60% completo) | falta 40% | Componentes inventan colores |
| Tailwind palette directos | 26 ocurrencias en 14 archivos | Alto | Bypass total del sistema |
| Hex literales | 4 | Bajo | Patches puntuales |
| `dark:bg-*` literales | 18 | Medio | Dark hecho por componente, no por token |
| Sombras hardcoded | 7 | Medio | Sin sistema de elevation |
| Cards "amarronadas" en dark | 3 vistas | Medio | Falta `--card-base` |
| `muted-foreground` ilegible | 0 (calibrado bien) | OK | — |
| Sombras igual en dark y light | sí en `--elevation-1/2` | Crítico | Elevation invisible en uno de los dos modos |
| Focus ring genérico | sí (`ring-2`) | Medio | Cancela el sistema |
| Mezcla HSL/OKLCH | mayoría OKLCH, 8 HSL legacy | Bajo | Calibración mixta |
```

---

## 5. Sistema de roles y tokens recomendado

Copiar/adaptar de `color-system.md` y `elevation-surfaces.md`.

```markdown
## 5. Sistema recomendado

### 5.1 Roles canónicos a declarar (15-20 tokens)

<copiar lista del color-system.md §3 con valores propuestos para este proyecto>

### 5.2 Valores propuestos por modo

| Token | Light | Dark | Razón |
|---|---|---|---|
| `--background` | `oklch(0.96 0.004 85)` | `oklch(0.105 0 0)` | Papel cálido vs near-black |
| `--card-base` | `oklch(0.91 0.004 85)` | `oklch(0.18 0 0)` | Contenedor de grilla |
| `--card` | `oklch(1 0 0)` | `oklch(0.235 0 0)` | POP / popover layer |
| ... | ... | ... | ... |

### 5.3 Elevation y surfaces

<tabla copiada de elevation-surfaces.md §3>

### 5.4 Mapeo `@theme inline`

<bloque de código completo>

### 5.5 Pares foreground+background a validar contraste

| Background | Foreground | Mínimo WCAG | Actual light | Actual dark |
|---|---|---|---|---|
| `--background` | `--foreground` | 4.5:1 | <medido> | <medido> |
| `--background` | `--muted-foreground` | 4.5:1 | <medido> | <medido> |
| ... | ... | ... | ... | ... |
```

---

## 6. Qué NO conviene hacer

Lista de 10 anti-patrones, copiados/adaptados de `anti-patterns.md`. Mantener "por qué" corto pero explícito.

```markdown
## 6. Qué NO conviene hacer

1. **No invertir automáticamente para construir dark**. <razón>
2. **No usar Tailwind palette directos para color semántico**. <razón>
3. **No mezclar brand primary con semantic colors**. <razón>
4. **No declarar foregrounds sin background**. <razón>
5. **No usar `ring-2` genérico para focus**. <razón>
6. **No usar `bg-card` para info cards de contenido**. <razón>
7. **No copiar elevation entre dark y light**. <razón>
8. **No deprecar HSL/HEX con find/replace ciego**. <razón>
9. **No alterar `--text-on-dark-*` en `.dark`**. <razón>
10. **No agregar tokens semánticos "por las dudas"**. <razón>
```

---

## 7. Plan de implementación por fases

```markdown
## 7. Plan de implementación

### Fase 0 — Snapshot light + dark (≤ 1h)
- Correr `scripts/theme-capture.mjs` guardando en `<repo>/.planning/color-baseline/<fecha>/<route>__<theme>.png`.
- Output: N×2 imágenes baseline para diff visual contra cada fase.

### Fase 1 — Declarar roles canónicos en `globals.css` (≤ 2h)
- Agregar tokens ausentes (de §5.1) en `:root` y `.dark`.
- NO tocar componentes.
- Verificación: snapshot diff vs Fase 0 ≈ idéntico.

### Fase 2 — Migrar utility classes hardcoded → tokens (≤ 3h)
- Search and replace dirigido por archivo:
  - `text-emerald-500/600` → `text-success`.
  - `bg-amber-500/15` → `bg-warning/15`.
  - `text-red-500` → `text-destructive`.
- Validar contraste en cada par.
- Verificación: build + capturas diff.

### Fase 3 — Calibrar dark y light por superficie (≤ 3h)
- Recalibrar `--background`, `--card`, `--card-base`, `--sidebar`, `--dialog` con valores de §5.2.
- Foco en eliminar "cards amarronadas" en dark.
- Verificación: pares light/dark mantienen jerarquía relativa.

### Fase 4 — Elevation + inset highlight + focus-ring (≤ 2h)
- Agregar `--elevation-1/2/3` con alphas diferenciados por modo.
- Agregar `--inset-top-highlight` y `--focus-ring`.
- Reemplazar `shadow-[...]` inline por `shadow-elevation-N`.
- Reemplazar `ring-2` por `shadow-focus-ring`.

### Fase 5 — Semantic colors con foreground propio (≤ 2h)
- Agregar `--success/--warning/--destructive/--info` + sus foregrounds en `:root` y `.dark`.
- Migrar `StatusPill`, `Badge` semánticos y similares.

### Fase 6 (opcional) — Migración HSL → OKLCH si aplica
- Color por color, validando visualmente.
- Solo si el repo está en HSL/HEX mixto y se beneficia de escala perceptual.

**Riesgo total**: bajo. Fases 1, 4, 5 no tocan componentes. Fase 2 tiene regresiones controlables por diff visual. Fase 3 es la más delicada — recalibración manual con baseline.
```

---

## 8. Checks visuales sugeridos

```markdown
## 8. Checks visuales después de cada fase

### Light mode
- Las cards de contenido se diferencian del bg sin parecer "flotantes excesivas".
- `--muted-foreground` legible en metadata.
- Focus visible en inputs sin ring agresivo.
- CTAs primarios destacan sin competir con semantic states.

### Dark mode
- Las cards NO se "amarronan" (no se ven luminosas demasiado).
- Sombras visibles (alpha calibrado a 40-50%).
- Inset highlight da sensación de "luz desde arriba".
- Texto secundario legible (no gris fantasma).
- Acento brand no se ve agresivo (calibrado para fondo oscuro).

### Pares
- Las jerarquías relativas se mantienen entre modos (lo principal en light sigue siendo principal en dark).
- Toggle de tema NO produce "flash" intermedio.
- Theme transition es suave (si aplica), sin elementos que "salten" entre estados.

### Contraste WCAG
- Body text (`--foreground` sobre `--background`): ≥ 4.5:1 en ambos modos.
- Metadata (`--muted-foreground` sobre `--background`): ≥ 4.5:1 en ambos modos.
- CTAs (`--primary-foreground` sobre `--primary`): ≥ 4.5:1 si el texto es body, ≥ 3:1 si es UI grande.
- Semantic foregrounds: ≥ 4.5:1.
- Focus ring visible contra TODOS los backgrounds que use.

### Validación con contenido extremo (opcional pero recomendado)
- Vista con muchos chips/badges: ¿se distinguen entre sí?
- Card con notification dot: ¿el rojo destacaba sin pelearse con brand?
- Hero con imagen + text-on-dark: ¿se lee el texto en ambos modos?
```

---

## Anexo opcional — Coexistencia con SSOT externo

Si el repo target clona tokens de color de otro repo, agregar:

```markdown
## Anexo — Coexistencia con SaaS <Nombre>

Este portal clona tokens del SaaS principal (`<path al SSOT>`). Implicancia:

- Los tokens nuevos / recalibraciones propuestas en §5 deben subir primero al SSOT.
- Las decisiones de elevation, focus-ring, glow son del SSOT también.
- Si el SSOT tiene tokens incompatibles, abrir discusión antes de divergir.

Si el repo target es el SSOT (caso ÍTERA Lex SaaS), la inversión: las decisiones acá viajan a los repos clones (`itera-lex-tools`, etc).

Documentar la decisión.
```

---

## Notas finales sobre redacción

- **Español rioplatense** si el repo lo usa.
- **Inglés en código**, español en narrativa.
- **Cada finding cita `archivo:línea`**.
- **Tono pragmático, sin marketing-speak**.
- **Foco en color como SISTEMA**, no como gusto.
- **Tamaño objetivo del reporte**: 400-600 líneas markdown. Si pasa 700, revisar redundancia.

---

## Auto-check final OBLIGATORIO

Antes de presentar el reporte, releer `references/audit-checklist.md` y confirmar que **cada uno de los 75 items** aparece en el reporte. Si un eje no aplica al proyecto o no se puede evaluar (ej: solo análisis visual sin código), **declararlo explícitamente como `N/A — razón concreta`** en la sección correspondiente. **NUNCA omitir un item en silencio**.

Especial atención a los ejes que suelen saltearse:

- **§1 Inventario de capas perceptuales**: este eje siempre se cubre primero, con tabla de capas en light + tabla en dark + comparativa. NO se infiere desde otros findings.
- **§4 Elevation y profundidad**: si NO hay sombras visibles, declararlo (puede ser un "todo plano por borders"). NO ignorar el eje.
- **§7 Construcción del par dark/light**: validar si los deltas entre capas son simétricos (inversión sospechosa) o calibrados manual.
- **§11 Asimetrías cross-mode**: el mismo elemento debe tener el mismo "weight perceptual" entre modos. Comparar elemento por elemento.

Si el reporte queda sin un eje, NO está completo. Volver al workflow §3 y cubrirlo antes de presentar.
