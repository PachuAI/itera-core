# Estructura del reporte — plantilla canónica

Las 7 secciones que todo reporte de `motion-audit` debe tener, en este orden. Path destino: `<repo>/.planning/MOTION-AUDIT.md` (o suffix `-vN.md` si ya existe).

---

## Encabezado mínimo

```markdown
# Auditoría de motion — <Nombre del proyecto>

**Fecha**: <YYYY-MM-DD>
**Scope**: sistema de motion / transiciones / animaciones del frontend
**Stack**: <Next.js X o Laravel+Inertia, React Y, Tailwind vZ, shadcn, tw-animate-css>
**Objetivo**: movimiento funcional, consistente y accesible — escala chica de duraciones, easings con criterio, reduced-motion a nivel sistema, fuente única de tokens.

**Inventario baseline**: output de `scripts/motion-inventory.mjs` (durations / easings / transition-props / keyframes bucketeados). El motion NO se screenshot-ea: el inventario ES la captura.

**Estado**: no se modificó código. Este documento es el plan previo a tocar.
```

---

## 1. Diagnóstico general

```markdown
## 1. Diagnóstico general

El proyecto tiene <lo que ya está bien: ej. una route transition sólida y microinteracciones con transition-colors> pero **el motion no sale de un sistema**: <causa raíz en una oración>.

| Síntoma | Dónde se siente |
|---|---|
| Cortes secos | <qué cambia de estado sin transición> |
| Timing inconsistente | <N duraciones distintas conviviendo> |
| Sin reduced-motion | <no hay prefers-reduced-motion> |
| Motion hardcodeado | <números mágicos inline, sin tokens> |

**Causa raíz**: 4 ejes que no comparten escala/fuente:

1. Escala de duraciones fragmentada (N valores ad-hoc).
2. Easings sin criterio (keyword + cubic-bezier sueltos).
3. reduced-motion ausente o parcial.
4. Sin fuente única de tokens de motion.
```

### 1.1 Ciclo de vida de las superficies de motion

```markdown
### 1.1 Ciclo de vida de las superficies de motion

El análogo temporal del árbol parent-child: la SECUENCIA de cada superficie crítica.

**Route / section transition** (`<archivo>`):
- Disparador: <router.on('start') / click / open>
- Entrada: <overlay mount opacity-0 → doble-rAF → opacity-100; viewport opacity-0>
- Salida: <respeta min-visible 420 → viewport opacity-100 + overlay fade → unmount tras 220>
- Coordinación: <min-visible, doble-rAF, fallback>

**Overlays** (dialog/popover/dropdown): <entrada animada? salida? flash de form?>

**Reveals** (collapsible/bulk bar): <grid 0fr→1fr? wrapper montado?>

**Sidebar collapse**: <width + fade coordinados, duración>
```

---

## 2. Inventario de motion actual

```markdown
## 2. Inventario de motion actual

### Duraciones en uso

| Valor | Ocurrencias | Dónde | Escalón canónico |
|---|---|---|---|
| 90ms | N | `filter-dropdown-panel` | fast |
| 120ms | N | `dropdown-item` | fast |
| 150ms | N | `dropdown-in`, default TW | base |
| 180ms | N | `filter-loading-overlay` | base |
| 200ms | N | sidebar, collapsible, route overlay | moderate |
| 220ms | N | route exit, alert | moderate |
| 240/250ms | N | alert height, page-enter | moderate |

### Easings en uso

| Easing | Ocurrencias | Token destino |
|---|---|---|
| `ease-out` (keyword) | N | `--ease-out` |
| `cubic-bezier(0.4,0,0.2,1)` | N | `--ease-in-out` |

### Keyframes propios

- `page-enter`, `dropdown-in`, `dropdown-item-in`, `collapsible-open/close` (`<archivo>`)

### Otros

- framer-motion: <presente/ausente>
- prefers-reduced-motion: <count, dónde>
```

---

## 3. Findings concretos (archivo:línea)

```markdown
## 3. Findings concretos (archivo:línea)

### A. Escala de duraciones fragmentada
- `resources/css/app.css:26` — `page-enter` 250ms (> moderate; bajar a 220).
- `resources/css/app.css:55` — `filter-dropdown-panel` 90ms (snap a fast 120).
- ...

### B. Easings sin criterio
- `<archivo:línea>` — `cubic-bezier(0.4,0,0.2,1)` inline repetido (tokenizar como `--ease-in-out`).

### C. Propiedades animadas caras / `transition: all`
- `<archivo:línea>` — `transition-all` en <componente>.

### D. Overlays enter/exit
- `<archivo:línea>` — <flash de form / sin doble-rAF>.

### E. reduced-motion ausente
- Global — sin `prefers-reduced-motion` salvo en `route-transition.tsx`.

### F. Motion hardcodeado / sin token
- `<archivo:línea>` — `const ANIM = 200` ad-hoc.

### G. <Patrones específicos del repo>
```

Evitar: findings sin `archivo:línea`, findings de color/sizing (otro skill).

---

## 4. Sistema de tokens de motion recomendado

Copiar/adaptar de `references/motion-system.md`:

```markdown
## 4. Sistema de tokens de motion recomendado

### 4.1 Principios
1. ≤300ms, preferido 150–220. 2. `ease-out` siempre, sin bounce. 3. reduced-motion. 4. CSS puro. 5. nunca `transition: all`. 6. tokens, no números mágicos.

### 4.2 Escala de duraciones (4) + easings (2) + presets
<bloque CSS del motion-system.md §2-4>

### 4.3 reduced-motion a nivel sistema (self-zeroing)
<bloque @media del motion-system.md §5>

### 4.4 Modo de consumo
<arbitrary value si CSS satélite, utilities si root — motion-system.md §6>

### 4.5 Mapeo valor-actual → escalón
| Actual | Token |
|---|---|
| 90/120ms | fast |
| 150/180ms | base |
| 200/220/240/250ms | moderate |
| 300ms | slow |
```

---

## 5. Qué NO conviene hacer

Lista de anti-patrones de `references/anti-patterns.md` con el por qué corto:

```markdown
## 5. Qué NO conviene hacer

1. **Sin bounce/elastic/overshoot.** <razón>
2. **Nada > 300ms en UI funcional.** <razón>
3. **Nunca `transition: all`.** <razón>
4. **No animar width/height/top (usar transform/opacity / grid rows).** <razón>
5. **No reinventar lo de tw-animate-css.** <razón>
6. **No meter framer-motion sin necesidad.** <razón>
7. **No duplicar fades (route transition + FadeIn).** <razón>
8. **reduced-motion no es opcional.** <razón>
9. **No montar overlays en opacity-100 (doble-rAF).** <razón>
10. **No desmontar el form mientras anima la salida del dialog.** <razón>
11. **No tokenizar las constantes JS de ciclo de vida como CSS vars.** <razón>
12. **No mezclar motion con color/sizing.** <razón>
```

---

## 6. Plan de implementación por fases (bajo riesgo)

```markdown
## 6. Plan de implementación por fases

### Fase 0 — Inventario baseline (≤ 0.5h)
- Correr `motion-inventory.mjs`, guardar el output. Mapa de duraciones/easings/keyframes.

### Fase 1 — Tokens base, sin tocar componentes (≤ 1h)
- Declarar `--duration-*` (4), `--ease-*` (2), `--transition-*` (3) + el `@media` self-zeroing.
- NO tocar componentes. Verificación: build limpio, nada cambia visualmente todavía.

### Fase 2 — Microinteracciones (≤ 1h)
- hover/active/focus → duraciones de la escala (fast/default). Rows, items, botones.
- Verificación: hover se siente igual; durations ya salen de token.

### Fase 3 — Overlays enter/exit (≤ 2h)
- Doble-rAF en mounts JS; `key={formKey}` en dialogs con form; salida animada.
- Verificación: abrir/cerrar dialog/popover sin flash ni corte.

### Fase 4 — Route/section transition + collapsibles (≤ 2h)
- Verificar no-duplicación de fades; reveals a grid 0fr→1fr; durations a token.
- Verificación: navegar entre secciones; abrir/cerrar filtros.

### Fase 5 — reduced-motion sistema + cleanup (≤ 1.5h)
- `@media` self-zeroing cubriendo todo; `motion-reduce:animate-none` en spinners; matar durations/easings hardcoded restantes.
- Verificación: toggle reduced-motion del SO → todo instantáneo.

### Fase 6 (opcional)
- Extraer a biblioteca de primitivas (`<RouteTransitionProvider>`, `<FadeIn>`, drawer) + tokens como única fuente.

**Riesgo total**: bajo. Fase 1 no toca componentes; las siguientes son aislables y revertibles.
```

---

## 7. Checks de validación

El motion NO se valida por screenshot (es temporal): se valida **interactuando**.

```markdown
## 7. Checks de validación

### Por interacción
- **Navegación**: cambiar de sección → overlay inmediato + entrada suave, sin doble fade.
- **Overlays**: abrir/cerrar dialog, popover, dropdown, select → entran y salen animados, sin flash de form vacío.
- **Reveals**: abrir/cerrar filtros / bulk bar → empuja suave, sin salto al final.
- **Sidebar collapse**: expandir/colapsar → ancho y labels coordinados, sin "compacto y luego crece".
- **Microinteracciones**: hover en botones/rows/items → color transiciona, no corta.

### reduced-motion
- Activar "Reducir movimiento" en el SO → todo instantáneo (sin transición), spinners sin girar de más. Confirma el self-zeroing.

### Performance / feel
- En una lista larga, scroll + hover sin jank.
- Nada se siente lento (≤300ms percibido) ni a tirones.

### Cross-tema (si aplica)
- El motion es mode-independent: light y dark se mueven igual. Verificar que ningún timing dependa del tema.
```

---

## Anexo opcional — Coexistencia con SSOT externo

Si el repo clona tokens de otro repo (patrón ITERA), agregar al final el mismo bloque que los hermanos: los tokens de motion suben primero al SSOT y después se clonan; documentar la decisión.

---

## Notas finales sobre redacción

- **Español rioplatense** si el repo lo usa (chequear CLAUDE.md). Inglés en código.
- **Cada finding cita `archivo:línea`**. Si no se puede, descartarlo.
- **Tono pragmático**. El lector va a ejecutar el plan.
- **Tamaño objetivo**: 250–450 líneas. Si pasa 550, revisar redundancia.

## Auto-check final OBLIGATORIO

Releer `references/audit-checklist.md` y confirmar que **cada uno de los 62 items** aparece en el reporte (finding concreto o `N/A — razón`). Atención especial a §9 reduced-motion (el más olvidado), §3 propiedades animadas, §5.6 constantes de ciclo de vida y §10.4 modo de consumo. Si falta un eje, NO está completo.
