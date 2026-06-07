# Obstacles Already Paid For

These are recurring traps found during the `linkea2` refactor wave. Reuse the fix, not the mistake.

## Server, Cache, And Data Integrity

### Next 16 cache invalidation changed

- `revalidateTag(tag)` is not the safe default here
- use `revalidateTag(tag, 'max')`
- grep revalidation before finishing a cache-related refactor

### Read-then-write flows need transactions

- position assignment and quota consumption both exposed race risks
- if a write depends on a prior read, default to `$transaction`
- when tests mock `$transaction`, update the mock transaction object for every newly used model

### Billing and subscription guards must default-deny

- a missing subscription row is not "probably allowed"
- tenant write guards must block when the tenant is billable and no valid subscription exists
- keep the same rule in both UI gating and write boundaries

### Upload replacement order matters

- upload new first
- delete old after success
- otherwise a failed replacement destroys the current asset

### Public and server env access must stay split

- `env.ts` and `public-env.ts` should not drift back into one shared import surface
- mixed env modules are easy to misuse during refactors

## Frontend And Runtime Traps

### Theme wrappers need local `text-foreground`

- if theme classes live on an inner wrapper, also apply `bg-background text-foreground` there
- otherwise plain text can inherit the wrong root color

### Portal content can lose the intended font scope

- dialog/sheet/popover/select content rendered via portal may escape local font vars
- for this repo shape, explicitly applying the admin/body font on the portal root is safer

### React 19 state updaters must stay pure

- do not fire side effects inside `setState((prev) => ...)`
- tracking, events, and cross-component updates go outside the updater

### Some UI failures are runtime-only

- missing shadcn/base-ui files or bad portal styling may pass lint
- build and targeted runtime-sensitive tests are not optional after UI seams move

## Process Traps

### Large refactors need a contract freeze first

- most regressions came from changing shape and behavior in one pass
- first extraction should preserve contracts
- redesign comes after the seam is stable

### Planning docs are part of the system

- in this repo, `.planning/CODEBASE-MAP.md` and `.planning/API-MAP.md` are not optional notes
- if routes, actions, guards, cache tags, or shared modules changed, update them in the same turn

### Dirty worktrees are normal

- do not revert unrelated changes
- extract around them unless they directly block the target seam
