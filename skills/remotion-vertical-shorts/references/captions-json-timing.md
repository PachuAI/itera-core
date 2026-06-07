# Captions From Word-Level JSON

## Rule

The word-level JSON is the source of truth for caption timing. Treat `start` and `end` as hard boundaries.

If word B starts at the same time word A ends, word A/chunk A must not still be visible over word B/chunk B.

Example:

```json
[
  { "text": "centralizar", "start": 5.239, "end": 6.0 },
  { "text": "toda", "start": 6.0, "end": 6.259 }
]
```

Correct:

```tsx
<PhaseWrap t={t} from={3.819} to={6.0} fadeIn={0} fadeOut={0}>
  <WordByWordText words={claim1} />
</PhaseWrap>

<PhaseWrap t={t} from={6.0} to={8.34} fadeIn={0} fadeOut={0}>
  <WordByWordText words={claim2} />
</PhaseWrap>
```

Incorrect:

```tsx
<PhaseWrap t={t} from={3.819} to={6.06} fadeOut={0.06}>
```

That leaves the previous caption visible while the next word is already spoken.

## Chunking

Chunk by readability, but boundaries must come from the transcript:

- `chunk.from = chunk[0].start`
- `chunk.to = nextChunk[0].start`
- last chunk can end at `lastWord.end`
- use `fadeIn={0}` and `fadeOut={0}` for chunk wrappers

If a chunk is too long for two lines, split it at a real word boundary and use that next word's `start` as the exact cut.

## Chunks = Phrases (rule of thumb)

Treat **one spoken phrase = one chunk = one `PhaseWrap`**. A "phrase" is a self-contained idea bounded by a comma or full stop in natural reading. Each chunk is rendered in isolation and replaced when the next one starts, so the viewer gets a clean cadence aligned with the speaker's breath.

For a typical pain→solution short:

| Section | Phrases |
|---|---|
| Pain hook | 2-3 chunks (one per phrase of the question) |
| Claim | 2-3 chunks (one per atomic claim) |
| Enumeration | 1 chunk in `oneAtATime` mode |
| Closing | 1-2 chunks (split top/bottom if camera leaves space) |

Calibrate `fontSize` per chunk so each phrase fits comfortably (1 line if short, 2 lines if longer). Do not stretch one chunk across the whole sentence to "save phases" — the natural punctuation should drive chunking.

## Controlling line breaks inside a phrase

When a single chunk needs an explicit wrap (eg. "tenés que abrir / para saber" must break at "abrir" regardless of font size), mark `breakAfter: true` on the word **before** the break:

```ts
const PAIN_FRASE_2: CaptionWord[] = [
  { text: "tenés", start: 0.859, end: 1.100 },
  { text: "que",   start: 1.100, end: 1.179 },
  { text: "abrir", start: 1.179, end: 1.500, breakAfter: true },  // ← salto acá
  { text: "para",  start: 1.500, end: 1.699 },
  { text: "saber", start: 1.699, end: 2.019 },
];
```

`breakAfter` only affects layout (a `flexBasis: 100%` spacer is inserted after the word). It does not affect timing. The visual wrap is independent of the rest of the flex-wrap behavior, so chunks without `breakAfter` keep relying on natural line-wrapping based on `fontSize` + container width.

A phrase that should occupy exactly one line is just a chunk with no `breakAfter` and a `fontSize` chosen to fit. Don't encode "single line" via punctuation in `text` — that mixes display rules with semantic content.

## Word-by-word for enumerations (`oneAtATime`)

Enumerations ("Expediente, movimientos, tareas, archivos,") read poorly as accumulating captions: each item is important and short, and they get spoken on the beat. The cleanest treatment is **one item at a time, large, centered** — each word appears as the speaker says it and leaves when the next one starts.

Pass `oneAtATime` to `WordByWordText`:

```tsx
<PhaseWrap t={t} from={8.340} to={12.199} fadeIn={0} fadeOut={0}>
  <WordByWordText
    words={ENUM_WORDS}
    oneAtATime
    fontSize={132}
    zone={enumCaptionZone}
  />
</PhaseWrap>
```

The component:

- Renders only the current word (centered absolute in the zone).
- Computes "current" as the most recent word whose `start` has passed but the next word's `start` has not.
- Animates each word in (slide-up-fade at its `start`) and out (fade-out near the next word's `start`).
- Skips `emphasis` / `pastInAccent` logic — every word in `oneAtATime` mode renders with the accent gradient because each is the active item.

Use `oneAtATime` for any phrase where each token is a discrete unit and should be "punched" — typically lists separated by commas, but also for staccato emphasis ("uno. dos. tres."). Avoid it for prose phrases — the visual replacement reads weirdly when words flow naturally.

## Silence Gap Fade-Outs

Default rule: when the next spoken word starts immediately, do not fade across the boundary. Cut exactly at `nextWord.start`.

Exception: if a phrase ends and there is about 1s or more of silence before the next spoken word, a fade-out is useful and allowed.

Example:

```json
[
  { "text": "causa?", "start": 2.579, "end": 2.919 },
  { "text": "En", "start": 3.819, "end": 3.939 }
]
```

The previous phrase may hold briefly after `2.919` and fade out inside the silence, as long as it is gone before `3.819`.

```tsx
<PhaseWrap t={t} from={0.859} to={3.42} fadeIn={0} fadeOut={0.42}>
  <WordByWordText words={painQuestion} />
</PhaseWrap>
```

Do not use this exception when the gap is short. Never fade a previous chunk over the first visible frame of the next spoken word.

## Word Animation

Word animation can happen inside the chunk, but it must not change timing.

Allowed:

- instant or near-instant opacity at `word.start`
- accent/highlight while a word is current
- persistent accent for already spoken words if the user wants accumulation
- glow, gradient, weight, or color changes that do not delay readability

Avoid:

- 200-300ms fade-ins after `word.start`
- slide-ups that make the word unreadable after the audio starts
- chunk crossfades
- lingering previous words after the next word begins, unless both words are intentionally part of the same visible chunk

Recommended word entrance:

```tsx
const wStartF = Math.round(word.start * fps);
const opacity = interpolate(frame, [wStartF - 1, wStartF], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

## Validation

For each chunk boundary, render:

- one frame before boundary
- exact boundary frame
- one frame after boundary

At `boundary = 6.0` and `fps = 30`, inspect frames 179, 180, and 181.

The previous chunk may appear at frame 179. At frame 180 and after, only the new chunk should appear.

Also validate silence fade-outs with a frame during the fade and a frame before the next word. The old text should be fully gone before the next word starts.
