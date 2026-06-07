# Checklist exhaustivo — color-theme-audit

**OBLIGATORIO**: completar **cada item** antes de cerrar el reporte. Si un item no aplica al proyecto o no se puede evaluar (ej: solo análisis visual sin código), declararlo explícitamente como `N/A — razón concreta` en el reporte. **NUNCA omitir un item en silencio**.

Antes de declarar el audit terminado, hacer auto-check: releer este archivo punto por punto y confirmar que cada item está cubierto en el reporte.

---

## 1. Inventario de capas perceptuales (siempre primero, MEDIDO)

Este es el eje **más fácil de saltearse** porque parece "obvio". No lo es. Hacerlo explícito.

**REGLA DURA**: los valores de L deben venir de **medición real** sobre la screenshot con `scripts/sample-layers.mjs`, NO de inferencia desde el CSS declarado. Razón: muchos componentes usan `bg-X/50` (alpha), `bg-X/10`, etc. que mezclan con la capa de abajo y producen un L renderizado distinto al token absoluto. Si declarás un L sin medir y resulta distinto al token, todo el resto del análisis hereda el error.

Cómo medir:

```bash
PNG=/path/to/screenshot__dark.png \
  SAMPLES="sidebar:50,400;bg:700,400;card-base:1100,700;card:1700,260" \
  node ~/.claude/skills/color-theme-audit/scripts/sample-layers.mjs
```

El script muestrea una región 9×9 centrada en cada punto (evita anti-aliasing) y devuelve sRGB + oklch reales. Repetir para light y dark.

**Si NO se puede medir** (no hay screenshot accesible, no hay sharp instalado, etc.), declarar `L no medido — razón` para cada capa. NO inventar números.

| Item | Qué responder en el reporte |
|---|---|
| 1.0 | **Coordenadas muestreadas** + valores L medidos por `sample-layers.mjs` (output tabular del script). NO inventar. |
| 1.1 | Listar TODAS las capas de L distinguibles en **DARK** mode con L MEDIDO + delta vs capa previa. Mínimo a muestrear: sidebar, topbar, bg main, card-base (si existe), card, interactive elevated, sidebar item activo, brand CTA. |
| 1.2 | Idem **LIGHT** mode con L MEDIDO. |
| 1.3 | Diff entre L medido y L declarado en el CSS para cada capa: ¿coinciden? Si difieren > 0.02, investigar la causa (probable `bg-X/alpha` o herencia inesperada). |
| 1.4 | ¿La cantidad de capas es **simétrica** entre modos? Si no, ¿es deuda o decisión consciente? Justificar. |
| 1.5 | ¿Las cards "**popean**" en LIGHT (L medido > bg L)? |
| 1.6 | ¿Las cards "**popean**" en DARK (L medido > bg L)? |
| 1.7 | ¿El **shell** (sidebar/header) recede respecto del bg en cada modo (L medido < bg L)? |
| 1.8 | ¿La profundidad se construye por **tonos de L**, por **sombras**, por **borders**, o combinación? Describir. |

---

## 2. Roles funcionales declarados u observados

Para cada rol: presente / ausente / parcial. Si solo se ve visualmente sin código, "observado".

| Item | Token | Notas |
|---|---|---|
| 2.1 | `--background` | Base de la app |
| 2.2 | `--foreground` | Texto principal. Contraste vs bg ≥ 4.5:1 ambos modos |
| 2.3 | `--card` + `--card-foreground` | Surface alta (popover/dialog/dropdown layer) |
| 2.4 | `--card-base` | Contenedor de grilla (capa intermedia). Es OPCIONAL pero típico del patrón v4.4 |
| 2.5 | `--dialog` | Modal surface. Puede o no diferir de `--card` |
| 2.6 | `--popover` + `--popover-foreground` | Popovers, tooltips |
| 2.7 | `--secondary` + `--secondary-foreground` | Botones secondary, badges neutros |
| 2.8 | `--muted` + `--muted-foreground` | Texto secundario / surface de menor jerarquía |
| 2.9 | `--accent` + `--accent-foreground` | Hover de items, sub-acentos |
| 2.10 | `--border` | Separadores. Calibrado por modo |
| 2.11 | `--input` | Borde de inputs |
| 2.12 | `--ring` | Focus ring genérico |
| 2.13 | `--primary` + `--primary-foreground` | Brand color |
| 2.14 | `--sidebar` + `--sidebar-foreground` + `--sidebar-border` | Shell |
| 2.15 | `--sidebar-accent` + `--sidebar-accent-foreground` | Item activo sidebar |
| 2.16 | `--text-on-dark-*` (strong/normal/muted) | Texto sobre superficies always-dark. Opcional |

---

## 3. Semantic colors

| Item | Qué validar |
|---|---|
| 3.1 | `--success` + `--success-foreground` presentes; contraste validado |
| 3.2 | `--warning` + `--warning-foreground` presentes; contraste validado |
| 3.3 | `--destructive` + `--destructive-foreground` presentes; contraste validado |
| 3.4 | `--info` + `--info-foreground` presentes; contraste validado |
| 3.5 | Hues de semantic NO chocan con `--primary` (no se confunden ambos) |
| 3.6 | Aplicados como **tokens**, NO como utility classes Tailwind palette (`text-emerald-500`, etc.) |

---

## 4. Elevation y profundidad

| Item | Qué validar |
|---|---|
| 4.1 | `--elevation-1` declarado, calibrado por modo (alpha diferenciado) |
| 4.2 | `--elevation-2` idem |
| 4.3 | `--elevation-3` idem |
| 4.4 | `--inset-top-highlight` presente; activo en DARK, transparent en LIGHT (o equivalente) |
| 4.5 | Sombras visibles en DARK (alpha ≥ 35%) |
| 4.6 | Sombras sutiles en LIGHT (alpha 10-22%) |
| 4.7 | Pattern v4.4 (shell-receding + card POP) aplicado o no aplicado. Si no aplicado, ¿qué patrón se usa en cambio? |
| 4.8 | NO hay sombras hardcoded `shadow-[0_4px_...]` inline |

---

## 5. Brand y CTAs

| Item | Qué validar |
|---|---|
| 5.1 | `--primary` con `oklch(L C H)` calibrado en ambos modos |
| 5.2 | `--primary-hover` o variante hover declarada (no inline filter) |
| 5.3 | `--primary-subtle` o equivalente con alpha bajo del brand |
| 5.4 | `--glow-itera-cta` o equivalente para CTAs primarios |
| 5.5 | `--glow-itera-cta-strong` para hover |
| 5.6 | Brand NO usado como semantic (action vs estado) |

---

## 6. Focus visible

| Item | Qué validar |
|---|---|
| 6.1 | `--focus-ring` declarado con **2 capas** (contact 1px + diffusion 4px) |
| 6.2 | Alpha calibrado diferente entre dark y light |
| 6.3 | NO se usa `ring-2` genérico de Tailwind/shadcn para focus de marca |
| 6.4 | Focus visible sobre TODOS los backgrounds que el componente use |

---

## 7. Construcción del par dark/light

| Item | Qué validar |
|---|---|
| 7.1 | Los valores NO son inversión automática `100 - L` (verificable: si los deltas entre capas son iguales en ambos modos, sospechar inversión) |
| 7.2 | Superficies altas: más claras que bg en DARK; más oscuras O blanco puro POP en LIGHT |
| 7.3 | Cards NO se "amarronan" en DARK (no usan capa equivocada) |
| 7.4 | Cards POP en LIGHT (blanco puro sobre bg cálido o sistema equivalente) |
| 7.5 | Toggle de tema NO produce flash intermedio |
| 7.6 | `prefers-color-scheme` como fallback del primer paint (si aplica) |

---

## 8. Mezcla de formatos y dispersión

| Item | Qué validar |
|---|---|
| 8.1 | Formato dominante: OKLCH / HSL / HEX. Reportar predominio |
| 8.2 | HSL/HEX dispersos en componentes (no en globals.css): contar ocurrencias |
| 8.3 | Inline `style={{ color }}` o `style={{ background }}` en componentes: contar |
| 8.4 | Utility classes Tailwind palette (`text-emerald-500`, `bg-amber-500/15`, `border-red-500`): contar por archivo |
| 8.5 | Arbitrary values `text-[#hex]`, `bg-[oklch(...)]`: contar |
| 8.6 | `dark:bg-X` / `dark:text-X` literales en lugar de tokens redefinidos en `.dark`: contar |

---

## 9. WCAG (requiere `wcag-check.mjs` o medición manual)

| Item | Mínimo |
|---|---|
| 9.1 | `--background` / `--foreground` en LIGHT | ≥ 4.5:1 |
| 9.2 | `--background` / `--foreground` en DARK | ≥ 4.5:1 |
| 9.3 | `--background` / `--muted-foreground` en LIGHT | ≥ 4.5:1 |
| 9.4 | `--background` / `--muted-foreground` en DARK | ≥ 4.5:1 |
| 9.5 | `--primary` / `--primary-foreground` | ≥ 4.5:1 (body) o ≥ 3:1 (UI) |
| 9.6 | `--success/warning/destructive/info` / sus foregrounds | ≥ 4.5:1 |
| 9.7 | `--sidebar` / `--sidebar-foreground` | ≥ 4.5:1 |
| 9.8 | `--sidebar-accent` / `--sidebar-accent-foreground` | ≥ 4.5:1 |
| 9.9 | Custom pairs (`--itera/--itera-foreground`, etc.) detectados por wcag-check | ≥ 4.5:1 |
| 9.10 | Placeholder text legible (no muy claro) | observación |
| 9.11 | Disabled states distinguibles pero no ilegibles | observación |

---

## 10. Estados interactivos

| Item | Qué validar |
|---|---|
| 10.1 | Hover declarado como token (cambio de L o overlay de `--accent` / `--muted`) |
| 10.2 | Active/pressed declarado (filter brightness 0.95 o L -3%) |
| 10.3 | Disabled consistente (opacity-50 estándar o token) |
| 10.4 | Loading state si aplica |

---

## 11. Asimetrías cross-mode

| Item | Qué validar |
|---|---|
| 11.1 | El sistema tiene el MISMO número de capas en light y dark, o se justifica la diferencia |
| 11.2 | El mismo elemento tiene el mismo "weight perceptual" entre modos (ej: item activo del sidebar no es subtle en light y CTA en dark) |
| 11.3 | El mismo elemento tiene el mismo tratamiento de superficie (ej: search bar tintada en light también tintada en dark) |
| 11.4 | Borders y dividers con alpha calibrado distinto por modo (no copiar valores entre modos) |

---

## Auto-check final

Antes de cerrar el reporte, releer este archivo y confirmar que **cada item** aparece en el reporte. Lista:

- [ ] §1 Capas perceptuales (light + dark + comparativa)
- [ ] §2 Roles funcionales (16 items)
- [ ] §3 Semantic colors (6 items)
- [ ] §4 Elevation (8 items)
- [ ] §5 Brand y CTAs (6 items)
- [ ] §6 Focus visible (4 items)
- [ ] §7 Construcción dark/light (6 items)
- [ ] §8 Mezcla de formatos (6 items)
- [ ] §9 WCAG (11 items)
- [ ] §10 Estados interactivos (4 items)
- [ ] §11 Asimetrías cross-mode (4 items)

**Total: 75 items**. Si quedó alguno sin cubrir y sin declarar `N/A — razón`, volver y completarlo antes de presentar el reporte.
