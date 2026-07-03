---
name: iteralex-rollout-check
description: Check whether recent ÍTERA Lex commits require development or production rollouts. Use when the user asks if there are pending rollouts, deploys, schema migrations, seeds, Coolify actions, cron/env changes, or "qué falta aplicar en dev/prod" based on recent commits in the itera-lex repo.
---

# ÍTERA Lex Rollout Check

## Overview

Determine the operational delta between recent commits, local/dev state, and production for ÍTERA Lex. Separate schema rollout, seed/data rollout, env/cron changes, and Coolify deploy status; report what is pending without printing secrets.

## Required Context

Read repo-local operating context before acting:

- `CLAUDE.md`
- `docs/codebase/OPERATIONS.md`
- `.planning/guides/SCHEMA-ROLLOUT.md`
- `.planning/STATE.md`
- For production DB access, also read `/home/pachu/projects/itera-core/guides/db-via-tunnel.md` and `/home/pachu/projects/itera-core/guides/db-schema-rollout.md`.

Never print secrets. When validating env or DB access, report only variable/source names, command status, commit SHAs, rollout file paths, and validation results.

## Workflow

1. Establish git and deploy baseline:
   - `git status --short`
   - `git branch --show-current`
   - `git log --oneline --decorate -n 25`
   - `coolify app deployments list r40kockgo40wowg4w84soc4s --format json`
   - Identify current `HEAD`, `origin/master`, latest `finished` production commit, and latest failed/in-progress deploy.

2. Classify recent commit delta:
   - Schema: `prisma/schema.prisma`, `prisma/manual/**`, `src/lib/db/tenant.ts`.
   - Data/seed: `src/lib/seeds/**`, `src/app/api/admin/seed/**`, seed targets in `OPERATIONS.md`.
   - Env/deploy/runtime: `.env.example`, `Dockerfile`, `next.config.*`, `package.json`, `pnpm-lock.yaml`, `scripts/cron/**`, Coolify scheduled tasks.
   - App-only/UI/refactor: no rollout unless deploy is behind.

3. Verify development/local schema first:
   - Run `pnpm db:schema:verify`.
   - If it is green, dev/local has all manifest rollouts applied for the configured `DATABASE_URL`.
   - If it fails, report missing files/checksums exactly. Do not run `pnpm db:migrate:prod` unless the user asked to apply.

4. Verify production schema read-only:
   - Use the SSH tunnel method from `db-via-tunnel.md`.
   - Prefer `DATABASE_URL=<tunnel-url> pnpm db:schema:verify`.
   - If the full verify hangs or is too slow, query `schema_rollout_history` for the recent SQL files from the commit delta and compare with `prisma/manual/rollout-manifest.json`.
   - Missing history rows for new SQL files mean production rollout is pending unless direct table/column checks prove it was applied outside the runner. Treat "applied outside runner" as drift to clean up, not as closed.

5. Check Coolify deployment independently:
   - Latest `finished` deploy commit is production code.
   - Latest `failed` deploy means code rollout is pending even if `origin/master` is ahead.
   - Inspect tail logs with `coolify app deployments logs <app_uuid> <deployment_uuid> -n 120`.
   - Build OOM during `next build` is a deploy/build capacity issue, not a schema rollout issue.

6. Decide and report:
   - `Dev/local`: schema pending? tests/checks needed? seed needed?
   - `Production DB`: SQL files pending? apply order? backup required?
   - `Production app`: deployed commit vs HEAD; failed deploy reason.
   - `Operational follow-up`: seeds, `propagate-defaults`, cron/env/redeploy, smoke checks.

## Decision Rules

- Schema SQL in recent commits + missing prod `schema_rollout_history` row = production DB rollout pending.
- `pnpm db:schema:verify` green locally = no development schema rollout pending for the current local DB.
- Code commit not latest `finished` Coolify deployment = production app deploy pending or failed.
- Seed file changes do not imply DB schema rollout. They imply seed/API rollout only when the user wants refreshed demo/default data.
- Env changes in `.env.example`, runtime config, cron scripts, or Coolify task commands imply operational rollout/redeploy review.
- Never apply production schema from this skill unless the user explicitly asks to apply and the repo guide's backup requirement is satisfied.

## Command Reference

Use `references/commands.md` for production-safe command snippets and fallback queries.

If the command reference disagrees with repo docs, prefer repo docs and update the skill after finishing the operational check.
