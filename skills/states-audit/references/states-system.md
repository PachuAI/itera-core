# Sistema de estados — referencia canónica

Patrones canónicos de estados de UI (empty / loading / error / success / disabled) para admin panels del ecosistema (React + Tailwind v4 + shadcn, Next.js o Laravel + Inertia). States es un dominio **de composición**: orquesta patrones, reusa los tokens de los otros dominios.

## Tabla de contenidos

1. Principios (no negociables)
2. Máquina de estado de vista
3. Empty
4. Loading
5. Error
6. Success
7. Disabled
8. Tokens chicos
9. Aria de estado
10. Reuso de los otros dominios

---

## 1. Principios (no negociables)

1. **Un estado a la vez.** Una vista nunca muestra loading + empty + error juntos. Orden de chequeo: `error → loading → empty → content`.
2. **Empty siempre con acción.** "No hay nada" sin próximo paso es un callejón sin salida.
3. **Skeleton-first para contenido**, spinner para acciones, overlay para transiciones.
4. **Reusar, no reinventar.** Colores semánticos (Color), spinner/overlay (Motion), tipografía (Sizing). States no los redefine.
5. **Aria de estado en cada patrón.** `aria-busy`, `aria-disabled`, `aria-invalid`, `role="status"`, `role="alert"`.
6. **reduced-motion en el loading.** Skeleton pulse y spinner se apagan/atenúan bajo `prefers-reduced-motion`.
7. **Disabled ≠ loading ≠ readonly.** Tres cosas distintas, tres tratamientos distintos.

## 2. Máquina de estado de vista

Toda vista que trae datos async es una máquina chica:

```
idle ──▶ loading ──▶ content   (hay datos)
                └──▶ empty     (no hay datos)
         loading ──▶ error     (falló)
```

Reglas:
- **Orden de chequeo**: `if (error) … else if (loading) … else if (empty) … else content`.
- **Nunca** dos estados visibles a la vez. El error pisa al loading; el empty solo se evalúa con loading resuelto y sin error.
- **In-page vs full**: un re-fetch por filtro NO vuelve la vista entera a `loading` (eso parpadea) — usa un overlay sutil sobre el contenido existente (dominio Motion). El `loading` full (skeleton) es para la **primera** carga.

## 3. Empty

Estructura: **ícono + título + descripción + acción**. Dos variantes según el porqué:

| Variante | Cuándo | Ícono | Acción |
|---|---|---|---|
| **Sin datos** | Primera vez, nunca hubo datos | `Inbox` / contextual | CTA primaria: "Crear / Nuevo X" |
| **Sin resultados** | Hay datos pero el filtro/búsqueda no matchea | `SearchX` | CTA secundaria: "Limpiar filtros" |

Tamaños según contexto:
- **Page** (`py-12`): la vista entera vacía.
- **Card / sección** (`py-8`): un panel dentro de una vista con datos.
- **Inline en tabla** (una fila con colspan): el cuerpo de la tabla vacío, header presente.

```tsx
<EmptyState icon={Inbox} title="No hay clientes todavía"
  description="Cargá tu primer cliente para empezar.">
  <Button size="sm"><Plus />Nuevo cliente</Button>
</EmptyState>
```

El error de sección reusa la MISMA estructura con tono `danger` (ver §5).

## 4. Loading

Tres sub-patrones según QUÉ está cargando:

### 4.1 Skeleton — para CONTENIDO (default)
Lo que va a aparecer (tablas, listas, cards) se prefigura con bloques que imitan su forma → **el layout no salta** cuando llegan los datos.

```tsx
<div role="status" aria-busy="true" aria-label="Cargando clientes">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-center gap-4 px-4 py-2.5">
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-5 w-16" />
    </div>
  ))}
</div>
```

Regla: **nunca un spinner full-page para datos** (colapsa el layout, hace saltar la vista). Skeleton preserva la estructura.

### 4.2 Spinner — para ACCIONES
Un botón que dispara algo async: spinner inline + label en gerundio + control `disabled` + `aria-busy`.

```tsx
<Button disabled aria-busy="true">
  <Loader2 className="animate-spin motion-reduce:animate-none" />
  Guardando…
</Button>
```

### 4.3 Overlay — para TRANSICIONES
Cambio de sección o re-fetch por filtro: overlay sutil sobre el contenido existente. **Es dominio Motion** (route transition / filter overlay) — States lo referencia, no lo reimplementa.

## 5. Error

Tres niveles + el async:

| Nivel | Patrón |
|---|---|
| **Inline de form** | `aria-invalid` en el campo (→ borde `danger` **tokenizado** + underglow danger en foco) + texto `danger` debajo (`role="alert"`). El borde refuerza, el texto explica. Lo prohibido es el color *hardcodeado* (`border-red-500`), no el feedback visual. |
| **De sección / fetch** | Empty-state con tono `danger`: ícono + qué pasó + botón "Reintentar". Reusa la estructura del empty. |
| **Crash** | `ErrorBoundary` con fallback: "Algo salió mal" + recargar. Captura excepciones de render. |
| **Async (acción)** | `toast.error(...)` para fallos de submit/delete/export. Efímero. |

```tsx
{/* inline */}
<Input aria-invalid={!!error} />
{error && <p role="alert" className="text-[var(--danger-fg)] text-meta">{error}</p>}
```

**Colores**: siempre los tokens semánticos (`--danger-surface` / `--danger-fg`). NUNCA `border-red-500` / `text-red-600` hardcodeado.

## 6. Success

| Patrón | Cuándo |
|---|---|
| **Toast** | Acción efímera completada ("Cliente guardado"). Flota (elevation), no ocupa layout, se va solo. |
| **Badge** | Estado persistente ("ACTIVO"). Vive en la fila/card mientras el estado dure. |
| **Inline** | Confirmación contextual junto a la acción ("✓ Cambios guardados"). |

Regla: no abusar de check marks por todos lados. El éxito de una acción async = toast; el estado de una entidad = badge.

## 7. Disabled

`--disabled-opacity` (0.5) + `cursor-not-allowed` + `aria-disabled`. Distinguir de:
- **Loading**: procesando → spinner + `aria-busy` (no es lo mismo que "no podés").
- **Readonly**: no editable pero presente y legible (sin opacity, `readonly` en inputs).

```tsx
<Button disabled>…</Button>  /* opacity token + cursor + el navegador setea :disabled */
<Button disabled aria-busy="true"><Loader2 className="animate-spin" />Procesando…</Button>
```

Un control disabled debería tener un **motivo** descubrible (tooltip / texto cercano: "Completá el teléfono primero").

## 8. Tokens chicos

States tokeniza POCO (es más patrón):

```css
:root { /* o .<scope>-ui */
  --disabled-opacity: 0.5;
  --skeleton: <color con contraste real sobre la card>;   /* par light/dark */
  --skeleton-pulse-duration: 1.6s;
}
@keyframes skeleton-pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
[data-slot="skeleton"], .skeleton {
  background-color: var(--skeleton);
  animation: skeleton-pulse var(--skeleton-pulse-duration) var(--ease-in-out) infinite;
}
@media (prefers-reduced-motion: reduce) {
  [data-slot="skeleton"], .skeleton { animation: none; }
}
```

- El **color** del skeleton necesita **contraste real** sobre la card. El `bg-accent`/`bg-muted` por defecto suele ser casi invisible sobre una card blanca → definir un `--skeleton` calibrado por tema.
- El pulse es un **loop continuo** (loading), más lento que la escala de motion (que es para transiciones puntuales) — 1.6–2s.
- Reusa el `--ease-in-out` del dominio Motion.

## 9. Aria de estado

| Estado | Atributo |
|---|---|
| Loading (región) | `role="status"` + `aria-busy="true"` |
| Loading (acción) | `aria-busy="true"` en el botón |
| Disabled | `disabled` (nativo) o `aria-disabled="true"` |
| Error de form | `aria-invalid="true"` en el campo + `role="alert"` en el mensaje |
| Error de sección | `role="alert"` |
| Empty | (no requiere rol especial; es contenido) |

Esto es lo ÚNICO de a11y que cubre States. Focus-visible / teclado / target sizes / aria general → su propio dominio.

## 10. Reuso de los otros dominios

| States usa… | Del dominio… | NO redefine |
|---|---|---|
| `--success/danger/warning/info-{surface,fg}` | Color | los valores de color semántico |
| spinner (`Loader2 animate-spin`), overlay, route transition | Motion | el timing/easing |
| roles tipográficos (`text-title`, `text-body`, `text-meta`) | Sizing | la escala |
| `--ease-in-out`, reduced-motion | Motion | la doctrina de movimiento |

States es la capa que **compone** estos en patrones de feedback. Si te encontrás definiendo un color o un timing, parate: pertenece a otro dominio.

---

## Implementaciones de referencia (mapa)

| Pieza | Repo · archivo |
|---|---|
| EmptyState (compartido) | `alquimica-crm/resources/js/components/shared/empty-state.tsx` |
| Skeleton tokenizado + reduced-motion | `alquimica-crm/resources/css/alquimica-tokens.css` (bloque STATES) |
| Story de los 5 estados | `alquimica-crm/resources/js/components/ui-lab/stories/states.tsx` |
| ErrorBoundary | `alquimica-crm/resources/js/components/error-boundary.tsx` |
| Toasts (Sonner, íconos semánticos) | `alquimica-crm/resources/js/components/ui/sonner.tsx` |
| StatusBadge (estado persistente) | `alquimica-crm/resources/js/components/shared/status-badge.tsx` |
