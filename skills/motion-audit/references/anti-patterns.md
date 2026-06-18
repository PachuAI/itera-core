# Anti-patrones — qué NO conviene hacer

Lista canónica de errores comunes al diseñar el motion de un admin panel. Cada uno con su razón. Si tu razonamiento te lleva a uno de estos, releé esto antes de avanzar.

## 1. No usar bounce / elastic / overshoot

```css
/* MAL */
transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1); /* back/overshoot */
```

**Razón**: el bounce es lúdico y juguetón; un admin panel de datos quiere sentirse **rápido y preciso**, no rebotar. El overshoot agrega tiempo percibido y distrae del contenido.

**Regla**: `ease-out` (decelerate) para todo. `ease-in-out` solo para movimiento de dos vías. Cero cubic-bezier con Y fuera de [0,1].

## 2. No pasar de 300ms

**Razón**: arriba de 300ms el movimiento se siente lento y el usuario espera. En una app de uso intensivo (clicks todo el día), 200ms ya es el techo cómodo; 300ms se reserva para superficies grandes que entran deslizando (drawer/sheet).

**Regla**: escala `fast`/`base`/`moderate`/`slow` = 120/180/220/300. Preferir 150–220. Nada de `duration-500`/`700` en UI funcional.

## 3. No animar TODO con `transition: all`

```css
/* MAL */
.card { transition: all 200ms; }
```

**Razón**: `all` anima props que no querías (incluido `width`/`height` que cambian por reflow del contenido → jank), y el navegador no puede optimizar. Además dispara animaciones fantasma cuando cambia cualquier propiedad heredada.

**Regla**: enumerar siempre — `transition-[opacity,transform]`, `transition-colors`. Sabés exactamente qué se mueve.

## 4. No animar props de layout cuando hay alternativa GPU

```css
/* MAL: anima en el hilo principal, reflow por frame */
.panel { transition: height 200ms; height: 0; }
.panel.open { height: auto; } /* además: height:auto NO anima */
```

**Razón**: `width`/`height`/`top`/`left`/`margin` disparan layout+paint cada frame → jank en listas o en móviles. `transform` y `opacity` van al compositor (GPU).

**Regla**: entradas/movimientos con `transform`+`opacity`. Reveals con `grid-template-rows: 0fr→1fr` (no `height`). Excepción acotada: ancho de sidebar colapsable (única vía razonable, contenido finito).

## 5. No reinventar lo que `tw-animate-css` ya da

**Razón**: escribir `@keyframes fade-in` a mano cuando `animate-in fade-in` existe duplica mantenimiento y diverge de los timings del sistema.

**Regla**: usar `animate-in`, `fade-in`, `slide-in-from-*`, `zoom-in-*`, `fill-mode-*`. Keyframes propios solo para algo que la lib no cubre (y documentarlo).

## 6. No meter framer-motion (u otra lib JS) sin necesidad

**Razón**: framer-motion son ~50kB+ y un modelo mental aparte para lograr lo que `transition-*` + `tw-animate-css` ya hacen en un admin panel. Peso y complejidad sin retorno.

**Regla**: CSS primero. Reservar libs JS para orquestación compleja real (layout animations, drag físico, timelines) — raro en paneles de datos.

## 7. No duplicar fades (route transition + `<FadeIn>`)

**Razón**: si la route/section transition ya desvanece el viewport como entrada de sección, sumar un `<FadeIn>` por página produce **dos fades encadenados** → la vista "aparece dos veces", se siente lenta y rara.

**Regla**: elegir uno. Con route transition global, las páginas NO traen su propio fade de entrada. `<FadeIn>` es para vistas SIN route transition (detail, contenido filtrado).

## 8. No olvidar `prefers-reduced-motion`

**Razón**: hay usuarios con sensibilidad vestibular; el movimiento puede marearlos. Es un requisito de accesibilidad, no un nice-to-have. Y es trivial de cubrir.

**Regla**: apagado a nivel sistema (duraciones self-zeroing en `@media (prefers-reduced-motion: reduce)`) + `motion-reduce:animate-none` para keyframes. NUNCA dejar una animación sin contemplarlo.

## 9. No montar overlays directo en `opacity-100`

```tsx
/* MAL: aparece de golpe, sin fade-in */
{open && <div className="opacity-100 transition-opacity">…</div>}
```

**Razón**: si el elemento se monta ya en su estado final, no hay transición desde dónde animar → aparece instantáneo. El browser pinta el frame final directo.

**Regla**: montar en `opacity-0`, y en el **segundo** `requestAnimationFrame` pasar a `opacity-100`. (Doble rAF — el primero pinta el estado inicial, el segundo dispara la transición.)

## 10. No desmontar el contenido de un dialog mientras anima la salida

```tsx
/* MAL: flash de dialog vacío al cerrar */
<DialogContent>{open && <FormFields />}</DialogContent>
```

**Razón**: al cerrar, React desmonta el form al instante mientras Radix todavía anima el fade-out del contenedor → se ve un dialog vacío por un frame.

**Regla**: `<FormFields key={formKey} />` con `formKey` que incrementa **solo al abrir** (`if (newOpen) setFormKey(k => k + 1)`). El contenido persiste durante el fade-out.

## 11. No animar listas largas todas a la vez sin cap

**Razón**: 50 filas con `animate-in` simultáneo (o stagger sin tope: 50 × 40ms = 2s) genera jank y una entrada eterna.

**Regla**: stagger chico (~40ms/item) y **cap a los primeros N visibles**; el resto entra sin animación o ya está. `[animation-fill-mode:both]` para que no parpadeen antes de su delay.

## 12. No tokenizar las constantes de ciclo de vida JS como CSS vars

**Razón**: las constantes del provider de route transition (enter/exit/min-visible/fallback) se miden y comparan en JS; las CSS custom props no se leen limpio desra JS (requieren `getComputedStyle` y parsing frágil).

**Regla**: viven como constantes co-locadas en el provider (`OVERLAY_EXIT_MS = 220`), documentadas en el reporte. Solo los tokens consumibles por CSS (`--duration-*`, `--ease-*`, `--transition-*`) van al archivo de tokens.

## 13. No mezclar motion con cambios de color/sizing

**Razón**: el skill es **temporal**. Si una propuesta arrastra un cambio de paleta, surface o tamaño, triplica el riesgo de regresión y se desalinea de `color-theme-audit` / `responsive-audit`.

**Regla**: si el reporte propone tocar color/tamaño/layout, fue scope creep — sacarlo. Motion = cómo se mueve, no qué se ve ni cuánto mide.
