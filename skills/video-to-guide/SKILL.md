---
name: video-to-guide
description: Convert tutorial videos, transcripts, timestamped segments, word-level transcripts, audio, and local media folders into evidence-based study guides, usually HTML pages with stills, conceptual chapters, examples, UX/UI takeaways, and candidate rules for future agent skills. Use when the user asks to analyze a video lesson, create a guide from a transcript/video pair, extract screenshots/stills to prove points, build a video-indexed learning artifact, or distill tutorial content into practical UI/UX/coding guidance.
---

# Video To Guide

## Core Principle

Treat stills as evidence, not decoration. First understand what each transcript block is trying to prove; then choose the strongest visual frame inside that block that proves, clarifies, or challenges the point.

## Workflow

1. Inventory the source files.
   - Locate video, audio, transcript JSON/SRT/VTT/TXT, existing guide/index files, and output folders.
   - Prefer transcript JSON with `segments` and `words` when available.
   - Note missing assets explicitly.
   - Compare the source title, existing catalog/index focus, and existing guide status against the actual transcript. If the catalog focus is stale or inaccurate, plan to update it.
   - If the repo has a static catalog, check status consistency before writing: `ready` with a missing guide file is stale; an existing guide with non-ready status should be updated; a generic focus should be tightened to the verified guide thesis.
   - Make the static-catalog check operational before writing when possible: verify the declared guide path exists, confirm the current status/focus, and run the catalog syntax check if the catalog is JavaScript. For example: `test -f guides/video-XX.html || echo "catalog guide missing"` and `node --check assets/app.js`.
   - Make the catalog decision explicit before finishing with a compact matrix:
     `catalog entry exists | guide path existed before | status before | status after | focus changed | reason`.
   - Record stale catalog findings in the work summary, e.g. `catalog before: entry yes | guide missing | status ready | focus broad; catalog after: guide exists | status ready | focus updated to verified thesis`.

2. Read the transcript in two passes.
   - Use `segments` to understand structure and topic changes.
   - Use `words` to refine exact timestamps for key phrases, cuts, and still extraction.
   - Do not treat every transcript segment as a final chapter; group adjacent segments by intention.
   - Verify the durable thesis from the transcript before writing. Use the opening, closing, repeated claims, and visual demonstrations; do not trust the title or existing metadata alone.

3. Create conceptual groups.
   - For each group, record timestamp range, thesis, role in the video, and usefulness for the guide.
   - Keep a compact working table before extracting final stills: `range | role | point | visual need | chosen still`. This can stay internal, but it must guide the guide structure and image choices.
   - For visual-heavy guides, also keep a coverage table before final still extraction: `block | teaching point | evidence needed | candidate timestamp`. Use it to ensure each major visual mechanism has proof and to avoid picking frames only because they look polished.
   - Common roles: hook, thesis, example, demonstration, visual proof, warning, tangent, sponsor, transition, recap, operational rule.
   - Match the grouping style to the video type:
     - Practical/tutorial videos: steps, rules, examples, mistakes, workflow.
     - Tips/cheat-sheet videos: group individual tips into operational families such as visual polish, layout/responsive behavior, interaction, references, validation, and workflow. Do not make one full chapter per minor tip unless the video itself gives that tip durable weight.
     - Narrative/dramatized videos: setup, metaphor, contrast, escalation, payoff, operational moral.
     - Opinion/argument videos: claims, evidence, caveats, counterpoints, applied interpretation.
     - Pattern-history/remix videos: origin of the pattern, digital adaptation, execution improvement, transferable rule.
     - Learning/AI-judgment videos: case or pain point, false shortcut, durable principle, practice loop, correct tool use, transferable rules.
     - AI/product/business argument videos: define the AI behavior being criticized, separate tool capability from passive use, test the business or market claim, identify the learning or career risk, then state the productive tool-use rule.
   - Skip or compress low-value tangents unless they affect interpretation.
   - For long videos, group by argument flow first, then by practical framework. Do not let the number of transcript segments dictate guide length.

4. Map each group to evidence needs.
   - Ask: what visual would prove this point?
   - Look for frames containing diagrams, lists, prompts, before/after states, UI changes, code, settings, interactions, or final states in a visual sequence.
   - For UX/UI videos, classify likely evidence by mechanism before extracting stills:
     - broken or unstyled UI showing the problem,
     - corrected UI showing the result,
     - before/after comparison or micro-refactor,
     - perceptual diagram or conceptual model,
     - design token or CSS variable system,
     - component/list/card pattern,
     - validation at real size, responsive size, or with dynamic content,
     - theme, state, or color-system conversion.
   - For CSS/layout/responsive tutorials, classify evidence more specifically before extracting:
     - parent-child or document-tree model,
     - broken or unresponsive state,
     - CSS property or token applied,
     - before/after layout behavior,
     - flex/grid/positioning decision,
     - responsive breakpoint or media-query condition,
     - gotcha or edge case,
     - final validated layout across viewport or theme states.
   - For before/after or refactor sections, record the change explicitly: `before problem | changed property/structure | after user benefit`. Use this to write captions that explain the mechanism instead of saying the UI "looks better."
   - When the video studies an external reference, app, website, or design library, translate what is visible into mechanisms: layout system, spacing, tokens, asset type, component structure, state changes, animation technique, responsive behavior, and implementation constraints.
   - For animation or interaction tutorials, prefer stills that expose the mechanism over stills that only look dramatic: visible property, keyframe, easing curve, transition line, JS measurement, ghost/cloned layer, SVG path, delay, state class, or final synchronized feedback.
   - Decide sponsor handling explicitly before final still selection. If a sponsor segment is integrated into the teaching argument and demonstrates a reusable method, tool workflow, reference system, or real product evidence, keep it as evidence. If it is only promotional, compress it in the chapter map or skip it, and do not spend still budget on it.
   - If a group has no useful visual evidence, explain it with text and avoid forced screenshots.

5. Extract candidate stills by group.
   - Generate contact sheets for broad scanning.
   - Keep broad contact sheets cheap enough to finish quickly. Start with lower density such as `fps=1/8`, `fps=1/10`, or `fps=1/15`; only create denser sheets for short, specific ranges after the broad pass shows where visual evidence lives.
   - For videos dominated by code editors, dark UI, diagrams, or small text, prefer a higher-resolution review sheet after the first scan, such as `scale=300:-1` or `scale=320:-1` with fewer columns. A 220px tile is often enough to locate a scene, but not enough to judge whether code or UI text proves the point.
   - Size contact-sheet tiles to fit the expected frame count. Estimate `ceil(duration_seconds / interval_seconds)` and choose rows/columns with enough cells, or split the video into multiple sheets. Do not use a tile that silently truncates later frames.
   - If a dense whole-video contact sheet runs too long, stop it and switch to range-specific extraction. Do not wait on a large exploratory sheet when a broad sheet plus transcript ranges can guide selection.
   - As a practical default, if a global contact sheet for a short or medium video takes more than about 45-60 seconds, stop waiting and switch to lower density or transcript-guided ranges.
   - For important groups, generate denser frame series inside the group range.
   - If you expect more than eight final stills, avoid exact-seeking every final timestamp as the first pass. Prefer fast extraction, dense review ranges, or a batch script; reserve exact seeking for final replacements where the selected frame is wrong or ambiguous.
   - For exploration, `ffmpeg -nostdin -ss ... -i video` is fine. This is faster but may land on a nearby keyframe and return a still several seconds before the intended moment.
   - For final stills where frame accuracy matters, prefer `ffmpeg -nostdin -y -i video -ss ...` when intentionally replacing a weak still.
   - When running `ffmpeg` inside a shell loop, use `-nostdin` so `ffmpeg` cannot consume the loop's timestamp list as interactive input.
   - For stills near the first second of a video, or any scene where the opening frame matters, use exact seeking such as `ffmpeg -nostdin -y -i video.mp4 -ss 00:00:00.1 ...` and visually verify the result before writing captions. Fast seeking at `00:00` can land on a later keyframe and silently capture the wrong scene.
   - Use exact seeking only when the final still must capture a precise UI state, animation endpoint, cursor position, visible phrase, or completed visual change. For conceptual evidence where nearby seconds show the same visual state, prefer fast seeking.
   - When several final stills need accurate timestamps and the video has a stable frame rate, prefer one batch extraction by frame number over many slow exact seeks: inspect `avg_frame_rate`, compute `frame = seconds * fps`, then use a single `select='eq(n,...) + eq(n,...)'` pass.
   - If exact seeking becomes slow because of video length, codec, or machine load, stop it and switch to fast seeking. Regenerate the selected-stills sheet and verify captions against the actual final images instead of waiting many minutes for frame-level precision the guide does not need.
   - If a chosen timestamp produces a wrong or weak final still, create a short dense review range around that moment, then copy or re-extract the best frame into the final still filename.
   - For rescue passes with many timestamps, try fast seeking or dense short-range extraction first. Use exact seeking for only the few stills where the precise frame changes the meaning; do not batch dozens of slow exact seeks when nearby frames would prove the same point.
   - If a still introduces a section but does not show the mechanism, extract 5-8 nearby frames inside the same transcript range and choose the one that shows variables, comparison, state change, final result, or another observable difference.
   - Choose the strongest final candidate, often the clearest or final frame in a visual sequence.
   - Discard duplicates and weak frames. Keep only stills that teach.
   - Keep the final asset folder focused on published stills. Move unused candidates to `review/unused/` or delete them; do not leave unreferenced `still-*.jpg` files beside final stills unless there is a clear audit reason.
   - After selecting stills, generate a selected-stills contact sheet and review it as a set before writing captions.
   - Treat the selected-stills sheet as a hard gate: do not write or keep final captions until you have opened/inspected the sheet and confirmed every still matches its intended timestamp, evidence claim, and caption.
   - Treat the selected-stills pass as mandatory: replace any still that looks weak beside the others, is too dark or unreadable, duplicates another teaching point, captures a generic intermediate frame, merely repeats a generic text slide, fails to prove a distinct teaching point, depends more on transcript text than visual evidence, or no longer matches the caption/timestamp you plan to write.
   - If fast seeking produced the wrong scene or a misleading nearby keyframe, re-extract only that still with exact seeking (`ffmpeg -nostdin -y -i video -ss timestamp ...`) or use a dense rescue range, then regenerate the selected-stills sheet.

6. Build the guide.
   - Use a structured HTML page unless the user requests another format.
   - Include: title, source metadata, thesis, chapter map, deep explanation, selected stills with captions, practical examples, checklist, and candidate skill rules.
   - Every still caption should name the timestamp and the point it proves.
   - Apply the proof sentence test to every selected still before finalizing captions: `This frame proves that...`. If the sentence is vague, decorative, redundant, or only repeats the narration, replace the still or remove it.
   - When a tutorial ends in reusable output such as code, a generated artifact, a tool result, or a downloadable/copiable resource, prefer one final still that proves the final artifact exists and is usable.
   - Separate what the video says from your applied interpretation.

7. Validate the artifact.
   - Check links and paths.
   - Confirm every referenced still exists.
   - For static guide repos, validate referenced guide images with a path check that filters by asset extension so inline prose or `<code>` examples do not create false positives: `for f in $(rg -o 'assets/video-XX/[^" ]+\.(jpg|jpeg|png|webp|gif|svg)' guides/video-XX.html); do test -f "guides/$f" || echo "missing $f"; done`.
   - Validate any updated catalog JavaScript, for example with `node --check assets/app.js` when applicable.
   - Confirm the new guide path is linked from the catalog/index and that the catalog focus matches the guide thesis.
   - If the transcript thesis is more specific than the existing catalog focus, update the catalog focus as part of the guide work, even when the old focus is not strictly wrong.
   - Confirm selected-stills contact sheets remain under `review/` for later auditing.
   - Clean final visual assets: remove obsolete selected contact sheets, keep final still filenames coherent, and confirm any still count shown in the guide matches the files actually referenced. For HTML guides, compare the meta count against a command such as `rg -c '<figure><img src="assets/video-XX/' guides/video-XX.html`.
   - Check that captions still match the final images after any replacement pass; do not trust earlier notes if the still file was overwritten.
   - Run a lightweight text sanity scan for accidental placeholders or obvious writing artifacts, e.g. `rg -n 'TODO|FIXME|placeholder|undefined|missing|acompanE|descripccion' guides/video-XX.html assets/app.js`.
   - Treat Git as optional. Before using `git status` or `git diff`, check `git rev-parse --is-inside-work-tree`; if it is not a Git repo, summarize touched files and validation results with ordinary filesystem checks instead of attempting Git diff/status.
   - Review the guide for over-summarizing: it should teach the concept, not merely compress the transcript.

## Still Selection Rules

- Prefer one strong still over several similar stills.
- Prefer visual structure over expressive footage: diagrams, checklists, prompts, UI, code, before/after, final states.
- Prefer the moment where the visual claim is complete, not the beginning of an animation or sequence.
- Keep a review/contact-sheet folder if useful, but do not surface every candidate in the guide.
- If a still does not prove a specific point, do not keep it.
- Every included still must pass the proof sentence test: it should support a concrete claim the guide makes, not merely show that the video mentioned the topic.
- When a selected still is only atmospheric, search the same transcript group again for a more structural frame.
- In long educational videos, include enough stills to cover the framework, but avoid one still per minor segment. A good target is one still per durable teaching point.

## Output Convention

When working in a static guide repo, use this default structure unless the repo already has a better pattern:

```text
guides/
  video-XX.html
  assets/
    video-XX/
      still-01-short-name.jpg
      still-02-short-name.jpg
      review/
        contact-sheet.jpg
```

## Detailed Protocol

For the full repeatable process, read `references/protocol.md` when the task involves creating or revising a guide.
