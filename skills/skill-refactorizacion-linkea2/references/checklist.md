# Operational Checklist

Use this during execution, not only at the end.

## 1. Discovery

Read first:

- `AGENTS.md`
- `package.json`
- `.planning/GUARDRAILS.md`
- `.planning/CODEBASE-MAP.md` if present
- `.planning/API-MAP.md` if present

Useful grep starting points:

```bash
rg -n "use client|revalidateTag|updateTag|tenantSlug|requireActiveTenantWriteAccess|checkActiveTenantWriteAccess" src
rg -n "export (async )?function|export const" src/<target-area>
rg -n "\\.test\\." src
git log --oneline --decorate -- <target-path>
```

## 2. Seam Proposal

Before editing, write a 4-line seam map:

1. Source hotspot
2. Stable contracts to preserve
3. First seam to extract
4. Risks to re-check after extraction

Good first seams in this repo shape:

- schemas
- legacy adapters
- pure domain resolvers
- view-model builders
- shell vs client effects
- leaf renderers

## 3. Edit Sequence

Preferred order:

1. extract new module
2. move logic with minimal semantic change
3. rewire imports
4. add or adjust focused tests
5. simplify caller only after tests pass

Avoid combining:

- extraction
- naming overhaul
- behavior changes
- data model changes

in one jump unless the user explicitly asked for it.

## 4. Verification

Minimum after code edits:

```bash
pnpm lint
```

After behavior changes:

```bash
pnpm exec vitest run <files>
pnpm build
```

If API routes, server actions, guards, cache tags, or shared modules changed:

- sync `.planning/CODEBASE-MAP.md`
- sync `.planning/API-MAP.md`

If user-facing text changed broadly:

```bash
pattern=$'\\u00C3|\\u00C2|\\u00E2|\\uFFFD'
rg -n "$pattern" src prisma scripts -g '*.ts' -g '*.tsx' -g '*.prisma' -g '*.md'
```

If cache APIs changed:

- confirm `revalidateTag(tag, 'max')`

## 5. Definition Of Done

A seam refactor is done when:

- the old hotspot clearly owns less responsibility
- the new modules have stable names and obvious ownership
- targeted tests cover the extracted logic or render path
- lint passes
- build passes when behavior changed
- planning maps are synced when required

## 6. Handoff Format

Leave a short closeout with:

- seams extracted
- invariants preserved
- tests run
- build/lint status
- remaining debt intentionally deferred
