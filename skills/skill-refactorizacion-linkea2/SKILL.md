---
name: skill-refactorizacion-linkea2
description: Repeat large seam-based refactors in a Next.js 16 + React 19 + Prisma 7 + BetterAuth multi-tenant SaaS. Use when a mixed page, module, route, or feature area needs to be split into clearer seams without breaking tenant guards, cache invalidation, preview/public parity, or legacy contracts.
---

# Refactorizacion Linkea2

Use this skill when the user wants to repeat the refactor style used in `linkea2`: long, iterative cuts by seam instead of one-shot rewrites.

This skill is intentionally repo-specific. Treat it as one case-study version that can later be merged with sibling repo variants into a broader super-skill.

## Outcome

Aim for:

- smaller files with one dominant reason to change
- stable contracts preserved before semantic redesign
- explicit server/client seams
- explicit tenant, cache, and security invariants
- tests pulled closer to newly extracted domain pieces

## Bootstrap

1. Read `AGENTS.md`.
2. Read `package.json` to confirm commands and stack versions.
3. Read `.planning/GUARDRAILS.md`.
4. If present, read `.planning/CODEBASE-MAP.md` and `.planning/API-MAP.md`.
5. Inspect recent commits near the target area. In this repo, the strongest baselines are:
   - `e80d696` public landing split
   - `79276c2` env split
   - `1f1264e` atomic quota fix
6. If `node_modules/next/dist/docs/` exists and you will touch cache, metadata, dynamic APIs, or route behavior, read the relevant Next 16 guide first.
7. Grep tests around the target before moving code.

## Pick The Seam Before Editing

Prefer seams around stable nouns and side effects, not arbitrary file size.

Reach for these seam types first:

- `schema seam`: validation and discriminated unions leave UI/actions
- `legacy adapter seam`: old DB/public contract is normalized in one place
- `domain action seam`: href builders, resolvers, serializers, quota logic
- `view-model seam`: defaults, derived flags, and shape normalization for one surface
- `shell/effects seam`: pure render tree separated from browser effects, preview hooks, tracking, or font loading
- `leaf renderer seam`: modal bodies, CTA links, icon maps, sticky bars, carousels, etc.
- `guard/cache seam`: auth, tenant ownership, cache tags, and revalidation stay centralized

Read `references/seams.md` for concrete patterns and file examples.

## Execution Loop

1. Freeze the contract.
   - List inputs, outputs, side effects, guards, cache tags, and caller expectations.
   - Keep exported names and serialized shapes stable unless the user asked for behavior changes.
2. Extract the first stable seam with minimum behavior change.
   - Move logic, then rewire imports, then compile.
   - Do not redesign naming, behavior, and architecture in the same step unless required.
3. Add or update focused tests around the extracted seam.
   - Prefer unit tests for new domain modules and focused component tests for split UI leaves.
4. Only after the seam holds, simplify callers.
5. If API routes, server actions, guards, cache tags, or shared modules changed, sync:
   - `.planning/CODEBASE-MAP.md`
   - `.planning/API-MAP.md`
6. Run verification in this order:
   - `pnpm lint`
   - targeted tests
   - `pnpm build`
   - extra scans from `references/checklist.md` when applicable

## High-Value Heuristics

- Preserve the public contract while changing the internal shape.
- Split browser-only effects away from reusable render code.
- Extract polymorphic logic out of JSX early.
- When legacy and new formats must coexist, isolate the translation layer instead of leaking conditionals everywhere.
- For tenant-scoped writes, keep auth and ownership checks at the boundary, not inside leaf helpers.
- For read-then-write flows, default to `$transaction`.
- For cache invalidation in Next 16, use explicit tag helpers and `revalidateTag(tag, 'max')`.
- After each seam, ask: "Did this reduce branching in the original file, or did it only move lines around?"

## Guardrails

- Do not split purely by component count. Split by responsibility and volatility.
- Do not let extracted helpers silently cross the server/client boundary.
- Do not mix env exposure rules; public and server env access stay separate.
- Do not break tenant isolation while "cleaning up" shared code.
- Do not remove legacy compatibility until every caller and persisted record is accounted for.
- Do not trust lint alone; this stack has runtime-only failures.

## Deliverable

When using this skill, leave behind:

- a short seam map explaining why each new module exists
- the invariants kept stable
- tests added or updated
- the exact verification run
- any remaining debt that was intentionally deferred

## Resources

- Seam patterns: `references/seams.md`
- Obstacles and fixes already paid for in this repo: `references/obstacles.md`
- Operational checklist and commands: `references/checklist.md`
