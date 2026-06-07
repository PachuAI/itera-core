# Seam Patterns

Concrete seams with trigger, anatomy, and when not to use. Apply in both construction mode (design a new module with the seam) and recovery mode (split an existing file along the seam). Pick the seams that remove real branching, not the ones that only move lines around.

## 1. Schema Seam

**Trigger:**
- A file mixes validation, discriminated unions, and UI options.
- `switch (type)` branches appear in more than one layer.
- Form schemas want transforms while render code wants required fields.

**Anatomy:**
- `foo-schemas.ts` owns Zod schemas, discriminated unions, inferred types.
- `foo-actions.ts` owns action resolution, builders, serializers that consume the schema.
- `foo-legacy.ts` owns legacy-format normalization if persisted records predate the union.

**Why it works:** The discriminated union becomes the contract anchor. Action builders stop leaking into JSX. Legacy inference stops infecting every caller.

**Do not use when:** the schema has a single shape and no branches. Splitting a single shape into three files is overhead.

## 2. Legacy Adapter Seam

**Trigger:**
- Persisted records have old and new formats coexisting.
- The same `if (record.v2) ... else ...` pattern appears in every caller.
- Migration cost is not worth paying yet, but the conditional is spreading.

**Anatomy:**
- `foo-legacy.ts` (or `foo-adapter.ts`) has one pure function: `normalizeFoo(raw) -> Foo`.
- All callers read the normalized shape. No caller checks version flags.

**Why it works:** Translation lives in one place, testable in isolation. Callers speak only the new shape.

**Do not use when:** there is no legacy format yet. Do not pre-adapt; wait until a real second shape exists.

## 3. Domain Action Seam

**Trigger:**
- Href builders, resolvers, serializers, or quota helpers are defined inline in JSX or alongside components.
- The same derivation shows up in three render sites.

**Anatomy:**
- `foo-actions.ts` (or `foo-resolvers.ts`) owns pure helpers: `resolveFoo(...)`, `buildFooHref(...)`, `serializeFoo(...)`.
- Components import and compose; they do not derive.

**Why it works:** UI stops knowing business rules. Helpers become unit-testable. Changes propagate from one file.

**Do not use when:** the helper is trivially local (one line) and used once.

## 4. Workspace / Provider Seam

**Trigger:**
- A vendor SDK (OAuth provider, payment processor, storage vendor, AI SDK) is about to dictate the internal types.
- UI state starts to shape-match the provider payload.
- A second provider is plausible (or should be plausible for testing).

**Anatomy:**
- `workspace-contract.ts` defines the product-facing shape (`WorkspaceFile`, `WorkspaceAuth`, `WorkspaceItem`), independent of any vendor.
- `providers/<vendor>/...` owns vendor-specific adapters, token handling, SDK calls.
- `providers/mock/...` or `providers/test/...` implements the same contract for tests.
- A `bridge.ts` or `adapter.ts` maps between workspace and provider types.

**Why it works:** The internal shape stays stable when the vendor changes. The mock provider proves the seam is real. Writes and UI never see provider tokens.

**Do not use when:** the vendor is truly single and permanent (e.g., a payment SDK with a decade of lock-in). Even then, a thin adapter layer buys testability cheaply.

## 5. Scoped Action Seam

**Trigger:**
- Two or more entity contexts perform the "same" mutation (e.g., per-tenant and per-workspace create-item).
- The only differences are scope (which parent id), cache tags, and revalidation path.

**Anatomy:**
- `foo-base-actions.ts` owns the shared write logic: validate + auth + transaction + result.
- Per-context files wrap the base: they pass scope, own `revalidateTag(...)` / `revalidatePath(...)`, handle context-specific redirects.

**Why it works:** The mutation logic stays in one place; only scope-specific concerns live outside.

**Do not use when:** the two mutations only look similar at first glance but diverge in validation, authorization, or side effects. Do not force unification that hides real differences.

## 6. View-Model Seam

**Trigger:**
- Server pages compute many defaults or normalize DB irregularities before rendering.
- Callers keep asking for "just one more derived flag".
- Null handling is spread across the render tree.

**Anatomy:**
- `foo-view-model.ts` exports `buildFooView(data): FooView`.
- `FooView` is the shape the UI renders. No null/undefined branches in JSX.
- Pure function, testable without DOM.

**Why it works:** Defaulting and normalization leave pages. Public surfaces get one stable shape. Render trees stop knowing DB quirks.

**Do not use when:** rendering consumes raw DB rows 1:1 with no derivation needed.

## 7. Shell + Effects + Leaves Seam

**Trigger:**
- A client component owns: render tree + DOM effects + preview hooks + tracking + responsive branching.
- Testing the component requires mocking browser APIs for pure render cases.
- Preview and public versions of the same surface diverge slowly because both live in one file.

**Anatomy:**
- `foo-page.tsx` — thin entrypoint, composes shell + effects + leaves.
- `foo-shell.tsx` — pure render tree, prop-driven, reusable in preview/public.
- `foo-client-effects.tsx` — owns `useEffect`, trackers, preview hooks, font loading, DOM measurements.
- `foo-*.tsx` leaves — modal bodies, CTA links, icon maps, sticky bars, carousels.

**Why it works:** Preview-only hooks stop polluting the render tree. The shell becomes reusable. Tests split cleanly into pure-render vs side-effect.

**Do not use when:** the component has no effects or tracking. A shell + effects split with no effects is cosmetic.

## 8. Leaf Renderer Seam

**Trigger:**
- One component has one interaction wrapper but many content modes (modal body per button type, preview per card kind).
- Inlined branches in JSX are 30+ lines each.

**Anatomy:**
- The wrapper owns one job: resolve interaction (open modal, navigate, submit).
- Each content mode moves to its own file: `foo-mode-a-content.tsx`, `foo-mode-b-content.tsx`.
- The wrapper renders a mode map or switch keyed on type.

**Why it works:** The wrapper regains a single responsibility. Content-specific UI becomes testable and extendable without touching the wrapper.

**Do not use when:** modes share 90% of markup. A shared subcomponent with prop variants is simpler.

## 9. Guard / Cache Seam

**Trigger:**
- Tenant-scoped writes are about to reimplement auth checks per action.
- `revalidateTag` / `revalidatePath` calls are spreading across leaves.
- Cache invariants depend on which tag belongs to which query.

**Anatomy:**
- `auth-action.ts` — single entry for action-level auth + tenant ownership. Wraps server actions.
- `cache-tags.ts` — one function per tag family: `getFooTag(id)`, `getBarTag(parentId, childId)`.
- Queries use the helpers. Mutations call `revalidateTag(helper(...), 'max')` centrally.

**Why it works:** Guard drift becomes visible (any new write has to opt into the wrapper). Cache invalidation is traceable. Refactors stop breaking hidden contracts between mutations and reads.

**Do not use when:** the surface has a single route and a single mutation. The overhead is not justified for tiny surfaces.

## 10. Boundary Contract Seam

**Trigger:**
- A module is imported from both browser and server code.
- Env access mixes public flags with server secrets.
- A type or helper is about to expose server-only data to a client bundle.

**Anatomy:**
- `env.ts` — server-only env validation (Zod schema including secrets). Imported only from server code.
- `public-env.ts` — browser-safe env reads. Imported anywhere. Never imports from `env.ts`.
- Equivalent splits for other shared modules (e.g., `db-server.ts` vs `db-types.ts`).

**Why it works:** Accidental client exposure risk drops. Imports become self-documenting. Browser-safe reads stop sharing a module with server-only validation.

**Do not use when:** the module is server-only or client-only. No boundary means no seam to enforce.

## Quick Decision Test

For every candidate seam, check:

- **Stable name:** the seam's name will still make sense in six months.
- **Branch reduction:** callers get simpler, not just the source file.
- **One invariant, one place:** an invariant that was spread now lives in one module.
- **Testability:** the seam is easier to test after extraction than before.

If all four are true, extract. If only one or two, the seam is cosmetic — skip.

## Stacking Seams

Seams compose. A single page might end up with:

- **Boundary contract seam** (public vs server env)
- **Schema seam** (shared Zod schemas)
- **View-model seam** (data normalization)
- **Shell + effects + leaves seam** (UI)
- **Guard/cache seam** (writes)

Do not add all of them preemptively. Add the ones whose invariants are actually under stress. A seam that nobody will ever stress is overhead.
