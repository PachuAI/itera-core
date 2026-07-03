---
name: rn-fallo-jurisdiccional
description: Generate executive extractos and editorial classifications for PJ Río Negro LOWER-COURT (jurisdiccional) full decisions (fallos) — juzgados, cámaras, unidades procesales/jurisdiccionales. Use when Codex must summarize a fiscal monitoria, homologation, family/violence protective measure, alimentos, divorcio, criminal-execution, civil-damages, labor, contencioso-administrativo or cámara appeal ruling into a tiered feed extract with anchors and classification metadata. Do not use for STJ/TSJ appellate rulings (use rn-fallo-stj), official sumarios, or legal advice.
---

# Extractos Fallos Jurisdiccionales — Río Negro

> Skill de fallos de **instancias inferiores** de PJ Río Negro (`tipo=fallos`,
> `ambito=jurisdiccional`). Hermano de `rn-fallo-stj` (que cubre el Superior Tribunal).
> Cosecha los perfiles de `extractos-jurisprudenciales-itera` RN-scopeados. La calibración
> vive en `itera-lex-tools/api/docs/integrations/analisis-fallos-ia/calibracion-fallos-jurisdiccional-rn-2026-07-03.md`.

## Purpose

Produce a short, useful extract for lower-court decisions and classify them for a future
indexed feed, filters and QA. The corpus is dominated by **operational/formulaic** rulings
(monitorias, homologadas, many interlocutorias) and a large **family/violence/NNyA** slice,
plus criminal-execution and some substantive civil/labor/contencioso definitivas. The object
is therefore **tiered by `perfil`**, not one uniform substantive summary.

Do not copy STJ doctrine wholesale: lower courts use `FALLO` / `SE RESUELVE` / `RESUELVO`
(unipersonal), not the `EL SUPERIOR TRIBUNAL ... RESUELVE` block; the matter mix is different;
and the review policy for the sensitive slice is deliberately narrower (see below).

## When To Use

Use for PJ Río Negro `fallos/jurisdiccional` full decisions from juzgados, cámaras de
apelaciones/del trabajo, unidades procesales y jurisdiccionales, juzgados de paz y de
ejecución penal.

Do not use for:

- STJ/TSJ decisions (quejas, casación, REF, amparo appeals at the top court) → use `rn-fallo-stj`.
- Official sumarios/headnotes, or generation from metadata/snippets — always work on `texto_oficial`.
- Legal advice, outcome prediction, doctrinal commentary detached from the ruling.

## Small-Model Guardrails (gpt-5.4-mini) — Non-Negotiable

You run on a **small model**. Be literal, not clever. Almost every error comes from filling a gap
with something plausible but unverified. Do the opposite: **if it is not explicit in
`texto_oficial`, it does not go in the extract.** No guessing, no rounding, no "aproximadamente",
no inferred dates, amounts, parties, courts, or measures.

Before writing each line, make three passes over `texto_oficial`:

1. **Dispositive pass** — find the final formal dispositive block and list *every* operative order
   in it (what is granted, denied, deferred; amounts, costs, fees, measures, terms). The extract
   must reflect the **full** result, not only the first order.
2. **Identity pass** — list every person and the *exact* form the source uses (full name, initials,
   or placeholder). If a person is anonymized (`E.S.G.`, `[CONDENADO_1]`) **anywhere**, use that
   exact form for them **everywhere** in `extracto` and `anclas`. Never output a name the source
   masks elsewhere; never partially mask; never mix two forms for the same person.
3. **Number pass** — copy every amount, percentage, JUS, distance, term and date **verbatim** from
   the dispositive. If two figures conflict, use the dispositive one and set `needs_review` (`monto:`).

Hard rules — treat each like a gate check on yourself:

- **Verbatim or omit.** Every fact must trace to a sentence you can point to in `texto_oficial`. If
  you cannot point to it, delete it. Never complete a truncated figure, name, article, or date.
- **Anchor the principal order** (the one matching the lead verb and result), copied verbatim, long
  enough to be unambiguous — never a secondary `líbrese oficio`/embargo/notification.
- **Controlled fields only.** `materia_principal`, `perfil`, `tipo_decision`, `alcance_decision`,
  `grupo_editorial`, `sensibilidad` take **only** values from `references/taxonomia-jurisdiccional.md`.
  Never invent a value, never leave one empty. If none fits exactly, pick the closest **and** set
  `needs_review` (`taxonomia:`) — do not silently approximate.
- **Full result, not half.** If the ruling grants one thing and denies/defers another, state both.
- **Direction is verifiable.** In appeals, name who appealed and derive the result from the effect
  on the **original claim**; state plainly whether the claim/protection/condena stands or falls.
- **No filler.** Never write "analizó la cuestión" / "consideró los agravios" without the concrete
  ground. Every sentence carries a specific fact or the decisive reason.
- **Clean placeholder tokens.** Emit `[VÍCTIMA_1]`, never `'[VÍCTIMA_1]'` or `[VÍCTIMA_1]'`.
- **When in doubt, flag — do not paper over.** If the result direction, the winner, an amount, the
  scope, a possible dissent, or the correct controlled value is unclear, set `needs_review` with the
  specific reason prefix. A flagged draft is cheap; a confident wrong extract is not.

## Required Workflow

1. Read metadata: organismo, fecha, carátula, tipo_sentencia, source id.
2. Locate the dispositive section first (see Dispositive Section Rule).
3. **Pick the `perfil`** (Perfil Selection) — it sets the length band and the tone.
4. Classify with `references/taxonomia-jurisdiccional.md` before drafting.
5. Identify the procedural object (demanda, ejecución, acuerdo, denuncia, apelación, incidente)
   and the decisive ground that connects it to the result.
6. Draft in this order: **organismo + operative verb + result**, issue/request, decisive
   ground, practical effect (amount/term/costs/fees/measures only if dispositive).
7. Verify every sentence against an anchor. Soften or drop unanchored sentences.
8. Produce classification metadata + anchors + `needs_review` + `review_reasons`.

## Perfil Selection (tiering)

Pick one `perfil`; it defines the target length and the model/review posture. The gate
enforces the outer band.

- **`operativo_formulaico`** — monitorias fiscales, homologadas, aclaratorias/rectificaciones,
  liquidaciones, honorarios-only, beneficio de litigar sin gastos, oficios/exhortos, cautelares
  operativas. Target **55–110** words (gate 45–120). Practical-notice voice: what was ordered,
  for how much / under what terms, what procedural effect. Never make it sound like precedent.
- **`familia_sensible`** — violencia, alimentos, divorcio, medida de protección NNyA,
  autorización para viajar, capacidad. Target **90–130** (gate 75–150). Cautious language,
  source-mirroring anonymization, concrete measures only.
- **`ejecucion_penal`** — condena a prisión (as execution), excarcelación, libertad
  condicional, unificación/cómputo de pena, detenido en unidad. Target **80–120** (gate 65–135).
  State the current procedural result first; treat conditions/health with care.
- **`sustantivo`** — definitivas laborales (Cámara del Trabajo), civil daños,
  contencioso-administrativo de fondo, amparo salud, cámara appeals (confirma/revoca/modifica).
  Target **120–170** (gate 105–185). This is the STJ-like substantive object, single instance.

See `references/perfiles-jurisdiccionales.md` for the per-matter rules and safe formulations.

## Dispositive Section Rule

Lower-court dispositives are usually at the end and use varied headers. Find the **last**
formal dispositive block:

- Colegiado / cámara: `RESUELVE` / `SE RESUELVE` / `FALLA` / `FALLO` (may read `RESUELVE por MAYORIA/unanimidad: ...`).
- Unipersonal: `RESUELVO` / `FALLO`.
- Providencia / auto (no header): the dispositive is an enclitic imperative — `fíjase`, `decrétase`,
  `líbrese`, `homológase`, `intímese`, `regúlese`, `ratifíquese`. Anchor on that verb, not on the
  closing formulas (`notifíquese`, `regístrese`, `protocolícese`, `archívese`).
- Without a header: `Por ello, ... I) / 1) / Primero: <verbo dispositivo>`.

Do not stop at the first body match (`el juez resuelve la cuestión...` is a false positive).
Quote `anclas.dispositivo` verbatim from that final block, with enough text for the gate to
match it. When the dispositive fixes **several orders** (a main resolution plus `líbrese oficio`,
embargo, `hágase saber` or notifications), anchor the **principal** order — the one that matches
the lead verb and the result (`llevar adelante la ejecución`, `prohibición de acercamiento`,
`decretar el divorcio`) — not a secondary oficio, embargo or communication. If no dispositive
block is found, set `needs_review: true` with a `dispositivo:*` reason.

Reject **truncated captures**: text that starts at `FALLO`/`RESUELVO`/`RESUELVE` with no body,
or `< ~400` chars, is a broken capture — do not invent the planteo/fundamentos; flag it.

## Appeals (cámaras): Name Who Appealed, Derive the Result From the Effect

In cámara appeals the dispositive verb (`confirma` / `revoca` / `hace lugar`) applies to the
**recourse**, not the underlying claim. The damaging error is inverting the result.

- Name the appellant in the first sentence (`la demandada`, `la ART`, `la parte actora`, `la defensa`).
- Derive `resultado` from what happens to the **original claim**. "Confirma la sentencia que
  condenó" ≠ "condena". Use `mantiene`/`confirma` when a measure/amount/percentage stands.
- Distinguish an appellate confirmation of a lower condemnation from a new condemnation.

## Anonymization: Mirror the Source

Use exactly the identity treatment of the official text. Río Negro lower-court sources come
**pre-anonymized with initials and generic roles** in family/violence/NNyA
(`H.E.M. c/ M.J.B. s/ alimentos`, `la denunciante`, `el denunciado`) and **named** in
civil/commercial/fiscal (`LA LUISINA S.R.L.`, `Agencia de Recaudación Tributaria`). If the
body carries anonymization placeholders, keep them.

- Never de-anonymize, never expand initials, never invent or complete names.
- Never add a stricter anonymization layer than the source.
- **Penal/ejecución penal with the accused named in the caption:** mirror the source (keep the
  name as it appears). Anonymization is **not** a review trigger.
- Prefer generic roles ("la denunciante", "el ejecutado", "el interno") over reconstructing names.
- **Inconsistent source anonymization:** when the source protects a person in one part (initials
  or a placeholder like `E.S.G.` / `[CONDENADO_1]`) but reveals the full name elsewhere in the same
  ruling, use the **most-anonymized form consistently** in both `extracto` and `anclas` — keep
  `E.S.G.` / `[CONDENADO_1]`, do not surface `Gutiérrez` / `Valdemoros`. This is not de-anonymizing
  (you adopt the protective form the source itself uses); it avoids re-exposing the name in prose.

## Sensitivity and Review — Two Tiers

Family/violence/NNyA is ~28% of this corpus. Mirroring the STJ policy (any NNyA/violence →
review) would send the bulk to review. Split it:

- **Tier A — cautious language only, `needs_review=false` (publishable):**
  `nnya`, `violencia_familiar`, `persona_privada_libertad`, `anonimizacion`. Routine protective
  measures, alimentos, divorcio, autorización and routine criminal-execution publish with the
  hard anti-patterns below — not human review.
- **Tier B — forces `needs_review=true`:** `violencia_sexual`, `abuso_menores`, `salud`,
  `salud_mental`, `discapacidad`. The gate forces review on these.

Hard anti-patterns for the family/violence slice (always, even Tier A):

- Never state that violence occurred unless the ruling expressly treats it as proven. Use
  "denuncia", "situación de riesgo", "medidas preventivas/cautelares".
- Do not narrate intimate facts; do not add locality/workplace/health detail that could identify.
- List only the operative measures (exclusión, perímetro, prohibición de contacto/acercamiento,
  rondines, restitución de efectos, plazo, derivación al juzgado de familia). Keep initials.
- If precautionary, do not describe it as deciding the merits. Do not use "interés superior" as
  an empty formula — say the concrete consequence it protects.

## The Extract Never Talks About Itself

The `extracto` is publishable prose about the ruling. It must never mention itself, its
classification, the review flow, internal tokens (`tier=escape`, `needs_review`), backticks, or
field names. Put all of that in `review_reasons`/`clasificacion`. The gate hard-fails
(`meta_texto_editorial`) any extract that references itself or leaks internal tokens.

## Extract Style

Lead with organismo + operative verb + result, keeping the court name concise so the verb lands
early:

```text
La [Unidad/Juzgado/Cámara] [dictó/ordenó/homologó/condenó/hizo lugar/rechazó/confirmó/revocó]
[acto/decisión], [efecto práctico].

[Planteo/objeto en una frase]. [Fundamento decisivo]. [Costas/honorarios/plazo si es dispositivo].
```

Acceptable opening verbs (gate): `dictó`, `ordenó`, `llevó adelante`, `homologó`, `hizo lugar`,
`rechazó`, `condenó`, `absolvió`, `sobreseyó`, `confirmó`, `revocó`, `modificó`, `reguló`,
`aprobó`, `fijó`, `decretó`, `dispuso`, `excarceló`, `concedió`, `rectificó`, `declaró`, `intimó`.

Avoid: legal advice/prediction; judge/secretary names and protocol formulas; long citations or
doctrine; facts/amounts/dates/parties not in the text; turning lack of proof into a positive
contrary fact ("no se acreditó", never "era falso"); generalizing a case-specific rule.

## Output

Return one compact JSON object (JSONL discipline for batches):

```json
{
  "extracto": "...",
  "clasificacion": {
    "materia_principal": "...",
    "submateria": "...",
    "perfil": "operativo_formulaico|familia_sensible|ejecucion_penal|sustantivo",
    "tipo_decision": "...",
    "resultado": "...",
    "alcance_decision": "...",
    "eje_argumental": "...",
    "sensibilidad": ["..."],
    "tags_busqueda": ["..."],
    "grupo_editorial": "jurisprudencia|operativo_procesal|registro|ejecucion_penal|familia_sensible|salud_amparo"
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

Read `references/taxonomia-jurisdiccional.md`. The gate validates as **closed vocabulary**:
`materia_principal`, `perfil`, `tipo_decision`, `alcance_decision`, `grupo_editorial`,
`sensibilidad`. The fields `resultado`, `eje_argumental`, `submateria`, `tags_busqueda` are
**free text in v1** (documented in the taxonomy; promoted to controlled sets after calibration).

The classification field is `tipo_decision` (generic), **not** `tipo_decision_stj`. Do not
invent controlled values. If no exact value fits a controlled field, pick the closest stable
value, set `needs_review: true`, and add a `taxonomia:*` reason. Derive `materia`/`tipo_proceso`
from the **decision text**, not guessed from the carátula.

## Review Triggers

Set `needs_review: true` when:

- no dispositive block is found, or the text is truncated/incomplete/annex-dependent;
- the case carries a **Tier B** sensitivity (`violencia_sexual`, `abuso_menores`, `salud`,
  `salud_mental`, `discapacidad`);
- amounts/percentages/JUS conflict across claim, reasons and dispositive;
- a protection/NNyA ruling decides guarda/adoptabilidad on the merits;
- a cámara appeal is easy to misread (confirmation vs new condemnation);
- a judge votes **en disidencia** on the operative result (`voto:*`) — anchor the holding to the
  dispositive, never summarize the dissent as the ruling;
- reasons are incorporated only by remission to a dictamen/annex/precedent (`remision:*`);
- the row is `tier=escape` (long/complex).

Use stable reason prefixes: `sensibilidad:*`, `remision:*`, `taxonomia:*`, `dispositivo:*`,
`voto:*`, `tier_escape`. Do not force review merely because a ruling is operational, short, or
formulaic — the taxonomy and Tier A cover it.

## JSONL Batch Discipline

- Keep `extracto_id` exactly as it appears in `batch.jsonl`.
- One compact JSON object per line; no markdown, no pretty-print.
- First operative verb matches the dispositive result and lands within the first ~20 words.
- Length within the band of the declared `perfil`.
- Only controlled values for `materia_principal`, `perfil`, `tipo_decision`, `alcance_decision`,
  `grupo_editorial`, `sensibilidad`.
- If the source row is `tier=escape`, set `needs_review: true`.

## Final Check

1. The first verb matches the dispositive result and reflects the `perfil`.
2. `anclas.dispositivo` comes from the final formal dispositive block (FALLO/RESUELVO/RESUELVE).
3. The extract names the current decision, not only the underlying dispute.
4. Amounts/costs/fees come from the dispositive section and are attributed to the right instance.
5. Family/violence/NNyA preserve anonymity and cautious language; violence is never asserted as proven.
6. Cámara appeals state whether the protection/condemnation/claim stands or falls.
7. Every person uses the source's most-anonymized form, consistent across `extracto` and `anclas` —
   no full name that appears masked elsewhere in the ruling.
8. Every amount, percentage, JUS, term and date is verbatim from the dispositive — nothing estimated,
   rounded, or completed from a truncated figure.
9. Every controlled field holds a value from the taxonomy; none is invented, approximated silently,
   or left empty. Anything unclear is flagged in `review_reasons`, not guessed.
