# Bootstrap Playbook

## Phase 0 - Baseline

Run the repo's current checks without changing behavior:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm test:coverage
pnpm build
```

Adapt commands for the repo. Record failures separately from test strategy; do not hide broken baseline.

## Phase 1 - Automatic Protection Audit

Copy `scripts/test-protection-audit.mjs` into the repo and adapt:

- directories;
- test filename patterns;
- auth guard names;
- ownership/FK field names;
- audit/log patterns;
- allowlisted pass-through routes;
- suspicious assertion patterns.

First baseline should be informational and exit `0`.

## Phase 2 - Manual Risk Audit

Audit in this order:

1. auth/session/access;
2. data isolation/tenant/org/user scoping;
3. services/actions/use cases with writes;
4. API/route handlers;
5. public endpoints and tokens;
6. uploads/storage/cleanup;
7. quotas/rate limits/budgets;
8. jobs/cron/workers;
9. external integrations and AI;
10. E2E critical flows.

For each item, record:

| File/flow | Risk | State | Evidence | Gap |
| --- | --- | --- | --- | --- |

## Phase 3 - Controlled Breaks

Run reversible breaks one by one:

- remove auth guard;
- remove owner/tenant/user filter;
- accept expired token;
- skip rate limit;
- skip quota revert;
- remove transaction/audit;
- skip cleanup after external side effect;
- accept invalid upload metadata;
- remove public visibility filter;
- make provider error look successful.

If no test fails, add the missing test and repeat the break.

## Phase 4 - Focused Backfill

Backfill P1 first:

- sensitive routes without 401/403;
- writes with client-supplied IDs and no ownership negative;
- public endpoints without hidden/expired/deleted cases;
- upload/storage without invalid/cleanup cases;
- jobs without idempotency/retry/error tests;
- critical UI flows without reload/persist assertions.

## Phase 5 - Mutation Testing

Add mutation testing only on critical files, not the whole repo.

Good first targets:

- auth/access guards;
- ownership helpers;
- upload validation;
- token validation;
- rate limits/quotas;
- route handlers with cleanup;
- critical parsing/security helpers.

Start with a dry run, then set a low ratchet. Raise slowly.

## Phase 6 - Release Gates

Stable release gate should include:

```bash
typecheck && lint && unit/integration tests && protection audit && stable smoke E2E && build
```

Keep slow/flaky/write-capable E2E and mutation testing as manual or scheduled ratchets until stable.

## Phase 7 - New Feature Default

Every new feature starts with:

- mini-spec;
- risk list;
- test matrix by layer;
- tests for highest-risk behavior before or alongside implementation;
- documented validation commands.
