---
name: rn-fallo-stj
description: Generate rich executive extractos (RAULI-style quality) and editorial classifications for PJ Río Negro Superior Tribunal de Justicia (STJ) full decisions (fallos). Use when Codex must summarize STJ/TSJ-style appellate, constitutional, amparo, queja, casation, extraordinary appeal, execution, civil damages, labor-administrative, health, or institutional rulings into a substantive extract with anchors and classification metadata for future indexing. Do not use for routine formulaic lower-court operational rulings or official headnote/sumario rewriting.
---

# Extractos Fallos STJ — Río Negro

> Skill de fallos STJ de PJ Río Negro. El nombre histórico fue `extractos-stj-rauli-itera`
> ("rauli" refería al *estilo* de calidad, no a Neuquén). La calibración 2026-06-30 vive en
> `itera-lex-tools/api/docs/integrations/analisis-fallos-ia/calibracion-fallos-stj-rn-2026-06-30.md`.

## Purpose

Produce a substantive executive extract for high-value STJ decisions, and classify the decision for future search, filters, QA, and comparison against RAULI.

This skill is separate from the general `extractos-jurisprudenciales-itera` profile because STJ decisions are longer, procedurally layered, and usually more useful to lawyers. Do not compress them into a penal/operational mini-summary.

## When To Use

Use for:

- PJ Rio Negro `fallos/stj` full decisions.
- STJ/TSJ decisions on quejas, casacion, impugnacion extraordinaria, recurso extraordinario federal, amparo appeals, constitutional actions, civil damages, labor-administrative disputes, execution incidents, health, institutional/public-law issues.
- Any decision where the extract should support a future indexed feed, advanced filters, or RAULI comparison.

Do not use for:

- Formulaic monitorias, homologations, material rectifications, routine registral/protocol orders.
- Official sumarios/headnotes unless the task explicitly asks for criterion extraction.
- Legal advice, outcome prediction, or doctrinal commentary detached from the decision.

## Required Workflow

1. Read metadata: court, date, caption, decision number, matter, source id.
2. Locate the dispositive section first: `RESUELVE`, `DECIDE`, `Por ello`, or equivalent.
3. Classify the decision before drafting. Use `references/taxonomia-stj.md`.
4. Identify the procedural object: queja, appeal, REF, action, execution incident, etc.
5. Separate current decision scope from background merits:
   - admissibility/opening of review;
   - merits/fondo;
   - abstractness/mootness;
   - procedural closure.
6. Extract decisive grounds that answer the actual procedural object.
7. Draft 120-170 words, usually 2 paragraphs:
   - Paragraph 1: STJ result + practical effect.
   - Paragraph 2: planteo + decisive grounds + costs/fees if concrete.
8. Produce classification metadata with the extract.
9. Verify every sentence against anchors.

## Dispositive Section Rule

The dispositive section is usually at the end. Do not stop at the first text match for
`resuelve`: body phrases such as "resuelven cuestiones" are false positives.

Use this order:

1. Prefer the final formal block after `EL SUPERIOR TRIBUNAL ... RESUELVE`.
2. If the text has spaced letters (`R E S U E L V E`), use that final block.
3. If several matches exist, use the last formal dispositive block near signatures,
   protocolization, notification, archive, costs, fees, or remand language.
4. Quote `anclas.dispositivo` verbatim from that final block, with enough text for
   the gate to match it.

If no dispositive block is found, set `needs_review: true` and explain it.

## Scope Matrix

Choose `alcance_decision` before writing the first sentence:

- `admisibilidad`: REF/casación/impugnación gateway; do not state the merits as decided.
  Includes `hace_lugar_queja` and `declara_bien_concedido`, because they open
  the route but do not resolve the merits.
- `procesal_cierre`: closes a route for lack of critique, procedural defect, or in limine rejection.
  Includes rejected quejas/casación/REF for fact-and-proof issues, lack of concrete
  critique, or formal defects, even if the practical effect is that a lower decision
  remains standing.
- `fondo`: the current STJ decision resolves the merits or modifies a concrete operative issue.
  If the STJ only revokes, reallocates, or recalculates costs/fees/honorarios, use
  `alcance_decision="fondo"` with `tipo_decision_stj="modifica"`; do not use
  `revision_correctora` unless the decision corrects a serious procedural or
  jurisdictional defect.
- `amparo_urgente`: urgent constitutional/health protection, whether confirmed or revoked.
- `revision_limitada`: habeas corpus, execution, or narrow procedural review.
- `nulidad_reenvio`: STJ admits, annuls, and remands; not a final merits ruling.
- `improcedencia_preventiva`: no current concrete case yet; not the same as abstractness.
- `abstracto`: the case became moot after filing; say there is no merits ruling.
- `revision_correctora`: STJ corrects a serious procedural/jurisdictional defect.

When in doubt between a merits description and the procedural gateway, lead with the
gateway and set `needs_review: true`.

## Instrumental STJ Decisions

Some `fallos/stj` rows are procedurally useful but not substantive merits decisions.
Do not force them into queja/casación buckets and do not approximate them with a
nearby value when the taxonomy already has an exact instrumental value:

- Excusación, apartamiento, integración del tribunal:
  `tipo_decision_stj="admite_excusacion"`, `alcance_decision="revision_correctora"`,
  `resultado="integracion_tribunal_confirmada"`,
  `eje_argumental="integracion_tribunal_imparcialidad"`. Do not use
  `admite_recusacion` when the judge excused themself or requested apartamiento and
  the STJ accepted that excusation.
- Intimación para cumplir sentencia/mandamus:
  `tipo_decision_stj="intima_cumplimiento"`, `alcance_decision="fondo"` if it orders
  concrete compliance, `resultado="cumplimiento_intimado"`,
  `eje_argumental="cumplimiento_mandato_judicial"`.
- Recurso concedido por la instancia anterior pero cerrado por el STJ:
  `tipo_decision_stj="declara_mal_concedido"`,
  `resultado="recurso_mal_concedido"`, `alcance_decision="procesal_cierre"`.
- Caducidad de instancia recursiva:
  `tipo_decision_stj="declara_caducidad"`, `resultado="instancia_caduca"`,
  `eje_argumental="caducidad_instancia_recursiva"`.
- Apelación inoficiosa/objeto cumplido:
  `tipo_decision_stj="declara_inoficioso"`, `resultado="apelacion_inoficiosa"`,
  `alcance_decision="abstracto"`, `eje_argumental="amparo_objeto_cumplido"` or
  `cuestion_devenida_abstracta`. If the dispositive says `inoficioso`, do not force
  `tipo_decision_stj="declara_abstracta_accion"`.
- Habeas corpus o ejecución penal estrecha:
  prefer `tipo_decision_stj="rechaza_habeas_corpus"` when the current decision rejects
  or declares inadmissible the habeas path itself; keep `alcance_decision="revision_limitada"`.
- Honorarios/costas:
  use `resultado="honorarios_readecuados"` with
  `eje_argumental="honorarios_base_regulatoria"` when the STJ redefines the regulatory
  base or amount, and `resultado="honorarios_anulados_reenvio"` when it annuls and
  remands the fee issue.
- Plazo recursivo extemporáneo:
  use `eje_argumental="plazo_recursivo_extemporaneo"` when closure rests on late
  filing or an expired appeal term.

These decisions are `needs_review=false` by default when anchors are complete and the
taxonomy fits. Set review only for a real trigger: sensitivity, remission to a
dictamen/annex/external precedent, real dissent, serious criminal exposure, or an
atypical/inconsistent dispositive block. Do not use `needs_review=true` merely because
the case is instrumental, procedural, short, or institutional.

## Tier Escape

Do not mix `tier=escape` rows into routine batches unless the operator explicitly asks
for it. They are long, multi-party, or unusually complex decisions.

If a `tier=escape` row is generated anyway:

- set `needs_review: true`;
- include `tier_escape` in `review_reasons`;
- use a conservative extract that names only the operative result and the clearest
  grounds;
- do not treat it as calibrated for bulk generation until a human audits it.

## Extract Style

Preferred pattern:

```text
El Superior Tribunal de Justicia [rechazo/declaro inadmisible/hizo lugar/confirmo/revoco/declaro abstracta] [recurso/accion/decision], [efecto practico].

La discusion se centro en [planteo real]. El tribunal sostuvo que [fundamento decisivo], por lo que [consecuencia]. [Costas/honorarios si corresponden].
```

Keep the voice institutional, clear, and useful to lawyers. Do not sound like marketing copy or a doctrinal article.

For instrumental decisions, use the real dispositive verb at the start:

- `El Superior Tribunal de Justicia intimó...`
- `El Superior Tribunal de Justicia declaró inoficioso...`
- `El Superior Tribunal de Justicia declaró la caducidad...`
- `El Superior Tribunal de Justicia declaró mal concedido...`
- `El Superior Tribunal de Justicia admitió la excusación...`

## Core Safety Rules

- Do not say the STJ decided the merits if it only rejected a queja, REF, or admissibility gateway.
- In quejas, lead with the closing/opening of the extraordinary path, not with the underlying claim as if it were newly decided.
- In amparo, separate urgent constitutional/health protection from ordinary patrimonial or administrative disputes.
- In abstractness, state that the court did not decide the constitutional merits.
- In sensitive criminal, NNyA, health, disability, or execution matters, preserve cautious language.
- Mirror the official source's identity treatment: use initials where the decision uses initials,
  and full names where the decision uses full names. Never expand initials and do not add a
  stricter anonymization layer on top of the official text.
- For facts/proof, use "el tribunal sostuvo", "considero acreditado", "advirtio", or "no demostro" as appropriate. Do not convert procedural insufficiency into a factual declaration.
- Include costs, fees, JUS, deadlines, or concrete orders only when they matter to the operative result.

## Remission Decisions

If the decision says that the antecedents, grievances, grounds, considerations, or
conclusions are treated in a Prosecutor General opinion, annex, or precedent, and the
current text only remits to that outside piece:

- do not reconstruct missing grounds from context;
- write a narrow extract that states the operative result and the remission;
- use `anclas.fundamentos` like `["remite a Dictamen N° ... del Procurador General"]`;
- set `needs_review: true`;
- add a review reason naming the external piece to audit before publication.

## Output

Return JSON unless the user asks only for prose:

```json
{
  "extracto": "...",
  "clasificacion": {
    "materia_principal": "...",
    "submateria": "...",
    "tipo_proceso": "...",
    "tipo_decision_stj": "...",
    "resultado": "...",
    "alcance_decision": "...",
    "eje_argumental": "...",
    "sensibilidad": ["..."],
    "tags_busqueda": ["..."],
    "grupo_editorial": "jurisprudencia|procesal_admisibilidad|salud_amparo|constitucional_institucional|ejecucion_penal|penal_sensible|civil_danos|laboral_publico"
  },
  "anclas": {
    "dispositivo": "...",
    "planteo": "...",
    "fundamentos": ["...", "..."]
  },
  "needs_review": false,
  "review_reasons": []
}
```

## Classification First

Use the taxonomy before drafting. The `grupo_editorial` is not the public label; it is an internal index helper. It should help answer:

- Is this a merits decision or an admissibility gateway?
- What filters should surface it later?
- What RAULI bucket would likely hold a comparable extract?
- Is the case sensitive enough to require stricter language?

Read `references/taxonomia-stj.md` when classifying. Read `references/muestra-2026-05-27.md` when working on the first STJ RN batch or when calibrating against examples.

The gate validates these fields as controlled vocabulary:

- `materia_principal`
- `tipo_decision_stj`
- `resultado`
- `alcance_decision`
- `eje_argumental`
- `grupo_editorial`
- `sensibilidad`

Do not invent ad hoc values. If no exact value fits, choose the closest stable value,
set `needs_review: true`, and mention the taxonomy gap in `review_reasons`.

## Review Triggers

Set `needs_review: true` if:

- no dispositive section is found;
- the decision scope is ambiguous between admissibility and merits;
- the case depends on annexes or a missing appealed decision;
- the reasons are incorporated only by remission to a dictamen, annex, or external precedent;
- protected identities or sensitive facts cannot be summarized safely under the source-mirroring policy;
- the case involves NNyA, health, disability, sexual violence, criminal sensitivity, or persons deprived of liberty;
- costs, fees, deadlines, or operative orders are inconsistent across the text;
- the extract would require inferring a doctrine broader than the case.

`(POR MAYORIA)` in the dispositive is not by itself a dissent. In RN STJ texts it often
means majority plus abstention. Use `voto:*` and force review only when a judge votes
for the opposite operative result or there is another real outcome split.

Use stable reason prefixes so later audits can separate quality risk from publication policy:

- `sensibilidad:*` for mandatory review because of NNyA, health, disability, sexual violence,
  penal sensitivity, or persons deprived of liberty.
- `remision:*` for PG opinions, annexes, or external precedents.
- `taxonomia:*` only when the closest controlled value is still imprecise.
- `voto:*` for majority/dissent complexity.
- `dispositivo:*` for no formal `RESUELVE`, atypical final block, or inconsistent operative orders.
- `tier_escape` for long/complex rows.

Do not use `needs_review=true` merely because the case is procedural, instrumental, or short
if the taxonomy covers it and the anchors are complete.

## JSONL Batch Discipline

When producing `out.jsonl` for the RN pipeline:

- keep `extracto_id` exactly as it appears in `batch.jsonl`;
- write one compact JSON object per line, no markdown and no pretty-printed JSON;
- keep `extracto` between 90 and 180 words;
- make the first operative verb match the dispositive result (`rechazó`, `hizo lugar`,
  `declaró inadmisible`, `confirmó`, `revocó`, `anuló`, `declaró abstracta`, `admitió`,
  `intimó`, `declaró inoficioso`, `declaró mal concedido`, `declaró la caducidad`);
- use only controlled values for `materia_principal`, `alcance_decision`,
  `tipo_decision_stj`, `resultado`, `eje_argumental`, `grupo_editorial`, and
  `sensibilidad`;
- if the source row is marked `tier=escape`, set `needs_review: true`.

## Final Check

Before returning:

1. The first verb matches the dispositive result.
2. `anclas.dispositivo` comes from the final formal dispositive block.
3. The extract names the current STJ decision, not only the underlying case.
4. The classification distinguishes `alcance_decision`.
5. Every sentence is supported by `dispositivo`, `planteo`, or `fundamentos`.
6. Tags are useful for future filters, not generic noise.
