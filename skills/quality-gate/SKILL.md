---
name: quality-gate
description: Audit a Next.js 16 + Prisma 7 + BetterAuth multi-tenant codebase for correctness, security, multi-tenancy, AI/runtime/credit safety, maintainability, and release readiness. Use when the user wants a structured quality report with severity, score, baseline comparison, and actionable follow-up before shipping or adding features.
---

# Quality Gate

Use this skill for repo-wide audits, release-readiness passes, regression checks after large refactors, or when the user wants one structured report instead of ad-hoc findings.

## Bootstrap

1. Read `CLAUDE.md` first if present — it is the canonical project source.
2. Read `AGENTS.md` next for repo-local workflow hints. If it conflicts with the actual environment or `CLAUDE.md`, trust `CLAUDE.md` and the live environment.
3. **Stack-assumed reads** (should exist in any Next 16 + Prisma 7 + BetterAuth repo — flag as signal if missing):
   - `package.json`
   - `tsconfig.json`
   - `next.config.*`
   - `prisma/schema.prisma`
   - `src/lib/env.ts`, `lib/env.ts`, or equivalent env validation module
   - `src/lib/auth.ts`, `lib/auth.ts`, or equivalent BetterAuth setup
4. **Project-specific reads** (read if present, skip silently if absent):
   - `src/lib/stores/request-host.ts`, `lib/stores/request-host.ts`, or equivalent host/tenant resolver
   - `scripts/quality-check.mjs` or `scripts/quality-check.*`
   - `.claude/commands/security-audit.md`
   - `.planning/quality-gate-report.md` (baseline for comparison)
   - `docs/` source-of-truth docs (schema, api, admin, brand, etc.)
5. If `node_modules/next/dist/docs/` exists, read the relevant Next.js 16 docs before flagging App Router, cache, metadata, or dynamic API issues.

## Workflow

1. Run `scripts/check-all.sh` from this skill. Use `fast` for iteration and `full` for a final pass.
2. Read the generated artifacts before opening a large number of source files.
3. Use `references/phase-playbook.md` as the audit checklist and severity rubric.
4. Read only the files implicated by the artifacts and grep results. Do not bulk-read the whole repo.
5. Build a report with `references/report-template.md`.

## Required Output

- Keep findings evidence-based and file-referenced.
- Use this finding format exactly:
  - `[ ] **[Categoria]** descripción — archivo:línea | Esfuerzo: S/M/L | Riesgo: bajo/medio/alto`
- Group findings by `CRÍTICOS`, `ALTOS`, `MEDIOS`, `BAJOS`.
- Include:
  - score global `/10`
  - score por fase
  - fortalezas
  - quick wins
  - estabilización
  - escala
  - checklist de re-auditoría
- If `.planning/quality-gate-report.md` exists, add comparison:
  - resuelto
  - regresión
  - persiste
  - nuevo

## Guardrails

- **Evidencia o descarte.** Si no podés apuntar a `archivo:línea` concreto respaldado por un log o scan file, el finding no entra al reporte.
- **Respetar el cap de longitud.** Máx 10 findings por severidad. Si hay más, referenciar el scan file. Ver `references/phase-playbook.md` > Output Length Cap.
- Do not call something "AI slop" unless it matches the objective heuristics in `references/phase-playbook.md`.
- For multi-tenant findings, prioritize ownership and IDOR risk over style concerns.
- A clean `lint/typecheck/build` does not mean the gate passes.
- Any critical security or cross-tenant isolation bug forces a `NO-GO`, even if the numeric score looks acceptable.
- Cualquier hit confirmado en `scans/client-env-leak.txt` (secreto real en bundle de browser; `NODE_ENV` no cuenta) = `NO-GO` automático.
- En features con IA pagada: modelo sin pricing catalogado, mock como default productivo, gasto sin reserva previa, o ledger sin runtime/pricing trace = `NO-GO` o `ALTO` según blast radius.

## Resources

- Phase criteria and grep recipes: `references/phase-playbook.md`
- Report template: `references/report-template.md`
- Deterministic collector: `scripts/check-all.sh`
