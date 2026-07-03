---
name: a11y-audit
description: Auditar la accesibilidad ESTRUCTURAL de un admin panel React (Next.js o Laravel+Inertia) + Tailwind v4 + shadcn, y proponer un sistema de foco-visible + patrones de teclado/landmarks + tokens chicos. Detecta foco-visible ausente o inconsistente (interactivos hechos a mano sin :focus-visible, outline:none sin reemplazo, ring genérico de shadcn neutralizado por overrides, indicador clipeado dentro de scroll-containers como el sidebar), navegación por teclado rota (div/span con onClick en vez de button, tab order ilógico, positive tabindex, keyboard traps, composites sin flechas), focus management de overlays (modal/drawer sin focus trap, sin Escape, foco que no vuelve al disparador), target sizes chicos (icon-buttons < 24px AA / < 44px AAA, sin piso del sistema, targets pegados), HTML no semántico y landmarks ausentes (sin header/nav/main, varios main, nav sin etiqueta, headings desordenados, listas con divs), skip-to-content faltante, y nombres/roles/aria estructural ausentes (icon-only sin aria-label, inputs sin label asociado, nav activo sin aria-current, toggles sin aria-expanded, imágenes sin alt). Propone un indicador de foco token-driven consistente (outline halo + inset para contenedores con clip, reusando el focus token y los control-heights existentes), un modelo de teclado (button vs link, tab order = DOM, trap+Escape vía la lib de overlays), un piso de target size, landmarks + skip-link, y un plan por fases revertible. Declara el SEAM explícito: el contraste WCAG de texto es del dominio Color (color-theme-audit), reduced-motion es de Motion (motion-audit), y el aria DE ESTADO (aria-busy/disabled/invalid, role=status/alert) es de States (states-audit) — A11y cubre foco-visible, teclado, target sizes, landmarks, skip-link y aria estructural, NO los redefine. Usar siempre que el usuario pida "auditar accesibilidad", "a11y", "focus visible", "anillo de foco", "navegación por teclado", "keyboard navigation", "tab order", "orden de tabulación", "focus trap", "atrapar el foco en el modal", "Escape cierra el modal", "target sizes", "área de click mínima", "44px", "landmarks", "header/nav/main", "skip to content", "saltar al contenido", "skip link", "aria-label", "labels accesibles", "lector de pantalla", "screen reader", "WCAG teclado", "/a11y-audit", o antes de cerrar el dominio de accesibilidad de un design system nuevo (caso ITERA: UI-Lab con tokens propios).
---

# A11y Audit (foco-visible / teclado / target sizes / landmarks / aria estructural)

Auditoría sistemática de la **accesibilidad estructural** de un frontend para que **todo lo que se puede hacer con el mouse se pueda hacer con el teclado**, con un **indicador de foco visible y consistente**, **target sizes** suficientes, **landmarks** y un **skip-to-content** — sin reinventar lo que ya resolvieron los otros dominios.

El método separa **diagnóstico** (este skill) de **aplicación** (decisión del usuario fase a fase). Como el resto de la familia (`color-theme-audit`, `responsive-audit`, `motion-audit`, `states-audit`), no toca código; entrega un reporte en `.planning/A11Y-AUDIT.md` con plan por fases revertibles.

A11y es la **última fundación** antes de las pantallas. Es un dominio **de composición** (más patrón que token): se apoya en los otros y **declara un seam explícito**. NO redefine el contraste WCAG de texto (Color), ni reduced-motion (Motion), ni el aria DE ESTADO (States). Cubre el aria **estructural** (labels, roles, landmarks, `aria-current`, `aria-expanded`), el **foco-visible**, el **teclado**, los **target sizes** y el **skip-link**. Casi siempre **APLICA** tokens que ya existen (el focus token, los control-heights) en vez de crear nuevos.

## Cuándo usar

- Los interactivos hechos a mano (`<a>`/`<button>` con clases propias) no muestran foco al tabular.
- Hay `outline:none` / `outline-0` sin un reemplazo visible (`:focus-visible` propio).
- El ring de foco existe como token pero **no está aplicado**, o lo neutralizó un override de sombra.
- El anillo de foco se **clipea** dentro de un scroll-container (sidebar, celda de tabla con `overflow-hidden`).
- Hay `<div onClick>` / `<span onClick>` que deberían ser `<button>` (no operables con teclado).
- Modales/drawers sin focus trap, sin Escape, o el foco no vuelve al disparador al cerrar.
- Icon-buttons de 24–28px sin piso de target; targets pegados sin separación.
- No hay `<main>` / `<nav>` / `<header>`, hay varios `<main>`, o la nav no está etiquetada.
- No hay skip-to-content (el teclado tiene que tabular todo el sidebar para llegar al contenido).
- Icon-only sin `aria-label`, inputs sin `<label>` asociado, nav activo sin `aria-current`.
- Antes de cerrar el dominio A11y de un design system nuevo (caso ITERA: UI-Lab con tokens propios).

## Cuándo NO usar

- **Contraste WCAG de texto** (qué `muted-foreground` pasa 4.5:1) → `color-theme-audit`. A11y verifica el contraste del **indicador de foco** (≥3:1), no recalcula el de texto.
- **reduced-motion** / timing de animaciones → `motion-audit`.
- **aria DE ESTADO** (`aria-busy`, `aria-disabled`, `aria-invalid`, `role=status`, `role=alert`) → `states-audit`. A11y cubre el aria **estructural** (labels, roles, landmarks, `aria-current`, `aria-expanded`).
- **Tamaños / tipografía / layout** en general → `responsive-audit` (A11y solo fija el **piso** de target size, reusando los control-heights).
- Lógica de negocio / data-fetching — no es presentación accesible.

## Bootstrap

1. **Detectar stack y dónde vive el foco/teclado**:
   - El componente o token de foco existente (`--focus-ring`, `--ring`, `focus-visible:` en shadcn) y si está **aplicado**.
   - Los control-heights del dominio Sizing (base de los target sizes).
   - La librería de overlays (Radix/shadcn Dialog, Headless UI) — suele traer focus trap + Escape **gratis**: A11y lo **verifica**, no lo reimplementa.
   - El shell (sidebar + topbar + main): landmarks, tab order, skip-link.
   - Si NO es React + Tailwind + shadcn (o equivalente con `:focus-visible`), advertir antes de seguir.

2. **Leer reglas del proyecto**: `CLAUDE.md`, `.planning/STATE.md`, y los reportes hermanos — sobre todo `COLOR-THEME-AUDIT.md` (de ahí salen el focus token y el contraste), `STATES-AUDIT.md` (aria DE ESTADO, para no pisarlo) y `MOTION-AUDIT.md` (reduced-motion del foco).

3. **Detectar dev server** (igual que los hermanos). NUNCA matar procesos. Útil para validar con **teclado real** (no se puede auditar a11y solo leyendo).

4. **Definir las superficies a auditar**: el shell (sidebar/topbar/main), los listados (tabla + acciones por fila), los formularios (modales), y los overlays (dialog/drawer/dropdown/select). Pedir las vistas clave si hay dudas.

5. **Detectar coexistencia con SSOT externo**: si los tokens/primitivas vienen clonados de otro repo (UI-Lab aislado, paquete compartido), anotar para el anexo.

## Workflow

1. **Inventario de la accesibilidad** con `scripts/a11y-inventory.mjs` (o Grep según `references/inspection-grep.md`). Cuenta y ubica: `:focus-visible` aplicado vs `outline-none` sin reemplazo, `<div/span onClick>` (interactivos no-semánticos), `aria-label`/`aria-current`/`aria-expanded`, landmarks (`<main>/<nav>/<header>`), skip-link/`sr-only`, `tabIndex` positivos, y los **targets chicos** (`size-6/7`, `h-7 w-7`).

2. **Mapear las superficies de foco y teclado** de las vistas críticas. Para el shell y cada vista, describir: el **tab order** (¿= DOM? ¿lógico?), qué interactivos **no** muestran foco, dónde se **clipea** el indicador, y cómo se comporta cada overlay (trap + Escape + retorno de foco). Esto es el análogo de la "máquina de estado" de States. Documentar en §1.1 del reporte.

3. **Catalogar findings recorriendo el checklist exhaustivo** de `references/audit-checklist.md` (los 9 ejes). **OBLIGATORIO** cubrir cada item — si no aplica o no se puede evaluar, declarar `N/A — razón concreta`. **NUNCA omitir un item en silencio**. Cada finding con `archivo:línea`.

   Los 9 ejes:
   - §1 Foco visible (indicador en TODO interactivo, sin `outline:none` huérfano, contraste ≥3:1, consistente, no clipeado)
   - §2 Navegación por teclado / tab order (operable, orden = DOM, sin positive tabindex, sin traps, Enter/Space)
   - §3 Focus management de overlays (trap, Escape, retorno de foco al disparador, foco inicial sensato)
   - §4 Target sizes (≥24px AA / 44px AAA, piso del sistema, separación entre targets chicos)
   - §5 HTML semántico + landmarks (header/nav/main/aside, un solo main, headings jerárquicos, button vs link, no `<div onClick>`)
   - §6 Skip-to-content (existe, primer tabulable, destino focusable, visible al foco)
   - §7 Names / labels / roles (icon-only con aria-label, input con label, alt, aria-current, aria-expanded)
   - §8 Reuso / seam (no redefine contraste/reduced-motion/aria-de-estado; reusa focus token + control-heights; modo de consumo)
   - §9 Verificación con teclado/AT (probado con Tab real, lector de pantalla si se puede, High Contrast Mode)

4. **Diseñar el sistema** consultando `references/a11y-system.md`:
   - Indicador de foco token-driven (outline halo + variante inset para contenedores con clip), reusando el focus token.
   - Modelo de teclado (button vs link, tab order = DOM, trap+Escape vía la lib de overlays).
   - Piso de target size reusando los control-heights.
   - Landmarks + skip-link.
   - Aria estructural por patrón (label / current / expanded / roles).
   - El seam: qué reusa de Color/Motion/States y qué NO redefine.

5. **Plan por fases** consultando `references/report-template.md`:
   - Fase 0 — inventario baseline.
   - Fase 1 — foco-visible token-driven aplicado a TODO interactivo (+ variante inset).
   - Fase 2 — target sizes al piso del sistema.
   - Fase 3 — landmarks + skip-link en el shell.
   - Fase 4 — names/labels/roles (aria-label, aria-current, aria-expanded, labels de inputs).
   - Fase 5 — `<div onClick>` → `<button>` / teclado + verificación de overlays + cleanup.
   - Fase 6 — opcional (primitivas `<SkipLink>`, hook de focus-return, lint a11y `eslint-plugin-jsx-a11y`).

6. **Escribir el reporte** según `references/report-template.md`. Guardar en `<repo>/.planning/A11Y-AUDIT.md`. **Si ya existe, pedir confirmación o sugerir suffix `-vN.md`**.

7. **Auto-check final ANTES de presentar**: releer `references/audit-checklist.md` punto por punto. Cada item con finding o `N/A — razón`. **No presentar un reporte incompleto**.

## Output esperado

Reporte markdown con 7 secciones canónicas:

1. **Diagnóstico general** — qué falta (foco no aplicado / teclado roto / sin landmarks / sin skip-link / targets chicos), causa raíz en 4 ejes. + §1.1 mapa de superficies de foco/teclado de las vistas críticas.
2. **Inventario de accesibilidad** — tabla de patrones con `archivo:línea`; indicador de foco actual; lib de overlays (focus trap).
3. **Findings concretos (archivo:línea)** — categorías A–G.
4. **Sistema de accesibilidad recomendado** — foco token-driven, modelo de teclado, target floor, landmarks/skip-link, aria estructural, reuso/seam.
5. **Qué NO conviene hacer** — anti-patrones con justificación.
6. **Plan de implementación por fases** — Fases 0–6.
7. **Checks de validación** — cómo verificar CON TECLADO (Tab por el shell, skip-link, Escape en overlays, foco visible en light+dark, High Contrast Mode).

Más: anexo con el **seam explícito** (qué reusa de cada dominio) y SSOT externo si lo hay.

**NO modificar código del proyecto** durante este skill. Termina cuando el reporte está en `.planning/A11Y-AUDIT.md`.

## Guardrails

- **APLICAR, no redefinir.** A11y casi siempre **aplica** tokens que ya existen (el focus token de Color, los control-heights de Sizing) en vez de crear nuevos. Si te encontrás minteando una escala de tamaños o un color de foco nuevo, pará: probablemente pertenece a otro dominio.
- **El seam es ley.** Contraste WCAG de texto = Color. reduced-motion = Motion. aria DE ESTADO (`aria-busy/disabled/invalid`, `role=status/alert`) = States. A11y cubre el aria **estructural** (label/current/expanded/roles), foco, teclado, targets, landmarks, skip-link. Declarar el seam en el reporte y NO pisar lo de los otros.
- **Foco visible en TODO interactivo.** Cada `<a>`, `<button>`, control de menú, tab y elemento operable necesita un `:focus-visible` visible. Un interactivo sin indicador de foco es finding, no detalle.
- **Nunca `outline:none` sin reemplazo.** Matar el outline sin un `:focus-visible` propio es romper el teclado. `outline:none` solo es válido acompañado de un indicador alternativo.
- **El indicador no se clipea.** Un box-shadow ring dentro de un `overflow-hidden` (sidebar, celda de tabla) se corta → no se ve. Preferir `outline` (token-driven); en contenedores con clip, usar la **variante inset** (offset negativo). Es eje propio (§1).
- **Teclado = mouse.** Todo lo accionable con click se acciona con teclado. `<div onClick>` / `<span onClick>` sin `role`+`tabindex`+handler de teclado es finding → debería ser `<button>`. button activa con Enter Y Space; link con Enter.
- **Tab order = DOM.** El orden de tabulación sigue el orden del DOM. Nada de `tabindex` positivo (rompe el orden global). Skip-link para saltar bloques largos (sidebar).
- **Overlays: trap + Escape + retorno.** Modal/drawer atrapa el foco, cierra con Escape y **devuelve el foco al disparador**. Si usás Radix/Headless UI, lo trae gratis → **verificar**, no reimplementar. Si es un overlay hecho a mano, es finding.
- **Target floor reusando control-heights.** El piso de área de click sale de los control-heights existentes (ej. `control-sm` = 32px ≥ 24px AA; `control-lg` = 44px AAA), NO de una escala nueva. Icon-buttons al piso; targets chicos con separación.
- **Landmarks + un solo main.** `<header>`/`<nav>`/`<main>` presentes; un único `<main>`; varias `<nav>` etiquetadas (`aria-label`); headings jerárquicos sin saltos.
- **Names obligatorios.** Icon-only con `aria-label`. Inputs con `<label htmlFor>` o `aria-label`. Imágenes con `alt`. Nav activo con `aria-current`. Toggles con `aria-expanded`.
- **Auditar con teclado, no solo leyendo.** La a11y se valida tabulando de verdad (foco visible, orden, skip-link, Escape). El grep encuentra candidatos; el teclado confirma.
- **Evidencia o descarte.** Sin `archivo:línea` el finding no entra.
- **Tokens chicos.** A11y tokeniza poco: el foco (color/ancho/offset, casi siempre reusando el de Color) y el target floor (= control-height). No inventar una constelación.
- **Modo de consumo** según root de Tailwind vs CSS satélite (arbitrary value si aislado) — igual que los hermanos.
- **NO crear el archivo del reporte sin chequear** si ya existe. **NO matar procesos.**
- **NO saltar ejes del checklist.** "Rápido" = menos profundidad por eje, NO menos ejes. Los que no apliquen se declaran `N/A — razón`.

## Resources

- **Checklist exhaustivo OBLIGATORIO (9 ejes)**: `references/audit-checklist.md`
- Sistema canónico: foco token-driven, modelo de teclado, target floor, landmarks/skip-link, aria estructural, seam: `references/a11y-system.md`
- Patrones grep + checks semánticos (qué buscar y qué NO infiere el grep): `references/inspection-grep.md`
- Anti-patrones (qué NO hacer y por qué): `references/anti-patterns.md`
- Estructura del reporte (7 secciones canónicas): `references/report-template.md`
- Script de inventario de a11y (foco / onClick no-semántico / aria / landmarks / skip-link / targets chicos): `scripts/a11y-inventory.mjs`
  - Uso: `node ~/.claude/skills/a11y-audit/scripts/a11y-inventory.mjs` desde la raíz del repo.
  - Env: `ROOT` (default `.`), `GLOBS` (CSV, default `resources,src,app,components`), `FORMAT` (`table` | `json`).
