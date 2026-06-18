# Adapter: shadcn + Tailwind v4 + bridge `[data-slot]` (LISTO)

Stack: React + Tailwind v4 + shadcn (Radix) + tokens en CSS satélite scopeado a `.<proj>-ui` que tematiza shadcn por `[data-slot]`. Referencia: **Alquímica UI-Lab** (`resources/js/components/ui-lab/` + `resources/css/alquimica-tokens.css`, prefijo `--alquimica-*`). Otro SaaS de este stack: mismo patrón, prefijo `--<proj>-*`.

## Cómo se consumen los tokens (¡clave!)

El CSS satélite NO está en el root de Tailwind → **`@theme` es inerte** ahí (Tailwind no autogenera utilities). Se consumen:

1. **Arbitrary value** (lo común): `text-[length:var(--alquimica-text-label)]` (el `length:` es obligatorio para tipografía), `h-[var(--alquimica-control-sm)]`, `bg-[var(--alquimica-surface-2)]`, `gap-[var(--alquimica-space-group)]`, `size-[var(--alquimica-icon-sm)]`.
2. **`style={{}}`**: para lo que no tiene utility cómoda (`boxShadow`, `gridTemplateRows`, `transition`).
3. **El bridge** mapea algunos tokens a las vars shadcn (`--primary`, `--popover`, `--ring`…) → ahí los componentes shadcn los usan solos.

Breakpoints custom NO se scopean (Tailwind los resuelve global).

## Tokens protagonistas (referencia Alquímica)

- **Color/superficies**: `--*-bg`, `--*-surface-1/2/3` (escalera de elevación), `--*-divider`, `--*-border` (SOLO controles), `--*-text`/`-muted`/`-subtle`. Marca: `--*-primary`/`-fg`/`-hover`. Semánticos: `--*-{success,warning,danger,info}` + `-surface` (bg badge) + `-fg` (texto). Tags: `--*-tag-surface`/`-fg`. Campo: `--*-field` (= surface-2). Tracks: `--*-track` (capacidad) y `--*-segment-track` (segmented sobre card, recesión suave). Elevación: `--*-elevation-1/2/3`, `--*-inset-top`, `--*-button-lift`. Modal: `--*-dialog` (= surface-1).
- **Sizing/tipografía**: `--*-text-{title,label,meta,eyebrow}` (estáticos) + body/display (clamp). `--*-control-{sm,md,lg}`, `--*-icon-{sm,md,lg}`, `--*-cell-{px,py}`, `--*-space-{close,group,break,area}`, `--*-main-max-w`, shell trio `--*-header-h`/`-sidebar-w`/`-page-pad`.
- **Motion**: `--*-duration-{fast,base,moderate,slow}` (120/180/220/300), `--*-ease-out`/`-in-out`, presets `--*-transition-{fast,base,moderate}`. `prefers-reduced-motion` → duraciones self-zero a 0ms.
- **States**: `--*-disabled-opacity`, `--*-skeleton`.
- **A11y**: `--*-focus-color`/`-width`/`-offset`, `--*-target-min`, clases `.<proj>-focus-ring` (halo) y `.<proj>-focus-inset` (offset negativo, para contenedores con clip).

## El bridge `[data-slot]`

shadcn pone `data-slot="button|input|select-trigger|dialog-content|dropdown-menu-item|tabs-trigger|…"`. El CSS satélite tematiza por ese atributo **sin tocar `components/ui/*`** (la app productiva queda intacta):

```css
.alquimica-ui [data-slot="input"], … { background: var(--alquimica-field); border-color: var(--alquimica-divider); box-shadow: var(--alquimica-inset-top); }
.alquimica-ui [data-slot="popover-content"], [data-slot="dropdown-menu-content"], [data-slot="select-content"] {
  border-color: transparent; background: var(--alquimica-surface-2); box-shadow: var(--alquimica-elevation-2);
}
.alquimica-ui [data-slot="tabs-trigger"][data-state="active"] { background: var(--alquimica-primary); color: var(--alquimica-primary-fg); box-shadow: var(--alquimica-button-lift); }
```

**Doctrina visual**: profundidad por **superficie + elevación + lip (inset)**, NO por borde claro. Popovers/menús/cards = surface raised + elevación + `border-color: transparent`. Campos = superficie con inset (recesión).

**Especificidad**: `.<proj>-ui [data-slot="x"]` (0,2,0) le gana a las utilities del cva shadcn (0,1,0) → el bridge puede sobreescribir (p.ej. completar el `transition` parcial del cva para que los cambios de estado no corten seco).

### Receta: tematizar un slot nuevo

1. Leer el `data-slot` en `components/ui/<x>.tsx`.
2. `grep 'data-slot="<x>"' <satélite>.css` — muchos contenedores comparten regla (popover/dropdown/select content).
3. Reglas `.<proj>-ui [data-slot="<x>"]` con la doctrina (surface/elevation/sin-borde; hover → surface-3; activo → primary; destructivo → danger-surface + danger-fg con specificity que le gane al hover genérico).
4. Cambios de estado con `transition` (preset de motion; reduced-motion lo auto-zeroa). No dejar opacity/bg/border sin transición.
5. Verificar dark Y light.

## Espejo iframe-aware de primitiva Radix (el footgun resuelto)

Espejo en `composition/` de `components/ui/<x>.tsx` con los **mismos `data-slot`** (para que el bridge lo tematice), cambiando SOLO el `<Portal>` para pasarle el container del iframe:

```tsx
import * as XPrimitive from '@radix-ui/react-<x>';
import { useIframePortalContainer } from './iframe-portal';

function XContent({ className, ...props }) {
  const container = useIframePortalContainer();
  return (
    <XPrimitive.Portal container={container ?? undefined}>
      <XPrimitive.Content data-slot="<x>-content" className={cn('…clases shadcn…', className)} {...props} />
    </XPrimitive.Portal>
  );
}
// Root/Trigger/Item/Separator: re-export del primitive con su data-slot.
```

- Mantener `data-slot` idénticos → el bridge ya los tematiza.
- Tokens por arbitrary value dentro del componente.
- A11y nativa de Radix se conserva (focus-trap, Escape, retorno de foco).
- Trigger propio con `asChild`: `<XTrigger asChild><button …/></XTrigger>` (puede reaccionar con `data-[state=open]:…`).

**Espejos existentes (Alquímica)**: ✅ `select`, ✅ `form-dialog` (Dialog), ✅ `dropdown-menu`, ✅ `tooltip`. ⛔ Popover: crear con este patrón si una story `shell`/`responsive` lo necesita (o `canvas:'flat'` para demo suelta).

## Footguns del stack

- **Portal escaping** → espejo iframe-aware (arriba).
- **`@theme` inerte** fuera del root → arbitrary value, no utilities.
- **Campo surface-2 dentro de contenedor surface-2** → el input no popea; sacar el contenedor (campo va sobre el dialog) o recesarlo.
- **`key`+fade en swap** → flash; usar FLIP de altura.
- **Inputs numéricos**: spinners prohibidos (regla única en el bridge: `appearance:textfield` + `::-webkit-*-spin-button`).
- **Dead code en el bridge**: al quitar un patrón, quitar su keyframe/clase/componente.
