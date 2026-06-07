---
name: seam-construction
description: Use when planning a new view, module, feature area, or page that risks becoming a monolith, or when refactoring an existing mixed file that has accumulated multiple responsibilities. Applies when a component/module will mix schema + actions + UI + legacy + tracking, when server and client boundaries are unclear, when tenant/guard/cache invariants must be preserved, or when a vendor integration threatens to dominate the internal shape. Stack-aware for Next.js + React + Prisma + auth-based SaaS apps.
---

# Seam Construction

Build modules, pages, and features along explicit seams from the first cut, instead of shipping a monolith and refactoring later. When a monolith already exists, split it using the same seam catalog in iterative cuts that preserve public contracts.

This is a generalization of the repo-specific "refactorizacion linkea2" method into an architectural habit that applies to any stack with similar shapes: server components + client effects, tenant-scoped writes, cache invalidation, and vendor/provider integrations.

## Core Principle

**Pick the seam before writing the file.** A seam is a stable line along which responsibility splits — schema vs action vs UI, server vs client, product vs provider, read vs write, guard vs leaf. Good seams let one invariant live in one place. Bad seams only move lines around.

Two modes:

- **Construction mode** (preferred): plan seams before coding a new feature.
- **Recovery mode**: apply the same seam catalog to split an existing file, in iterative cuts that preserve contracts.

Both modes use the same vocabulary and the same execution loop.

## When To Use

Reach for this skill when any of the following signal a future monolith:

- A module or page will mix: schema/validation + action resolution + UI labels + legacy compatibility + tracking
- A component will own: render tree + DOM effects + analytics + responsive branching + state
- Data normalization is about to happen inline in JSX (null handling, defaults, derived flags)
- A vendor SDK or external provider is about to dictate the internal shape of the feature
- Tenant/auth guards, cache tags, or billing rules risk being sprinkled across leaves
- The same capability exists in multiple entity contexts (e.g., per-tenant and per-workspace), about to be duplicated
- The mock or spec shows 5+ sections that each evolve independently (header, KPIs, chart, funnel, list, etc.)

Also use when refactoring an existing file that already exhibits these traits.

## When NOT To Use

- One-off scripts, migrations, or genuinely throwaway code
- A file with a single stable responsibility that just happens to be long
- Pure reference material (types, constants) that has no behavior to split
- Splits motivated only by line count — splitting without reducing branching moves lines around

## Seam Catalog (quick reference)

| Seam | Use when |
|---|---|
| **Schema seam** | Discriminated unions or validation leak into UI/actions |
| **Legacy adapter seam** | An old DB or public contract must be normalized in one place |
| **Domain action seam** | Href builders, resolvers, serializers, quota logic mixed with UI |
| **Workspace/provider seam** | A vendor integration threatens to dominate the internal shape |
| **Scoped action seam** | Same mutation exists per entity context, differing only by scope + revalidation |
| **View-model seam** | Many defaults, derived flags, and shape normalization before rendering |
| **Shell + effects seam** | Pure render tree is fused with browser effects, tracking, preview hooks |
| **Leaf renderer seam** | One component renders many content modes with big inlined branches |
| **Guard/cache seam** | Auth, tenant ownership, cache tags, and revalidation must stay centralized |
| **Boundary contract seam** | One module serves browser + server, or secrets + public env may mix |

See `references/seam-patterns.md` for anatomy, triggers, and examples of each.

## Execution Loop

Same loop applies to construction and recovery.

1. **Freeze the contract.** List inputs, outputs, side effects, guards, cache tags, and caller expectations. In construction mode, this is the contract you will honor. In recovery mode, this is the contract you will not break until the last cut.
2. **Extract (or place) the first seam with minimum behavior change.** Move logic, rewire imports, compile. Do not redesign naming, behavior, and architecture in the same step unless the user asked for it.
3. **Add focused tests around the seam.** Unit tests for domain modules, focused component tests for split leaves. When a seam introduces a provider contract, prove it with a second provider or a mock before polishing the primary one.
4. **Simplify callers only after the seam holds.** Not before.
5. **Verify.** Minimum: lint. If behavior changed: targeted tests + build. If guards, cache tags, routes, or shared modules changed: sync project maps (e.g., `.planning/CODEBASE-MAP.md`, `.planning/API-MAP.md` in this family of repos).

Do not combine extraction + naming overhaul + behavior change + data model change in one jump unless explicitly requested.

## Core Rules

- Preserve the public contract while changing internal shape.
- Split browser-only effects away from reusable render code.
- Extract polymorphic logic out of JSX early.
- When legacy and new formats coexist, isolate the translation layer instead of leaking conditionals.
- When a vendor dominates a module, abstract from the product outward; do not let the external API define the internal shape. A thin provider contract + bridge/adapter beats leaking provider payloads into UI state or server actions.
- Centralize base action logic; keep only scoped wrappers for revalidation and route-specific concerns.
- Tenant-scoped writes: keep auth + ownership checks at the boundary, not inside leaf helpers.
- Read-then-write flows: default to transactions.
- Cache invalidation on Next 16: use explicit tag helpers and `revalidateTag(tag, 'max')`.
- Billing / subscription guards: default-deny. Missing subscription row ≠ allowed.
- Env split: `env.ts` (server) and `public-env.ts` (client) do not merge.

## Seam Quality Test

Pick the seam only if ALL are true:

- It has a stable name (a noun that makes sense in six months).
- It reduces branching in callers, not just in the source file.
- It lets one invariant live in one place.
- It can be tested more directly after extraction.

If only one or two are true, the cut is cosmetic. Skip it.

## Red Flags

These thoughts mean STOP and reconsider the seam:

| Thought | Reality |
|---|---|
| "I'll split this by file size later" | Size is not a seam. Pick a responsibility. |
| "The provider SDK shape is fine as the internal type" | You just handed architecture to a vendor. |
| "Let me rename while I'm extracting" | Two risks compound. Extract first, rename later. |
| "I'll add the guard in the leaf for now" | Guards drift out of leaves in 2 weeks. Put them at the boundary. |
| "The mock has 8 cards so I'll make 8 leaves" | Pick seams by responsibility and volatility, not by mock boxes. |
| "I'll skip the contract freeze, the change is small" | Contract freeze is cheap; regressions from skipped freezes are expensive. |
| "A mock provider is overkill, we only have Google" | A mock provider is the test that proves the seam is real, not renamed Google code. |

## Stack Defaults

Assumptions this skill makes when stack hints match:

- **Next.js App Router (14+, especially 16):** server components query the DB directly; server actions own revalidation; dynamic APIs (`cookies()`, `headers()`, `params`, `searchParams`) are Promises; `revalidateTag(tag, 'max')` on 16.
- **React 19:** state updaters stay pure (no side effects inside `setState(prev => ...)`).
- **Prisma 7:** read-then-write uses `$transaction`; client imported from the generated path the repo uses, not `@prisma/client` by default.
- **BetterAuth or equivalent:** session checks live in the first lines of protected layouts/actions, not in middleware.
- **Multi-tenant path-based:** `/${tenantSlug}/...` pattern; tenant resolution via host or path in a single resolver module.

If stack differs (Remix, SvelteKit, Laravel, etc.), the seam catalog still applies; only the stack-specific defaults change.

See `references/obstacles.md` for concrete traps already paid for in this family of apps.

## Deliverable

When finishing work done under this skill, leave:

- A short seam map explaining why each module exists (1–2 sentences each)
- The invariants that stayed stable
- Tests added or updated
- Exact verification run (lint / targeted tests / build / project maps sync)
- If providers or repeated entity contexts were involved: the contract used and why it belongs at that boundary
- Any remaining debt intentionally deferred

## Resources

- Seam patterns with anatomy + examples: `references/seam-patterns.md`
- Obstacles already paid for in Next/React/Prisma/auth SaaS: `references/obstacles.md`
- Operational checklist and commands: `references/checklist.md`
