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

Exception: transcript tools may collapse brand names into one invented token, such as `Iteralex` for `ÍTERA Lex`. When manually splitting that token, do not divide time by character count and assume it is correct. Validate by listening + checking stills at the exact spoken boundary. If the audio says the second brand word earlier than the JSON-derived split, update both the corrected JSON and the composition constants with an explicit manual override.

When using Remotion Studio, read the timeline as `seconds:frames`, not decimal seconds. At 30fps, `00:04.22` = 4s + 22 frames = 4.733s. Convert Studio timecodes before editing JSON seconds; otherwise caption overrides drift by hundreds of ms.

Read `references/captions-json-timing.md` before implementing captions.

## Core Workflow

1. Read the audio transcript JSON first.
2. Normalize words only when needed for display, but preserve `start` and `end` exactly.
3. Split captions into readable chunks, with each chunk boundary equal to the next chunk's first word `start`.
4. Build the visual sequence around those timings, not the other way around.
5. Use a laptop mockup only as an outer frame. Do not zoom the app inside the laptop independently unless the user explicitly asks for micro-zoom.
6. For desktop UI in a laptop, use unframed app variants. Do not put a `ScreenFrame`/browser-frame story inside another laptop frame.
7. Validate with stills at exact transcript boundary frames, especially one frame before and after chunk changes.

### Laptop Frame Invariant

`LaptopFrame` is the only device/browser wrapper in a short. Its children must be the naked product UI or a `DashboardShell` mounted directly through `DashboardCamera.content`.

Never nest any of these inside `LaptopFrame`:

- `ScreenFrame`
- a gallery story whose id ends in `-framed`
- a browser/device mockup exported from the component gallery
- any extra outer padding meant for gallery review

If the app screen appears shifted inside the laptop, first check for accidental double framing before adjusting camera offsets. Double framing creates false alignment bugs, hides part of the UI, and makes zoom/pan calibration unreliable.

## Recipe-First Production Method

For ÍTERA Lex product shorts, do not polish camera, captions, cursor, and music in one pass. Start with a flow cut, then promote it into a recipe under `projects/iteralex/campañas/vertical-shorts/_shared/recipe`.

Before the recipe/camera layer, write a `ShortPlan` under `…/_shared/plan` or in the short's `src/plan.ts`. The plan is the human-editable contract between script and UI:

- `screen`: component-library flow step or explicit gallery variant.
- `camera`: approved camera preset or `"same"`.
- `captions`: caption zone or `"none"`.
- `cursor`: target/action, with `cameraLocked: true` when pointer movement must not cause a camera move.
- `purpose`: why this beat exists.

Do not start from Remotion interpolation code when a video is still being structured. First produce a plan:

```ts
export const plan = defineShortPlan({
  id: "clientes-busqueda-rapida",
  title: "Buscar cliente en ÍTERA Lex",
  flow: { id: "encontrar-abrir-cliente", source: "component-library" },
  beats: [
    {
      id: "push-to-search",
      pause: true,
      screen: { flowId: "encontrar-abrir-cliente", step: 1 },
      camera: "focusSearch",
      captions: "none",
      purpose: "Move camera during the pause before the caption returns.",
    },
    {
      id: "type-client-name",
      voice: "Escribís el nombre del cliente en el buscador.",
      screen: { flowId: "encontrar-abrir-cliente", step: 1 },
      camera: "same",
      captions: "belowLaptop",
      cursor: { target: "searchInput", cameraLocked: true },
      purpose: "Typing and result are readable in the same shot.",
    },
  ],
});
```

If a beat cannot explain its `purpose`, remove it or merge it with the previous beat. This prevents micro-pans and decorative camera work.

Layer order:

1. Flow cut: voiceover + product UI state changes, no captions, rough camera only.
2. Shot map: choose the few narrative camera shots. A UI state change does not imply a camera move.
3. Camera pass: implement those shots with presets and render audit stills.
4. Cursor pass: cursor targets live inside the current shot and must not move the camera by themselves.
5. Caption pass: captions added after camera zones are stable.
6. Soundtrack/outro pass: music and final fades last.

For batch production, build Layer 1 for several scripts in series before polishing any single short. Use one shared Remotion workshop: `projects/iteralex/campañas/vertical-shorts/layer-workshop/remotion`. Do not clone a fresh Remotion app per candidate; add each flow cut as a separate composition, keep voice assets in `public/audio/<slug>.{mp3,json}` and source files in `projects/iteralex/audio-text-test/...` with the same slug. Split a short into its own project only after it is approved and needs freezing.

In the workshop, write product screens as direct wrappers (`DashboardShell` → `DashboardCamera content={...}` inside `LaptopFrame`); do not wrap in `ScreenFrame`. Layer 1 excludes captions/cursor/zoom/soundtrack but NOT meaningful UI state animation — if the script names sections ("causas, archivos, notas, presupuestos"), show those tabs/states in sequence, not a static detail screen.

Every meaningful camera beat should have a `movementClass` and `cameraPurpose`. If the purpose is hard to name, hold. Use `movementClass: "none"` for cursor-only actions; `allowShortMove`/`allowCaptionDuringMove` only as reviewed exceptions.

## Camera Rule

All main zooms and pans should be controlled by the 9:16/laptop camera, not by scaling the app inside the laptop screen.

Before solving camera anchors, classify each beat: `screenState` (which UI variant), `cameraShot` (narrative focus of the lens), `cursorTarget` (where the pointer goes), `captionWindow` (when text may be visible), `movementClass` (`none`/`hold`/`macro-pan`/`zoom-transition`/`pull-back`). An anchor does not automatically deserve a camera move — first decide if it is a real narrative shot.

### Non-Negotiable: Camera Tracks the Focus Point

**When `laptopScale > 1` and the variant content shifts (tab change, row click, section reveal), `laptopOffsetX` and/or `laptopOffsetY` MUST animate to keep the active element near frame center.** A camera that stays fixed while variants change underneath is exactly the anti-pattern the user notices first. The whole point of the zoom-in is to guide the eye; if the cursor moves to a new tab but the camera doesn't follow, the content drifts to the edge. Always pan with the cursor.

Reference: `causas-pestanas` v4 (`projects/iteralex/campañas/vertical-shorts/causas-pestanas/remotion/src/compositions/CausasPestanasShort.tsx`) is the validated example — `laptopOffsetX` interpolates through 4 values (`245 → 85 → -70 → -230`) during the 4-tab enum, cursor recurring the tabs and camera tracking each. **Read it as a starting template before writing a new short.**

```ts
// Center a variant element (native_x = X) at frame_x=540, laptop at scale S:
const VIEWPORT_CX = LAPTOP_VIEWPORT.width / 2;          // 952/2 = 476
const offsetX = (VIEWPORT_CX - X * VARIANT_BASE_SCALE) * laptopScale;
// Empirically adjust ±20-30px after rendering stills.
```

For a tab row at `y=290 native`, X centers come from `references/variant-anchors.md`. Cache them in a `TAB_OFFSET_X` const and interpolate `laptopOffsetX` through them at the variant-change moments.

### Good patterns

- `LaptopFrame scale/offsetX/offsetY` zooms the full mockup (bezel, chrome, base, app content move together).
- Camera jumps/eases over short, meaningful intervals tied to the voice.
- **During an enumerated tab sequence, the camera tracks the active tab** (each variant = new offsetX target; hold between transitions). Pans must have perceptible duration: at 30fps avoid 0.10-0.16s tab-tour moves (read as cuts), prefer ~0.32-0.45s unless a snap is intended.
- During a settled result step (search → row click), center on the row.
- Before a major zoom-in, fade out wordmark/captions and move cleanly over the app. Bring them back after the camera settles if needed.
- For zoom-outs into the closing plate, finish the move before the closing phrase; hold, then fade the whole frame in the last ~0.5s.
- Captions never overlap the laptop frame/bezel/base/screen. Validate on stills at each camera extreme.

### Anti-patterns

- Slow, constant zooms with no narrative purpose.
- `DashboardCamera zoom` changing while the laptop frame stays fixed.
- A framed story inside the laptop creating dead space.
- **Camera at `laptopOffsetX = 0` while the variant cycles through offset tabs/rows** (target appears at the edge).
- Micro-pans between nearby elements already readable in the same shot (search input → row → click). Moving the camera just because the cursor target changed. `causas → tareas → archivos → presupuestos` IS a real pan; `input → row` usually is not.

### Caption ↔ zoom is a single contract

- Every zoom preset defines `scale`, horizontal focus, vertical offset, and a caption band proven not to overlap the laptop.
- If a zoomed laptop leaves no room below, raise it with `offsetY` or reduce scale; never place captions over bezel/base/screen/shadow.
- Keep `offsetY` stable across related tab pans so captions don't drift vertically.
- `cameraShot` may stay broad while `cursorTarget` points inside it. When multiple targets are close, hold the camera and let the pointer/UI carry the action.

Read `references/zoom-macro-camera.md` before implementing laptop camera moves.

## Pointing at Variant Elements (cursor, ClickRipple, focus)

Motion graphics that land on specific dashboard elements need coordinates in the **variant native space** (1504×940, `GALLERY_CANVAS`) — NOT the 9:16 frame coords, and NOT computed by inverting transforms (error-prone). Use the `CalibrationGrid` overlay:

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

Render a still, read the magenta/cyan grid labels, paste coords into `TAB_X` / `ANCHORS` consts, remove the overlay. Calibrate **once per variant** and save to `references/variant-anchors.md`. Shell layout (sidebar 250 / main 1210 / rail 44) and canvas size never change; only inner widget coords vary.

Read `references/calibrating-anchors.md` before placing cursor/clicks; check `references/variant-anchors.md` for existing coords.

## Contextual Text Placement

For tighter shorts, wordmark and captions relate to the laptop, not only to fixed global zones:

- Early claim: wordmark just above the laptop, captions just below.
- Transition zoom: clear all text before the zoom-in starts.
- Enumeration: reintroduce captions (and optionally wordmark) after the screen is stable.
- Closing phrase: split the final copy across the black space above/below the laptop when it helps rhythm.
- If a phrase ends with ~1s+ before the next word, fade out during the silence. If the next word starts immediately, cut exactly on the transcript boundary.
- Major zooms/pans happen in pauses with no caption visible; the next caption appears only after the camera is stable.
- If the final phrase is also the final caption, hold it after the audio ends (when timeline allows), then fade gracefully before the outro.
- The black space below the laptop is intentional caption space, but captions must feel attached to the laptop — not so low they look disconnected, never raised into the frame.

Read `references/contextual-text-zones.md` before choreographing text around a laptop zoom.

## Soundtrack Mixing

When a short has voiceover plus soundtrack:

- Start the soundtrack from the beginning or the user-selected musical moment, kept low while the voiceover is active.
- Default bed volume during voiceover: subtle, ~`0.04`-`0.06`, unless the track is unusually quiet/loud.
- When the final voiceover word ends, wait ~`0.5s`, then raise the soundtrack for the outro (default boost `0.50`).
- Keep the boost through the final wordmark/outro hold.
- Fade the soundtrack out together with the final video fade — do not let audio cut abruptly after the image fades.
- If the user references a Studio timecode for the boost/fade, convert `seconds:frames` to real seconds first.

## Outro

End the short with the brand wordmark centered on black, not the last caption frozen on the dashboard. Choose and document one outro style in the `ShortPlan`:

- `fadeToBlackWordmark` (default): laptop/screen fades out first; wordmark fades in on black, holds, fades out with the video.
- `blackOverlayWordmark`: a black overlay fades over the last UI state, leaving the product faintly visible behind the wordmark.
- `directWordmark`: wordmark over live UI. Exception — can make the brand read poorly.

### Outro Plate implementation

Two coordinated opacities:

- `mainSceneOpacity` — fades the body (laptop + captions + early wordmark) at the end of the last caption.
- `finalWordmarkOpacity` — fades in the wordmark plate after the body is gone, holds, then fades out.

Use `assets/WordmarkOutro.tsx` (brand-agnostic; pass `src` for non-default wordmarks).

```tsx
<AbsoluteFill style={{ background: colors.bg }}>
  <AbsoluteFill style={{ opacity: mainSceneOpacity }}>
    {/* body of the short */}
  </AbsoluteFill>
  {finalWordmarkOpacity > 0 && (
    <WordmarkOutro startAt={15.0} fadeOutAt={16.3} endAt={16.8} logoHeight={140} />
  )}
</AbsoluteFill>
```

Keep `WordmarkOutro` a **sibling** of the body wrapper, not nested — otherwise the body's fade-out cascades into the wordmark. Read `references/outro-pattern.md` for the full timing recipe and rationale.

## Layout

Default: a 4:5 content frame centered inside the 9:16 canvas; derive anchors from it.

```ts
export const COMP = { width: 1080, height: 1920 } as const;
export const CONTENT_FRAME_4_5 = {
  x: 0,
  y: Math.round((COMP.height - COMP.width * 5 / 4) / 2),
  width: COMP.width,
  height: Math.round(COMP.width * 5 / 4),
} as const;

export const WORDMARK_ZONE = { x: 0, y: CONTENT_FRAME_4_5.y, width: 1080, height: 160 } as const;
export const MOCKUP_ZONE = CONTENT_FRAME_4_5;
export const CAPTIONS_ZONE = {
  x: 0,
  y: CONTENT_FRAME_4_5.y + CONTENT_FRAME_4_5.height - 340,
  width: 1080,
  height: 340,
} as const;
```

Wordmark against the top edge of the 4:5 frame. Laptop centered vertically, as large as the base shot allows. Captions anchored to the bottom edge, ≤3 lines, last line on that boundary.

**Non-negotiable**: every block — laptop, pain tabs, wordmark, captions — is optically centered on the **shared anchor `y=960`** (vertical center of the 4:5 frame), not on a local zone. After ANY sizing/positioning change (`LAPTOP_*`, `tabWidth/Height`, wordmark `logoHeight`, captions `fontSize`), re-verify each block still sits on `y=960` with 40-80px buffers. The most common iteration regression is resizing one element and forgetting to re-center.

When a scene uses its OWN layout independent of `MOCKUP_ZONE` (eg. PAIN abstract with floating tabs before the laptop emerges), pass an explicit `zone` prop, do not reuse `MOCKUP_ZONE`:

```tsx
const painFrame45 = { x: 0, y: 285, width: 1080, height: 1350 };
<PainTabs zone={painFrame45} />
```

Read `references/layout-4x5-wrapper.md` before changing sizing or vertical anchors.

## Validation

Before rendering:

- Run typecheck.
- Generate stills at all word/chunk boundaries and at camera start/end frames.
- Generate stills for each zoomed caption band; reject any frame where text overlaps the laptop bezel/base/screen/shadow.
- Check for accidental micro-pans by comparing adjacent beat stills: if the subject is already readable and the camera moved only a few px, hold the previous shot.
- Check tab-tour pans still cross meaningful horizontal distance after suppressing micro-pans, and validate intermediate frames so motion reads as a pan, not a one-frame cut.
- Check the last caption after the audio ends and during its fade-out; avoid leaving empty black space too early.
- Check the app content fills the laptop screen without dead internal margins.
- Check audio playback in Studio if validating interactively.

Do not render the final MP4 until the user locks the stills or Studio preview.
