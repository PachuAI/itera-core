# Macro Camera Over Laptop Frame

## Rule

The main camera should zoom and pan the full 9:16/laptop frame, not the app content inside the laptop screen.

Use:

```tsx
<LaptopFrame scale={cameraScale} offsetX={cameraX} offsetY={cameraY}>
  <DashboardCamera zoom={1} focus={APP_FIT_FOCUS} />
</LaptopFrame>
```

Keep `DashboardCamera zoom` fixed at `1` unless the user explicitly requests a separate micro-zoom.

## Why

In a vertical short, desktop UI is too wide to read at full fit. The natural solution is a camera/lupa over the full mockup. If the app zooms inside the laptop while the bezel stays still, the effect looks fake and disconnected.

The bezel, topbar, base, and app should move together.

## Avoid Dead Screen Margins

Do not put a framed story inside `LaptopFrame` if that story already includes a `ScreenFrame`, browser chrome, or padding. This creates a nested frame and dead space inside the laptop screen.

Prefer unframed app variants such as `views/...` stories, or a bridge export that bypasses `ScreenFrame`.

If using a camera wrapper, calibrate the fit focus so the app canvas starts at the left edge of the laptop viewport:

```ts
const APP_FIT_FOCUS = { x: 752, y: 446 }; // for 1504x940 canvas in the current laptop viewport
const zoom = 1;
```

Validate by rendering a still before any camera move. There should be no black/dead band between the laptop bezel and app sidebar.

## Motion Timing

Camera moves should be short and motivated:

- hold the list view while the voice introduces the claim
- zoom in when the script says the app centralizes information
- during tab enumeration, track the active tab/content from left to right
- avoid slow, constant zooms over multiple seconds without a specific beat

Use eased intervals:

```tsx
const ease = Easing.inOut(Easing.cubic);
const scale = interpolate(t, [6.0, 6.6], [1, 1.58], { easing: ease });
```

For tab enumeration, use short transitions at transcript boundaries:

- information/expediente: left
- movimientos: mid-left
- tareas: mid-right
- archivos: right

The visual state change and camera move should be tied to the same transcript word boundary.
