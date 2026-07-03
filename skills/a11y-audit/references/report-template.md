# Estructura del reporte — plantilla canónica

Las 7 secciones que todo reporte de `a11y-audit` debe tener, en este orden. Path: `<repo>/.planning/A11Y-AUDIT.md` (o suffix `-vN.md` si ya existe).

---

## Encabezado mínimo

```markdown
# Auditoría de accesibilidad — <Nombre del proyecto>

**Fecha**: <YYYY-MM-DD>
**Scope**: a11y estructural (foco-visible / teclado / target sizes / landmarks / skip-link / aria estructural)
**Stack**: <Next.js o Laravel+Inertia, React, Tailwind v4, shadcn, lib de overlays>
**Objetivo**: todo operable con teclado, foco visible y consistente, landmarks + skip-link, target sizes suficientes — reusando los tokens de los otros dominios.

**Inventario baseline**: `node ~/.claude/skills/a11y-audit/scripts/a11y-inventory.mjs`.

**Estado**: no se modificó código. Plan previo a tocar.  (o, si se implementó en un lab aislado: cerrado en el UI-Lab; app viva se migra después)
```

---

## 1. Diagnóstico general

```markdown
## 1. Diagnóstico general

La app <lo que ya está bien: ej. shadcn trae foco, Radix trap, landmarks en el layout> pero <causa raíz: foco no aplicado a los interactivos hechos a mano / sin skip-link / targets chicos / aria estructural incompleto>.

| Eje | Cómo está |
|---|---|
| Foco visible | <token aplicado? interactivos hechos a mano? clipeado?> |
| Teclado / tab order | <todo operable? divs con onClick? orden lógico?> |
| Overlays | <Radix (trap gratis) o a mano?> |
| Target sizes | <piso definido? icon-buttons 24/28px?> |
| Landmarks | <main/nav/header? skip-link?> |
| Names / aria estructural | <icon-only con label? aria-current/expanded?> |

**Causa raíz** (4 ejes): 1. foco no aplicado a interactivos hechos a mano · 2. sin skip-link / landmarks incompletos · 3. targets chicos sin piso · 4. aria estructural escaso (no se redefine lo de Color/Motion/States).
```

### 1.1 Mapa de superficies de foco y teclado

```markdown
### 1.1 Mapa de superficies de foco y teclado

Para el shell y cada vista crítica: tab order, qué interactivos no muestran foco, dónde se clipea, comportamiento de overlays.

**App Shell (`.../app-shell.tsx`)**:
- tab order: skip-link → nav (sidebar) → header (búsqueda + acciones) → main. = DOM ✓.
- foco: NavLink/icon-buttons/footer hechos a mano → sin :focus-visible (finding). El sidebar tiene `overflow-hidden` → un ring se cliparía → variante inset.
- skip-link: ausente (finding §6).

**Listado (`.../Index.tsx`)**: acciones por fila como `<div onClick>` (finding §2). Overlay de detalle = Radix Dialog (trap ✓).

**<otra vista>**: …
```

---

## 2. Inventario de accesibilidad

```markdown
## 2. Inventario de accesibilidad

### Indicador de foco actual
- Token: `--focus-ring` <declarado / aplicado / neutralizado>. Mecanismo: <box-shadow ring (se clipea) / outline>.

### Usos por patrón
| Patrón | Ocurrencias | Notas |
|---|---|---|
| :focus-visible aplicado | N (M archivos) | shadcn ✓; hechos a mano ✗ |
| outline-none sin reemplazo | N | finding |
| <div/span onClick> | N | candidatos a <button> |
| aria-label | N | icon-only |
| aria-current | N | nav activo (bajo → finding) |
| aria-expanded | N | toggles |
| <main> / <nav> / <header> | N | landmarks |
| skip-link | N | <ausente?> |
| targets 24–28px (size-6/7) | N | piso |
| tabindex positivo | N | <0 = OK> |

### Overlays
- Lib: <Radix/shadcn Dialog> → focus trap + Escape + retorno de foco gratis (verificar). / overlay a mano (finding).
```

---

## 3. Findings concretos (archivo:línea)

```markdown
## 3. Findings concretos (archivo:línea)

### A. Foco no aplicado / anulado / clipeado
- `.../app-shell.tsx:90` — NavLink <a> sin :focus-visible.
- `tokens.css:92` — `--focus-ring` declarado pero nunca aplicado.
- `.../Card.tsx:14` — box-shadow ring dentro de overflow-hidden → se clipea.

### B. Teclado roto (div onClick / tab order)
- `.../Index.tsx:412` — <div onClick> abre detalle → debería ser <button>.

### C. Target sizes chicos
- `.../app-shell.tsx:266` — ActionIcon h-7 w-7 (28px) → subir a 32px (piso).

### D. Landmarks / skip-link
- `.../Layout.tsx` — sin skip-to-content. <main> presente ✓.

### E. Names / aria estructural
- `.../Topbar.tsx:42` — <Input> sin aria-label (solo placeholder).
- nav activo sin `aria-current` (N ocurrencias).

### F. Overlays
- `.../CustomModal.tsx` — overlay a mano sin trap/Escape (o: Radix ✓).

### G. <específicos del repo>
```

---

## 4. Sistema de accesibilidad recomendado

Copiar/adaptar de `references/a11y-system.md`:

```markdown
## 4. Sistema de accesibilidad recomendado

### 4.1 Foco visible (token-driven)
outline halo (espacio abierto) + variante inset (scroll-containers con clip). Reusa el focus token de Color. `:focus-visible`, no `:focus`.

### 4.2 Modelo de teclado
button (acción, Enter+Space) vs link (nav, Enter); tab order = DOM; sin tabindex positivo; composites con flechas (Radix).

### 4.3 Overlays
trap + Escape + retorno de foco vía la lib (verificar, no reimplementar).

### 4.4 Target sizes
piso 32px (= control-sm) para icon-buttons; 44px (= control-lg) para CTA. Reusa control-heights.

### 4.5 Landmarks + skip-link
header/nav(aria-label)/main(id, tabindex -1); skip-link primer tabulable.

### 4.6 Aria estructural
aria-label (icon-only) · label (inputs) · aria-current (nav) · aria-expanded (toggles).

### 4.7 Reuso / seam
focus token ← Color · control-heights ← Sizing · NO redefine contraste de texto (Color) / reduced-motion (Motion) / aria de estado (States).
```

---

## 5. Qué NO conviene hacer

Lista de `references/anti-patterns.md` con el por qué corto:

```markdown
## 5. Qué NO conviene hacer

1. **Interactivo sin foco visible** → :focus-visible en todo.
2. **outline:none sin reemplazo** → rompe el teclado.
3. **Indicador que se clipea** → outline / inset, no box-shadow ring en scroll-containers.
4. **<div onClick> para acciones** → <button>.
5. **tabindex positivo** → tab order = DOM.
6. **Sin skip-to-content** → tabular todo el sidebar.
7. **Icon-only sin aria-label** → botón anónimo.
8. **Placeholder como label** → <label>/aria-label.
9. **Focus trap a mano** → usar la lib (Radix).
10. **Landmarks rotos** (varios main, nav sin label).
11. **Redefinir contraste/reduced-motion/aria-de-estado** → seam (Color/Motion/States).
12. **Auditar solo leyendo** → validar con teclado.
```

---

## 6. Plan de implementación por fases

```markdown
## 6. Plan de implementación por fases

### Fase 0 — Inventario baseline (hecho)
### Fase 1 — Foco-visible token-driven aplicado a TODO interactivo (+ variante inset) (≤ 1.5h)
### Fase 2 — Target sizes al piso del sistema (≤ 1h)
### Fase 3 — Landmarks + skip-link en el shell (≤ 1h)
### Fase 4 — Names/labels/roles (aria-label, aria-current, aria-expanded, labels de inputs) (≤ 1.5h)
### Fase 5 — <div onClick> → <button> + verificación de overlays + cleanup (≤ 2h)
### Fase 6 (opcional) — primitivas (<SkipLink>, hook de focus-return) + lint `eslint-plugin-jsx-a11y`

**Riesgo**: bajo. Fase 1 es CSS + clases; el resto es aislable y revertible.
```

---

## 7. Checks de validación

```markdown
## 7. Checks de validación

Auditar CON TECLADO (no alcanza con leer):
- **Tab por el shell**: foco visible y orden lógico (skip-link → nav → header → main).
- **Skip-link**: primer Tab → Enter → salta al contenido.
- **Foco visible**: cada interactivo muestra el indicador; no se clipea en el sidebar; visible en light **y** dark.
- **Overlays**: abrir modal → Tab atrapado → Escape cierra → foco vuelve al disparador.
- **Target sizes**: icon-buttons ≥ piso; CTAs a 44px.
- **Names**: con lector de pantalla (si se puede), icon-only y nav se anuncian; landmarks navegables.
- **High Contrast Mode** (si se puede): el foco sobrevive.
```

---

## Notas finales

- Español rioplatense si el repo lo usa. Inglés en código.
- Cada finding cita `archivo:línea`.
- Tamaño objetivo: 250–400 líneas.

## Anexo — seam con los otros dominios

```markdown
## Anexo — relación con los otros dominios

A11y es la capa estructural: reusa el focus token (Color) y los control-heights (Sizing), y declara qué NO toca — contraste de texto (Color), reduced-motion (Motion), aria DE ESTADO (States). El skill `a11y-audit` documenta el método; este reporte es el output repo-specific.
```

## Auto-check final OBLIGATORIO

Releer `references/audit-checklist.md` y confirmar que **cada uno de los 53 items** aparece (finding o `N/A — razón`). Atención a §1.2/§1.5 (interactivos hechos a mano sin foco, ring clipeado), §3 (overlays — abrir y tabular), §5.5 (`<div onClick>`), §8 (seam — no pisar Color/Motion/States), §9 (validar con teclado).
