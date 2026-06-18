# Checklist exhaustivo — motion-audit

**OBLIGATORIO**: completar **cada item** antes de cerrar el reporte. Si un item no aplica al proyecto o no se puede evaluar, declararlo explícitamente como `N/A — razón concreta`. **NUNCA omitir un item en silencio**.

Antes de declarar el audit terminado, hacer auto-check: releer este archivo punto por punto y confirmar que cada item está cubierto.

---

## 1. Inventario de duraciones

| Item | Qué responder |
|---|---|
| 1.1 | Listar TODAS las duraciones en uso (`duration-N`, `Nms`, `Ns`) con count por valor |
| 1.2 | ¿Cuántos valores distintos conviven? (fragmentación: 8 distintos = problema) |
| 1.3 | ¿Hay alguna duración > 300ms? (¿justificada por drawer/sheet grande o es lenta?) |
| 1.4 | ¿Hay duraciones < 100ms que se sienten como cortes? |
| 1.5 | Mapear cada valor existente al escalón canónico más cercano (fast/base/moderate/slow) |
| 1.6 | ¿Las duraciones salen de tokens o son números mágicos inline? |

---

## 2. Inventario de easings

| Item | Qué responder |
|---|---|
| 2.1 | Listar TODOS los easings en uso (`ease-out`/`ease-in`/`ease-in-out` keyword + cada `cubic-bezier(...)`) |
| 2.2 | ¿Cuántos cubic-bezier distintos conviven? |
| 2.3 | ¿Hay bounce/elastic/overshoot (cubic-bezier con valor > 1 o < 0 en Y)? → prohibido |
| 2.4 | ¿Se usa `ease-out` como default? (debería) |
| 2.5 | ¿`ease-in-out` se reserva a movimiento de dos vías (height/width)? ¿o está disperso? |
| 2.6 | ¿Algún `ease-in` puro / `linear` mal aplicado? (linear solo para spinners) |

---

## 3. Propiedades animadas

| Item | Qué validar |
|---|---|
| 3.1 | ¿Hay `transition: all` / `transition-all`? (contar — debería ser cero) |
| 3.2 | ¿Se anima `width`/`height`/`top`/`left`/`margin` (layout caro) donde podría ser transform/opacity? |
| 3.3 | Collapsible/reveal: ¿usa `grid-template-rows 0fr→1fr` o el anti-pattern `height: 0→auto`? |
| 3.4 | Entradas/movimientos: ¿priorizan `transform`+`opacity` (GPU)? |
| 3.5 | ¿Hay `will-change` aplicado con criterio (solo en lo que realmente anima, no global)? |
| 3.6 | Excepciones de layout-prop documentadas (sidebar width, etc.) — ¿acotadas? |

---

## 4. Enter/exit de overlays

| Item | Qué validar |
|---|---|
| 4.1 | Dialog/modal: ¿entra y SALE animado? (no corte seco al cerrar) |
| 4.2 | ¿Hay flash de form vacío al cerrar dialog? (`{open && <Form/>}` → footgun; debe ser `key={formKey}`) |
| 4.3 | Popover/dropdown/select: ¿animan entrada? (`animate-in fade-in`/`zoom-in`) |
| 4.4 | Overlays montados en JS: ¿usan doble-rAF para el fade-in? (sin esto aparecen de golpe) |
| 4.5 | Sheet/drawer: ¿slide con `transition-transform`? (no `left`/`right`) |
| 4.6 | ¿Las duraciones de overlay caen en `base`/`moderate`? |

---

## 5. Route / section transition

| Item | Qué validar |
|---|---|
| 5.1 | ¿Existe transición de sección a sección? (overlay + fade del viewport) |
| 5.2 | Si existe: ¿overlay aparece sin delay + min-visible para no parpadear? |
| 5.3 | ¿Ignora navegaciones in-page (`preserveState`: filtros/búsqueda/paginación)? |
| 5.4 | ¿NO duplica fades (no hay `<FadeIn>` por página encima del viewport fade)? |
| 5.5 | El viewport, ¿preserva `h-full min-h-full`? |
| 5.6 | Constantes de ciclo de vida (enter/exit/min-visible/fallback): ¿co-locadas en el provider, documentadas? |
| 5.7 | ¿Spinner con `motion-reduce:animate-none`? |

---

## 6. Collapsible / layout reveal

| Item | Qué validar |
|---|---|
| 6.1 | Reveals (filtros, bulk bar, avisos): ¿grid `0fr→1fr` con hijo `min-h-0 overflow-hidden`? |
| 6.2 | El wrapper, ¿queda siempre montado (no `open && ...`)? |
| 6.3 | ¿Anima también `opacity` + `margin` para no cortar en seco al final? |
| 6.4 | ¿Radix Collapsible usa `--radix-collapsible-content-height` en sus keyframes? |
| 6.5 | Duración 150–220ms (`base`/`moderate`) |

---

## 7. Microinteracciones (hover/active/focus)

| Item | Qué validar |
|---|---|
| 7.1 | Botones: ¿`transition-colors` en hover? (no corte de color seco) |
| 7.2 | Rows de tabla / items de lista: ¿`hover:bg-* transition-colors`? |
| 7.3 | Items de sidebar / nav: ¿`transition-colors duration-150`? |
| 7.4 | Focus visible: ¿transición suave del ring (no flash)? |
| 7.5 | Badges/notificaciones: ¿`animate-in zoom-in` al aparecer? |
| 7.6 | Duraciones de microinteracción en `fast` (120) o default 150, no en `slow` |

---

## 8. Stagger de listas

| Item | Qué validar |
|---|---|
| 8.1 | ¿Las listas/grids que aparecen usan stagger (delay escalonado) o entran todas de golpe? |
| 8.2 | Si hay stagger: ¿`[animation-fill-mode:both]` para no parpadear antes del delay? |
| 8.3 | ¿El delay incremental es chico (~40ms/item) y se corta a N items (no 50 items × 40ms)? |
| 8.4 | Contenido filtrado: ¿`key` que fuerza remount con fade sutil? |

---

## 9. reduced-motion

| Item | Qué validar |
|---|---|
| 9.1 | ¿Existe algún manejo de `prefers-reduced-motion`? (si no: hallazgo crítico) |
| 9.2 | ¿Apagado a nivel sistema (duraciones self-zeroing en `@media`) o `motion-reduce:` repetido? |
| 9.3 | Keyframes (spinners, `animate-in`): ¿`motion-reduce:animate-none`? |
| 9.4 | Consumidores inline (no pueden llevar variantes Tailwind): ¿cubiertos por el self-zeroing? |
| 9.5 | ¿Algún componente nuevo quedó sin cubrir? (el self-zeroing los cubre por defecto; verificar) |

---

## 10. Tokenización y fuente única

| Item | Qué validar |
|---|---|
| 10.1 | ¿Las duraciones salen de tokens (`--duration-*`) o están hardcodeadas dispersas? |
| 10.2 | ¿Los easings salen de tokens (`--ease-*`) o hay cubic-bezier inline repetidos? |
| 10.3 | ¿Hay `framer-motion` (u otra lib JS)? ¿Justificada o reemplazable por CSS + tw-animate-css? |
| 10.4 | Modo de consumo correcto según root de Tailwind vs CSS satélite (arbitrary value si aislado) |
| 10.5 | ¿Coexistencia con SSOT externo? (tokens de motion que deberían subir primero al SSOT) |
| 10.6 | ¿`tw-animate-css` importado y usado, o hay keyframes reinventados a mano? |

---

## 11. Performance / jank

| Item | Qué validar |
|---|---|
| 11.1 | Animaciones de entrada: ¿transform+opacity (compositor) y no layout props? |
| 11.2 | ¿`will-change` puntual (no global "por las dudas", que consume memoria)? |
| 11.3 | Mount de overlays: ¿doble-rAF (sin él el primer frame salta)? |
| 11.4 | ¿Hay animaciones de `box-shadow`/`filter` pesadas en hover de muchos elementos a la vez? |
| 11.5 | ¿Listas largas animando todas a la vez (stagger sin cap) → jank? |

---

## Auto-check final

Antes de cerrar el reporte, releer este archivo y confirmar que **cada item** aparece en el reporte. Lista:

- [ ] §1 Inventario de duraciones (6 items)
- [ ] §2 Inventario de easings (6 items)
- [ ] §3 Propiedades animadas (6 items)
- [ ] §4 Enter/exit de overlays (6 items)
- [ ] §5 Route / section transition (7 items)
- [ ] §6 Collapsible / layout reveal (5 items)
- [ ] §7 Microinteracciones (6 items)
- [ ] §8 Stagger de listas (4 items)
- [ ] §9 reduced-motion (5 items)
- [ ] §10 Tokenización y fuente única (6 items)
- [ ] §11 Performance / jank (5 items)

**Total: 62 items**. Si quedó alguno sin cubrir y sin declarar `N/A — razón`, volver y completarlo antes de presentar el reporte.

Atención a los ejes que suelen saltearse:

- **§9 reduced-motion**: el eje más olvidado. Siempre se cubre, aunque la respuesta sea "no hay nada → hallazgo crítico".
- **§3 Propiedades animadas**: `transition: all` y animar `width/height` pasan desapercibidos porque "funcionan" visualmente; el costo es jank.
- **§5.6 Constantes de ciclo de vida**: documentarlas aunque NO se tokenicen (viven en JS).
- **§10.4 Modo de consumo**: si los tokens están en un CSS satélite, las utilities nombradas NO existen — verificar que el consumo sea por arbitrary value.
