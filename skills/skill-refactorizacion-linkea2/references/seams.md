# Seam Patterns

Use these patterns as defaults for this stack. Do not force all of them into every refactor. Pick only the seams that remove real branching and make invariants easier to hold.

## 1. Split A Polymorphic Domain Monolith

Use when one file mixes:

- schema and validation
- action resolution
- legacy compatibility
- UI labels/options
- string builders or side-effect-free domain helpers

`linkea2` example:

- source hotspot: `src/lib/buttons.ts`
- extracted seams:
  - `src/lib/button-schemas.ts`
  - `src/lib/button-actions.ts`
  - `src/lib/button-legacy.ts`

Why it worked:

- the discriminated union became the contract anchor
- action builders stopped leaking into JSX
- legacy URL/content inference got isolated instead of infecting every caller
- tests became narrower and easier to add

Apply this when a domain has many `type` branches and the same branch logic shows up in more than one layer.

## 2. Split Shared UI Into Shell + Client Effects + Leaves

Use when a page/component mixes:

- render tree
- DOM effects
- preview hooks
- analytics/tracking
- responsive modal/sheet branching

`linkea2` example:

- `src/components/landing/landing-page.tsx` became a thin entrypoint
- `src/components/landing/landing-client-effects.tsx` owns browser effects
- `src/components/landing/landing-shell.tsx` owns pure rendering
- leaf renderers were extracted:
  - `button-modal-content.tsx`
  - `public-cta-link.tsx`
  - `landing-icon-map.ts`
  - `whatsapp-form-modal-content.tsx`

Why it worked:

- preview-only hooks stopped polluting the render tree
- the shell became reusable in preview and public contexts
- testing improved because pure rendering and client effects were no longer fused

Use this cut whenever a client component feels "too sticky" because it owns state, DOM, tracking, and markup at once.

## 3. Add A View-Model Builder Before Rendering

Use when server pages/components compute many defaults or normalize unstable DB shapes before rendering.

`linkea2` example:

- `src/lib/public-site-view-model.ts`

Why it worked:

- defaulting and normalization moved out of pages
- the public surface got one stable shape
- public rendering no longer needed to know raw DB irregularities

Reach for a view-model seam when callers keep asking for "just one more derived flag" or when null/default handling is spread across the tree.

## 4. Isolate Boundary-Specific Contracts

Use when one module serves both browser and server callers or when secrets/public flags risk mixing.

`linkea2` example:

- server env: `src/lib/env.ts`
- public env: `src/lib/public-env.ts`

Why it worked:

- accidental client exposure risk dropped
- imports became self-documenting
- browser-safe reads stopped sharing a module with server-only validation

Use this cut whenever a helper is imported from both client and server code and env access is involved.

## 5. Keep Guards And Cache At The Boundary

Use when refactoring tenant-scoped writes, route handlers, or shared admin/public paths.

`linkea2` anchors:

- guards: `src/lib/auth-action.ts`
- cache helpers: `src/lib/cache-tags.ts`
- planning surface: `.planning/API-MAP.md`

Why it worked:

- write access stayed consistent across actions and routes
- cache invalidation became traceable instead of implicit
- refactors stopped breaking hidden contracts between mutations and reads

Rule:

- boundary modules decide auth, ownership, and invalidation
- leaf helpers stay side-effect-light and tenant-agnostic unless their whole purpose is boundary enforcement

## 6. Prefer Case-Specific Leaves Over Mega Components

Use when one component renders multiple content modes with large inlined branches.

`linkea2` example:

- modal content rendering left the button component and moved into `button-modal-content.tsx`

Why it worked:

- the button regained one job: resolve interaction and open the right surface
- content-specific UI became easier to test and extend

If a component has one interaction wrapper but many content modes, keep the wrapper and extract the modes.

## Quick Decision Test

Pick the seam if all are true:

- it has a stable name
- it reduces branching in the source file
- it lets one invariant live in one place
- it can be tested more directly after extraction

Do not pick the seam if it only moves lines without changing ownership.
