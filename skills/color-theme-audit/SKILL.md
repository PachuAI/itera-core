---
name: color-theme-audit
description: Auditar el sistema de color y temas (dark/light) de un frontend Next.js + React + Tailwind v4 + shadcn. Detecta roles funcionales ausentes (background, surface, raised surface, text primary/muted, border, primary, semantic states), colores hardcoded sin función (text-emerald-500, bg-amber-400, hex literales), inconsistencias entre dark y light mode (cards que se "amarronan", muted-foreground sin contraste, sombras que se pierden), surfaces planas sin sistema de elevation, mezcla de formatos (hex / rgb / hsl / oklch sin criterio) y contraste WCAG insuficiente. Propone un sistema unificado de tokens semánticos por rol, dark+light como pares calibrados (NO inversión automática), surfaces con shell-receding + card POP, elevation 1/2/3 + inset highlight, y semantic colors success/warning/destructive/info con valores diferenciados por tema. Usar siempre que el usuario pida "auditar el sistema de colores", "estandarizar dark mode y light mode", "tokens semánticos", "paleta funcional", "WCAG AA contrast", "colores con roles", "surfaces con elevation", "tema claro vs oscuro inconsistente", "cards amarronadas en dark", "/color-theme-audit", o cuando un proyecto tiene colores ad-hoc dispersos sin sistema funcional, dark mode improvisado por inversión, o jerarquía visual chata por falta de elevation.
---

# Color & Theme Audit

Auditoría sistemática del sistema de color de un frontend para que sea **funcional, no decorativo**: cada color cumple un rol (lectura, acción, jerarquía, estado, profundidad), dark y light mode son pares calibrados con la misma lógica, y la paleta sobrevive cambios de tema sin reinventar tokens.

El método separa **diagnóstico** (este skill) de **aplicación** (decisión del usuario fase a fase). Como `responsive-audit`, no toca código; entrega un reporte en `.planning/COLOR-THEME-AUDIT.md` con plan por fases revertibles.

Este skill es **dimensional al eje color**. NO ajusta layout, typography size, ni spacing — esos viven en `responsive-audit`. Son complementarios.

## Cuándo usar

- Proyecto con paleta improvisada: hex / rgb / hsl / oklch mezclados sin sistema.
- Dark mode "por inversión automática" donde algunas cards quedan amarronadas, sombras invisibles, borders demasiado fuertes o débiles.
- Colores semánticos (success/warning/error) renderizados con utility classes Tailwind directos (`text-emerald-500`, `bg-amber-500/15`) en vez de tokens.
- Jerarquía visual chata: todo en el mismo plano, falta sensación de "qué está arriba / qué está hundido / qué es interactivo".
- Texto secundario (`muted-foreground`) demasiado oscuro en dark mode o demasiado claro en light mode.
- Acentos de marca aplicados sin contraste validado contra el fondo o sobre estados interactivos.
- Antes de extender el portal a producción donde cumplir WCAG AA / AAA es un requisito.

## Cuándo NO usar

- Cambios de paleta / rebranding total. El skill estandariza la paleta existente; no la reemplaza.
- Diseño desde cero (sin proyecto target). Para eso, `frontend-design` o `brandboard-creator`.
- Animaciones / motion / micro-interacciones — eso vive en otros skills.
- Solo accesibilidad sin tocar tokens (ej: corregir un label faltante). Es ortogonal.

## Bootstrap

1. **Detectar stack y archivos de color**:
   - Tailwind v4: `globals.css` con `@theme inline` + `:root` / `.dark`.
   - Tailwind v3: `tailwind.config.{ts,js}` con `theme.extend.colors`.
   - Plain CSS: archivos con CSS variables (`--bg`, `--color-*`).
   - Si NO es Next/React+Tailwind, advertir antes de seguir.

2. **Leer reglas del proyecto**:
   - `CLAUDE.md` del repo (guardrails, brand tokens declarados).
   - `.planning/STATE.md` o equivalente si existe (decisiones recientes de color).
   - SSOT del color (`docs/brand.md` o equivalente) si convive con otro repo.

3. **Detectar dev server** (igual que responsive-audit). NUNCA matar procesos.

4. **Definir rutas a capturar**. Idealmente las mismas que `responsive-audit` para reusar el inventario visual. Para color basta una resolución (1440 o 1920); lo crítico es repetir cada vista en **light + dark**.

5. **Detectar coexistencia con SSOT externo**: tokens semánticos suelen pertenecer al SSOT. Anotar para anexo del reporte.

## Workflow

1. **Capturar baseline visual light + dark** con `scripts/theme-capture.mjs`. Configurable por env vars:
   - `APP_URL` (default `http://localhost:3020`)
   - `ROUTES` (CSV de paths)
   - `OUT_DIR` (default `/tmp/color-theme-audit/shots`)
   - `RESOLUTION` (default `1920x1080` — para color basta una; el responsive-audit ya cubrió el rango)
   - `THEME_TOGGLE` (default automático: setea `prefers-color-scheme: dark` para captura dark; si el sitio usa `class="dark"` en `<html>`, el script lo aplica via cookie/localStorage según el patrón del repo)

   Salida: 2 PNGs por ruta (`<slug>__light.png` y `<slug>__dark.png`).

2. **Comparar light vs dark por vista**. Para cada par:
   - ¿Las cards mantienen su jerarquía relativa al fondo en ambos modos?
   - ¿El texto muted es legible (contraste ≥ 4.5:1) en ambos?
   - ¿Las sombras se ven en light y dark? (En dark, sombras necesitan más alpha.)
   - ¿Los semantic colors (success/warning/destructive) se reconocen en ambos?
   - ¿El acento de marca tiene el mismo "weight" perceptual?

3. **Catalogar findings recorriendo el checklist exhaustivo** de `references/audit-checklist.md` (75 items en 11 ejes). **OBLIGATORIO** cubrir cada item — si no aplica al proyecto o no se puede evaluar (ej: solo análisis visual sin código), declarar `N/A — razón concreta` en el reporte. **NUNCA omitir un item en silencio**.

   Los 11 ejes que el checklist obliga a cubrir:
   - §1 Inventario de capas perceptuales (light + dark + comparativa)
   - §2 Roles funcionales declarados u observados (16 tokens canónicos)
   - §3 Semantic colors (success/warning/destructive/info)
   - §4 Elevation y profundidad (1/2/3 + inset highlight + sombras)
   - §5 Brand y CTAs (primary + hover + subtle + glow)
   - §6 Focus visible (2 capas, alpha calibrado)
   - §7 Construcción del par dark/light (no inversión automática)
   - §8 Mezcla de formatos y dispersión (oklch/hsl/hex, hardcoded, dark:literales)
   - §9 WCAG (10 pares mínimos a medir con `wcag-check.mjs`)
   - §10 Estados interactivos (hover/active/disabled)
   - §11 Asimetrías cross-mode (misma capa, mismo weight, mismo tratamiento)

   Apoyos por categoría: `references/color-system.md`, `references/elevation-surfaces.md`, `references/inspection-grep.md`.

4. **Diseñar el sistema** consultando `references/color-system.md`:
   - **Roles canónicos** (background, surface, card, card-base, dialog, popover, text primary, text muted, border, primary, accent, semantic states, focus-ring, etc.).
   - **Dark y light como pares calibrados** — NO inversión automática `100 - L`. Cada par se ajusta por física visual (las superficies altas son MÁS claras en dark, MÁS oscuras en light).
   - **Surfaces v4.4**: shell-receding pattern (sidebar/header receden, main toma luz, cards POP). Detallado en `elevation-surfaces.md`.
   - **Elevation 1/2/3 + inset top highlight** como sistema unificado de profundidad.
   - **Semantic colors**: success/warning/destructive/info con foreground propio + valores diferenciados por tema.
   - **OKLCH preferido sobre HSL** para chroma estable en escalas perceptuales; HEX solo para legacy.

5. **Plan por fases** consultando `references/report-template.md`:
   - Fase 0 — snapshot baseline light+dark.
   - Fase 1 — declarar roles canónicos en `globals.css` sin tocar componentes.
   - Fase 2 — migrar utility classes hardcoded → tokens semánticos (search-and-replace dirigido).
   - Fase 3 — calibrar dark+light por superficie (no inversión).
   - Fase 4 — elevation system + inset highlight + focus-ring tokens.
   - Fase 5 — semantic colors con foreground propio.
   - Fase 6 — opcional: OKLCH migration si el repo está en HSL/HEX.

6. **Escribir el reporte** según `references/report-template.md`. Guardar en `<repo>/.planning/COLOR-THEME-AUDIT.md`. **Si ya existe, pedir confirmación o sugerir suffix `-vN.md`**.

7. **Auto-check final ANTES de presentar el reporte**: releer `references/audit-checklist.md` punto por punto y confirmar que **cada uno de los 75 items** aparece en el reporte (ya sea con finding concreto o declarado como `N/A — razón`). Si falta alguno, volver a §3 del workflow y completarlo. **No presentar un reporte incompleto**.

## Output esperado

Reporte markdown con estas 7 secciones canónicas:

1. **Diagnóstico general** — qué se ve mal en light y en dark, causa raíz en 4 ejes (roles ausentes / colores hardcoded / dark inversión sin criterio / surfaces planas).
2. **Inventario de tokens actuales** — qué roles declara el sistema, cuáles faltan, cuáles están duplicados.
3. **Findings concretos (archivo:línea)** — categorías A-G de inconsistencias.
4. **Sistema de roles y tokens recomendado** — paleta de roles canónicos + tabla dark/light + mapeo `@theme inline`.
5. **Qué NO conviene hacer** — anti-patrones con justificación.
6. **Plan de implementación por fases** — Fases 0-6.
7. **Checks visuales sugeridos** — qué validar en light y en dark después de cada fase + WCAG AA gates.

Más: anexo opcional si hay SSOT externo.

**NO modificar código del proyecto** durante este skill. Termina cuando el reporte está en `.planning/COLOR-THEME-AUDIT.md`.

## Guardrails

- **Color como SISTEMA, no como gusto**. Cualquier propuesta de cambio se justifica por rol, no por "queda más lindo".
- **Dark y light como pares CALIBRADOS, no inversión automática**. El video 06 (Whosajid) lo dice claro: restar L de 100 es punto de partida, no resultado. Las superficies altas son más claras en dark y más oscuras en light (depth invertida).
- **Evidencia o descarte**. Sin `archivo:línea` concreto el finding no entra.
- **NO mezclar este skill con cambios dimensionales** (typography size, spacing, layout). Esos pertenecen a `responsive-audit`. Si surge necesidad cruzada, documentarla pero no aplicarla.
- **NO inventar roles que no estén en `color-system.md`**. Si surge necesidad real (ej: `--marketing-glass`, `--folder-card-hover` del caso ÍTERA), proponer la adición al token-system primero.
- **NO crear el archivo sin chequear si ya existe**.
- **NO matar procesos** del dev server.
- **WCAG AA como mínimo no negociable** para body text + interactive states. Si una propuesta no llega a 4.5:1 (body) o 3:1 (text-large/UI), revisarla antes de meterla al reporte.
- **Foreground viene siempre con su background**. Nunca proponer un `--text-on-X` sin declarar contra qué `--X` se mide su contraste.
- **Acentos de marca NO son semantic colors**. El `--itera`/`--primary` comunica acción; `--success` comunica estado positivo. Mezclarlos vuelve ambiguos botones y mensajes.
- **Si el repo es clon de un SSOT externo**, los tokens nuevos suben primero al SSOT.
- **NO saltar ejes del checklist**. Si el análisis es "rápido" o "visual sin código", cada eje sigue siendo obligatorio — el "rápido" significa **menos profundidad por eje**, NO **menos ejes**. Los ejes que no apliquen se declaran `N/A — razón`.
- **El inventario de capas perceptuales (§1 del checklist) es el primer eje siempre**. No es opcional. No se infiere de otros findings. Se enumera explícitamente con L estimado + delta + rol por cada capa visible en cada modo.

## Resources

- **Checklist exhaustivo OBLIGATORIO (76 items en 11 ejes)**: `references/audit-checklist.md`
- Roles funcionales canónicos, paleta dark+light y mapeo `@theme inline`: `references/color-system.md`
- Elevation, surfaces (shell-receding + card POP), inset highlight, glow CTA: `references/elevation-surfaces.md`
- Patrones grep + checks semánticos para detección de inconsistencias: `references/inspection-grep.md`
- Anti-patrones (qué NO hacer y por qué): `references/anti-patterns.md`
- Estructura del reporte (7 secciones canónicas con plantilla): `references/report-template.md`
- Script de captura light + dark: `scripts/theme-capture.mjs`
- **Script de muestreo de píxeles** (OBLIGATORIO para §1 del checklist): `scripts/sample-layers.mjs` — toma una PNG + lista de puntos `label:x,y` y devuelve sRGB + oklch del pixel (promedio 9×9 por defecto). Permite **medir** las capas de profundidad en lugar de inferirlas desde el CSS. Requiere `sharp` en el cwd (`pnpm add -D sharp` si no está).
  - Uso: `PNG=shot.png SAMPLES="sidebar:50,400;bg:700,400;card:1700,260" node ~/.claude/skills/color-theme-audit/scripts/sample-layers.mjs`
  - Env: `REGION_SIZE` (default 9), `FORMAT` (`table` | `json`).
- **Script de auditoría WCAG**: `scripts/wcag-check.mjs` — parsea `globals.css`, extrae pares canónicos foreground+background (background/foreground, card/card-foreground, primary/primary-foreground, semantic states, sidebar, etc.) + custom pairs (`--itera/--itera-foreground` y similares), calcula contraste OKLCH→sRGB y reporta AA/AAA pass/fail por modo (light + dark). Sin npm install — todo nativo Node.
  - Uso típico: `CSS_PATH=src/app/globals.css node ~/.claude/skills/color-theme-audit/scripts/wcag-check.mjs`
  - Env vars: `CSS_PATH`, `THRESHOLD_AA` (default 4.5), `THRESHOLD_UI` (default 3.0), `SHOW_PASS` (default false — solo imprime fails; pass va al resumen).
  - Exit code 1 si hay fails (útil para CI gate).
