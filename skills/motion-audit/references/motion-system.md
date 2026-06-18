# Sistema de motion — referencia canónica

Sistema de tokens de motion + patrones validados para admin panels del ecosistema (React + Tailwind v4 + shadcn, tanto Next.js App Router como Laravel + Inertia). **Absorbe y eleva** `itera-core/guides/guia-de-motion-y-transiciones.md` a la forma tokenizada del design system.

## Tabla de contenidos

1. Principios (no negociables)
2. Escala de duraciones (4 pasos)
3. Easings (2)
4. Presets de transición
5. reduced-motion a nivel sistema
6. Modo de consumo (root de Tailwind vs CSS satélite)
7. Patrón — route / section transition (2 variantes)
8. Patrón — `<FadeIn>` (entrada de páginas + stagger)
9. Patrón — collapsible reveal (grid 0fr→1fr)
10. Patrón — microinteracciones (hover/active/focus)
11. Footguns transversales

---

## 1. Principios (no negociables)

1. **Duración ≤ 300ms**, preferido **150–220ms**. Nada que se sienta lento.
2. **`ease-out` siempre**. **Sin bounce, sin elastic.** "Nada bouncy".
3. **`prefers-reduced-motion` respetado** en toda animación. Preferir apagado a nivel sistema (duraciones self-zeroing, §5) + `motion-reduce:animate-none` para keyframes.
4. **CSS puro** con `tw-animate-css` (`animate-in`, `fade-in`, `slide-in-from-*`, `fill-mode-*`). **NO framer-motion** en admin panels.
5. **Cambios de estado siempre con `transition-*`**, nunca cortes abruptos. **Nunca `transition: all`** — enumerar las props.
6. **El motion sale de tokens**, no de números mágicos dispersos. Una escala chica > muchos valores ad-hoc.
7. **Preferir props GPU** (`transform`, `opacity`) sobre props de layout (`width`/`height`/`top`). Excepción acotada y documentada: collapsible reveal (grid rows) y sidebar collapse (width).

## 2. Escala de duraciones (4 pasos)

UN solo lugar para las duraciones. Cualquier valor de animación cae en uno de estos 4 escalones. El objetivo es **colapsar la dispersión** (proyectos reales tienen 8+ valores: 90/120/150/180/200/220/240/250ms), no catalogarla.

```css
:root { /* o .<scope>-ui en un design system aislado */
  --duration-fast:     120ms; /* micro-feedback: hover color, tint de ícono, badge pop, fade de ítem de menú */
  --duration-base:     180ms; /* DEFAULT: fade de overlays, panel de dropdown, cambios de estado */
  --duration-moderate: 220ms; /* layout: collapse/reveal, ancho de sidebar, salidas, alert shell */
  --duration-slow:     300ms; /* techo: superficies grandes que entran deslizando (drawer/sheet) */
}
```

**Cómo elegir el escalón:**
- ¿Solo cambia color/opacidad de algo chico, instantáneo al ojo? → `fast`.
- ¿Es la transición por defecto de un cambio de estado / fade de overlay? → `base`.
- ¿Mueve layout (algo se abre, corre, colapsa)? → `moderate`.
- ¿Una superficie grande entra deslizando desde un borde? → `slow`.

**Snap de valores ad-hoc** (ejemplo real, Alquímica CRM): 90,120 → `fast` · 150,180 → `base` · 200,220,240,250 → `moderate`. El page-enter de 250ms baja a 220 (`moderate`); las microinteracciones de 90/120 suben/quedan en 120 (`fast`).

## 3. Easings (2)

```css
:root {
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);   /* decelerate (Material). Workhorse: entradas, fades, microinteracciones */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* abre Y cierra — height/width de dos vías */
}
```

- **`ease-out` es el default absoluto.** Entra rápido y desacelera al final = se siente responsivo. El keyword CSS `ease-out` (`cubic-bezier(0,0,0.58,1)`) sirve, pero el token `cubic-bezier(0,0,0.2,1)` desacelera más limpio.
- **`ease-in-out`** solo para movimiento de **dos vías** (un sidebar que colapsa y expande, un acordeón). El `cubic-bezier(0.4,0,0.2,1)` es el estándar que ya usan muchos repos (Material "standard").
- **`ease-in` puro** (acelera, `cubic-bezier(0.4,0,1,1)`): SOLO para elementos que se van de pantalla en una salida, y con criterio. No es token base; agregarlo solo si una salida lo justifica.
- **NUNCA** `cubic-bezier` con overshoot (`...1.5...`, back/elastic). Eso es bounce.

## 4. Presets de transición

Composite `<duración> <easing>` para un shorthand inline cómodo:

```css
:root {
  --transition-fast:     var(--duration-fast)     var(--ease-out);
  --transition-base:     var(--duration-base)     var(--ease-out);
  --transition-moderate: var(--duration-moderate) var(--ease-out);
}
```

Consumo: `style={{ transition: 'opacity var(--transition-base)' }}` → `transition: opacity 180ms cubic-bezier(0,0,0.2,1)`. Para movimiento de dos vías, componer a mano: `transition: 'width var(--duration-moderate) var(--ease-in-out)'`.

## 5. reduced-motion a nivel sistema

El patrón clave: **las duraciones se auto-anulan** bajo `prefers-reduced-motion`. Así CUALQUIER consumidor (inline, arbitrary value, preset) queda instantáneo **sin tocar cada componente**.

```css
@media (prefers-reduced-motion: reduce) {
  :root { /* o .<scope>-ui */
    --duration-fast:     0ms;
    --duration-base:     0ms;
    --duration-moderate: 0ms;
    --duration-slow:     0ms;
  }
}
```

Como los presets `--transition-*` referencian las vars de duración, también se vuelven `0ms …` = instantáneo. Las CSS custom props resuelven en el sitio de uso, así que el override del media query gana para todo descendiente del scope.

**Complemento para keyframes** (spinners, `animate-spin`, `animate-in`): el self-zeroing no apaga `@keyframes` (esos son `animation`, no `transition`). Para ellos:
```tsx
<Loader2 className="animate-spin motion-reduce:animate-none" />
<div className="animate-in fade-in motion-reduce:animate-none" />
```
Y en CSS propio: `@media (prefers-reduced-motion: reduce) { .mi-keyframe { animation: none; } }`.

**Por qué self-zeroing > `motion-reduce:` en cada componente**: un solo lugar de verdad; cubre consumidores inline (que no pueden llevar variantes Tailwind `motion-reduce:`); imposible olvidarse en un componente nuevo.

## 6. Modo de consumo (root de Tailwind vs CSS satélite)

| Dónde viven los tokens | `duration-X` / `ease-X` utilities | Cómo consumir |
|---|---|---|
| `globals.css` / `app.css` raíz (procesado por Tailwind) | se pueden generar via `@theme` | utilities nombradas: `duration-base`, `ease-out` |
| **CSS satélite aislado** (importado desde un componente, caso UI-Lab) | **NO** se generan (`@theme` inerte fuera del root) | **arbitrary value**: `duration-[var(--duration-base)]`, `ease-[var(--ease-out)]`, o preset inline `style={{ transition: 'opacity var(--transition-base)' }}` |

Mismo criterio que `responsive-audit §6.1`. En un design system aislado bajo un scope (`.alquimica-ui`), el modo correcto es **arbitrary value** — las utilities nombradas no existen porque el archivo no es root de Tailwind.

## 7. Patrón — route / section transition

El patrón estrella: feedback inmediato al navegar + entrada suave de la nueva vista. Resuelve el "hago click y no pasa nada" y el "la sección aparece a secas".

**Anatomía:** overlay full-screen (fondo semi + spinner) que aparece al instante, + **fade del viewport padre** (el contenido viejo se desvanece, el nuevo entra). El fade del viewport **ES** la entrada de sección.

**Constantes de ciclo de vida (JS, NO CSS vars):**

| Constante | Valor | Rol |
|---|---|---|
| enter | ~180ms | fade-in del overlay (lo da la clase CSS `duration-200` ≈ `base`) |
| exit | ~220ms | fade-out + desmontaje del overlay (`moderate`) |
| **min visible** | **420ms** | tiempo mínimo del overlay → consistencia sin parpadeo. Tunable ~300ms si el panel es de mucho click |
| fallback max | 8000ms | timeout de seguridad por si `finish` nunca llega |

> Estas viven como **constantes co-locadas en el provider** (`OVERLAY_EXIT_MS`, etc.), NO como CSS vars: el ciclo de vida se mide en JS y las custom props no se leen limpio desde JS. El reporte las documenta; no se tokenizan en CSS.

**Reglas:**
- El overlay aparece **sin delay** (feedback inmediato). El min-visible evita el flash.
- **No duplicar fades**: si usás esta transición, NO agregues `<FadeIn>` por página encima.
- El viewport preserva **`h-full min-h-full`** para no romper páginas con altura porcentual (FullCalendar, etc.).
- Ignorar navegaciones **in-page** (filtros, búsqueda, paginación: `preserveState`) → instantáneas.
- **Adaptar por marca solo el color** del overlay/spinner. Secuencia y timings fijos.

**Variante A — Next.js App Router, imperativa.** Un `AppRouteTransitionProvider` expone `navigateWithTransition(href)` que la sidebar usa en `onClick`. Referencia: `itera-lex/src/components/layout/app-route-transition.tsx`.

**Variante B — Laravel + Inertia, event-driven (recomendada para Inertia).** Se engancha a `router.on('start'/'finish')` → cubre TODAS las navegaciones sin tocar cada link. Referencia: `alquimica-crm/resources/js/components/layout/route-transition.tsx`.

```tsx
useEffect(() => {
  const removeStart = router.on('start', (e) => {
    if (e.detail.visit.preserveState) return   // ignora in-page (filtros/búsqueda)
    begin()
  })
  const removeFinish = router.on('finish', (e) => {
    if (e.detail.visit.preserveState) return
    finish()
  })
  return () => { removeStart(); removeFinish(); clearTimers() }
}, [begin, finish, clearTimers])
```

```tsx
// Viewport: hijo directo de <main>, envuelve el contenido de página.
<div className={cn(
  'h-full min-h-full transition-opacity duration-200 ease-out motion-reduce:duration-0',
  isViewportHidden && 'opacity-0',
)}>
  {children}
</div>
```

## 8. Patrón — `<FadeIn>` (entrada de páginas + stagger)

Para entrada de secciones y stagger escalonado **cuando NO se usa la route transition de §7** (contenido filtrado server-side, detail pages). Referencia: `itera-lex/src/components/shared/fade-in.tsx`.

```tsx
<FadeIn variant="fade" duration={200}><Breadcrumb /></FadeIn>
<FadeIn variant="fade-up" delay={50}><Header /></FadeIn>
<FadeIn variant="fade-up" delay={100}><Tabs /></FadeIn>
```

- `variant`: `'fade'` | `'fade-up'` (default) | `'fade-down'`. `duration` (default 300) · `delay` (default 0).
- Stagger de listas: delay inline escalonado `style={{ animationDelay: \`${i * 40}ms\` }}` + `animate-in fade-in slide-in-from-bottom-1 [animation-fill-mode:both]`.
- Contenido filtrado: `<FadeIn key={JSON.stringify(filters)} variant="fade" duration={200}>` fuerza remount con fade sutil.

## 9. Patrón — collapsible reveal (grid 0fr→1fr)

Para barras contextuales, filtros avanzados, acciones bulk, avisos: aparecen **empujando suavemente** el contenido de abajo.

**Técnica canónica:** workaround de `height: auto` con CSS Grid. NO animar `height: 0 -> auto` (no anima). Usar `grid-template-rows: 0fr -> 1fr`, con un hijo `overflow-hidden`.

```tsx
<div
  aria-hidden={!open}
  className={cn(
    'grid transition-[grid-template-rows,margin-bottom,opacity] duration-200 ease-out motion-reduce:duration-0',
    open ? 'mb-3 opacity-100' : 'mb-0 opacity-0',
  )}
  style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
>
  <div className="min-h-0 overflow-hidden">
    {/* contenido contextual */}
  </div>
</div>
```

**Reglas:**
- El wrapper queda **siempre montado**. Si se renderiza condicional (`open && ...`), no hay transición de layout.
- El hijo inmediato lleva `min-h-0 overflow-hidden`; sin eso, `0fr` puede seguir ocupando altura.
- Animar también `opacity` y `margin-bottom` para que no quede un salto seco al final.
- Duración 150–220ms (`base`/`moderate`). Referencia: `alquimica-crm/resources/js/Pages/Productos/Index.tsx` (barra bulk).

## 10. Patrón — microinteracciones (hover/active/focus)

| Elemento | Clase |
|---|---|
| Botón primary/secondary | `transition-colors hover:bg-primary/90` / `hover:bg-accent` |
| Botón icon (8×8) | `transition-colors duration-150 hover:bg-accent/60 hover:text-foreground` |
| Item sidebar | `transition-colors duration-150` |
| Sidebar collapse (ancho) | `transition-[width] duration-200 ease-out` (o `var(--duration-moderate)`) |
| Row tabla | `hover:bg-accent/30 transition-colors` |
| Link "ver todos" | `group` + arrow `group-hover:translate-x-0.5 transition-transform` |
| Notification badge | `animate-in zoom-in-50 duration-200` |
| Tabs (`TabsContent`) | ya trae `animate-in fade-in slide-in-from-bottom-1` global — no agregar nada |

Regla: las microinteracciones de color caen en `fast` (120) o el default Tailwind (150ms); el movimiento de layout en `moderate` (220).

## 11. Footguns transversales

- **Doble rAF en mount**: un overlay recién montado pintado directo en `opacity-100` aparece de golpe (sin fade-in). Montar en `opacity-0`, y recién en el **segundo** `requestAnimationFrame` pasar a `opacity-100`.
- **Dialog con form + fade-out**: NUNCA `{open && <FormFields />}`. Al cerrar, React desmonta el form al instante mientras Radix anima el fade-out → flash de dialog vacío. Usar `<FormFields key={formKey} />` con `formKey` que incrementa **solo al abrir** (`if (newOpen) setFormKey(k => k+1)`). (Origen: shope-ar.)
- **Wrappers + globals**: el viewport de la route transition es un `<div>` hijo directo de `<main>`. Si hay un global `main > div { padding }`, ese wrapper hereda padding fantasma → doble-padding. Verificar el CSS global antes de insertar wrappers estructurales.
- **Dropdowns nativos**: nunca `<select>` nativo → siempre shadcn `<Select>` (el nativo no acepta estilos ni animaciones).
- **Drawer/sheet custom**: reveal con doble-rAF + `transition-transform duration-300 ease-out` (`slow`). Ver `shope-ar/src/components/storefront/mobile-overlay.tsx`.
- **`transition: all`**: anima props inesperadas (incluido `width`/`height` que cambian por reflow) → jank. Enumerar siempre.

---

## Hacia la biblioteca de primitivas (pendiente)

Visión a futuro: extraer estas piezas a una biblioteca reutilizable across admin panels — primitivas (`<RouteTransitionProvider>` con las 2 variantes, `<FadeIn>`, drawer, overlay) + estos tokens de motion como única fuente. Hasta entonces, esta referencia es el método y cada repo tiene su copia adaptada por marca.

## Implementaciones de referencia (mapa)

| Pieza | Repo · archivo |
|---|---|
| Route transition — Next imperativa | `itera-lex/src/components/layout/app-route-transition.tsx` |
| Route transition — Inertia event-driven | `alquimica-crm/resources/js/components/layout/route-transition.tsx` |
| `<FadeIn>` | `itera-lex/src/components/shared/fade-in.tsx` |
| Collapsible reveal | `alquimica-crm/resources/js/Pages/Productos/Index.tsx` |
| Tokens de motion (design system aislado) | `alquimica-crm/resources/css/alquimica-tokens.css` (bloque MOTION) |
| Microinteracciones (doctrina) | `itera-core/guides/guia-de-ui-admin-panels.md` |
