---
name: test-protection-suite
description: Build or audit a reusable, risk-based test strategy for a software repository. Use when Codex must establish a baseline suite, decide what tests a repo needs, migrate the ÍTERA-style "test protection" discipline to another project, add tests to new features by default, audit existing tests for false confidence, define release gates, add mutation testing, E2E smoke tests, or create scripts that detect missing auth/ownership/side-effect coverage.
---

# Test Protection Suite

## Core Rule

Treat tests as protection, not inventory.

A test counts only if it would fail when a real rule of the system is broken. Do not accept coverage percentage, snapshots, happy-path renders, or `success: true` assertions as sufficient evidence for risky behavior.

## Workflow

1. **Discover the repo**
   - Read local instructions first (`AGENTS.md`, `CLAUDE.md`, README, docs).
   - Inspect `package.json`, test config, CI/release scripts, source layout, route/API/service/action folders, schema, and current tests.
   - Identify business-critical flows and risk boundaries before editing.

2. **Create a baseline**
   - Run the existing gates the repo already trusts: typecheck, lint, unit tests, integration tests, build.
   - Run coverage if available, but use it as a map, not as a quality score.
   - Save current commands/results in project planning docs if the repo has a planning convention.

3. **Define invariants**
   - Load `references/risk-matrix.md`.
   - Replace ÍTERA-specific terms with repo-specific ones, but keep the same categories: auth, authorization, data isolation, ownership, writes, audit/observability, public tokens, uploads/storage, quotas/rate limits, jobs, integrations, and critical UI flows.
   - Mark each invariant as `protected`, `partial`, `superficial`, or `missing`.

4. **Add the protection auditor**
   - Copy `scripts/test-protection-audit.mjs` into the target repo.
   - Adapt the config constants at the top: source dirs, API/service/action dirs, auth guard names, write patterns, FK/ownership fields, allowlist.
   - Add a package script such as `test:protection:audit`.
   - Keep it non-blocking at first. It should exit `0` while the baseline is being cleaned up.

5. **Do manual audit by risk**
   - Use `references/bootstrap-playbook.md`.
   - Start with auth/session/access, then data isolation/ownership, then services/actions with writes, then public endpoints, uploads/storage, jobs, integrations, and E2E.
   - For each risky module, ask: "Which broken rule should make this test fail?"

6. **Run controlled breaks**
   - Temporarily remove one guard or invariant at a time.
   - Run the smallest relevant test command.
   - Revert immediately.
   - If nothing fails, add a test before moving on.

7. **Backfill focused tests**
   - Prefer integration tests around routes/actions/services over broad UI tests for business rules.
   - Require negative cases, no-side-effect assertions, and persisted/observable final state for sensitive paths.
   - Use `references/test-patterns.md` for examples.

8. **Add ratchets**
   - Add release gates only after they are reproducible and reasonably cheap.
   - Add mutation testing only for high-risk files first.
   - Add E2E smoke tests for a few critical flows, not the entire product.

## Required Output In A Target Repo

When setting this up, leave the repo with:

- A documented test policy or plan.
- A matrix of critical invariants and current coverage state.
- A `test:protection:audit` or equivalent script.
- A release/preflight command that runs typecheck, lint, unit/integration tests, the protection audit, and the stable smoke tests.
- A rule for future features: mini-spec first, tests by risk layer, then implementation.

## Future Feature Rule

Before implementing a new feature or risky change, write or state a mini-spec:

- contract: inputs, outputs, rejection rules;
- risks: auth, ownership, persistence, external effects, limits;
- tests: unit, integration, E2E, and manual checks;
- done: exact commands and what evidence they provide.

Every sensitive feature should include at least:

- one happy path;
- one invalid input;
- one permission/ownership rejection if applicable;
- one limit/boundary case if applicable;
- one dependency failure if applicable;
- one no-side-effect assertion on rejection;
- one persisted or observable state assertion.

## Resources

- `references/risk-matrix.md`: generic invariant matrix to adapt per repo.
- `references/bootstrap-playbook.md`: phased adoption plan.
- `references/test-patterns.md`: practical testing patterns and anti-patterns.
- `scripts/test-protection-audit.mjs`: portable baseline auditor to copy into repos and adapt.
