# Calibrating Anchors Inside a Variant

When a short uses motion graphics that need to land on specific elements inside the dashboard (cursor on a tab, ClickRipple on a button, focus target on a row), you need coordinates in the **variant native** space (1504×940, the `GALLERY_CANVAS` size).

These coords are NOT the same as the frame coords of the 9:16 composition. They are the local coordinates of the variant as rendered by the component library, before any laptop macro-zoom or DashboardCamera scaling.

## When to calibrate

Calibrate once **per variant** the short visits. Anchors persist as long as the component library does not refactor the affected widget. After calibrating, save the coords to `references/variant-anchors.md` so future shorts skip the work.

Skip calibration if:

- The short only uses elements at the variant center (no precise anchor needed).
- The variant is already in the anchors catalog and the widget has not changed.

## Workflow

### 1. Add `CalibrationGrid` to the DashboardCamera overlay

```tsx
import { CalibrationGrid } from "./CalibrationGrid";

<DashboardCamera
  storyId="screen/causas-framed"
  variantName="Ficha: información"
  focus={{ x: focusX, y: focusY }}
  zoom={microZoom}
  overlay={<CalibrationGrid />}
/>
```

`CalibrationGrid` renders a magenta/cyan grid every 100 variant px with labels (`x100`, `x200`, ..., `y100`, `y200`, ...). Since the overlay lives in the variant transform space, the grid pans and zooms together with anything else.

### 2. Render a still inside the variant you want to calibrate

```bash
npx remotion still <CompositionId> out/calibrate.png --frame=<f>
```

Pick a frame where the macro-zoom or pan is showing the area you care about. The grid is visible regardless.

### 3. Read coordinates visually

Look at the rendered PNG. The grid labels (`x300`, `y200`, etc.) give you the variant coordinates of every cell. Identify the elements you need:

- Tab centers: read the x where each tab title sits, y of the tab row.
- Button centers: x/y of the button.
- Row anchors: x/y of the row content.

Write the values into a `TAB_X` / `ANCHORS` const in the composition.

### 4. Remove `CalibrationGrid` from the overlay

The grid is only for calibration. Once you have the coords, remove the prop and re-render to confirm the cursor / ripples / focus land where you wrote them.

### 5. Save coords to the catalog

Update `references/variant-anchors.md` with the new variant. Future shorts using the same variant skip steps 1-4.

## Layered transforms — why the grid is the cleanest tool

The cursor + ripples live inside `<DashboardCamera>`'s overlay. The DashboardCamera applies `transform: translate + scale` (the micro-zoom) to position the variant. Above that, `<LaptopFrame>` applies its own `transform: scale + translate` (the macro-zoom). Above that, the composition can hide or show different beats.

Trying to compute variant coords from frame coords requires inverting all those transforms — easy to get wrong. The grid sidesteps the math: it lives inside the same transform space as the elements you are targeting, so what you see is what the cursor / ripple / focus will see.

## Common mistakes

- **Reading the grid from a stand-alone DebugVariant composition (no laptop).** That works for fast prototyping, but the rendering pipeline is subtly different from inside `<LaptopFrame>`. Always calibrate inside the same render pipeline you'll use for the final video.
- **Guessing coords from `dist/index.css` rules.** CSS percentages and flex layouts give approximate positions, not exact pixels. The grid gives exact pixels.
- **Calibrating once and assuming it works for every variant.** Each variant is a different React tree. `Ficha: información` of `screen/causas-framed` has tabs at different x positions than `Ficha: información` of `screen/clientes-framed`. Calibrate per variant.

## Catalog: known anchors

See `references/variant-anchors.md` for the running catalog.
