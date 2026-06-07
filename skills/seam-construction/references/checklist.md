# Operational Checklist

Use this during execution, not only at the end. The checklist applies to both construction (designing a new feature) and recovery (splitting an existing file). Skip steps that do not apply to the mode.

## 1. Discovery

Read first (whatever exists):

- `CLAUDE.md` / `AGENTS.md` — project rules and workflow hints
- `package.json` — stack versions and commands
- `.planning/GUARDRAILS.md` — known project-specific traps
- `.planning/CODEBASE-MAP.md` — structural index
- `.planning/API-MAP.md` — mutation surface
- Recent commits near the target area — baseline patterns

For Next.js 16 work that touches cache, metadata, dynamic APIs, or route behavior: read the relevant `node_modules/next/dist/docs/` guide if present before extracting.

Useful grep starting points:

```bash
rg -n "use client|revalidateTag|updateTag|tenantSlug|requireActiveTenantWriteAccess|checkActiveTenantWriteAccess" src
rg -n "export (async )?function|export const" src/<target-area>
rg -n "\\.test\\." src
git log --oneline --decorate -- <target-path>
```

## 2. Seam Proposal (4 lines)

Before editing, write:

1. **Source hotspot** — what file/feature is the target. In construction mode, this is the file you are about to create.
2. **Stable contracts to preserve** — public exports, serialized shapes, guards, cache tags, caller expectations.
3. **First seam to extract (or place)** — one seam from the catalog, with its rationale.
4. **Risks to re-check after** — what could silently break (hydration, cache invalidation, tenant scope, billing guard, font scope in portals, etc.).

Good first seams:

- schemas
- legacy adapters
- pure domain resolvers
- view-model builders
- shell vs client effects
- leaf renderers

Defer until later:

- guard/cache seam (usually second or third)
- boundary contract seam (only if the module spans client + server)
- workspace/provider seam (requires knowing a second provider is plausible)

## 3. Edit Sequence

Preferred order:

1. Extract (or create) the new module.
2. Move logic with minimal semantic change.
3. Rewire imports.
4. Add or adjust focused tests.
5. Simplify caller only after tests pass.

Avoid combining, in a single jump:

- Extraction + naming overhaul
- Extraction + behavior change
- Extraction + data model change

Chain them in separate cuts unless the user explicitly asked for a bigger jump.

## 4. Verification

Minimum after code edits:

```bash
pnpm lint
# or: npm run lint / yarn lint — match the repo
```

After behavior changes:

```bash
pnpm exec vitest run <files>
pnpm build
```

If API routes, server actions, guards, cache tags, or shared modules changed:

- Sync `.planning/CODEBASE-MAP.md`
- Sync `.planning/API-MAP.md`
- Run any repo-local audit (e.g., `.planning/audits/SECURITY-AUDIT.md`)

If user-facing text changed broadly (mojibake check):

```bash
pattern=$'\\u00C3|\\u00C2|\\u00E2|\\uFFFD'
rg -n "$pattern" src prisma scripts -g '*.ts' -g '*.tsx' -g '*.prisma' -g '*.md'
```

If cache APIs changed on Next 16:

- Confirm every `revalidateTag` call passes `'max'` as second argument.

If tests mock `$transaction`:

- Confirm the mock transaction object includes every new Prisma model referenced inside the transaction.

## 5. Definition Of Done

A seam cut (construction or recovery) is done when:

- The responsibility targeted by the seam lives in one module.
- The new module has a stable name and obvious ownership.
- Targeted tests cover the extracted logic or render path.
- Lint passes.
- Build passes when behavior changed.
- Planning maps are synced when required.
- Provider seams include a mock or second-provider test when applicable.

## 6. Handoff Format

Leave a short closeout with:

- Seams created or extracted (name + one-sentence rationale)
- Invariants preserved (public contracts that did not change)
- Tests added or updated
- Build / lint status
- Remaining debt intentionally deferred (with a pointer to where it should resume)

## 7. Common Skips (and why they bite)

| Skip | Why it bites |
|---|---|
| "I'll freeze the contract mentally, not in writing" | The next cut will break something you were keeping stable |
| "The mock provider is obvious, no test needed" | The mock provider is the test that the seam is real |
| "Lint passed, we're good" | Hydration, cache, and portal bugs are runtime-only |
| "I'll sync the planning maps at the end" | They drift silently per commit; sync in the same turn |
| "The guard can live in the leaf for now" | 'For now' means it never moves back to the boundary |
