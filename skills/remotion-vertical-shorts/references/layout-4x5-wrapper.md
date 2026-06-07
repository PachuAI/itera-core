# 4:5 Wrapper Inside 9:16

## Rule

For vertical SaaS shorts, use a centered 4:5 composition frame inside the 9:16 canvas as the primary layout reference.

For a 1080x1920 composition:

```ts
const CONTENT_FRAME_4_5 = {
  x: 0,
  y: 285,
  width: 1080,
  height: 1350,
};
```

The final video is still 9:16. The 4:5 frame is a design guide that keeps the wordmark, mockup, and captions visually closer and easier to camera-frame.

## Derived Zones

- Wordmark: top edge of the 4:5 frame.
- Mockup: centered vertically inside the 4:5 frame, as large as possible for the base shot.
- Captions: bottom edge of the 4:5 frame.

Recommended defaults:

```ts
export const WORDMARK_ZONE = {
  x: CONTENT_FRAME_4_5.x,
  y: CONTENT_FRAME_4_5.y,
  width: CONTENT_FRAME_4_5.width,
  height: 160,
} as const;

export const MOCKUP_ZONE = CONTENT_FRAME_4_5;

export const CAPTIONS_ZONE = {
  x: CONTENT_FRAME_4_5.x,
  y: CONTENT_FRAME_4_5.y + CONTENT_FRAME_4_5.height - 340,
  width: CONTENT_FRAME_4_5.width,
  height: 340,
} as const;
```

## Caption Anchor

Captions should be bottom-aligned inside `CAPTIONS_ZONE`, not vertically centered. This makes the lowest visible caption row collide with the bottom boundary of the 4:5 frame, while the 9:16 canvas still leaves black room below.

Keep captions to 3 lines max. If a chunk exceeds 3 lines, split it at a real transcript word boundary and use the next word's `start` as the exact cut.

## Camera Implication

The laptop can start large and centered in the 4:5 frame, then the macro camera can zoom/pan over the full laptop. Because the composition is already tighter, avoid compensating with internal app zooms.

## Non-negotiable: vertical centering inside the 4:5 frame

**Every layout block — laptop, pain tabs stack, wordmark, captions — must be optically centered inside the 4:5 frame, not inside the 9:16 canvas, and not inside an arbitrary `MOCKUP_ZONE` that drifted off the 4:5 contract.**

The 4:5 frame goes from `y=285` to `y=1635` in a 1080×1920 composition. Its vertical center is `y=960`. That number is the **only** anchor when deciding where a new block lives.

### Why this rule exists

Without it, the temptation is to center the laptop in some `MOCKUP_ZONE` (eg. `y=440-1320`, center `880`), then place pain tabs in a different zone, then captions in another, and so on. Each block ends up centered in its own local zone, drifting off the shared 4:5 frame. The result reads as "everything is too separated" or "the stack looks displaced" because the optical center moves around between scenes.

The right pattern: pick the 4:5 frame center (`y=960`) as the **single shared anchor**. The body of each block (the laptop screen body, the stack of tabs, etc.) sits with its visual midpoint on that anchor. Surrounding text (wordmark above, captions below) hugs that body with a comfortable buffer.

### Applying the rule

- A laptop drawn at a fixed size should have its **visual center** (not the top of the frame, not the center of the screen, the whole mockup including bezel + base) sitting on `y=960`.
- A PainTabs stack should center its midpoint on `y=960`. If the stack span is `H` tall, its top is at `960 - H/2` and its bottom at `960 + H/2`.
- Auxiliary text (wordmark above the body, captions below) sits in zones derived from the body's top/bottom edges. Buffer 40-80px between the body edge and the nearest text baseline — this is the "optically comfortable" distance. Less than 40 reads as crowded; more than 80 reads as drift.

### When the rule conflicts with an existing `MOCKUP_ZONE`

If the project's `MOCKUP_ZONE` is not the 4:5 frame (eg. it was sized smaller to keep room for a specific wordmark height), and you're adding a NEW block (different scene, eg. PAIN abstract before the laptop emerges), do not reuse the existing `MOCKUP_ZONE` for the new block — center the new block on the 4:5 anchor instead. Pass an explicit `zone` prop to the block component (eg. `<PainTabs zone={painFrame45} />`) so it uses the right anchor.

Document the divergence in a comment near the override:

```tsx
// PAIN block lives in the 4:5 frame, not in MOCKUP_ZONE (which is sized
// for the laptop's specific aspect). Override the default zone so the
// stack centers on y=960 regardless of where MOCKUP_ZONE sits.
const painFrame45 = { x: 0, y: 285, width: 1080, height: 1350 };
<PainTabs zone={painFrame45} />
```

### When you change ANY block's size or position

After any of:

- Resizing the laptop frame (changing `LAPTOP_WIDTH`, `LAPTOP_HEIGHT`, or any `LAPTOP_*` constant).
- Changing the PainTabs stack dimensions (`tabWidth`, `tabHeight`, `diagonalOffset*`).
- Adjusting the wordmark logo height.
- Changing the captions font size.

**Re-verify** that the body of the block still optically sits on `y=960` and the surrounding text buffers still read as 40-80px. If you only changed sizing without re-checking the centering, the layout drifts off without anyone noticing.

This is the single most common regression in iterations: someone resizes a block, doesn't re-center, and the layout reads "weird" without an obvious reason. Always re-center after any sizing change.
