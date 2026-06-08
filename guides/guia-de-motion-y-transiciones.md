# Motion y transiciones (admin panels ITERA)

Método canónico de animaciones y transiciones para los admin panels del ecosistema (Next.js + React y Laravel + Inertia + React). Consolida lo que veníamos anotando disperso en las guías de diseño de cada SaaS.

**Fuentes que reemplaza/absorbe:**
- `itera-lex/.planning/guides/UI-GUIDE.md §16` (microinteracciones + `<FadeIn>`) → sigue siendo válido, esta guía lo eleva a cross-repo.
- `itera-lex/DESIGN.md` sección "Motion" (principios).
- `guides/guia-de-ui-admin-panels.md` (tabla de microinteracciones, patrón de drawer).
- Footguns sueltos en `shope-ar/CLAUDE.md`.

Pensada como **semilla** de la futura biblioteca de primitivas + animaciones reutilizables.

---

## Principios (no negociables)

- **Duración ≤ 300ms**, preferido 150–220ms. Nada que se sienta lento.
- **`ease-out`** siempre. **Sin bounce, sin elastic.** "Nada bouncy".
- **`prefers-reduced-motion` respetado**: `motion-reduce:duration-0` y `motion-reduce:animate-none` en cada animación. (En proyectos con `globals.css` propio ya está global.)
- **CSS puro** con `tw-animate-css` (`animate-in`, `fade-in`, `slide-in-from-*`, `fill-mode-*`). **NO framer-motion** — no lo usamos en ningún admin panel.
- Cambios de estado siempre con `transition-*`, nunca cortes abruptos.

---

## 1. Transición de sección a sección (route transition)

El patrón estrella: feedback inmediato al navegar entre secciones + entrada suave de la nueva vista. Resuelve el "hago click y no pasa nada" y el "la sección aparece a secas".

**Anatomía:** overlay full-screen (fondo semi + spinner) que aparece al instante, + **fade del viewport padre** (el contenido viejo se desvanece, el nuevo entra). El fade del viewport **ES** la entrada de sección.

**Parámetros canónicos:**

| Constante | Valor | Rol |
|-----------|-------|-----|
| enter | ~180ms | fade-in del overlay (lo da la clase CSS `duration-200`) |
| exit | ~220ms | fade-out + desmontaje del overlay |
| **min visible** | **420ms** | tiempo mínimo que el overlay queda visible → consistencia sin parpadeo. Tunable: ~300ms si el panel es de mucho click |
| fallback max | 8000ms | timeout de seguridad por si `finish` nunca llega |

**Reglas:**
- El overlay aparece **sin delay** (el feedback inmediato es el punto). El min-visible evita el flash.
- **No duplicar fades**: si usás esta transición, NO agregues `<FadeIn>` por página encima — el fade del viewport ya es la entrada.
- El viewport preserva **`h-full min-h-full`** para no romper páginas con altura porcentual (FullCalendar, etc. — validado en itera-lex).
- Ignorar navegaciones **in-page** (filtros, búsqueda, paginación) → deben seguir instantáneas.
- **Adaptar por marca solo el color** del overlay/spinner. La secuencia y los timings se dejan fijos.

### Variante A — Next.js (App Router), imperativa

Un `AppRouteTransitionProvider` expone `navigateWithTransition(href)` que la sidebar usa en `onClick`: oculta el viewport, muestra el overlay, espera el enter, hace `router.push`, y al confirmar el nuevo `pathname` retira el overlay respetando el min-visible.

**Implementación de referencia:** `itera-lex/src/components/layout/app-route-transition.tsx` (+ test en `__tests__/app-route-transition.test.tsx`).

### Variante B — Laravel + Inertia, event-driven (recomendada para Inertia)

En Inertia no hace falta navegación imperativa: se engancha a los eventos globales del router, así **cubre todas las navegaciones** (menú, botones, `router.visit`) sin tocar cada link.

**Implementación de referencia:** `alquimica-crm/resources/js/components/layout/route-transition.tsx`.

```tsx
// Núcleo del provider (event-driven). Ver archivo completo para el manejo
// de re-entrancy (clicks encadenados) y limpieza de timers.
const OVERLAY_EXIT_MS = 220
const OVERLAY_MIN_VISIBLE_MS = 420
const OVERLAY_MAX_VISIBLE_MS = 8000

// begin(): al primer start, monta overlay en opacity-0, doble rAF, opacity-100,
//          oculta el viewport (opacity-0), arma fallback.
// finish(): respeta max(0, MIN_VISIBLE - elapsed), luego muestra viewport y
//           desvanece overlay; tras EXIT_MS lo desmonta.

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
// Viewport: envuelve el contenido de página dentro del AppShell.
<div
  className={cn(
    'h-full min-h-full transition-opacity duration-200 ease-out motion-reduce:duration-0',
    isViewportHidden && 'opacity-0'
  )}
>
  {children}
</div>
```

**Footgun (doble rAF):** un overlay recién montado pintado directo en `opacity-100` aparece de golpe (sin fade-in). Montar en `opacity-0`, y recién en el segundo `requestAnimationFrame` pasar a `opacity-100`.

**Footgun (wrappers + globals):** el viewport es un `<div>` hijo directo de `<main>`. Si el proyecto tiene un global tipo `main > div { padding }`, ese wrapper hereda padding fantasma → doble-padding. Verificá el CSS global antes de insertar wrappers estructurales.

---

## 2. `<FadeIn>` — entrada de páginas y stagger de listas

Para entrada de secciones y stagger escalonado **cuando NO se usa la route transition de §1** (ej: contenido filtrado server-side, detail pages).

**Implementación de referencia:** `itera-lex/src/components/shared/fade-in.tsx`.

```tsx
<FadeIn variant="fade" duration={200}><Breadcrumb /></FadeIn>
<FadeIn variant="fade-up" delay={50}><Header /></FadeIn>
<FadeIn variant="fade-up" delay={100}><Tabs /></FadeIn>
```

- `variant`: `'fade'` | `'fade-up'` (default) | `'fade-down'`
- `duration` (default 300) · `delay` (default 0)
- Stagger de listas: delay inline escalonado `style={{ animationDelay: \`${i * 40}ms\` }}` + `animate-in fade-in slide-in-from-bottom-1 [animation-fill-mode:both]`.
- Contenido filtrado: `<FadeIn key={JSON.stringify(filters)} variant="fade" duration={200}>` fuerza remount con fade sutil.

---

## 3. Collapsible reveal — abrir espacio en el layout

Para barras contextuales, filtros avanzados, acciones bulk, avisos no críticos o paneles compactos que aparecen/desaparecen **empujando suavemente** la tabla o contenido de abajo.

**Nombre del patrón:** `collapsible reveal`, `expand/collapse animation` o `smooth layout reveal`.

**Cuándo usarlo:**
- Cuando el elemento debe ocupar espacio real en el flujo del documento.
- Cuando la tabla/lista de abajo tiene que correrse mientras aparece la fila.
- Cuando `slide-in` sería demasiado teatral o haría sentir que el elemento flota sobre el contenido.

**Técnica canónica:** workaround de `height: auto` con CSS Grid. No animar `height: 0 -> auto`; usar `grid-template-rows: 0fr -> 1fr`, con un hijo `overflow-hidden`.

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
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/35 px-3 py-2">
      {/* contenido contextual */}
    </div>
  </div>
</div>
```

**Reglas:**
- El wrapper debe quedar siempre montado. Si se renderiza condicional (`open && ...`), no hay transición de layout.
- El hijo inmediato lleva `min-h-0 overflow-hidden`; sin eso, `0fr` puede seguir ocupando altura por contenido mínimo.
- Animar también `opacity` y `margin-bottom` para que no quede un salto seco al final.
- Mantener duración 150–220ms. Para barras de tabla, `duration-200 ease-out` es el default.
- Si los controles quedan montados mientras `open=false`, agregar `disabled={!open}` o evitar foco/tab accidental según el caso.

**Implementación de referencia:** `alquimica-crm/resources/js/Pages/Productos/Index.tsx` — barra bulk de Productos y Stock.

---

## 4. Microinteracciones (hover/active/focus)

Tabla canónica en `guides/guia-de-ui-admin-panels.md` (sección Microinteracciones). Resumen de las más usadas:

| Elemento | Clase |
|----------|-------|
| Botón primary/secondary | `transition-colors hover:bg-primary/90` / `hover:bg-accent` |
| Botón icon (8×8) | `transition-colors duration-150 hover:bg-accent/60 hover:text-foreground` |
| Item sidebar | `transition-colors duration-150` |
| Sidebar collapse | `transition-[width] duration-200 ease-out` |
| Row tabla | `hover:bg-accent/30 transition-colors` |
| Link "ver todos" | `group` + arrow `group-hover:translate-x-0.5 transition-transform` |
| Notification badge | `animate-in zoom-in-50 duration-200` |
| Tabs (`TabsContent`) | ya trae `animate-in fade-in slide-in-from-bottom-1` global — no agregar nada |

---

## 5. Footguns transversales

- **Dialog con form + fade-out**: NUNCA `{open && <FormFields />}`. Al cerrar, React desmonta el form al instante mientras Radix anima el fade-out → flash de dialog vacío. Usar `<FormFields key={formKey} />` con `formKey` que incrementa **solo al abrir** (`if (newOpen) setFormKey(k => k+1)`). (Origen: `shope-ar`.)
- **Dropdowns admin**: nunca `<select>` nativo → siempre shadcn `<Select>` (el nativo no acepta estilos ni animaciones).
- **Drawer/sheet custom**: reveal con doble-rAF + `transition-transform duration-300 ease-out` (ver `shope-ar/src/components/storefront/mobile-overlay.tsx` y `guia-de-ui-admin-panels.md`).

---

## Implementaciones de referencia (mapa)

| Pieza | Repo · archivo |
|-------|----------------|
| Route transition — Next imperativa | `itera-lex/src/components/layout/app-route-transition.tsx` |
| Route transition — Inertia event-driven | `alquimica-crm/resources/js/components/layout/route-transition.tsx` |
| `<FadeIn>` | `itera-lex/src/components/shared/fade-in.tsx` |
| Collapsible reveal | `alquimica-crm/resources/js/Pages/Productos/Index.tsx` |
| Microinteracciones (doctrina) | `itera-core/guides/guia-de-ui-admin-panels.md` |

---

## Hacia la biblioteca de primitivas (pendiente)

Visión a futuro (cuando haya tiempo): extraer estas piezas a una biblioteca de componentes reutilizable across admin panels — primitivas (`<RouteTransitionProvider>` con las dos variantes, `<FadeIn>`, drawer, overlay) + tokens de motion (durations, easings) como única fuente. Hasta entonces, **esta guía es la fuente del método** y cada repo tiene su copia adaptada por marca.
