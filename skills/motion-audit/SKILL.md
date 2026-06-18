---
name: motion-audit
description: Auditar el sistema de motion y transiciones de un admin panel React (Next.js o Laravel+Inertia) + Tailwind v4 + shadcn, y proponer un sistema unificado de tokens de motion. Detecta escala de duraciones fragmentada (90/120/150/180/200/220/240/250ms ad-hoc sin escala), easings inconsistentes (keyword ease-out + cubic-bezier sueltos, bounce/elastic indebido), animación de propiedades caras (animar `all`, width/height/top en vez de transform/opacity), cortes secos (cambios de estado sin transition-*), entradas/salidas de overlays mal hechas (sin doble-rAF, flash de form vacío al cerrar dialog), route/section transition ausente o que duplica fades, collapsible reveal con `height: 0->auto` en vez de grid 0fr->1fr, microinteracciones sin sistema, stagger de listas ad-hoc, reduced-motion no respetado (sin `prefers-reduced-motion`, sin `motion-reduce:`), y motion hardcodeado sin fuente única (framer-motion donde alcanza CSS, durations dispersas). Propone una escala de duraciones (fast/base/moderate/slow ≤300ms, preferido 150-220), 2 easings (ease-out decelerate + ease-in-out para two-way), presets de transición, reduced-motion a nivel sistema (duraciones self-zeroing), y un plan por fases revertible. Usar siempre que el usuario pida "auditar el motion", "sistema de transiciones", "tokens de motion", "duraciones y easings", "se siente lento / a tirones / con lag", "cortes secos al cambiar de estado", "animaciones inconsistentes", "bouncy / sin bounce", "route transition", "transición entre secciones", "collapsible / expand animation", "microinteracciones", "reduced-motion / prefers-reduced-motion", "accesibilidad de movimiento", "/motion-audit", o cuando un proyecto tiene animaciones ad-hoc dispersas sin escala ni fuente única.
---

# Motion & Transition Audit

Auditoría sistemática del sistema de **motion** de un frontend para que el movimiento sea **funcional, no decorativo**: cada transición tiene una duración de una escala chica, un easing con criterio (`ease-out` siempre, sin bounce), respeta `prefers-reduced-motion`, y sale de una fuente única de tokens en vez de números mágicos dispersos.

El método separa **diagnóstico** (este skill) de **aplicación** (decisión del usuario fase a fase). Como `responsive-audit` y `color-theme-audit`, no toca código; entrega un reporte en `.planning/MOTION-AUDIT.md` con plan por fases revertibles.

Este skill es **dimensional al eje motion** (la dimensión TEMPORAL del sistema). NO ajusta color, sizing ni layout estructural — esos viven en `color-theme-audit` y `responsive-audit`. Son complementarios: color (qué se ve), sizing (cuánto mide), motion (cómo se mueve).

## Cuándo usar

- El proyecto tiene duraciones dispersas (`duration-150`, `200ms`, `duration-300`, `90ms`…) sin una escala ni nombres.
- Conviven varios easings sin criterio: `ease-out` keyword en un lado, `cubic-bezier(0.4,0,0.2,1)` en otro, algún `ease-in-out` suelto.
- Cambios de estado que cortan en seco (hover, abrir/cerrar, mostrar/ocultar) sin `transition-*`.
- Overlays (dialog/popover/dropdown/sheet) que aparecen de golpe, hacen flash al cerrar, o el form se vacía mientras anima la salida.
- Hay (o falta) una transición de sección a sección y no está claro si duplica fades o ignora navegaciones in-page.
- Reveals de filtros/barras bulk hechos con `height: 0 -> auto` (no anima) o con `display` toggle (corte seco).
- `prefers-reduced-motion` no se respeta en ningún lado; no hay `motion-reduce:` ni un apagado a nivel sistema.
- Se usa `framer-motion` (o similar) para cosas que resuelve CSS, sumando peso sin necesidad.
- Antes de cerrar el dominio motion de un design system nuevo (caso ITERA: UI-Lab con tokens propios).

## Cuándo NO usar

- Animación compleja orquestada / timelines / scroll-driven / SVG morphing — eso es trabajo de motion design dedicado, no un sistema de tokens de UI.
- Cambios de color, surfaces o elevation (eso es `color-theme-audit`).
- Cambios de tamaño, tipografía o layout (eso es `responsive-audit`).
- Piezas de marketing/video/redes (Remotion, social-motion) — otra disciplina y otro stack.
- Diseño desde cero sin proyecto target. Para eso, `frontend-design`.

## Bootstrap

1. **Detectar stack y dónde vive el motion**:
   - Tailwind v4: `globals.css` / `app.css` con `@import "tw-animate-css"`, `@keyframes`, utilities `animate-*`, `transition-*`, `duration-*`.
   - Provider de route transition (si existe): Next App Router (`app-route-transition.tsx`, imperativo) o Inertia (`route-transition.tsx`, event-driven).
   - CSS satélite de tokens aislado (caso UI-Lab) vs `globals.css` raíz.
   - Si NO es React + Tailwind + shadcn, advertir antes de seguir.

2. **Leer reglas del proyecto**:
   - `CLAUDE.md` del repo (guardrails, convenciones de UI, scope de commits).
   - `.planning/STATE.md` o equivalente (decisiones recientes de motion / design system).
   - El doctrina cross-repo: `itera-core/guides/guia-de-motion-y-transiciones.md` (la fuente que este skill absorbió). `references/motion-system.md` es la versión canónica + tokenizada.

3. **Detectar dev server** (igual que los hermanos). NUNCA matar procesos. Para motion el server es opcional: el inventario es greppeable sin levantar nada; el server sirve solo para validar el FEEL al final.

4. **Definir las superficies de motion a auditar**: route/section transition, overlays (dialog/popover/dropdown/select/sheet), collapsibles/reveals, sidebar collapse, microinteracciones (hover/active/focus), stagger de listas, spinners/loaders. Pedir al usuario las vistas clave si hay dudas.

5. **Detectar coexistencia con SSOT externo**: si los tokens de motion vienen clonados de otro repo (patrón ITERA), anotar para el anexo del reporte.

## Workflow

1. **Inventario cuantitativo del motion actual** con `scripts/motion-inventory.mjs` (o Grep directo según `references/inspection-grep.md`). Extrae y bucketea: cada `duration-N` / `Nms` / `Ns`, cada easing (`ease-*` keyword + `cubic-bezier(...)`), cada `transition-*` (¿se anima `all`? ¿layout caro?), cada `@keyframes`, cada `delay`, presencia de `framer-motion` y de `prefers-reduced-motion` / `motion-reduce:`. **El motion NO se screenshot-ea** (es temporal) → el inventario grep ES la captura baseline. Guardar el output como evidencia.

2. **Mapear el ciclo de vida de cada superficie de motion crítica**. Para route transition, overlays y reveals, describir la secuencia: qué dispara, qué entra/sale, en qué orden, con qué timing. Esto es el análogo temporal del "árbol parent-child" del responsive-audit: sin la secuencia, las propuestas de token quedan sin anclaje. Documentar como bullets en §1.1 del reporte.

3. **Catalogar findings recorriendo el checklist exhaustivo** de `references/audit-checklist.md` (los 11 ejes). **OBLIGATORIO** cubrir cada item — si no aplica o no se puede evaluar, declarar `N/A — razón concreta`. **NUNCA omitir un item en silencio**. Para cada finding, `archivo:línea`. Sin línea concreta el finding NO entra.

   Los 11 ejes que el checklist obliga a cubrir:
   - §1 Inventario de duraciones (qué valores existen, fragmentación vs escala canónica)
   - §2 Inventario de easings (keyword vs cubic-bezier, bounce/elastic indebido, decel vs standard)
   - §3 Propiedades animadas (`all` evitado, transform/opacity vs layout props caros)
   - §4 Enter/exit de overlays (doble-rAF, flash de form vacío, exit animado)
   - §5 Route / section transition (overlay + min-visible, no duplica fades, ignora in-page)
   - §6 Collapsible / layout reveal (grid 0fr→1fr, wrapper montado, min-h-0 overflow-hidden)
   - §7 Microinteracciones (hover/active/focus con `transition-colors`, duraciones, badge pop)
   - §8 Stagger de listas (delay escalonado, fill-mode both)
   - §9 reduced-motion (token-level self-zeroing / `motion-reduce:` / `animate-none` en keyframes)
   - §10 Tokenización y fuente única (durations/easings centralizados, framer-motion justificado, consumo arbitrary-value si CSS satélite)
   - §11 Performance / jank (transform+opacity GPU, `will-change` con criterio, doble-rAF en mount)

4. **Diseñar el sistema de tokens de motion** consultando `references/motion-system.md`:
   - **Escala de 4 duraciones** (`fast`/`base`/`moderate`/`slow`), ≤300ms, preferido 150–220. NADA fuera de la escala.
   - **2 easings**: `ease-out` decelerate (workhorse) + `ease-in-out` para movimiento de dos vías (width/height). Sin bounce/elastic.
   - **Presets de transición** (`<duración> <easing>`) para shorthand inline.
   - **reduced-motion a nivel sistema**: las duraciones se auto-anulan bajo `prefers-reduced-motion` (self-zeroing) → todo consumidor queda instantáneo sin tocar cada componente. Más `motion-reduce:animate-none` para keyframes (spinners).
   - **Modo de consumo** según si el archivo de tokens es root de Tailwind o CSS satélite (arbitrary value vs utilities — mismo criterio que `responsive-audit §6.1`).
   - **Patrones canónicos** (no inventar): route transition (2 variantes), `<FadeIn>`, collapsible reveal (grid), microinteracciones, drawer.

5. **Plan por fases** consultando `references/report-template.md`:
   - Fase 0 — inventario baseline (output del script).
   - Fase 1 — tokens base sin tocar componentes.
   - Fase 2 — migrar microinteracciones (hover/active/focus) a los tokens.
   - Fase 3 — overlays enter/exit (doble-rAF, flash de form vacío, exit animado).
   - Fase 4 — route/section transition + collapsible reveals.
   - Fase 5 — reduced-motion a nivel sistema + cleanup de durations/easings hardcoded.
   - Fase 6 — opcional (extraer a biblioteca de primitivas reutilizable).

   Cada fase independiente, testeable y revertible, con `typecheck && lint && build` (o el gate del stack) al cierre.

6. **Escribir el reporte** según `references/report-template.md`. Guardar en `<repo>/.planning/MOTION-AUDIT.md`. **Si ya existe, pedir confirmación o sugerir suffix `-vN.md`**.

7. **Auto-check final ANTES de presentar el reporte**: releer `references/audit-checklist.md` punto por punto y confirmar que **cada uno de los items** aparece en el reporte (finding concreto o `N/A — razón`). Si falta alguno, volver a §3 y completarlo. **No presentar un reporte incompleto**.

## Output esperado

Reporte markdown con estas 7 secciones canónicas, en este orden:

1. **Diagnóstico general** — qué se siente mal (cortes secos / lag / inconsistencia de timing / bounce indebido / jank), causa raíz en 4 ejes (escala de duraciones fragmentada / easings ad-hoc / sin reduced-motion / sin fuente única de tokens). + §1.1 ciclo de vida de las superficies de motion críticas.
2. **Inventario de motion actual** — tabla de duraciones y easings en uso con `archivo:línea`, keyframes existentes, presencia de framer-motion / reduced-motion.
3. **Findings concretos (archivo:línea)** — categorías A–G.
4. **Sistema de tokens de motion recomendado** — escala de duraciones, easings, presets, reduced-motion, modo de consumo, patrones canónicos.
5. **Qué NO conviene hacer** — anti-patrones con justificación corta.
6. **Plan de implementación por fases (bajo riesgo)** — Fases 0–6.
7. **Checks de validación** — cómo verificar el feel (navegación, abrir/cerrar overlays, toggle reduced-motion del SO, no jank), no por screenshot sino por interacción.

Más: anexo opcional si hay SSOT externo.

**NO modificar código del proyecto** durante este skill. La aplicación es decisión del usuario después de leer el reporte; el skill termina cuando el reporte está en `.planning/MOTION-AUDIT.md`.

## Guardrails

- **Duración ≤ 300ms, preferido 150–220ms**. Nada que se sienta lento. Si una propuesta pasa 300ms sin razón concreta (drawer grande, sheet full), revisarla.
- **`ease-out` siempre. SIN bounce, SIN elastic.** El `ease-in-out` se reserva para movimiento que abre Y cierra (height/width). `ease-in` puro (acelera) solo para salidas que se van de pantalla, con criterio.
- **Escala chica de duraciones**. 4 pasos (`fast`/`base`/`moderate`/`slow`) y NADA más. Si tentás un quinto, releer `references/anti-patterns.md` antes. El objetivo es colapsar la dispersión, no documentarla.
- **reduced-motion NO es opcional**. Toda animación respeta `prefers-reduced-motion`. Preferir el apagado a nivel sistema (duraciones self-zeroing) sobre `motion-reduce:` repetido en cada componente; usar `motion-reduce:animate-none` para keyframes (spinners). Es eje propio del checklist (§9), siempre se cubre.
- **NO animar propiedades de layout caras** (`width`, `height`, `top/left`, `margin`) cuando hay alternativa GPU (`transform`, `opacity`). Excepción documentada: collapsible reveal usa `grid-template-rows: 0fr→1fr` (no `height`). Animar `width` de un sidebar es aceptable si es la única vía y está acotado.
- **NO `transition: all`**. Enumerar las propiedades (`transition-[opacity,transform]`). `all` anima props inesperadas y cuesta performance.
- **Evidencia o descarte**. Sin `archivo:línea` concreto el finding no entra al reporte.
- **El modo de consumo depende de si el archivo de tokens es root de Tailwind**. Tokens en CSS satélite (aislado, importado desde un componente, caso UI-Lab) tienen `@theme`/`duration-*` utilities sin generar → consumir por arbitrary value (`duration-[var(--x)]`, `ease-[var(--x)]`, o el preset inline `transition: prop var(--transition-x)`). Mismo criterio que `responsive-audit §6.1`.
- **NO meter framer-motion** (ni otra lib de animación JS) si CSS + `tw-animate-css` alcanzan. En admin panels casi siempre alcanzan. Si ya está, señalar dónde podría salir.
- **NO duplicar fades**. Si hay route/section transition (el fade del viewport ES la entrada), NO agregar `<FadeIn>` por página encima. Es el footgun más común.
- **NO tocar color, sizing ni layout**. Si una propuesta de motion arrastra un cambio de color/tamaño, fue scope creep — sacarlo. El skill es temporal, no espacial ni cromático.
- **NO crear el archivo del reporte sin chequear**. Si ya existe `.planning/MOTION-AUDIT.md`, preguntar antes de sobrescribir o usar suffix.
- **NO matar procesos** del dev server. El inventario no lo necesita; el feel-check, sí, pero lo levanta el usuario.
- **Las constantes JS de ciclo de vida (route transition) NO se migran a CSS vars**. Enter/exit/min-visible/fallback del provider se leen desde JS; las CSS custom props no se leen limpio en JS. Quedan como constantes co-locadas en el provider, documentadas en el reporte, no tokenizadas en CSS.
- **NO saltar ejes del checklist**. Si el análisis es "rápido", el "rápido" significa **menos profundidad por eje**, NO **menos ejes**. Los que no apliquen se declaran `N/A — razón`.

## Resources

- **Checklist exhaustivo OBLIGATORIO (11 ejes)**: `references/audit-checklist.md`
- Sistema canónico de tokens de motion, easings, presets, patrones (route transition, FadeIn, collapsible, microinteracciones) y reduced-motion: `references/motion-system.md`
- Patrones grep + checks semánticos para detección de inconsistencias: `references/inspection-grep.md`
- Anti-patrones (qué NO hacer y por qué): `references/anti-patterns.md`
- Estructura del reporte (7 secciones canónicas con plantilla): `references/report-template.md`
- Script de inventario de motion (durations / easings / transition-props / keyframes, bucketeados): `scripts/motion-inventory.mjs`
  - Uso: `node ~/.claude/skills/motion-audit/scripts/motion-inventory.mjs` desde la raíz del repo.
  - Env: `ROOT` (default `.`), `GLOBS` (CSV de dirs a escanear, default `resources,src,app,components`), `FORMAT` (`table` | `json`).
