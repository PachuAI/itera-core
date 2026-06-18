---
name: responsive-audit
description: Auditar y proponer un sistema de tokens responsive desktop-first (laptop hacia arriba, NO mobile-first) para frontends Next.js + React + Tailwind v4 + shadcn. Captura screenshots con Playwright en 5 resoluciones (1366/1440/1920/2560/3840), detecta inconsistencias en font sizes, control heights, sidebar/header dimensions, max-widths, grids y spacing, propone un sistema unificado de tokens (rem + clamp() para 6 protagonistas, breakpoints 3xl/4xl custom, container queries opt-in) y entrega un reporte estructurado con plan por fases bajo riesgo. Usar siempre que el usuario pida "auditar el sistema de diseño", "auditoría responsive", "que escale en 4K", "espacio muerto en pantallas grandes", "se ve apretado en laptop", "ordenar el diseño en distintos breakpoints", "tokens fluidos", "clamp para tipografía", "container queries", "media queries del proyecto", "responsive system", "design tokens que escalen", "/responsive-audit", o cuando un proyecto frontend está calibrado a 1440/1920 y necesita extenderse para 1366/2K/4K sin rediseñar la marca.
---

# Responsive Audit (desktop-first)

Auditoría sistemática del sistema de tokens y dimensiones de un frontend para que escale cómodo desde 1366×768 hasta 3840×2160 sin colapsar abajo ni dejar vacío arriba. El target es ergonomía profesional en laptop y desktop de trabajo, NO mobile-first.

El método separa **diagnóstico** (este skill) de **aplicación** (decisión del usuario fase a fase). No toca código; entrega un reporte estructurado en `.planning/RESPONSIVE-AUDIT.md` con plan por fases revertibles.

## Cuándo usar

- Proyecto calibrado a 1440/1920 que en 4K se ve apretado a la izquierda y vacío a la derecha.
- En 1366 el contenido entra pero queda con espacio muerto vertical o filas que casi se rompen.
- Conviven muchas alturas de control (`h-8`, `h-9`, `h-10`, `h-11`) sin un sistema.
- Muchos `text-[Npx]` arbitrary scattered en componentes.
- Sidebar/header con dimensiones fijas en `px` que no responden al viewport.
- Cards en grid que topean en `lg:grid-cols-3` y no usan los breakpoints superiores.
- Antes de extender el portal a clientes con monitores 2K/4K.

## Cuándo NO usar

- Mobile-first apps (este skill prioriza laptop y desktop de trabajo).
- Cambios de paleta o identidad visual (es dimensional, no de color).
- Redesign de un componente individual (es de sistema, no de feature).
- Sites estáticos sin sistema de tokens (no aplica el output).
- Proyectos en stacks distintos a Next/React + Tailwind+shadcn (el sistema propuesto asume ese stack; si difiere, declararlo y adaptar manualmente).

## Bootstrap

1. **Detectar stack**:
   - `package.json` para confirmar Next.js y React.
   - `tailwind.config.*` o `@import "tailwindcss"` en CSS para confirmar Tailwind v3 vs v4 (el sistema propuesto asume v4 con `@theme inline`).
   - `components.json` para shadcn/ui.
   - Si difiere, avisarle al usuario antes de seguir.

2. **Leer reglas del proyecto**:
   - `CLAUDE.md` del repo (guardrails, convenciones, scopes de commits).
   - `.planning/STATE.md` o equivalente si existe (decisiones recientes de UI que pueden afectar la propuesta).
   - El archivo de tokens central (`src/app/globals.css` en Next App Router, o equivalente).

3. **Detectar dev server**:
   - Probar `localhost:3000` y `localhost:3020` con `curl -sS -o /dev/null -w "%{http_code}"`.
   - Si no hay server corriendo, preguntar al usuario en qué puerto está o pedir que lo levante. **NUNCA matar procesos**.

4. **Definir rutas a capturar**: pedir al usuario la lista de rutas clave (home, hub, búsqueda, detalle, dashboard, etc.). Si no responde: arrancar con `/` más las rutas detectables en `app/`/`pages/`.

5. **Detectar coexistencia con SSOT externo**: si el `CLAUDE.md` declara que los tokens vienen clonados de otro repo (patrón ITERA: tools ⟵ saas), anotar para el anexo del reporte y discutir con el usuario si los tokens nuevos suben primero al SSOT.

## Workflow

1. **Capturar baseline visual** con `scripts/capture.mjs`. El script vive en este skill pero necesita correr desde un directorio con Playwright instalado (típicamente `<repo>/web/` o el package que tiene `playwright` como devDep). Configurable por env vars:
   - `APP_URL` (default `http://localhost:3020`)
   - `ROUTES` (CSV de paths)
   - `OUT_DIR` (default `/tmp/responsive-audit/shots`)
   - `WAIT_MS` (default `300`)
   - `FULL_PAGE` (default `false` — sólo first-fold para enfocarse en density)
   - `THEME` (`light` | `dark` | `both`; default `light`)
   - `THEME_MODE` (`emulate` | `class`; default `emulate` — usar `class` si el repo usa `next-themes` con `class="dark"` en `<html>`)
   - `INIT_SCRIPT` (path opcional a un .js que setea el theme antes del primer render, si el repo usa un setter distinto a `localStorage.theme`)

   Salida:
   - `THEME=light|dark` → 5N PNGs (un theme).
   - `THEME=both` → 10N PNGs (light + dark). Recomendado cuando el reporte va a incluir validación dark mode (§7 del template).

2. **Inspeccionar capturas críticas** (NO todas, ahorra context):
   - `1366×768` de la vista más densa: chequear apriete horizontal y vacío vertical.
   - `3840×2160` de vistas hero y de listado: chequear vacío lateral y tipografía minúscula.
   - `1440×900` y `1920×1080` solo si hay sospecha de regresión en el target dulce.
   - Confirmar la sospecha del usuario contra evidencia visual antes de seguir.

3. **Dibujar el árbol parent-child** de las secciones críticas. Para cada vista capturada (home, hub, search landing, search results, detail, dashboard), nombrar el contenedor padre y los hijos inmediatos con su rol y display (`flex`/`grid`/`block`). Esta lectura **debe venir antes del grep** porque el sistema de tokens propone valores sobre dimensiones de elementos que pertenecen a un árbol; sin árbol, las propuestas se vuelven juicio estético. Documentar como bullets en el reporte (sección §1.1).

4. **Grep sistemático del código** según `references/inspection-grep.md`. Patterns a buscar:
   - Arbitrary text sizes (`text-[Npx]`).
   - Control heights (`h-{8,9,10,11,12}`).
   - Max-widths arbitrary (`max-w-\[`).
   - Min/max-heights arbitrary (`(min|max)-h-\[`).
   - Grids que topean (`(sm|md|lg|xl|2xl):grid-cols-\d`).
   - Padding/spacing arbitrary (`(p|px|py|m|mx|my|gap|space-y|space-x)-\[`).
   - Tokens existentes en globals.css (`--app-header-h`, `--sidebar-width`, custom radius, etc.).
   - **Checks semánticos** (no son grep simple, requieren lectura): proximity (interno < externo), flex-vs-grid, breakpoints sin condición nombrada, mismatch entre features hermanas. Ver §S1-S5 de `inspection-grep.md`.

5. **Catalogar inconsistencias recorriendo el checklist exhaustivo** de `references/audit-checklist.md` (92 items en 14 ejes). **OBLIGATORIO** cubrir cada item — si no aplica al proyecto o no se puede evaluar, declarar `N/A — razón concreta` en el reporte. **NUNCA omitir un item en silencio**. Para cada finding, registrar `archivo:línea`. Sin línea concreta el finding NO entra.

   Los 14 ejes que el checklist obliga a cubrir:
   - §1 Captura baseline (5 res, light+dark si aplica, contenido extremo)
   - §2 Árbol parent-child de cada vista crítica (8 secciones)
   - §3 App shell dimensions (header / sidebar / main-max-w / paddings)
   - §4 Typography scale (display / h2 / body / meta / label / mono-xs)
   - §5 Line-height (tight / snug / normal / loose)
   - §6 Control heights (sm / md / lg + mismatch entre componentes)
   - §7 Icon system (sizes, stroke widths, gap icono-texto)
   - §8 Spacing scale (close / group / break / area + proximity + peso óptico)
   - §9 Grids (escalado por breakpoints, auto-fit vs semantic)
   - §10 Breakpoints custom (3xl, 4xl + condición que resuelven)
   - §11 Container queries (opt-in justificado)
   - §12 Validación con contenido extremo (título largo, número grande, lista densa, theme dark)
   - §13 Mismatch entre features hermanas
   - §14 Checks visuales por resolución (1366 → 4K)

6. **Diseñar el sistema de tokens** consultando `references/token-system.md`:
   - 6 protagonistas con `clamp()` — y NADA más.
   - 13 tokens nuevos del sistema base + spacing scale discreta (§11) + line-height (§12) + icon system (§13).
   - 2 breakpoints custom (`3xl: 1920px`, `4xl: 2560px`). **Cada breakpoint debe nombrar la condición que resuelve** (ver Guardrails).
   - Mapeo Tailwind v4 `@theme inline`.
   - Reglas de aplicación por eje (rem, clamp, vh/dvh, vw, container queries, breakpoints).

7. **Plan por fases** consultando `references/report-template.md`:
   - Fase 0 — baseline visual snapshot.
   - Fase 1 — tokens base sin tocar componentes (≤ 2h).
   - Fase 2 — migrar shell + grids (≤ 3h).
   - Fase 3 — unificar control heights (≤ 3h).
   - Fase 4 — tipografía fluida en protagonistas (≤ 2h).
   - Fase 5 — spacing escalable + cleanup (≤ 2h).
   - Fase 6 — opcional (container queries + density mode).

   Cada fase debe ser independiente, testeable y revertible. Cada fase termina con `pnpm typecheck && pnpm lint && pnpm build && pnpm test:smoke` (o equivalente del stack del repo) como gate.

8. **Escribir el reporte** según `references/report-template.md`:
   - 7 secciones canónicas.
   - Guardar en `<repo>/.planning/RESPONSIVE-AUDIT.md`. **Si ya existe, pedir confirmación o sugerir suffix `-vN.md`** — no sobrescribir audits previos.
   - Incluir checks visuales por resolución (sección 7).
   - Si hay SSOT externo, agregar "Anexo — Coexistencia con SaaS/SSOT" al final.

9. **Auto-check final ANTES de presentar el reporte**: releer `references/audit-checklist.md` punto por punto y confirmar que **cada uno de los 92 items** aparece en el reporte (ya sea con finding concreto o declarado como `N/A — razón`). Si falta alguno, volver a §5 del workflow y completarlo. **No presentar un reporte incompleto**.

## Output esperado

Reporte markdown con estas 7 secciones EXACTAS, en este orden:

1. **Diagnóstico general** — narrativa breve por resolución (qué se ve mal y por qué) + causa raíz en 4 ejes (shell rígido / tipografía ad-hoc / heights ad-hoc / grids sin breakpoints superiores).
2. **Problemas concretos (archivo:línea)** — findings con cita precisa, agrupados en categorías A-J.
3. **Tabla resumen de inconsistencias** — eje × estado actual × magnitud × impacto.
4. **Sistema de tokens responsive recomendado** — los 13 tokens, mapeo `@theme`, breakpoints, reglas por eje, grids por ruta.
5. **Qué NO conviene hacer** — los 10 anti-patrones con justificación corta.
6. **Plan de implementación por fases (bajo riesgo)** — Fases 0-6 con scope, archivos afectados y criterio de verificación.
7. **Checks visuales sugeridos por resolución** — qué validar a 1366 / 1440 / 1920 / 2560 / 3840 después de cada fase + validaciones cross-resolución.

Más:
- Path a los screenshots baseline (`/tmp/responsive-audit/shots/` o donde se haya guardado).
- Anexo opcional si hay SSOT externo.

**NO modificar código del proyecto** durante este skill. La aplicación es decisión del usuario después de leer el reporte; el skill termina cuando el reporte está en `.planning/RESPONSIVE-AUDIT.md`.

## Guardrails

- **Desktop-first, no mobile-first**. Si el usuario pide mobile-first, declarar que este skill no es el adecuado y no improvisar.
- **Evidencia o descarte**. Sin `archivo:línea` concreto el finding no entra al reporte.
- **No escalar TODO con `clamp()`/`vw`**. Sólo los 6 protagonistas listados en `references/token-system.md`. Si tentás expandir, releer `references/anti-patterns.md` antes.
- **Verificá el `clamp()` en el anchor, no confíes en el `min` ni en los coeficientes de ejemplo**. El `min` es el piso de pantallas chicas; el valor en 1366/1440 lo da `preferred`. Re-derivá la banda por proyecto y computá el valor en cada anchor (`token-system.md §2.1`). Coeficientes con banda mobile saturan y NO escalan en desktop (caso real: un `body` "13→15" dando 15px en 1366 y 15px en 2560).
- **El modo de consumo depende de si el archivo de tokens es root de Tailwind**. Tokens en un CSS satélite (aislado, importado desde un componente) tienen `@theme` inerte → consumir por arbitrary value (`text-[length:var(--x)]`, `min-[1920px]:`), no por utilities nombradas (`token-system.md §6.1`). Y no tokenizar el chrome del lab/galería (es andamiaje, no entregable).
- **No tocar paleta ni tokens semánticos existentes** (`--primary`, `--background`, surfaces, elevation, focus-ring, brand tokens). El skill es dimensional, no de color.
- **No crear el archivo del reporte sin chequear**. Si ya existe `.planning/RESPONSIVE-AUDIT.md`, preguntar al usuario antes de sobrescribir o usar suffix de versión.
- **No matar procesos** del dev server. Si no está corriendo, pedirle al usuario que lo levante.
- **No inventar tokens** que no estén en `references/token-system.md`. Si surge necesidad real, proponer la adición al token-system y validar con el usuario antes de meterla al reporte.
- **Coexistencia con SSOT**: si el repo es clon de tokens de otro repo (caso ITERA: `itera-lex-tools` ⟵ `itera-lex`), no proponer cambios locales sin avisar que deberían subir primero al SSOT. Documentar la coexistencia en el anexo del reporte.
- **Resoluciones canónicas**: 1366×768, 1440×900, 1920×1080, 2560×1440, 3840×2160. No agregar/sacar resoluciones sin razón concreta (más resoluciones = más capturas = más context, sin mejor cobertura). Si el cliente del proyecto usa un monitor exótico, agregar UNA específica.
- **Breakpoints DEBEN nombrar la condición que resuelven**. Cualquier breakpoint custom propuesto en el reporte (3xl, 4xl, o intermedios) debe responder a una condición observable: "el main sobra y las 3 cards quedan estiradas → habilitar 4ta columna", "la sidebar empuja el main → cambiar a layout 1-col", "el header pierde la search bar". Nada de "para pantallas grandes" / "para tablets".
- **Validar también con contenido extremo**: además de las capturas en 5 resoluciones, validar título largo, número grande, lista densa y label más largo del sidebar. La jerarquía no sirve si ignora datos reales.
- **Para mejorar jerarquía, bajar lo secundario antes que subir el principal**. Si una vista falta jerarquía, revisar `--muted-foreground`, `text-meta`, `text-mono-xs` antes de agrandar headings o engrosar pesos.
- **Árbol parent-child antes de proponer tokens**. Es paso obligatorio del workflow, no opcional. Documentar como §1.1 del reporte.
- **NO saltar ejes del checklist**. Si el análisis es "rápido" o "visual sin código", cada eje sigue siendo obligatorio — el "rápido" significa **menos profundidad por eje**, NO **menos ejes**. Los ejes que no apliquen se declaran `N/A — razón`.

## Resources

- **Checklist exhaustivo OBLIGATORIO (92 items en 14 ejes)**: `references/audit-checklist.md`
- Sistema canónico de tokens, breakpoints, reglas y mapeo `@theme inline`: `references/token-system.md`
- Patrones grep para detección sistemática de inconsistencias: `references/inspection-grep.md`
- Anti-patrones (qué NO hacer y por qué): `references/anti-patterns.md`
- Estructura del reporte (7 secciones canónicas con plantilla): `references/report-template.md`
- Script de captura multi-resolución parametrizable: `scripts/capture.mjs`
