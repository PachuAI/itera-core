---
name: rn-pipeline-operativo
description: Operate the PJ Río Negro Itera Lex local-to-production pipeline for daily new documents and retroactive monthly backfills across fallos/sumarios × STJ/jurisdiccional. Use when Codex must check production/local freshness, pull new RN documents, capture texto_oficial, export pending extract batches, generate with the RN skills, ingest locally with the anti-garbage gate, verify editorial_completeness_v2, or promote the local RN snapshot to production with a fast set-based push. Do not use for writing individual extract prose only; use rn-fallo-stj, rn-fallo-jurisdiccional, or rn-sumario-criterio for generation.
---

# Pipeline Operativo RN

## Scope

Use this skill for operational runs in `itera-lex-tools/api` involving the Río Negro own index:

- daily novelty handling: "qué entró hoy/en PROD";
- retroactive completion by corpus/month;
- local generation batches and gate validation;
- readiness reports for demo or promotion;
- scoped production push planning.

Before touching data, read `api/CLAUDE.md` → "Workflows operativos validados", the relevant RN runbook, `.planning/STATE.md`, and `git status`. Work local-first unless the current user request explicitly says to push to PROD.

## Mental Model

Document state is gap-driven:

`observado -> con_texto -> con_extracto -> publicado`

Route by the missing piece:

- missing `texto_oficial` -> capture official text, do not generate;
- has valid `texto_oficial` but no active extract -> export/generate/ingest;
- active extract missing tags/anclas/model/prompt -> remediate only the missing metadata from real `texto_oficial`;
- active extract complete -> no-op.

Editorial completeness SSOT is `editorial_completeness_v2`:

- source: `app/jurisprudencia/rio_negro_index/editorial_completeness.py`;
- report: `scripts/rio_negro_editorial_completeness_report.py --meses 0`;
- complete extract means active text plus classification/tags, anchors, model and prompt traceability.

`needs_review` / `requiere_revision` is not an active workflow state. The gate is only an anti-garbage filter: real anchor in source text, length, controlled vocab, no meta text, no invented unsupported facts.

## Corpus Rules

- `fallos/stj`: `texto_oficial` is full `Texto Sentencia` from `protocolo/protocolo`; generate with `$rn-fallo-stj`.
- `fallos/jurisdiccional`: `texto_oficial` is full `Texto Sentencia` from `protocolo/protocolo`; generate with `$rn-fallo-jurisdiccional`.
- `sumarios/stj`: `texto_oficial` is the verbatim criterio from `sumario/buscar` by protocol; never use `resumen_oficial` when it is `"Fallo"`; generate with `$rn-sumario-criterio`.
- `sumarios/jurisdiccional`: `texto_oficial` is the verbatim criterio; `resumen_oficial` can be copied only when the corpus is jurisdiccional and the backfill script/runbook marks it useful; generate with `$rn-sumario-criterio`.

Never generate from metadata, snippets, carátula, public card text, or `resumen_oficial="Fallo"`.

## Daily Novelty Workflow

Use when the user asks to process today's/new production RN entries.

1. Refresh local context from production or compare production/local freshness per the DB runbook. Do not print secrets.
2. Count new documents by corpus and identify documents missing locally.
3. Ingest/observe recent documents for all four corpus if needed.
4. Capture `texto_oficial` for all newly observed docs:
   - fallos via `scripts/rio_negro_capture_fallo_text.py`;
   - sumarios via `scripts/rio_negro_capture_sumario_text.py` or the autofill hook.
5. Export only eligible pending rows with `scripts/rio_negro_export_pending_for_extract.py`; quarantine short/truncated/missing-text docs.
6. Generate JSONL with the matching RN skill.
7. Run `scripts/rio_negro_ingest_extracts.py` dry-run. Fix JSONL until gate failures are zero.
8. Apply locally only after a clean dry-run.
9. Verify counts:
   - `editorial_completeness_v2`;
   - active extracts have tags, anchors, model, prompt;
   - frontend/API rows show generated text or unavailable message.
10. Stop and report. Push to PROD only if the user explicitly asks in the same turn.

Suggested user prompt:

```text
Chequeá novedades RN en PROD desde el último dump, traelas a local y aplicales el pipeline completo: texto oficial, extractos, tags, anclas y verificación. No pushes a PROD todavía.
```

## Retroactive Workflow

Use when the user asks to complete a month/range/corpus going backward.

1. Query official/local coverage for the requested corpus and date range.
2. Backfill missing documents first if the official portal has rows absent locally.
3. Capture or backfill `texto_oficial` according to the corpus rules.
4. Export pending eligible rows for that exact scope.
5. Generate with the matching RN skill and ingest locally through the gate.
6. Re-run completeness and report:
   - docs total;
   - con_texto;
   - con_extracto;
   - con tags/anclas/model/prompt;
   - pending split into missing text, insufficient text, upstream error, gate failure.

Suggested user prompt:

```text
Completá hacia atrás sumarios STJ de septiembre 2024 en local: texto oficial, extracto/titular, resumen_itera, tags, anclas y reporte v2. No pushes.
```

## Promotion Workflow

Production promotion is separate from generation.

- Default to fast snapshot promotion when local is the intended source of truth and the user explicitly asks to promote RN to PROD.
- Do not use `scripts/rio_negro_sync_content.py push --apply` for mass RN promotion. That CLI calls `verify_content_package()` after apply and can spend tens of minutes checking rows one by one.
- Do not use `TRUNCATE ... CASCADE` on `documentos_rio_negro`: it deletes dependent telemetry/positioning tables (`query_documento_rio_negro`, `observaciones_posicion_rio_negro`, tags, etc.).
- Use slow sync only for a surgical merge where PROD differences must be preserved or for a tiny `extracts_only` batch.

Fast snapshot promotion sequence:

1. Prove local is a superset of production by document key `(tipo, ambito, id_fuente)`. If `PROD - LOCAL != 0`, stop and pull/merge first.
2. Take a production backup of `documentos_rio_negro`, `extractos_rio_negro`, and `lotes_contenido_rio_negro` unless the user explicitly accepts skipping it.
3. Push set-based packages for only the scopes touched. Use bundled script:

```bash
cd /home/pachu/projects/saas/iteralex/itera-lex-tools/api
python /home/pachu/projects/itera-core/skills/rn-pipeline-operativo/scripts/rn_fast_snapshot_push.py \
  --scope fallos/jurisdiccional/2026 \
  --scope fallos/stj/2026 \
  --scope sumarios/jurisdiccional/2024 \
  --scope sumarios/stj/2024 \
  --scope sumarios/stj/2026
```

This is dry-run by default. To apply:

```bash
python /home/pachu/projects/itera-core/skills/rn-pipeline-operativo/scripts/rn_fast_snapshot_push.py \
  --scope fallos/jurisdiccional/2026 \
  --scope fallos/stj/2026 \
  --scope sumarios/jurisdiccional/2024 \
  --scope sumarios/stj/2024 \
  --scope sumarios/stj/2026 \
  --apply --confirm push-snapshot-rn-to-produccion
```

Use `--default-demo-scopes` only when those exact five scopes are the desired promotion target. Use `--skip-backup` only after the user explicitly accepts the rollback tradeoff.

After apply, verify with aggregate counts, not row-by-row:

- local and PROD corpus totals match;
- `prod docs missing in local = 0` and `local docs missing in prod = 0`;
- active extracts have tags, anchors, model/prompt, and `review=0`;
- public API `/jurisprudencia/rio-negro/indice/buscar` returns `200` with `ai_extract.status=generated` and tags for one sample per touched corpus;
- web routes return `200`.

Known pitfalls from the 2026-07-06 push:

- `--force-reviewed` must override legacy `manual`/`revisado` rows when local has the corrected generated extract; otherwise legacy gaps remain.
- `requires_review` is metadata noise for this prototype and must not block promotion.
- Avoid hand-escaped `psql` commands for multiline ops. Use repo tunnel helpers/scripts so secrets are not printed and quoting does not derail the operation.
- If a process reaches post-apply `verify_content_package()` on a mass snapshot, stop it and switch to aggregate verification.

Suggested user prompt:

```text
Promové la foto RN local a PROD con snapshot rápido: verificá que local sea superset, hacé backup, aplicá set-based y verificá agregado/API. No uses sync fila-por-fila.
```

## Completion Checklist

A run is done only when:

- every processed generated row passed the gate;
- no `needs_review`/`requiere_revision` state is left as an operational blocker;
- fallos have `extracto`, `clasificacion.tags_busqueda`, `anclas.dispositivo`, `modelo`, `version_prompt`;
- sumarios have `titular`, `resumen_itera`, `clasificacion.tags_busqueda`, `anclas.criterio`, `modelo`, `version_prompt`;
- non-generable documents are explained as missing/insufficient official content, not silently left blank;
- the final answer states local vs production status clearly.
