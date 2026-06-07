---
name: remotion-vertical-shorts
description: Build short vertical 9:16 Remotion videos, especially pain-to-solution SaaS reels with laptop mockups, exact word-level JSON captions, and camera moves over the full 9:16/laptop frame. Use for "short vertical 9:16", "story pain solucion", "reel de iteralex con laptop", "video corto con tipografia + mockup", and "/remotion-vertical-shorts".
---

# Remotion Vertical Shorts

Use this skill for short 8-15s vertical Remotion pieces. It is optimized for:

- Pain -> solution narrative.
- Strict 9:16 layout with a centered 4:5 composition frame, wordmark, mockup, and captions derived from that frame.
- SaaS desktop UI shown through a laptop mockup.
- Word-level transcript JSON from ElevenLabs/Scribe-style tools.

This is not `remotion-camera-tour`: camera-tour is for longer product tours and multi-step flows. This skill is for fast social shorts where typography and one desktop mockup carry the story.

## Non-Negotiable Caption Rule

The transcript JSON is the source of truth.

When the user provides word-level JSON like:

```json
[
  { "text": "centralizar", "start": 5.239, "end": 6.0 },
  { "text": "toda", "start": 6.0, "end": 6.259 }
]
```

`centralizar` must leave the screen at `6.0` exactly, or at most 1ms before. It must not fade out over `toda`.

Use exact chunk boundaries:

```tsx
<PhaseWrap t={t} from={3.819} to={6.0} fadeIn={0} fadeOut={0}>
  <WordByWordText words={CLAIM_1} />
</PhaseWrap>

<PhaseWrap t={t} from={6.0} to={8.34} fadeIn={0} fadeOut={0}>
  <WordByWordText words={CLAIM_2} />
</PhaseWrap>
```

Do not invent visual crossfades for captions. Animation is allowed only inside a word's active highlight style, and it must never delay appearance or extend the word/chunk past the JSON timing.

Read `references/captions-json-timing.md` before implementing captions.

## Core Workflow

1. Read the audio transcript JSON first.
2. Normalize words only when needed for display, but preserve `start` and `end` exactly.
3. Split captions into readable chunks, with each chunk boundary equal to the next chunk's first word `start`.
4. Build the visual sequence around those timings, not the other way around.
5. Use a laptop mockup only as an outer frame. Do not zoom the app inside the laptop independently unless the user explicitly asks for micro-zoom.
6. For desktop UI in a laptop, prefer unframed app variants. Do not put a `ScreenFrame`/browser-frame story inside another laptop frame.
7. Validate with stills at exact transcript boundary frames, especially one frame before and after chunk changes.

## Camera Rule

All main zooms and pans should be controlled by the 9:16/laptop camera, not by scaling the app inside the laptop screen.

### Non-Negotiable: Camera Tracks the Focus Point

**When `laptopScale > 1` and the variant content shifts (tab change, row click, section reveal), `laptopOffsetX` and/or `laptopOffsetY` MUST animate to keep the active element near frame center.** A camera that stays fixed while variants change underneath is exactly the anti-pattern the user notices first.

The whole point of the zoom-in is to guide the viewer's eye to a specific element. If the cursor moves to a new tab but the camera doesn't follow, the active content drifts to the edge and the viewer doesn't know where to look. Always pan with the cursor.

Reference: `causas-pestanas` v4 (`projects/iteralex/stages/vertical-shorts/causas-pestanas/remotion/src/compositions/CausasPestanasShort.tsx`) is the validated example. Its `laptopOffsetX` interpolates through 4 values (`245 → 85 → -70 → -230`) during the 4-tab enum, with the cursor recorring the tabs and the camera tracking each. **Always read this file as a starting template before writing a new short.**

How to compute `offsetX` to center a variant element at frame_x=540:

```ts
// Variant element at native_x = X, laptop at scale S.
// LAPTOP_VIEWPORT.width / 2 (with corrected values: 952/2 = 476)
const VIEWPORT_CX = LAPTOP_VIEWPORT.width / 2;
const offsetX = (VIEWPORT_CX - X * VARIANT_BASE_SCALE) * laptopScale;
// Empirically adjust ±20-30 px after rendering stills.
```

For a tab row at `y=290 native` (standard Ficha widget), the X centers of tabs come from `references/variant-anchors.md`. Cache the computed offsets in a `TAB_OFFSET_X` const and interpolate `laptopOffsetX` through them at the moments the variants change.

### Good Patterns

- `LaptopFrame scale/offsetX/offsetY` zooms the full mockup: bezel, chrome, base, and app content move together.
- The camera jumps or eases over short, meaningful intervals tied to the voice.
- **During an enumerated tab sequence, the camera tracks the active tab.** Each new variant = new offsetX target. Hold between transitions.
- During a settled result step (search → row click), the camera centers on the row. Same row in the variant = same offsetX.
- Before a major zoom-in, fade out wordmark/captions and let the camera move happen cleanly over the app.
- It is valid to bring wordmark/captions back after the camera settles, then remove the wordmark again for a split closing caption.
- For zoom-outs into the closing plate, finish the camera move before the closing phrase starts; hold the final phrase, then fade the entire frame together in the last ~0.5s.
- Captions must never overlap the laptop frame, bezel, base, or screen content. Validate overlap visually on stills at each camera extreme.

### Anti-Patterns

- Slow, constant zooms with no narrative purpose.
- `DashboardCamera zoom` changing while the laptop frame stays fixed.
- A framed story inside the laptop that creates dead space inside the screen.
- **Camera stays at `laptopOffsetX = 0` while the variant cycles through tabs/rows that are visually offset to one side.** This makes the cursor and target appear at the edge of the frame instead of centered.

Read `references/zoom-macro-camera.md` before implementing laptop camera moves.

## Pointing at Variant Elements (cursor, ClickRipple, focus)

When a short needs motion graphics that land on specific elements inside the dashboard — a cursor that clicks a tab, a ClickRipple over a button, a `focus` target tuned to a row — you need coordinates in the **variant native space** (1504×940, the `GALLERY_CANVAS` size).

Those coords are NOT the same as the 9:16 frame coords. They are local to the variant as it would render at full size, before any laptop macro-zoom or DashboardCamera scaling. Computing them by inverting the transforms is error-prone.

Use the `CalibrationGrid` overlay instead:

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

Render a still, read the magenta/cyan grid labels, paste the coords into `TAB_X` / `ANCHORS` consts, then remove the overlay.

Calibrate **once per variant**. Save the result to `references/variant-anchors.md` so the next short skips the work. The shell column layout (sidebar 250 / main 1210 / rail 44) and the canvas size never change; only the inner widget coords vary per variant.

Read `references/calibrating-anchors.md` before placing cursor or clicks inside a variant. Look in `references/variant-anchors.md` for existing calibrated coords.

## Outro Plate

End the short with the brand wordmark centered on black, not with the last caption frozen on the dashboard. The pattern uses two coordinated opacities:

- `mainSceneOpacity` — fades the body (laptop + captions + early wordmark) at the end of the last caption.
- `finalWordmarkOpacity` — fades in the wordmark plate after the body is gone, holds, then fades out.

Use `assets/WordmarkOutro.tsx` as a drop-in component. It does not know about brand; pass `src` for non-default wordmarks.

```tsx
<AbsoluteFill style={{ background: colors.bg }}>
  <AbsoluteFill style={{ opacity: mainSceneOpacity }}>
    {/* body of the short */}
  </AbsoluteFill>
  {finalWordmarkOpacity > 0 && (
    <WordmarkOutro
      startAt={15.0}
      fadeOutAt={16.3}
      endAt={16.8}
      logoHeight={140}
    />
  )}
</AbsoluteFill>
```

Keep `WordmarkOutro` as a **sibling** of the body wrapper, not nested inside it — otherwise the body's fade-out cascades into the wordmark.

Read `references/outro-pattern.md` for the full timing recipe and the rationale (why two opacities, why a silence beat between body and plate, what fails when nested).

## Contextual Text Placement

For tighter shorts, wordmark and captions should relate to the laptop, not only to fixed global zones:

- Early claim: place the wordmark just above the laptop and captions just below it.
- Transition zoom: clear all text before the zoom-in starts.
- Enumeration: reintroduce captions, and optionally the wordmark, after the screen is stable.
- Closing phrase: split the final copy across the black space above and below the laptop when it helps rhythm.
- If a phrase ends and there is roughly 1s or more before the next spoken word, use a fade-out during that silence. If the next word starts immediately, cut exactly on the transcript boundary.

Read `references/contextual-text-zones.md` before choreographing text around a laptop zoom.

## Layout

Default layout: create a 4:5 content frame centered inside the 9:16 canvas, then derive the visual anchors from it.

```ts
export const COMP = { width: 1080, height: 1920 } as const;
export const CONTENT_FRAME_4_5 = {
  x: 0,
  y: Math.round((COMP.height - COMP.width * 5 / 4) / 2),
  width: COMP.width,
  height: Math.round(COMP.width * 5 / 4),
} as const;

export const WORDMARK_ZONE = {
  x: 0,
  y: CONTENT_FRAME_4_5.y,
  width: 1080,
  height: 160,
} as const;

export const MOCKUP_ZONE = CONTENT_FRAME_4_5;

export const CAPTIONS_ZONE = {
  x: 0,
  y: CONTENT_FRAME_4_5.y + CONTENT_FRAME_4_5.height - 340,
  width: 1080,
  height: 340,
} as const;
```

Place the wordmark against the top edge of the 4:5 frame. Center the laptop vertically in the 4:5 frame and make it as large as the base shot allows. Anchor captions to the bottom edge of the 4:5 frame; captions should be no more than 3 lines, with the last line sitting on that lower visual boundary.

**Non-negotiable**: every block — laptop, pain tabs, wordmark, captions — must be optically centered on the **shared anchor** `y=960` (the vertical center of the 4:5 frame), not on a local zone. After **any** sizing or positioning change (`LAPTOP_*` constants, `tabWidth/Height`, wordmark `logoHeight`, captions `fontSize`), re-verify that the body of each block still sits on `y=960` and the buffers between blocks still read as 40-80px. The most common iteration regression is resizing one element and forgetting to re-center.

When a scene uses its OWN layout independent of `MOCKUP_ZONE` (eg. PAIN abstract with floating tabs while the laptop hasn't emerged yet), do **not** reuse `MOCKUP_ZONE` — pass an explicit `zone` prop pointing to the 4:5 frame:

```tsx
const painFrame45 = { x: 0, y: 285, width: 1080, height: 1350 };
<PainTabs zone={painFrame45} />
```

Read `references/layout-4x5-wrapper.md` before changing sizing or vertical anchors.

## Validation

Before rendering:

- Run typecheck.
- Generate stills at all word/chunk boundaries.
- Generate stills at camera start/end frames.
- Check that the app content fills the laptop screen without dead internal margins.
- Check audio playback in Studio if the user is validating interactively.

Do not render the final MP4 until the user locks the stills or Studio preview.
