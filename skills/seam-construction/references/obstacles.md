# Obstacles Already Paid For

Traps repeatedly hit in Next.js + React + Prisma + auth-based SaaS apps while applying seam-construction. Reuse the fix, not the mistake.

## Server, Cache, And Data Integrity

### Next 16 cache invalidation changed

- `revalidateTag(tag)` is not the safe default.
- Use `revalidateTag(tag, 'max')`.
- Grep revalidation calls before closing a cache-related seam.

### Read-then-write flows need transactions

- Position assignment, quota consumption, and counter increments all expose race risks.
- If a write depends on a prior read, default to a transaction (`$transaction` in Prisma, equivalent in others).
- When tests mock transactions, update the mock transaction object for every newly used model.

### Billing and subscription guards must default-deny

- A missing subscription row is not "probably allowed".
- Tenant write guards must block when the tenant is billable and no valid subscription exists.
- Keep the same rule in both UI gating and write boundaries.

### Upload / replacement order

- Upload new asset first.
- Delete old asset only after success.
- A failed replacement must never destroy the current asset.

### Public and server env access must stay split

- `env.ts` (server) and `public-env.ts` (client) do not drift back into one shared import surface.
- Mixed env modules are easy to misuse during refactors and can leak secrets to the browser bundle.

### Cache tags are part of the contract

- Query helpers and mutation helpers share the same tag module (e.g., `cache-tags.ts`).
- A new query that skips the helper and invents an inline tag breaks invalidation silently.

## Frontend And Runtime Traps

### Theme wrappers need local `text-foreground`

- If theme classes live on an inner wrapper, also apply `bg-background text-foreground` there.
- Otherwise plain text inherits the wrong root color.

### Portal content can lose the intended font scope

- Dialog / sheet / popover / select content rendered via portal may escape local font vars.
- Explicitly apply the feature's font family on the portal root.

### React 19 state updaters must stay pure

- Do not fire side effects inside `setState((prev) => ...)`.
- Tracking, events, cross-component updates go outside the updater.

### Hydration mismatches

- `window`, `Date.now()`, `Math.random()` in initial render → wrap with `useEffect` + mounted gate, render a skeleton on first paint.
- Nested interactive elements (e.g., `<button>` inside `<button>`) produce hydration errors.
- Elements with a drag-and-drop library (e.g., dnd-kit) need a `mounted` guard that renders a static list during SSR.

### Date handling in GMT-3 (or any fixed local tz)

- Strings without time in schema Zod → use a local parser (`parseDateLocal`), not `new Date(v)`.
- "Start of today" in server code → use a timezone-aware helper (`startOfDayGMT3` or local equivalent), not `new Date(); setHours(0,0,0,0)`.
- `toLocaleDateString('es-AR')` only changes format, not timezone. For display, pass `timeZone` explicitly.

### Some UI failures are runtime-only

- Missing shadcn/base-ui files or bad portal styling may pass lint.
- Build + targeted render tests are not optional after UI seams move.

## Prisma / Data Layer

### Import path consistency

- Projects generating the client in a custom path (e.g., `src/generated/prisma/`) must import from that path, not `@prisma/client`.
- A single seam-refactor that mixes both import paths will break at runtime in dev and compile in build.

### Zod v4 field errors

- `z.flattenError(error).fieldErrors` — not `error.flatten().fieldErrors` (deprecated in v4).
- After `safeParse`, use `result.data` — never the original body.

### Form schemas vs transform schemas

- React Hook Form schemas stay required with `defaultValues` set in `useForm`.
- Transform schemas (with `.transform()`, `.default()`) live in a separate file consumed by server actions.
- Mixing them produces form fields that RHF cannot control.

### `findMany` without `take`

- Any `findMany` in a growing table needs `take`. Default to 100–200.
- Public queries filter by visibility (`isVisible: true`, `status: 'published'`) — do not expose hidden rows.

### Serialization to client components

- `Decimal` fields → convert with `Number(v)` in the page.
- `Date` fields → `.toISOString()` in the page.
- Do not pass raw `Decimal` or `Date` to a client component boundary.

## Auth / Boundaries

### Session in server components

- `auth.api.getSession({ headers: await headers() })` with `query: { disableRefresh: true }` is the safe default.
- Never check session in middleware only; verify in server components/actions at the boundary.

### Server vs client imports

- Server modules: `better-auth`, `better-auth/adapters/prisma`, `better-auth/next-js`.
- Client modules: `better-auth/react`, `better-auth/client/plugins`.
- A leaf that drags a server-only package into a client bundle is a runtime break, not a lint failure.

### `globalThis` singleton for auth instance

- Without a `globalThis` singleton, dev hot reload creates a new auth instance and logs users out spontaneously.
- The same pattern applies to Prisma client and other singletons.

## Process Traps

### Large refactors need a contract freeze first

- Most regressions come from changing shape and behavior in one pass.
- First extraction preserves contracts.
- Redesign comes after the seam is stable, not during extraction.

### Planning docs are part of the system

- In repos where `.planning/CODEBASE-MAP.md` and `.planning/API-MAP.md` exist, they are not optional notes.
- If routes, actions, guards, cache tags, or shared modules changed, update them in the same turn.

### Dirty worktrees are normal

- Do not revert unrelated changes.
- Extract around them unless they directly block the target seam.

### Don't trust lint alone

- Lint catches unused imports and basic type mismatches.
- Runtime-only failures include: missing portal styling, hydration errors, broken provider contracts, silent cache invalidation mismatches.
- Targeted tests + build are part of the verification step, not optional.

### Don't combine unrelated concerns in one seam

- Extract + rename + behavior change + data model change in one commit = no bisect target.
- One concern per cut. Chain them if needed, never fuse them.
