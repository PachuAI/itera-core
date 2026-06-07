# Contextual Text Zones Around Laptop

## Rule

Do not treat wordmark and captions as permanently fixed bands when the short uses a laptop camera move. Let text placement follow the narrative phase.

Captions must never overlap the laptop frame, bezel, base, or screen content. A still is not validated until the text has visible black-space separation from the mockup at that frame.

## Pattern

1. **Intro / claim**
   - Wordmark sits close above the laptop.
   - Captions sit close below the laptop.
   - This makes the black space feel intentional and keeps the composition compact.

2. **Clean camera move**
   - When a major zoom-in starts, fade out wordmark and captions first.
   - The zoom should happen over the full laptop/frame with no text competing in the black space.
   - Keep the fade short and place it after the last spoken word in the prior caption chunk.
   - For zoom-outs into a final plate, finish the camera move before the closing caption starts.

3. **Enumeration**
   - After the camera settles, reintroduce captions at the next transcript word boundary.
   - If the wordmark returns, keep it smaller/subtler than the intro.
   - Check each camera extreme. If the laptop is zoomed in, push captions lower or temporarily clear them.

4. **Closing phrase**
   - It is valid to split one sentence into two spatial captions:
     - first clause above the laptop
     - final clause below the laptop
   - Keep each clause synced to its own word-level timings.

## Implementation

Caption and wordmark components should accept explicit zones:

```tsx
<WordmarkBanner zone={claimWordmarkZone} opacity={claimOpacity} />

<WordByWordText
  words={claimWords}
  zone={claimCaptionZone}
  verticalAlign="start"
  opacity={claimOpacity}
/>
```

Avoid moving text by hardcoded CSS transforms in the composition when a reusable `zone` prop is clearer.

## Overlap Validation

For each still used as an audit point:

- Confirm caption text does not touch or cover the laptop base, chrome, bezel, or app screen.
- Confirm glow/shadow does not visually smear onto the frame in a way that reads as overlap.
- Check the most zoomed-in frames first; those are where bottom captions usually collide with the laptop.
- If overlap exists, adjust the zone and regenerate the still before reporting it as passing.

## Zoom Choreography

Use the same rule for zoom-ins and zoom-outs: text should explain stable frames, not fight camera movement.

Recommended sequence for a zoom-in:

1. Finish the current spoken caption exactly at its transcript boundary.
2. Fade overlays out over a short window.
3. Run the macro camera move with no wordmark/captions.
4. Hold the new framing for a few frames.
5. Bring captions/wordmark back on the next spoken word boundary.

Recommended sequence for a zoom-out into the closing plate:

1. Start the zoom-out immediately after the last enumerated item.
2. End the camera move before the closing phrase starts.
3. Show the closing phrase with the laptop already stable.
4. Hold the complete closing phrase long enough to land.
5. Fade the entire frame together in the final 0.5s.

Do not let a slow camera move continue underneath a closing caption unless the movement itself is the point of the beat. For SaaS shorts, the closing line usually needs a stable product shot.
