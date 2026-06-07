# Outro Pattern: Brand Wordmark as Final Plate

A short ends best when the brand mark closes the piece. The audio finishes, the dashboard fades out, and a clean wordmark on black holds for ~1-1.5s before the clip ends. Without that closing plate, the last frame of a typical pain→solution short is just a static dashboard sitting in silence, which feels abrupt.

This pattern coordinates two opacities — `mainSceneOpacity` for the body of the short, `finalWordmarkOpacity` for the closing plate — so the handoff between the two reads as a deliberate beat, not a cut.

## When to use this

Use it for any vertical short where:

- The narrative arc resolves with the last spoken word (typical pain→solution shorts).
- The audio leaves at least ~1s of silence at the end of the clip for the wordmark to breathe.
- The brand has a wordmark asset already in `public/` of the Remotion project.

Skip it for shorts that end mid-action (eg. a button click that fades out into a cut-to-next-scene) or for pieces designed as part of a longer sequence where the brand plate would interrupt.

## The two opacity variables

```ts
// Main scene: laptop + captions + early wordmark + everything inside the body.
// Fades out at the end of the last caption.
const mainSceneOpacity = interpolate(
  t,
  [T.cierreEnd, T.outroPlateStart],   // ej. [14.56, 15.0]
  [1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

// Final wordmark plate: enters after the body is fully gone, holds, then
// fades the whole clip.
const finalWordmarkOpacity = interpolate(
  t,
  [
    T.outroPlateStart,                  // ej. 15.0 — wordmark empieza a entrar
    T.outroPlateStart + 0.4,            // ej. 15.4 — wordmark full opacity
    T.outroPlateEnd - 0.5,              // ej. 16.3 — empieza fade-out
    T.outroPlateEnd,                    // ej. 16.8 — fin del clip
  ],
  [0, 1, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
```

## JSX structure

```tsx
return (
  <AbsoluteFill style={{ background: colors.bg }}>
    <AbsoluteFill style={{ opacity: mainSceneOpacity }}>
      {/* ... laptop + captions + early wordmark + everything else ... */}
    </AbsoluteFill>

    {/* Outro plate — fuera del wrapper de mainSceneOpacity para que
        no se mezcle con el fade-out del body. */}
    {finalWordmarkOpacity > 0 && (
      <WordmarkOutro
        startAt={T.outroPlateStart}
        fadeOutAt={T.outroPlateEnd - 0.5}
        endAt={T.outroPlateEnd}
        logoHeight={140}
      />
    )}

    <Audio src={staticFile("audio.mp3")} />
  </AbsoluteFill>
);
```

The `mainSceneOpacity` wrapper is critical. If the wordmark plate sits inside the same opacity wrapper as the body, the body's fade-out also fades the wordmark — defeats the point. Keep them as sibling layers under the root `AbsoluteFill`.

## Timing recipe (15s short with 14.56s audio)

| Time | Event |
|---|---|
| 14.56s | Last word ends. Cierre caption is fully shown. |
| 14.56-15.0s | `mainSceneOpacity` ramps 1 → 0. Body fades to black. |
| 15.0s | Body is fully gone. Frame is black. |
| 15.0-15.4s | `finalWordmarkOpacity` ramps 0 → 1. Wordmark fades in. |
| 15.4-16.3s | Hold. Wordmark on black. |
| 16.3-16.8s | `finalWordmarkOpacity` ramps 1 → 0. Wordmark fades out. |
| 16.8s | End of clip (`totalEnd`). |

Total wordmark visibility: ~1.8s (0.4 fade-in + 0.9 hold + 0.5 fade-out).

Adjust based on the short's pacing. For a 8-10s short, shorter wordmark hold (0.5s) is fine; for a 15-20s short, a longer hold (1-1.5s) gives the brand time to land.

## What NOT to do

- **Do not nest `WordmarkOutro` inside the `mainSceneOpacity` wrapper.** The wordmark will inherit the body's fade-out and never reach opacity 1.
- **Do not reuse the body's `<WordmarkBanner>` for the outro.** `WordmarkBanner` defaults to `verticalAlign: "start"` and the entry animation (slide-down from above) — both make sense for the early plate but fight the outro framing. `WordmarkOutro` is centered + no entry slide, by design.
- **Do not let the audio bleed into the outro plate.** If the audio has a tail (background music, ambient room tone), trim or fade it before the outro starts.
- **Do not skip the silence beat.** Cutting from `last word.end` directly to `wordmark fade-in` reads as abrupt. The black-frame silence between body and plate is the punctuation.

## Multiple wordmarks (multi-brand projects)

For a project that swaps brands (eg. itera-social hosts shopear + iteralex + itera shorts in the same Remotion repo), parameterize `src`:

```tsx
<WordmarkOutro
  startAt={T.outroPlateStart}
  fadeOutAt={T.outroPlateEnd - 0.5}
  endAt={T.outroPlateEnd}
  src="wordmarks/iteralex-light.png"
  logoHeight={140}
/>
```

The `WordmarkOutro` component does not know about brands. It only renders whatever asset path you pass via `src`. Brand-specific copy/styles live one layer above (in the composition that uses the outro).
