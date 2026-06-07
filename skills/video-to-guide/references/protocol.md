# Video To Guide Protocol

## Purpose

Convert a tutorial video into a durable learning artifact that explains what the teacher is saying, shows the visual proof, and turns the lesson into practical rules that can later become agent skills.

## Source Analysis

Start with local files when available:

- video: `.mp4`, `.mov`, `.mkv`
- transcript: `.transcript.json`, `.srt`, `.vtt`, `.txt`
- audio: `.mp3`, `.wav`
- source list or YouTube URLs
- existing guide/index files

Compare the video title, source list, existing catalog/index focus, and any existing guide against the transcript. Treat metadata as a hypothesis, not truth. If the transcript's durable thesis differs from the catalog focus, update the catalog as part of the guide work.

When the repo has a static catalog or index, validate consistency before and after guide creation:

- `status: ready` plus a missing guide file means the catalog is stale.
- An existing guide plus a non-ready status means the catalog should be updated.
- A broad or generic focus should be tightened when the transcript reveals a more specific thesis.
- The catalog's still count, status, link, and focus should describe the actual final guide, not just the source title.
- Make this check mechanical before writing when the project structure allows it:

```bash
test -f guides/video-XX.html || echo "catalog guide missing"
node --check assets/app.js
```

Use the missing-guide result to classify the work: creating a new guide, revising an existing guide, or fixing stale catalog metadata.
- Make the catalog decision explicit before finishing:

```text
catalog entry exists: yes/no
guide path existed before: yes/no
status before: ready/draft/missing
status after: ready/draft/unchanged
focus changed: yes/no
reason:
```

- Note stale catalog findings in the work summary with an explicit before/after line, for example:

```text
catalog before: entry yes | guide missing | status ready | focus broad
catalog after: guide exists | status ready | focus updated to verified thesis
```

For JSON transcripts, inspect keys first. When both `segments` and `words` exist:

- `segments`: use for rough conceptual grouping.
- `words`: use for exact phrase timing, still timing, and quote boundaries.
- `text`: use for full-read coherence.

Before writing, verify the thesis from transcript evidence:

- opening claim or hook,
- closing rule or payoff,
- repeated terms and examples,
- visual demonstrations that receive screen time,
- any explicit caveat that changes the lesson.

## Grouping Method

Create groups larger than raw segments and smaller than whole chapters. A good group has one clear teaching function.

Suggested group record:

```text
range: 01:10-02:05
role: demonstration
point: The speaker shows that CSS improves faster when applied to a real app.
visual need: UI/code before-and-after or final hover state.
guide value: high
candidate stills: 01:22, 01:38, 01:54
chosen still: 01:54 because it shows code and final UI together.
```

For production guide work, keep at least a compact working table before final still extraction:

```text
range | role | point | visual need | chosen still
```

This table does not need to appear in the final guide, but it should exist as the reasoning bridge between transcript groups and image selection. If a group has no visual need, mark it as text-only instead of forcing a decorative still.

For visual-heavy tutorials, add a coverage table before final still extraction:

```text
block | teaching point | evidence needed | candidate timestamp
```

Use this table to confirm every major visual mechanism has proof. It prevents the contact sheet from over-weighting frames that look polished but do not prove the teaching point.

For long videos, use two grouping passes:

1. Argument pass: identify the major rhetorical arc, such as thesis, evidence, objections, framework, examples, and closing rule.
2. Framework pass: identify reusable teaching units, such as pillars, steps, heuristics, checklists, or repeated patterns.

The final guide should reflect the framework without becoming a transcript-shaped outline.

Adjust grouping to the video type:

- Practical/tutorial videos: steps, rules, examples, mistakes, workflow.
- Tips/cheat-sheet videos: compress individual tips into operational families such as visual polish, layout/responsive behavior, interaction, reference analysis, validation, and workflow. Avoid a transcript-shaped guide with one full chapter per tiny tip unless a tip becomes a durable lesson through examples or visual proof.
- Narrative/dramatized videos: setup, metaphor, contrast, escalation, payoff, operational moral.
- Opinion/argument videos: claims, evidence, caveats, counterpoints, applied interpretation.
- Pattern-history/remix videos: group by origin of the pattern, adaptation into a new medium, execution improvement, and transferable design rule. Do not force these into tutorial steps; the teaching value is often in tracing how a familiar UI or product idea changed context.
- Learning/AI-judgment videos: start from the concrete pain point, identify the false shortcut, state the durable learning principle, extract the practice loop, distinguish correct from incorrect tool use, and end with transferable rules. A common shape is:

```text
case or pain point -> risk -> principle -> practices -> correct tool use -> rules
```

- AI/product/business argument videos: define the behavior under critique, separate the tool's legitimate capability from passive or careless use, test the business or market claim, identify who bears the learning/career/product risk, and end with a productive tool-use rule. A common shape is:

```text
definition of AI behavior -> market/product objection -> learning or career risk -> correct tool use -> operational rule
```

For these videos, avoid flattening the thesis into "AI is bad." Preserve the distinction between:

- the tool being useful for speed, planning, writing, debugging, or specific tasks,
- the user outsourcing judgment, validation, debugging, or learning to the tool.

For videos that are mostly a list of small tactics, run an extra compression pass:

```text
raw tips -> operational families -> reusable rules
```

Example: gradients, shadows, border radius, and cards may become one "visual polish and grouping" family; hover, reveal, and keyframes may become one "interaction feedback" family. Preserve specific tips as examples inside the family instead of inflating the chapter map.

For UX/UI videos, add a mechanism pass after grouping. The question is not only "which chapter is this?" but "what kind of evidence would prove the design rule?" Useful evidence families include:

- broken or unstyled UI that exposes the problem,
- corrected UI that shows the intended result,
- before/after comparison or micro-refactor,
- perceptual diagram or mental model,
- design token, CSS variable, or implementation system,
- repeated component/list/card pattern,
- validation at real size, responsive size, or with dynamic content,
- theme, state, or color-system conversion.

For CSS, layout, or responsive-design tutorials, make the mechanism pass more concrete before extracting stills. Classify likely evidence as:

- parent-child, document-tree, or box-model diagram,
- broken or unresponsive state that exposes the problem,
- CSS property, shorthand, variable, or token being applied,
- before/after layout behavior,
- flex, grid, or positioning decision,
- breakpoint or media-query condition,
- gotcha or edge case,
- final layout validated across viewport, content, or theme states.

Use this classification to avoid generic editor screenshots. A code still is strong only when the visible property, selector, or result is the thing the guide explains.

For animation or interaction tutorials, make the mechanism pass explicit. Prefer stills that prove how the motion is produced, not just how it looks:

- `animation`, `transition`, duration, delay, fill mode, iteration count, or timing function,
- `@keyframes` with percentages, `from/to`, transform, opacity, width, or position changes,
- easing curves or cubic-bezier tools that explain speed and weight,
- ghost elements, pseudo-elements, clones, z-index, or absolute layers that preserve layout,
- JavaScript measurement such as `getBoundingClientRect`, offset/client dimensions, or dynamic destinations,
- Web Animations API calls, timeouts, callbacks, or class toggles that synchronize feedback,
- 3D primitives such as perspective, preserve-3d, rotate, and backface visibility,
- SVG paths, `offset-path`, `animateMotion`, stroke dash values, gradients, or morph-compatible path points.

A strong animation still should support a caption like: `This frame proves the movement works because this property/layer/timing decision changes X into Y.` Avoid mid-transition frames unless the intermediate state itself is the teaching point.

For before/after or micro-refactor sections, keep a compact note in this shape:

```text
before: what problem is visible
change: what property, structure, or token changed
after: what user benefit improved
```

Use that note in captions. A strong caption says what changed and why it matters to the user; it does not merely say that the final UI looks better.

## Evidence Search

Use a broad contact sheet first, then dense extraction for important ranges.

Example commands:

```bash
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "video.mp4"
# Choose a tile with enough cells: ceil(duration_seconds / interval_seconds).
ffmpeg -nostdin -hide_banner -loglevel error -i "video.mp4" -vf "fps=1/10,scale=240:-1,tile=6x20:padding=8:margin=10:color=white" -frames:v 1 "review/contact-10s.jpg"
ffmpeg -nostdin -hide_banner -loglevel error -ss 00:01:54 -i "video.mp4" -frames:v 1 -q:v 2 "still-03-hover-final.jpg"
```

Keep exploratory contact sheets bounded. Start with a low-density whole-video sheet such as `fps=1/8`, `fps=1/10`, or `fps=1/15`, depending on video length and visual density. Use denser sheets only for short timestamp ranges that the transcript or broad sheet identifies as important.

For videos dominated by code editors, dark UI, diagrams, dashboards, or small on-screen text, treat the first low-resolution contact sheet as a locator only. If the tile size makes code or UI unreadable, generate a second review sheet with larger tiles and fewer columns, for example `scale=300:-1` or `scale=320:-1`. Do this before locking final stills, because a tiny contact sheet can hide whether the frame actually proves the mechanism.

Before generating a one-image contact sheet, estimate the number of captured frames and make the tile large enough. If `duration / interval` is greater than the tile cell count, `ffmpeg` will only render the first full sheet and later parts of the video will be missing. Increase rows/columns, lower density, or split the video into multiple timestamp ranges.

If a dense whole-video sheet is taking too long, stop it and switch to range-specific extraction. A slow exploratory sheet is not worth waiting for when a broad sheet plus transcript ranges can identify the same evidence. After switching strategies, still generate a selected-stills contact sheet and verify captions against the actual final images.

As a practical default, if a global contact sheet for a short or medium video takes more than about 45-60 seconds, stop waiting and switch to one of these approaches:

- lower density, such as `fps=1/15`,
- separate sheets per major transcript range,
- direct candidate extraction from the coverage table.

If the guide will use more than eight final stills, do not exact-seek every timestamp as the first extraction pass. Exact seeking with `ffmpeg -nostdin -i video -ss timestamp` can be very slow on longer videos or certain codecs because it may decode from the start. Prefer this sequence:

1. Generate broad contact sheets.
2. Extract likely final stills with fast seeking.
3. Generate dense review ranges for visually rich sections.
4. Build the selected-stills contact sheet.
5. Exact-seek only the stills whose final image is wrong, ambiguous, or frame-sensitive.

When many final stills need accurate timing, and the video reports a stable frame rate, use a single frame-number extraction pass instead of many slow exact seeks:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=avg_frame_rate,r_frame_rate,start_time \
  -of default=nw=1 "video.mp4"

# Example for a 30 fps video: 16s -> frame 480, 40s -> frame 1200.
ffmpeg -nostdin -y -hide_banner -loglevel error -i "video.mp4" \
  -vf "select='eq(n,480)+eq(n,1200)+eq(n,2400)'" \
  -vsync 0 -q:v 2 "review/frame-%02d.jpg"
```

After this pass, rename or copy the numbered frames into coherent final still filenames, regenerate the selected-stills contact sheet, and verify captions against those actual files. Use this method only after confirming the frame rate is stable enough for timestamp-to-frame math; otherwise use dense range extraction.

Use fast seeking for exploration and exact seeking only when final-frame precision matters:

- Exploration: `ffmpeg -nostdin -ss 00:01:54 -i "video.mp4" ...`
- Final replacement when the exact frame matters: `ffmpeg -nostdin -y -i "video.mp4" -ss 00:01:54 ...`

Fast seeking is useful for broad candidate generation and for conceptual evidence where nearby seconds show the same visual state. Exact seeking is worth the cost when the still must capture a precise UI state, animation endpoint, cursor position, visible phrase, or completed visual change.

For stills near the first second of a video, or any scene where the opening frame matters, prefer exact seeking and verify visually before writing the caption:

```bash
ffmpeg -nostdin -y -hide_banner -loglevel error \
  -i "video.mp4" -ss 00:00:00.1 -frames:v 1 -q:v 2 "still-01-opening-state.jpg"
```

Fast seeking at `00:00` can land on a later keyframe and silently capture a different screen than the opening visual.

When batching still extraction from a timestamp list, always pass `-nostdin`. Without it, `ffmpeg` can consume the loop's heredoc or pipe as interactive input and corrupt the remaining timestamp/name pairs.

```bash
while IFS='|' read -r ts name; do
  ffmpeg -nostdin -y -hide_banner -loglevel error \
    -ss "$ts" -i "$video" -frames:v 1 -q:v 2 "$out/$name"
done <<'EOF'
00:01:12|still-02-core-functionality-first.jpg
00:01:45|still-03-similarity-proximity.jpg
EOF
```

If exact seeking becomes slow because of video length, codec, or machine load, stop it and switch to fast seeking unless the guide genuinely needs frame-level precision. Then regenerate the selected-stills contact sheet and visually verify every caption against the final images. Do not leave long exact-seeking jobs running for many minutes when a nearby frame proves the same teaching point.

Fast seeking can return a nearby keyframe rather than the exact moment. If a final still appears several seconds early and the mismatch changes the evidence or caption, re-extract with exact seeking or use a dense rescue range, then rebuild the selected-stills contact sheet before writing or keeping captions.

When a range is visually dense, extract candidates every 1-3 seconds within that range and review them before choosing.

When the video studies an external app, site, design library, or inspiration source, do not stop at "this looks good." Treat the reference as implementation evidence. For each selected reference still, identify what mechanism it demonstrates:

- layout system or responsive constraint,
- spacing, radius, shadow, color, or typography token,
- component pattern or repeated card/list/form structure,
- asset type such as raster image, SVG, icon set, or generated media,
- state change such as hover, focus, reveal, fill, transition, or loading,
- user-flow context that a single isolated screenshot would hide.

In the guide, translate the visual reference into implementable observations. If the mechanism cannot be inferred confidently, mark it as an inference rather than a fact.

Sponsor segments should not be discarded mechanically. Make the sponsor decision explicit before final still selection. If the sponsor is integrated into the lesson and demonstrates a reusable workflow, reference library, search/filter method, real app flow, or product evidence that supports the thesis, treat it like any other evidence block. If it is only a promotional interruption, compress it in the chapter map or skip it, and do not spend still budget on it.

If a specific final still keeps missing the intended visual, use a dense rescue pass around the transcript range:

```bash
mkdir -p "guides/assets/video-XX/review/exact"
for t in 20 24 28 32 36 40; do
  ffmpeg -nostdin -y -hide_banner -loglevel error -i "video.mp4" -ss "$t" -frames:v 1 -q:v 2 "guides/assets/video-XX/review/exact/t-$t.jpg"
done
ffmpeg -nostdin -y -hide_banner -loglevel error -pattern_type glob -i "guides/assets/video-XX/review/exact/t-*.jpg" -vf "scale=200:-1,tile=6x2:padding=8:margin=10:color=white" -frames:v 1 "guides/assets/video-XX/review/exact/contact-range.jpg"
```

After selecting the best rescued frame, copy or re-extract it into the final `still-NN-name.jpg` path, then regenerate the selected-stills contact sheet.

For rescue passes with many candidate timestamps, avoid starting with dozens of exact seeks. First use fast seeking or dense short-range extraction around the transcript window, then inspect the rescue contact sheet. Use exact seeking only for the few frames where the exact cursor position, completed animation, visible text, or UI state changes the caption's meaning. If a nearby fast-seeked frame proves the same point, keep it and move on.

If a still introduces a section but does not show the actual mechanism, treat it as weak even if the timestamp is correct. Extract 5-8 nearby frames inside the same transcript range and choose the frame that shows one of:

- variables, values, code, or tokens,
- before/after or format comparison,
- a completed state change,
- a final result or copied/exportable artifact,
- another observable difference that the caption can point to directly.

After choosing stills, generate a selected-stills contact sheet. This is a hard gate, not an optional audit: do not write or keep final captions until the sheet has been opened or inspected and every chosen still has been checked against its intended evidence claim. Review the chosen set together and ask:

- Does every still prove a different point?
- Can every still complete the sentence `This frame proves that...` with a concrete guide claim?
- Are any stills merely atmospheric?
- Are any stills only generic text slides when a UI, diagram, code frame, or completed example nearby would prove more?
- Is a later frame in the same sequence clearer?
- Are core framework items missing visual evidence?
- Is the guide overweighted toward one part of the video?
- Does each still match the timestamp and caption planned for it?
- Is any still too dark, visually unreadable, or a generic intermediate frame?
- Does any caption depend more on transcript explanation than what the still itself proves?

Replace weak stills before writing final captions. If a fast-seeked still captured the wrong scene, a meme/transition, a nearby keyframe, or a frame that changes the meaning of the caption, do not patch the caption around the bad image. Re-extract that individual still with exact seeking or use a dense rescue range around the transcript window, then regenerate the selected-stills sheet.

This review pass is mandatory. A still can be inside the correct timestamp range and still be the wrong final choice. The selected-stills sheet should make weak choices obvious before captions lock them in.
If any final still is overwritten after captions are drafted, re-check that caption against the image before finishing.

After the final selection is stable, keep published stills separate from rejected candidates. Move unreferenced `still-*.jpg` files to `review/unused/` or delete them. The main `guides/assets/video-XX/` folder should be easy to audit: final stills plus `review/`, not every candidate generated during exploration.

When a tutorial ends in reusable output, include a final-result still when it proves a real teaching point. Good candidates include generated code, copied theme tokens, exported assets, a working tool result, a finished UI state, or a resource the viewer is meant to use. Do not include a final still merely because it is the last frame; it still needs to pass the proof sentence test.

## Still Choice Criteria

Strong stills usually contain at least one of:

- a completed diagram or list,
- a prompt that shows how the speaker asks the AI/tool,
- a before/after comparison,
- an interface at the moment the problem becomes visible,
- code beside the result it changes,
- a final state after an animation/sequence,
- an error or broken state that explains the learning moment.

Weak stills usually include:

- reaction clips with no instructional content,
- mid-transition animation frames,
- repeated frames where a later frame is clearer,
- sponsor visuals that do not teach a transferable point,
- memes, transition jokes, or motivational closing frames that mark a chapter but do not prove a transferable rule,
- generic text-only slides that restate the narration without adding structure,
- generic talking-head frames unless they contain key on-screen text.

For long educational videos, prefer coverage by durable teaching point rather than by timestamp interval. It is acceptable for one rich section to contribute several stills and for a low-value section to contribute none.

## Guide Structure

For each guide, prefer:

1. Hero: title, source, duration, thesis.
2. Idea in one sentence: the durable lesson.
3. Chapter map: timestamp ranges grouped by intent.
4. Deep explanation: what the video teaches and why it matters.
5. Evidence section: selected stills with captions that state the point proven.
6. Applied translation: what changes in UX/UI/coding work.
7. Checklist: operational steps a person or agent can follow.
8. Candidate skill rules: tentative rules to validate across more videos.

For longer videos, add a short "segment grouping" note or make the chapter map explicit enough that a reader can see how the transcript was compressed into teaching blocks.

## Caption Standard

Each still caption should answer:

- timestamp,
- what is visible,
- what point it proves,
- why this still was chosen over nearby alternatives when relevant.

Before keeping the still, run the proof sentence test:

```text
This frame proves that...
```

If the completion is vague, decorative, redundant with another still, or only says that the speaker mentioned a topic, the still is not strong enough for the guide. Replace it with a more structural frame from the same group or make the group text-only.

Example:

```text
05:00 · Just-in-time vs just-in-case.
This frame proves the distinction because the speaker has reduced the argument to a visual contrast:
learn when the work creates the need, not just in case someday it might.
```

## Writing Standard

Do not produce a simple summary. Produce a guide that helps the reader absorb and reuse the lesson.

Use the transcript as source material, but restructure around understanding:

- name the concept,
- explain the mechanism,
- show the evidence,
- give a concrete example,
- state the operational rule,
- note limitations or caveats.

## Validation Standard

Before finishing:

- Check every guide image path exists.
- For static guide repos, use a concrete missing-file check, for example:

```bash
for f in $(rg -o 'assets/video-XX/[^" ]+\.(jpg|jpeg|png|webp|gif|svg)' guides/video-XX.html); do
  test -f "guides/$f" || echo "missing $f"
done
```

- Confirm source video, transcript, and YouTube/local links resolve to the intended video.
- Confirm the guide path is present in the catalog/index when the repo has one.
- Validate catalog JavaScript with `node --check assets/app.js` when applicable.
- Confirm the catalog/index focus matches the guide thesis, not just the video title.
- If the existing catalog focus is broadly correct but less specific than the verified transcript thesis, update it. The catalog should describe what the guide actually teaches, not just a generic topic label.
- Record the catalog decision in the work notes or final summary with the compact matrix: catalog entry exists, guide path existed before, status before, status after, focus changed, reason.
- Keep broad and selected contact sheets under `review/` for future audit.
- Before finishing, clean the final asset set:
  - remove obsolete selected contact sheets created during iteration,
  - keep exactly one current selected-stills contact sheet unless there is a clear reason for variants,
  - make final still filenames coherent enough to audit against the guide,
  - confirm any still count shown in the hero/meta equals the number of referenced final stills,
  - for HTML guides, count referenced figures with `rg -c '<figure><img src="assets/video-XX/' guides/video-XX.html` and compare that number with the visible still count,
  - move unused candidate stills to `review/unused/` or remove them,
  - leave exploratory broad contact sheets only when they help future review.
- Open or inspect the selected-stills contact sheet one last time and verify there are no caption/timestamp mismatches introduced by late replacements.
- Run a lightweight text sanity scan for placeholders and common writing artifacts before finalizing. Tailor the terms to the repository language, but include obvious development placeholders and any suspicious tokens noticed while editing:

```bash
rg -n 'TODO|FIXME|placeholder|undefined|missing|acompanE|descripccion' guides/video-XX.html assets/app.js
```

Use the scan as a prompt for review, not as a strict failure on legitimate words such as a CSS class or app status string.

Treat Git as optional. Some guide folders are plain directories, not repositories. Before using Git for status or diffs, run:

```bash
git rev-parse --is-inside-work-tree
```

If it fails, do not run `git status` or `git diff -- path-a path-b`; outside a repo, Git may treat two paths as a `--no-index` comparison and produce misleading output. Summarize changes with direct checks instead, such as `test -f`, `find`, `rg -c`, `wc -l`, and the validation commands above.

## Skill Distillation

Do not convert one video directly into a final skill unless the user asks. Usually collect candidate rules across several guides first.

Good candidate rules are:

- specific enough to change agent behavior,
- backed by visual or transcript evidence,
- repeat across multiple videos or apply broadly,
- phrased as actions/checks, not motivational slogans.

Example candidate:

```text
Before improving a UI, ask for a concrete screen and diagnose spacing, hierarchy, color,
typography, state clarity, and responsive behavior before proposing a redesign.
```
