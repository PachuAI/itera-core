---
name: extractos-jurisprudenciales-itera
description: Generate or audit conservative judicial extractos for Itera Lex from full court decisions, especially Argentine jurisprudence feeds such as PJ Rio Negro or RAULI-like sources. Use when Codex must summarize a fallo/sentencia into a short feed extract, validate whether an AI summary is anchored to the decision, produce JSON with anchors and needs_review checks, or design prompts for jurisprudential extract generation. Do not use for legal advice, doctrinal commentary, predictions, or summarizing official sumarios without a separate criterion-summary rule.
---

# Extractos Jurisprudenciales Itera

## Core Rule

Generate a short executive extract, not a doctrinal comment. The extract must say what the court resolved, what was at issue, why that result follows, and what practical effect it has.

Target 120-150 words. Allow up to 170 words for multiple grievances, multiple damages items, or sensitive procedural context. For purely operative, registral, or formulaic rulings, such as fiscal monitorias, homologations, execution-fee orders, and material rectifications, prefer 55-100 words if that preserves all useful dispositive data. Use third-person institutional voice.

## Queue Order

When producing batches for an indexed feed, work in the same order that the public feed shows:

1. `fecha_sentencia DESC NULLS LAST`.
2. `primer_visto_en DESC` or equivalent ingestion timestamp.
3. Stable local id/source id as final tie-breaker.

Do not fill only one editorial group unless the user or UI segment explicitly asks for that group. For PJ Rio Negro, check `jurisprudencia`, `operativo_procesal`, `registro`, and optional `ejecucion_penal` separately; a top result may be pending in another segment even if the main jurisprudence feed is complete.

## Model Tiering

Smaller models may be used only for low-argument operational work: fiscal monitorias, simple executive monitorias, homologations without substantive dispute, material rectifications, fee-only orders, routine criminal-execution/hearing records, and procedural remissions.

Do not use a mini model unattended for real jurisprudential decisions, appeals, revocations/modifications with legal reasoning, ART/labor calculations, civil damages, health amparos, NNyA/tutela, violence/family risk measures, or any case where allegation/proof/result is hard to separate. For these, either use a stronger model or set `needs_review: true`.

When a mini model is used, persist the real model name in metadata and use a prompt/version label that says `operativo_formulaico_mini`, not `penal_operativo`, unless the batch is strictly criminal-execution operational material.

## Mandatory Workflow

1. Read metadata: court, date, caption, jurisdiction/fuero, decision type.
2. Locate the dispositive section: `RESUELVE`, `FALLO`, `DECIDE`, `Por ello`, `SE RESUELVE`, or equivalent.
3. Extract the exact result from the dispositive section before drafting.
4. Locate the appeal, grievance, claim, incident, or procedural request.
5. Locate the decisive grounds that connect the request to the result.
6. Draft in this order: court + result, issue/request, decisive grounds, practical consequences.
   - If the ruling is formulaic or operational, do not invent a "debate". Draft as a practical notice: what was ordered, for how much or under what terms, and what procedural effect follows.
7. Verify every sentence against an anchor. Remove or soften any unanchored sentence.
8. If the dispositive section conflicts with reasons, prayers, or requested amounts, set `needs_review: true`.

## Output

Return JSON for internal use unless the user asks only for prose. Follow `references/output-schema.md`.

The public-facing `extracto` should be publishable only when `needs_review` is false. If `needs_review` is true, produce a draft but mark the reasons clearly.

## Style

Prefer this structure:

```text
El/La [tribunal] [confirmó/revocó/modificó/hizo lugar/rechazó/declaró inadmisible] [decisión/recurso/demanda], [efecto práctico].

La discusión se centró en [agravio/planteo]. El tribunal sostuvo que [fundamento decisivo], por lo que [consecuencia]. [Costas/honorarios si corresponde].
```

Avoid:

- legal advice or outcome prediction;
- judge/secretary names and protocol formulas;
- long citations or doctrinal exposition;
- facts, amounts, percentages, dates, URLs, or parties not present in the text;
- turning lack of proof into a positive contrary fact;
- generalizing a rule beyond the case.

## Decision Rules

Use `references/rules.md` when the case involves any of these:

- queue/batch ordering or PJ Rio Negro editorial groups;
- confirmatory, modifying, revoking, or interlocutory decisions;
- TSJ, quejas, extraordinary appeals, RIL/RNE, or admissibility;
- Laboral/ART: disability, Baremo, DNU 669/2019, `Trotelli`, interest, capitalization;
- civil damages, liability, quantification, costs, fees;
- family, NNyA, violence, health, or other sensitive matters;
- fees/JUS as the actual object of the appeal;
- monitorias, homologations, material rectifications, habeas corpus, or criminal execution.

## Short Profiles

Use these profiles unless the decision has a real argumentative issue that requires the full 120-150 word structure.

- **Fiscal monitoria / tax execution**: 60-95 words. Result, capital, interests/costs, fees, provisional budget or embargo limit only if dispositive. Mention exception period only as practical effect. Omit generic embargo boilerplate.
- **Formulaic operational ruling**: 55-95 words. Use when the text has no real argumentative dispute. State the operative act, amount/obligation if any, notice/payment/exception effect, costs/fees. Do not make it sound like precedent.
- **Menor cuantia monitoria**: 80-120 words. Result, claim origin, decisive proof/default, amount, payment term, costs, fees.
- **Homologation**: 70-110 words. Homologated agreement, amount/payment structure if present, costs, fees, taxes/contributions only if ordered.
- **Material rectification / aclaratoria**: 50-80 words. Corrected prior decision, exact corrected item, whether substance changes. Do not make it sound like a merits decision.
- **Habeas corpus / execution penal**: 80-120 words. Current result first. Separate the inmate/defense allegation from what prison/medical reports established. If abstract, state what changed.
- **Protective violence/family measures**: 90-130 words. Use cautious language. Include only concrete restrictions/referrals/duration. Do not narrate intimate facts unless necessary to understand the order.

## Review Triggers

Set `needs_review: true` if:

- no dispositive section is found;
- the official text is incomplete, corrupt, or depends on unavailable annexes;
- amount/percentage/JUS differs between grievances, reasons, and dispositive section;
- the case requires anonymization and the text does not permit it safely;
- the case is sensitive and risk/report/allegation cannot be separated from proven fact;
- an admissibility decision contains extensive background merits discussion;
- fees or final amounts are unclear;
- the current decision and the appealed decision are easy to confuse.

## Final Check

Before returning, confirm:

1. The first verb matches the dispositive result.
2. Final amounts and percentages come from the dispositive section or recomposition.
3. Costs and fees are attributed to the correct instance.
4. The selected ground answers the main grievance.
5. Sensitive matters preserve anonymity and cautious language.
6. TSJ/quejas state whether the court decided admissibility or merits.
