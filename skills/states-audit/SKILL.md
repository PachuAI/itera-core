---
name: states-audit
description: Auditar el sistema de estados de UI (empty / loading / error / success / disabled) de un admin panel React (Next.js o Laravel+Inertia) + Tailwind v4 + shadcn, y proponer patrones canónicos + tokens chicos. Detecta empty states sin acción o ad-hoc (sin componente compartido), loading sin sistema (spinners inline por página, skeletons inexistentes o sin usar, spinner full-page para datos en vez de skeleton que preserva layout), errores hechos a mano (colores hardcodeados como border-red-500 / text-green-600 en vez de tokens semánticos, sin aria-invalid, sin ErrorBoundary, mezcla de toast y mensaje local), success inconsistente (check marks por todos lados, toast vs badge sin criterio), disabled sin sistema (opacity-50 ad-hoc, sin aria-disabled, confundido con loading o readonly), ausencia de máquina de estado de vista (loading/empty/error mostrados a la vez o en mal orden), y falta de aria de estado (aria-busy, aria-disabled, aria-invalid, role=status, role=alert). Propone patrones canónicos por estado (empty con 2 variantes sin-datos/sin-resultados, loading skeleton-first para contenido + spinner para acciones + overlay para transiciones, error en 3 niveles inline/sección/crash, success toast/badge/inline, disabled vs loading vs readonly), una máquina idle->loading->(content|empty)|error, tokens chicos (disabled-opacity, skeleton con reduced-motion), reuso de los semánticos del dominio Color, y un plan por fases. Usar siempre que el usuario pida "auditar los estados", "empty states", "loading states", "skeletons", "estados de error", "manejo de errores de UI", "estados de carga", "spinners inconsistentes", "disabled states", "estados vacíos", "loading/empty/error", "máquina de estados de vista", "feedback de la UI", "/states-audit", o cuando un proyecto tiene el manejo de estados disperso sin patrones ni tokens.
---

# States Audit (empty / loading / error / success / disabled)

Auditoría sistemática de los **estados de UI** de un frontend para que el feedback sea **consistente y predecible**: cada vista sabe mostrar que está cargando, que no tiene datos, que falló o que se completó algo, con los mismos patrones en toda la app y sin reinventar colores ni componentes.

El método separa **diagnóstico** (este skill) de **aplicación** (decisión del usuario fase a fase). Como el resto de la familia (`color-theme-audit`, `responsive-audit`, `motion-audit`), no toca código; entrega un reporte en `.planning/STATES-AUDIT.md` con plan por fases revertibles.

States es un dominio **de composición** (más patrón que token). Se apoya en los otros: reusa los **semánticos** del dominio Color (success/danger/warning/info), el **spinner/overlay/transition** del dominio Motion, y los **roles tipográficos** del dominio Sizing. No los redefine.

## Cuándo usar

- Cada página resuelve "está cargando" distinto (un spinner acá, un texto allá, nada en otra).
- Hay un componente `Skeleton` pero no se usa; las tablas/listas saltan cuando llegan los datos.
- Errores pintados a mano con colores hardcodeados (`border-red-500`, `text-green-600`) en vez de los tokens semánticos.
- Empty states sin acción (el usuario ve "no hay nada" pero no sabe qué hacer), o cada lista con su propio markup.
- `disabled` resuelto con `opacity-50` ad-hoc, sin `aria-disabled`, confundido con loading o readonly.
- Una vista que muestra loading Y empty Y error al mismo tiempo (o en mal orden).
- Falta feedback de accesibilidad de estado (`aria-busy`, `role="status"`, `role="alert"`).
- Antes de cerrar el dominio States de un design system nuevo (caso ITERA: UI-Lab con tokens propios).

## Cuándo NO usar

- Diseño de microinteracciones / timing de animaciones → `motion-audit`.
- Paleta de colores semánticos en sí (qué verde es success) → `color-theme-audit`.
- Tamaños / tipografía / layout → `responsive-audit`.
- Accesibilidad general (focus-visible, navegación por teclado, target sizes, aria fuera de estado) → dominio/ skill de a11y. States cubre solo los aria DE ESTADO.
- Lógica de negocio del fetch (cuándo cargar, cache) — es data-fetching, no presentación de estado.

## Bootstrap

1. **Detectar stack y dónde viven los estados**:
   - Componentes compartidos de estado: `EmptyState`, `Skeleton`, `Spinner`, `ErrorBoundary`, `StatusBadge`, `ConfirmDialog`.
   - Librería de toasts/notificaciones: Sonner, react-hot-toast, custom.
   - Tokens existentes relacionados (`--skeleton`, `--disabled-opacity`) o su ausencia.
   - Si NO es React + Tailwind + shadcn, advertir antes de seguir.

2. **Leer reglas del proyecto**: `CLAUDE.md`, `.planning/STATE.md`, y los reportes hermanos (`COLOR-THEME-AUDIT.md` para los semánticos, `MOTION-AUDIT.md` para spinner/overlay).

3. **Detectar dev server** (igual que los hermanos). NUNCA matar procesos. Opcional para el inventario; útil para validar el feel.

4. **Definir las vistas a auditar**: listados (tabla/grid), formularios (modales), detail pages, y los flujos async (submit, export, delete). Pedir al usuario las vistas clave si hay dudas.

5. **Detectar coexistencia con SSOT externo**: si los componentes/tokens de estado vienen clonados de otro repo, anotar para el anexo.

## Workflow

1. **Inventario del manejo de estados** con `scripts/states-inventory.mjs` (o Grep según `references/inspection-grep.md`). Cuenta y ubica: usos de `EmptyState`, `Skeleton`/`animate-pulse`, `Loader2`/spinners, `aria-invalid`/`aria-busy`/`aria-disabled`, `disabled`/`opacity-50`, `toast.*`, `ErrorBoundary`, y **colores semánticos hardcodeados** (`border-red-500`, `text-green-600`, `bg-amber-*`…) que deberían ser tokens.

2. **Mapear la máquina de estado de las vistas críticas**. Para cada listado/form, describir qué estados maneja y en qué orden los chequea (`error → loading → empty → content`), y si alguna muestra dos a la vez. Esto es el análogo del árbol/ciclo de vida de los hermanos. Documentar en §1.1 del reporte.

3. **Catalogar findings recorriendo el checklist exhaustivo** de `references/audit-checklist.md` (los 9 ejes). **OBLIGATORIO** cubrir cada item — si no aplica o no se puede evaluar, declarar `N/A — razón concreta`. **NUNCA omitir un item en silencio**. Cada finding con `archivo:línea`.

   Los 9 ejes:
   - §1 Empty states (componente compartido, 2 variantes, acción presente, tamaños)
   - §2 Loading (skeleton-first para contenido, spinner para acción, overlay para transición, no spinner full-page para datos)
   - §3 Error (inline form aria-invalid+semántico, sección con retry, crash ErrorBoundary, toast async, sin colores hardcoded)
   - §4 Success (toast efímero, badge persistente, inline contextual, sin abuso de checks)
   - §5 Disabled (opacity token, cursor, aria-disabled, distinto de loading/readonly)
   - §6 Máquina de estado de vista (un estado a la vez, orden de chequeo)
   - §7 Aria de estado (aria-busy, aria-disabled, aria-invalid, role status/alert)
   - §8 Tokenización y reuso (disabled-opacity, skeleton; semánticos reusados del color domain, no reinventados)
   - §9 reduced-motion del loading (skeleton pulse / spinner respetan prefers-reduced-motion)

4. **Diseñar el sistema** consultando `references/states-system.md`:
   - Patrones canónicos por estado (empty / loading / error / success / disabled).
   - Máquina de estado de vista.
   - Tokens chicos (disabled-opacity, skeleton con reduced-motion).
   - Reuso de los semánticos del color domain + spinner/overlay del motion domain.
   - Aria de estado por patrón.

5. **Plan por fases** consultando `references/report-template.md`:
   - Fase 0 — inventario baseline.
   - Fase 1 — tokens chicos + skeleton tokenizado (con reduced-motion).
   - Fase 2 — empty states al componente compartido + 2 variantes + acción.
   - Fase 3 — loading: skeletons en listados/tablas; spinner solo para acciones.
   - Fase 4 — errores: hardcoded → semánticos; aria-invalid; sección con retry.
   - Fase 5 — máquina de estado de vista + aria de estado + cleanup.
   - Fase 6 — opcional (primitivas reutilizables `<ViewState>`).

6. **Escribir el reporte** según `references/report-template.md`. Guardar en `<repo>/.planning/STATES-AUDIT.md`. **Si ya existe, pedir confirmación o sugerir suffix `-vN.md`**.

7. **Auto-check final ANTES de presentar**: releer `references/audit-checklist.md` punto por punto. Cada item con finding o `N/A — razón`. **No presentar un reporte incompleto**.

## Output esperado

Reporte markdown con 7 secciones canónicas:

1. **Diagnóstico general** — qué falta (loading sin sistema / errores hardcodeados / empty sin acción / disabled ad-hoc), causa raíz en 4 ejes. + §1.1 máquina de estado de las vistas críticas.
2. **Inventario de estados actual** — tabla de usos por patrón con `archivo:línea`; componentes compartidos; toasts.
3. **Findings concretos (archivo:línea)** — categorías A–G.
4. **Sistema de estados recomendado** — patrones canónicos, máquina de vista, tokens, reuso, aria.
5. **Qué NO conviene hacer** — anti-patrones con justificación.
6. **Plan de implementación por fases** — Fases 0–6.
7. **Checks de validación** — cómo verificar cada estado (forzar loading, vaciar datos, romper fetch, deshabilitar, reduced-motion).

Más: anexo opcional si hay SSOT externo.

**NO modificar código del proyecto** durante este skill. Termina cuando el reporte está en `.planning/STATES-AUDIT.md`.

## Guardrails

- **Reusar, no reinventar.** Los colores de error/success/warning/info salen del dominio Color (tokens semánticos). El spinner/overlay del dominio Motion. Los roles tipográficos del dominio Sizing. States ORQUESTA, no redefine. Un `border-red-500` / `text-green-600` hardcodeado es finding, no propuesta.
- **Skeleton-first para contenido.** Lo que va a aparecer (tablas, listas, cards) carga con skeleton que **preserva el layout**, no con spinner full-page que lo colapsa y hace saltar la vista. El spinner es para ACCIONES (botón submit), el overlay para TRANSICIONES (route).
- **Un estado a la vez.** Una vista nunca muestra loading + empty + error juntos. Orden de chequeo: `error → loading → empty → content`. Si ves dos simultáneos, es finding.
- **Empty siempre con acción.** "No hay nada" sin un próximo paso (crear / limpiar filtros / reintentar) es un callejón. Distinguir sin-datos (CTA crear) de sin-resultados (CTA limpiar).
- **Disabled ≠ loading ≠ readonly.** Disabled = no podés todavía (con motivo). Loading = procesando (spinner + aria-busy). Readonly = no editable pero presente. No mezclarlos visualmente.
- **Aria de estado obligatorio.** `aria-busy` en loading, `aria-disabled` en disabled, `aria-invalid` en error de form, `role="status"` en regiones de carga, `role="alert"` en errores. Es eje propio (§7).
- **reduced-motion en el loading.** El pulse del skeleton y el spin del spinner respetan `prefers-reduced-motion` (skeleton: pulse off; spinner: `motion-reduce:animate-none`). Coordinar con el dominio Motion (tokens self-zeroing).
- **Evidencia o descarte.** Sin `archivo:línea` concreto el finding no entra.
- **Tokens chicos, no sistema gigante.** States tokeniza poco: `disabled-opacity`, `skeleton` (color + pulse). El resto son PATRONES. No inventar una constelación de tokens de estado.
- **Modo de consumo** según root de Tailwind vs CSS satélite (arbitrary value si aislado) — igual que los hermanos.
- **NO tocar color/sizing/motion.** Si una propuesta arrastra un cambio de paleta, tamaño o timing, fue scope creep — sacarlo (salvo el reuso documentado).
- **NO crear el archivo del reporte sin chequear** si ya existe. **NO matar procesos.**
- **NO saltar ejes del checklist.** "Rápido" = menos profundidad por eje, NO menos ejes. Los que no apliquen se declaran `N/A — razón`.

## Resources

- **Checklist exhaustivo OBLIGATORIO (9 ejes)**: `references/audit-checklist.md`
- Sistema canónico: patrones por estado, máquina de vista, tokens, aria, reuso de semánticos: `references/states-system.md`
- Patrones grep + checks semánticos: `references/inspection-grep.md`
- Anti-patrones (qué NO hacer y por qué): `references/anti-patterns.md`
- Estructura del reporte (7 secciones canónicas): `references/report-template.md`
- Script de inventario de estados (EmptyState / Skeleton / spinners / aria / colores hardcoded): `scripts/states-inventory.mjs`
  - Uso: `node ~/.claude/skills/states-audit/scripts/states-inventory.mjs` desde la raíz del repo.
  - Env: `ROOT` (default `.`), `GLOBS` (CSV, default `resources,src,app,components`), `FORMAT` (`table` | `json`).
