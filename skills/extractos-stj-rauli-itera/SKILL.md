---
name: extractos-stj-rauli-itera
description: Generate richer RAULI-style executive extractos and editorial classifications for Superior Tribunal de Justicia decisions, especially PJ Rio Negro STJ full decisions. Use when Codex must summarize STJ/TSJ-style appellate, constitutional, amparo, queja, casation, extraordinary appeal, execution, civil damages, labor-administrative, health, or institutional rulings into a substantive extract with anchors and classification metadata for future indexing. Do not use for routine formulaic lower-court operational rulings or official headnote/sumario rewriting.
---

# Extractos STJ RAULI Itera

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

## Extract Style

Preferred pattern:

```text
El Superior Tribunal de Justicia [rechazo/declaro inadmisible/hizo lugar/confirmo/revoco/declaro abstracta] [recurso/accion/decision], [efecto practico].

La discusion se centro en [planteo real]. El tribunal sostuvo que [fundamento decisivo], por lo que [consecuencia]. [Costas/honorarios si corresponden].
```

Keep the voice institutional, clear, and useful to lawyers. Do not sound like marketing copy or a doctrinal article.

## Core Safety Rules

- Do not say the STJ decided the merits if it only rejected a queja, REF, or admissibility gateway.
- In quejas, lead with the closing/opening of the extraordinary path, not with the underlying claim as if it were newly decided.
- In amparo, separate urgent constitutional/health protection from ordinary patrimonial or administrative disputes.
- In abstractness, state that the court did not decide the constitutional merits.
- In sensitive criminal, NNyA, health, disability, or execution matters, preserve cautious language and anonymity.
- For facts/proof, use "el tribunal sostuvo", "considero acreditado", "advirtio", or "no demostro" as appropriate. Do not convert procedural insufficiency into a factual declaration.
- Include costs, fees, JUS, deadlines, or concrete orders only when they matter to the operative result.

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

## Review Triggers

Set `needs_review: true` if:

- no dispositive section is found;
- the decision scope is ambiguous between admissibility and merits;
- the case depends on annexes or a missing appealed decision;
- protected identities or sensitive facts cannot be summarized safely;
- costs, fees, deadlines, or operative orders are inconsistent across the text;
- the extract would require inferring a doctrine broader than the case.

## Final Check

Before returning:

1. The first verb matches the dispositive result.
2. The extract names the current STJ decision, not only the underlying case.
3. The classification distinguishes `alcance_decision`.
4. Every sentence is supported by `dispositivo`, `planteo`, or `fundamentos`.
5. Tags are useful for future filters, not generic noise.
