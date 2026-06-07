# Checklist exhaustivo — responsive-audit

**OBLIGATORIO**: completar **cada item** antes de cerrar el reporte. Si un item no aplica al proyecto o no se puede evaluar, declararlo explícitamente como `N/A — razón concreta`. **NUNCA omitir un item en silencio**.

Antes de declarar el audit terminado, hacer auto-check: releer este archivo punto por punto y confirmar que cada item está cubierto.

---

## 1. Captura baseline

| Item | Qué responder |
|---|---|
| 1.1 | Las 5 resoluciones canónicas capturadas (1366, 1440, 1920, 2560, 3840) |
| 1.2 | Rutas críticas cubiertas (home, hub, búsqueda, detalle, dashboard, settings) |
| 1.3 | Capturas guardadas con naming canónico `<res>__<slug>.png` o con suffix theme |
| 1.4 | Capturas también en DARK mode si el proyecto lo soporta (`THEME=both`) |
| 1.5 | Capturas también con contenido dinámico extremo (título largo, número grande, lista densa) |

---

## 2. Árbol parent-child de secciones críticas

Para CADA vista capturada, listar el árbol con parent + children inmediatos + display + relación con el viewport.

| Item | Sección |
|---|---|
| 2.1 | **Header**: parent + children + display + bg + sticky? |
| 2.2 | **Sidebar**: parent + children + display + scroll behavior |
| 2.3 | **Main**: parent + children + max-w + padding |
| 2.4 | **Hero / PageHeader** de cada vista crítica |
| 2.5 | **Search panel / filtros** (si aplica) |
| 2.6 | **Result list / dashboard grid** |
| 2.7 | **Rail derecho / aside** (si aplica) |
| 2.8 | **Footer** (si aplica) |

---

## 3. App shell dimensions

| Item | Qué validar |
|---|---|
| 3.1 | `--app-header-h` declarado |
| 3.2 | `--sidebar-width` declarado |
| 3.3 | `--main-max-w` declarado |
| 3.4 | `--main-pad-x` y `--main-pad-y` declarados |
| 3.5 | Header NO se siente "hilo" en 4K (≥ 60px de alto) |
| 3.6 | Sidebar NO ocupa menos del 7% del viewport en 4K |
| 3.7 | Main usa al menos 80% del viewport en 4K |
| 3.8 | Tokens fluidos via `clamp()` o discretos por breakpoint |

---

## 4. Typography scale

| Item | Qué validar |
|---|---|
| 4.1 | `--text-display` (h1) declarado, fluido |
| 4.2 | `--text-h2` declarado |
| 4.3 | `--text-body` declarado, body ≥ 16px equivalente en 4K |
| 4.4 | `--text-meta` (12px) declarado |
| 4.5 | `--text-label` declarado |
| 4.6 | `--text-mono-xs` declarado |
| 4.7 | NO hay `text-[Npx]` arbitrary values dispersos (contar ocurrencias) |
| 4.8 | NO hay `text-xl sm:text-2xl` ad-hoc en page headers (debe usar `text-display`) |
| 4.9 | NO hay `text-sm` body-level sin migración a `text-body` |

---

## 5. Line-height

| Item | Qué validar |
|---|---|
| 5.1 | `--leading-tight` declarado, aplicado a headings |
| 5.2 | `--leading-snug` declarado, aplicado a UI densa |
| 5.3 | `--leading-normal` declarado, aplicado a body |
| 5.4 | `--leading-loose` declarado si hay prosa larga (blog/docs) |
| 5.5 | NO hay `leading-[Npx]` arbitrary |
| 5.6 | Line-heights en rem/ratio, NO en px fijo |

---

## 6. Control heights

| Item | Qué validar |
|---|---|
| 6.1 | `--control-h-sm` (32px) declarado |
| 6.2 | `--control-h-md` (36px) declarado |
| 6.3 | `--control-h-lg` (44px) declarado |
| 6.4 | NO conviven 4+ alturas distintas en componentes hermanos (contar) |
| 6.5 | Buttons size lg + Input variant line + Search bar usan misma altura |
| 6.6 | Tabs y segments consistentes con controls |
| 6.7 | NO hay `h-{8,9,10,11,12}` arbitrary disperso sin sistema |

---

## 7. Icon system

| Item | Qué validar |
|---|---|
| 7.1 | Icon sizes consistentes: máximo 3-4 niveles (xs/sm/md/lg) |
| 7.2 | Stroke widths consistentes: máximo 2 valores en una vista |
| 7.3 | Gap icono-texto < padding-horizontal del control (regla de proximidad) |
| 7.4 | NO hay mezcla `strokeWidth={1.5}` + `{1.7}` + `{2}` + `{2.2}` |
| 7.5 | Íconos representativos en cards: inline al lado del título, NO encima con frame |

---

## 8. Spacing scale

| Item | Qué validar |
|---|---|
| 8.1 | `--space-close` (0.5rem) declarado |
| 8.2 | `--space-group` (1rem) declarado |
| 8.3 | `--space-break` (1.5rem) declarado |
| 8.4 | `--space-area` (2rem) declarado |
| 8.5 | `--space-section` (fluido para layout-level) declarado |
| 8.6 | `--space-grid-gap` (fluido) declarado |
| 8.7 | Regla "espacio interno < espacio externo" respetada (verificar pares padre+hijos) |
| 8.8 | Peso óptico: padding-h ~2× padding-v en text buttons |
| 8.9 | NO hay `gap-[Npx]` / `space-y-[Npx]` arbitrary disperso |

---

## 9. Grids

| Item | Qué validar |
|---|---|
| 9.1 | Home grid escala con `sm`/`lg`/`xl`/`2xl`/`3xl`/`4xl` según corresponda |
| 9.2 | Hub grids escalan con breakpoints superiores |
| 9.3 | Dashboard grids escalan |
| 9.4 | Valores / utility grids escalan |
| 9.5 | Cards NO quedan estiradísimas en 4K |
| 9.6 | Cards NO se vuelven demasiado chicas en 1366 |
| 9.7 | NO se usa `auto-fit`/`minmax` donde el tope es semántico (N cards conocidas) |
| 9.8 | Result lists son column única (no grid) salvo justificación |

---

## 10. Breakpoints

| Item | Qué validar |
|---|---|
| 10.1 | `3xl: 1920px` declarado |
| 10.2 | `4xl: 2560px` declarado |
| 10.3 | **Cada breakpoint custom nombra la condición que resuelve** (comentario explícito) |
| 10.4 | NO hay comentarios `// tablet` / `// desktop` sin condición |
| 10.5 | NO se duplican breakpoints estándar de Tailwind con valores cercanos |

---

## 11. Container queries

| Item | Qué validar |
|---|---|
| 11.1 | ¿Hay container queries opt-in? Listar dónde |
| 11.2 | Si hay: ¿justificadas (componente cambia de forma según su padre)? |
| 11.3 | Si NO hay: ¿hay zonas donde deberían usarse? (ej: rail aparece/desaparece) |
| 11.4 | NO se aplican container queries globalmente "por las dudas" |

---

## 12. Validación con contenido extremo

| Item | Qué validar |
|---|---|
| 12.1 | Título de 200+ caracteres no rompe layout en ninguna vista |
| 12.2 | Número de 9 dígitos no desborda cards |
| 12.3 | Lista de 50 items respeta space-y sin verse apretada ni excesiva |
| 12.4 | Label más largo del sidebar entra sin truncar en sidebar-width mínimo |
| 12.5 | Empty state se ve bien (no deja vacíos enormes) |
| 12.6 | Theme dark capturado y validado (debería verse simétrico en density) |
| 12.7 | Validar con datos reales si están disponibles, no con lorem ipsum |

---

## 13. Mismatch entre features hermanas

| Item | Qué validar |
|---|---|
| 13.1 | Inputs en features hermanas con misma altura + variant |
| 13.2 | Buttons "Buscar" / CTA principal con mismo tratamiento entre features |
| 13.3 | Spacing entre input y botón consistente |
| 13.4 | Tabs strips con misma altura entre features |
| 13.5 | Hero / PageHeader con misma jerarquía tipográfica |

---

## 14. Checks visuales por resolución

| Item | Qué validar |
|---|---|
| 14.1 | **1366×768**: contenido entra sin scroll horizontal, sin espacio muerto vertical excesivo |
| 14.2 | **1440×900**: punto dulce; cualquier regresión es bloqueante |
| 14.3 | **1920×1080**: main usa el aire sin tocar bordes; body ~15-16px |
| 14.4 | **2560×1440**: sin bloque visible de vacío muerto |
| 14.5 | **3840×2160**: main usa ≥ 80% del viewport; body ≥ 16px equivalente |
| 14.6 | Diff visual cross-resolución: contenido no se vuelve más grande en 1366 vs baseline |

---

## Auto-check final

Antes de cerrar el reporte, releer este archivo y confirmar que **cada item** aparece en el reporte. Lista:

- [ ] §1 Captura baseline (5 items)
- [ ] §2 Árbol parent-child (8 items)
- [ ] §3 App shell dimensions (8 items)
- [ ] §4 Typography scale (9 items)
- [ ] §5 Line-height (6 items)
- [ ] §6 Control heights (7 items)
- [ ] §7 Icon system (5 items)
- [ ] §8 Spacing scale (9 items)
- [ ] §9 Grids (8 items)
- [ ] §10 Breakpoints (5 items)
- [ ] §11 Container queries (4 items)
- [ ] §12 Validación contenido extremo (7 items)
- [ ] §13 Mismatch entre features hermanas (5 items)
- [ ] §14 Checks visuales por resolución (6 items)

**Total: 92 items**. Si quedó alguno sin cubrir y sin declarar `N/A — razón`, volver y completarlo antes de presentar el reporte.
