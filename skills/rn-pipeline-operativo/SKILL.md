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

For "chequeá los 4 corpus", "lo nuevo de hoy", "barrida diaria RN", or equivalent,
use the four-corpus daily sweep below. This is not a historical reconciliation.

### Daily Four-Corpus Sweep

1. Define the target day in ART (`America/Argentina/Buenos_Aires`). Treat "today" as that
   exact date, not as a year or full snapshot.
2. Query PROD read-only for the four operative corpus:
   `fallos/stj`, `fallos/jurisdiccional`, `sumarios/stj`, `sumarios/jurisdiccional`.
   Include every row with `fecha_sentencia = <day>`. Also include rows with
   `(primer_visto_en AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = <day>` only when
   `fecha_sentencia` is recent (helper default: last 7 days) or NULL. This catches late same-week
   publication without confusing historical backfills/imports with daily novelties.
   Process the resulting exact `source_id`s.
3. If a corpus has `0` daily `source_id`s, stop there for that corpus. Do not inspect older
   years, do not run `--all-indexed`, and do not reconcile historical scopes unless the user
   explicitly asks for a snapshot/backfill.
4. Write per-corpus source-id files under `data/YYYY-MM-DD/` and operate from those files.
   Use the repo helper when possible:
   ```bash
   cd /home/pachu/projects/saas/iteralex/itera-lex-tools/api
   .venv/bin/python scripts/rio_negro_daily_four_corpus.py \
     --date <YYYY-MM-DD> \
     --prepare-local
   ```
   This produces exact `daily_<tipo>_<ambito>_source_ids.txt`, pulls missing documents with
   `missing_only`, captures local text and exports batches only for those IDs.
5. If an included row has `fecha_sentencia` different from the target day, do not rely on
   `--desde-fecha/--hasta-fecha`; use `--source-ids-file` with:
   - `scripts/rio_negro_capture_fallo_text.py`;
   - `scripts/rio_negro_capture_sumario_text.py`;
   - `scripts/rio_negro_export_pending_for_extract.py`.
6. Generate only the exported eligible rows with the matching RN skill:
   `$rn-fallo-stj`, `$rn-fallo-jurisdiccional`, or `$rn-sumario-criterio`.
7. Gate dry-run. Fix JSONL until `rechazados_gate=0`. Apply locally only after a clean gate.
8. Before pushing extract-only batches, capture the same daily `source_id`s in PROD:
   ```bash
   .venv/bin/python scripts/rio_negro_daily_four_corpus.py \
     --date <YYYY-MM-DD> \
     --capture-prod
   ```
   Then close/push explicit generated outs:
   ```bash
   .venv/bin/python scripts/rio_negro_daily_four_corpus.py \
     --date <YYYY-MM-DD> \
     --finalize-out fallos/jurisdiccional:data/<YYYY-MM-DD>/out_*.jsonl \
     --push-prod \
     --confirm finalizar-tanda-extractos-stj
   ```
   `finalize_extract_batch.py --push-prod` remains extract-only and must stay scoped by the
   `out.jsonl` IDs.
9. Re-run the daily four-corpus check at the end. If new `source_id`s arrived while processing,
   run a second daily pass for only those new IDs. The run is not complete until the final
   PROD daily aggregate has no missing text/extracts for daily generable rows.
10. Smoke public API with the current own-index query params:
    `fecha_desde=<YYYY-MM-DD>&fecha_hasta=<YYYY-MM-DD>`; do not use legacy
    `desde_fecha`/`hasta_fecha`.

The common status line to report is, per corpus:

```txt
docs=<n> con_texto=<n> con_extracto=<n> con_tags=<n> con_anclas=<n> modelo_prompt=<n> review_true=0
```

Only after the daily sweep is complete should the final answer say "los 4 corpus fueron revisados".

### Generic Novelty Flow

1. Refresh local context from production or compare production/local freshness per the DB runbook. Do not print secrets.
2. Count new documents by corpus and identify documents missing locally.
3. Ingest/observe recent documents for all four corpus if needed.
   - If PROD already has documents that LOCAL lacks, pull them first with content sync and
     `missing_only`; do not use an ad-hoc Python snippet:
     ```bash
     cd /home/pachu/projects/saas/iteralex/itera-lex-tools/api
     .venv/bin/python scripts/rio_negro_sync_content.py pull \
       --tipo fallos --ambito jurisdiccional --anio 2026 \
       --import-strategy missing_only \
       --apply
     ```
     For `pull`, `--confirm` is not required. Use `merge` only when intentionally reconciling
     existing rows.
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

For whole-year `sumarios` completion, prefer the compact repo helper. It keeps
heavy logs in files, avoids printing hundreds of rows, and runs the full local
pipeline:

```bash
cd /home/pachu/projects/saas/iteralex/itera-lex-tools/api
.venv/bin/python scripts/rio_negro_complete_sumarios_year.py \
  --ambito jurisdiccional \
  --anio <AAAA> \
  --apply-local \
  --confirm finalizar-tanda-extractos-stj
```

Use this for prompts like "indexá/completá 2022 entero" when the active corpus is
`sumarios/jurisdiccional`. In this context "complete/index year" means:
observe metadata, capture `texto_oficial`, generate `sintesis_criterio`, gate,
apply local, and verify `editorial_completeness_v2`.

The helper writes artifacts under `data/sumarios-<ambito>-<YYYYMMDD>/`:
`*_backfill.log`, `batch_*.jsonl`, `out_*.jsonl`, `gate_fail_*.jsonl`, and
`quarantine_*.jsonl`. It also writes `summary_*.json` and
`promotion_scopes_*.txt`; pass that scopes file directly to the fast snapshot
promotion script if the user later asks to publish the completed year. It never
pushes PROD. If gate is not clean, stop and fix only the failed `extracto_id`s
in `out_*.jsonl`, then re-run finalize or the helper with `--skip-backfill`.

Known friction removed by the helper:

- admin `target_min_docs` is capped at `200`; this is just a planning guardrail,
  not the real official total. Trust `total_upstream` and final completeness.
- `finalize_extract_batch.py` needs `--anio` to print the right scope; pass it.
- avoid `--summary` on big exports unless debugging; it prints one line per row.

Use the manual flow below for fallos, exact month work, non-standard scopes, or
when the helper reports gate failures that need inspection.

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
- If documents were pulled from PROD and then `texto_oficial` was captured only in LOCAL,
  extract-only push is not a clean promotion: it would publish the extract while leaving PROD
  without the official source text. Either promote the touched documents/text first, or run the
  validated capture script against PROD for the exact scoped date/docs, then push extracts.
  `scripts/rio_negro_sync_extracts.py` now blocks this by default when LOCAL has text and PROD does
  not; do not bypass it with `--allow-target-missing-text` unless that mismatch is explicitly
  intentional and documented.
- Do not use `scripts/rio_negro_sync_content.py push --apply` for mass RN promotion. That CLI calls `verify_content_package()` after apply and can spend tens of minutes checking rows one by one.
- Do not use `TRUNCATE ... CASCADE` on `documentos_rio_negro`: it deletes dependent telemetry/positioning tables (`query_documento_rio_negro`, `observaciones_posicion_rio_negro`, tags, etc.).
- Use slow sync only for a surgical merge where PROD differences must be preserved or for a tiny `extracts_only` batch.

Fast snapshot promotion sequence:

1. Prove local is a superset of production by document key `(tipo, ambito, id_fuente)`. If `PROD - LOCAL != 0`, stop and pull/merge first.
2. Take a production backup unless the user explicitly accepts skipping it. The fast helper defaults
   to a scoped JSONL content backup for only the touched scopes; this is for scoped content restore,
   not a direct full-table rollback. Use `--backup-mode full` when a full-table dump of
   `documentos_rio_negro`, `extractos_rio_negro`, and `lotes_contenido_rio_negro` is required.
3. Push set-based packages for only the scopes touched. Use bundled script:

```bash
cd /home/pachu/projects/saas/iteralex/itera-lex-tools/api
.venv/bin/python /home/pachu/projects/itera-core/skills/rn-pipeline-operativo/scripts/rn_fast_snapshot_push.py \
  --scope fallos/jurisdiccional/2026 \
  --scope fallos/stj/2026 \
  --scope sumarios/jurisdiccional/2024 \
  --scope sumarios/stj/2024 \
  --scope sumarios/stj/2026
```

This is dry-run by default. To apply:

```bash
.venv/bin/python /home/pachu/projects/itera-core/skills/rn-pipeline-operativo/scripts/rn_fast_snapshot_push.py \
  --scope fallos/jurisdiccional/2026 \
  --scope fallos/stj/2026 \
  --scope sumarios/jurisdiccional/2024 \
  --scope sumarios/stj/2024 \
  --scope sumarios/stj/2026 \
  --apply --confirm push-snapshot-rn-to-produccion
```

If the yearly sumarios helper produced a scopes file, prefer that handoff instead of manually
retyping scopes:

```bash
.venv/bin/python /home/pachu/projects/itera-core/skills/rn-pipeline-operativo/scripts/rn_fast_snapshot_push.py \
  --scopes-file data/sumarios-jurisdiccional-YYYYMMDD/promotion_scopes_sum_jurisdiccional_<AAAA>.txt \
  --apply --confirm push-snapshot-rn-to-produccion
```

Use `--default-demo-scopes` only when those exact five scopes are the desired promotion target. Use
`--skip-backup` only after the user explicitly accepts the rollback tradeoff.

After apply, verify with aggregate counts, not row-by-row:

- local and PROD corpus totals match;
- `prod docs missing in local = 0` and `local docs missing in prod = 0`;
- active extracts have tags, anchors, model/prompt, and `review=0`;
- public API `/jurisprudencia/rio-negro/indice/buscar` returns `200` with `ai_extract.status=generated`;
  for current Tools API shape, inspect `ai_extract.text` and
  `ai_extract.clasificacion_itera.tags_busqueda`, not legacy `ai_extract.extracto`/`ai_extract.tags`;
- web routes return `200`.

Known pitfalls from the 2026-07-06 push:

- `--force-reviewed` must override legacy `manual`/`revisado` rows when local has the corrected generated extract; otherwise legacy gaps remain.
- `requires_review` is metadata noise for this prototype and must not block promotion.
- The fast snapshot import is set-based and avoids row-by-row verification. Its default backup is
  now scoped JSONL content, so frequent yearly pushes no longer pay the full-table dump cost. Use
  `--backup-mode full` only when the rollback plan explicitly needs a full-table `pg_dump`.
- In dry-run mode, an aggregate local/PROD mismatch is informational; only `--apply` enforces exact
  aggregate equality after the set-based import.
- Avoid hand-escaped `psql` commands for multiline ops. Use repo tunnel helpers/scripts so secrets are not printed and quoting does not derail the operation.
- If a process reaches post-apply `verify_content_package()` on a mass snapshot, stop it and switch to aggregate verification.
- `finalize_extract_batch.py --push-prod` is extract-only. It is correct for a generated batch only
  when the target already has the document and `texto_oficial` parity is true, or when text parity
  was intentionally waived.

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
- whole-year sumarios also have `wc -l batch/out/fail/quarantine` checked and the
  final SQL aggregate confirms docs, text, extract, resumen, tags, anchor, model,
  prompt, and `review_true=0`;
- non-generable documents are explained as missing/insufficient official content, not silently left blank;
- `.planning/STATE.md` records the local/prod status, date range, counts, files,
  gate result, and any manual fixes;
- the final answer states local vs production status clearly.
