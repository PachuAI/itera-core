---
name: rn-sumario-criterio
description: Classify and title official judicial SUMARIOS (headnotes/doctrinal criterios) from PJ Río Negro — STJ and jurisdiccional (Tribunal de Impugnación etc.) — for an indexed feed. Use when Codex must turn an official sumario/headnote (a distilled legal rule that already exists in texto_oficial) into a short editorial `titular` plus controlled classification metadata, anchored verbatim to the criterio. The official criterio stays verbatim as the body; the AI never rewrites it. Do not use for full decisions/fallos (use rn-fallo-stj or rn-fallo-jurisdiccional), for legal advice, or for generation from metadata/snippets.
---

# Extractos de Sumarios (`sintesis_criterio`) — Río Negro

> Skill de **sumarios / headnotes doctrinarios** de PJ Río Negro (`tipo=sumarios`,
> `ambito ∈ {stj, jurisdiccional}`). Hermano de `rn-fallo-stj` / `rn-fallo-jurisdiccional`, pero
> el objeto es **distinto de fondo**. La calibración vive en
> `itera-lex-tools/api/docs/integrations/analisis-fallos-ia/calibracion-sumarios-rn-2026-07-03.md`.

## Purpose

A sumario is **not** a decision to be narrated: it is a legal rule already distilled by the court's
secretaría (a holding — "se configura X cuando…", "corresponde rechazar Y cuando…"). It arrives in
`texto_oficial` as short, well-written doctrinal prose (≈35–120 words) and it already carries `voces`
(raw thesaurus tags).

So the AI does **not** replace the official criterio — it always stays, verbatim, as the authoritative
reference. On top of it the AI adds three layers: (1) a short editorial **`titular`** (a scannable
topic headline); (2) a **`resumen_itera`** — a plain-language "lectura fácil" of the *same* rule
(1–2 sentences), shown next to the dense official text so the reader grasps it at a glance; and
(3) **controlled classification** (materia, tipo de criterio, instituto, tags, sensibilidad) that turns
a flat list of headnotes into a navigable, filterable doctrinal index. The `resumen_itera`
re-expresses, never reinterprets: same rule, plainer words, nothing invented.

This is the opposite of the fallos skills. There is **no dispositive block**, **no "primer verbo
dispositivo"**, **no "quién apeló"**, **no tiering**. The anchor is the criterio itself.

## When To Use

Use for PJ Río Negro `sumarios` (STJ secretarías and jurisdiccional Tribunal de Impugnación / lower
courts) whose `texto_oficial` holds a real criterio.

Do not use for:

- Full decisions / fallos → `rn-fallo-stj` (STJ) or `rn-fallo-jurisdiccional` (instancias inferiores).
- A `texto_oficial` that is the literal word `"Fallo"`, empty, or `< ~60` chars — that is a broken
  capture (89% of the STJ corpus was polluted with `"Fallo"`); it is quarantined upstream, never
  fabricate a criterio.
- `resumen_oficial` from STJ when it is `"Fallo"` or a metadata placeholder. For STJ sumarios,
  the only valid source is the criterio captured into `texto_oficial` from `sumario/buscar`.
- Legal advice, outcome prediction, doctrinal commentary beyond the headnote.

## Model Guardrails (codex-5.5-medium) — Non-Negotiable

Use **codex-5.5-medium** for batches. Be literal, not clever. Almost every error comes from filling a gap
with something plausible but unverified. Do the opposite: **if it is not explicit in `texto_oficial`,
it does not go in the titular, the resumen_itera, or the classification.** No guessing, no rounding, no
inferred articles, amounts, parties, or outcomes.

Before writing, make two passes over `texto_oficial`:

1. **Criterion pass** — state, in your head, the exact rule the sumario holds and its scope: the
   instituto (amparo, robo agravado, prisión preventiva, prueba pericial…) and the condition/effect
   ("cuando… entonces…"). The titular names that instituto/eje and the resumen_itera restates that
   rule in plain words; neither **adds facts of the case**.
2. **No-invented-specifics pass** — the sumario is abstract doctrine. Copy **no** number, article,
   percentage, date or proper name into the titular or resumen_itera unless it appears **verbatim** in
   `texto_oficial`. Any digit you write must be findable in the source (the gate hard-fails
   `titular_dato_inventado` / `resumen_dato_inventado`).

Hard rules — treat each like a gate check on yourself:

- **Anchor verbatim or fail.** `anclas.criterio` must be a fragment **copied verbatim** from
  `texto_oficial` (the core rule clause), long enough to be unambiguous. A paraphrase will not overlap
  and the gate fails `ancla_criterio_no_coincide`. Never anchor a fragment you reworded.
- **Never rewrite the holding.** The titular is a topic label, not a compressed restatement of the
  rule. Do not paraphrase the criterio into the titular — name what it is about.
- **Controlled fields only.** `materia_principal` and `tipo_criterio` take **only** values from
  `references/taxonomia-sumarios.md`. Never invent a value, never leave one empty. If none fits
  exactly, pick the closest **and** emit a `taxonomia:*` audit reason if review metadata is emitted —
  do not silently approximate.
- **Lean on `voces`, do not trust them blindly.** The batch row carries `voces` (raw thesaurus, e.g.
  `["AMPARO","CARACTER EXCEPCIONAL","REQUISITOS"]`). Use them to pick materia/instituto and to fill
  `sub_voces` (lowercased). But the rule is in `texto_oficial`: if a voz contradicts the criterio,
  the criterio wins.
- **No filler.** The titular carries the concrete instituto + eje, never "criterio jurisprudencial
  sobre el tema" or "doctrina del tribunal".
- **When in doubt, flag — do not paper over.** If the correct controlled value, the instituto, or a
  real dissent is unclear, emit a specific audit reason prefix if review metadata is emitted.

## Required Workflow

1. Read metadata: organismo, fecha, carátula, `voces`, source id, `id_fallo_vinculado`.
2. Verify source readiness: `texto_oficial` must be the real verbatim criterio. If it is empty,
   `"Fallo"`, too short, or only metadata, route to capture/backfill and do not generate.
3. Do the **Criterion pass** and **No-invented-specifics pass** over `texto_oficial`.
4. Classify with `references/taxonomia-sumarios.md` (materia + tipo_criterio) **before** writing the titular.
5. Copy `anclas.criterio` verbatim from `texto_oficial` (the core rule clause).
6. Write the **`titular`**: a nominal topic phrase, **4–16 words**, naming the instituto + eje. No verb
   asserting an outcome, no case facts, no invented specifics.
7. Write the **`resumen_itera`** — the ÍTERA plain reading (see "The ÍTERA Reading"): 1–2 sentences,
   ~15–40 words, stating the SAME rule as the criterio in plain, direct language (no citations, no
   formal scaffolding), faithful, with no invented specifics.
8. Fill `instituto`, `sub_voces` (from voces, lowercased), `tags_busqueda` (free), `sensibilidad`.
9. Produce `needs_review` + `review_reasons` only as compatibility metadata (v1: usually `false`).

## Completion Contract (editorial_completeness_v2)

A sumario is complete for the Itera own index only if it has:

- `titular` as `extracto.text`;
- `resumen_itera` populated;
- `clasificacion` with non-empty `tags_busqueda`;
- `anclas.criterio` copied verbatim from real `texto_oficial`;
- ingest traceability (`modelo` and `version_prompt`).

The official criterio remains the authoritative body shown to the user. Never replace it with
`resumen_itera`; never use `resumen_oficial="Fallo"` as source text.

## The Titular

A short, scannable **topic headline** for the feed card — it replaces the ugly uppercase carátula
(which is just voces concatenated). It is editorial navigation, not authority.

- **Nominal / topic phrase**, 4–16 words. Prefer noun phrases over full sentences.
- Names the **instituto + the eje** of the rule. No dispositive verb, no "el tribunal resolvió…".
- **No invented specifics** (no article/number/name/date absent from `texto_oficial`).
- Never mentions itself, the classification, or the review flow (see below).

Examples (criterio → titular → materia / tipo_criterio):

- *"El amparo constituye un proceso excepcional que exige… arbitrariedad o ilegalidad manifiesta…"*
  → **"Carácter excepcional de la acción de amparo"** → `constitucional` / `admisibilidad`.
- *"La consulta al CIF es una facultad privativa de la judicatura, que resulta atinada cuando la
  opinión del médico tratante no alcanza…"* → **"Consulta al Cuerpo de Investigación Forense como
  facultad del juez"** → `salud` / `probatorio`.
- *"Se configura el robo agravado cometido en poblado y en banda cuando… la intervención conjunta de
  varias personas, aun cuando solo uno haya sido identificado."* → **"Robo agravado en poblado y en
  banda con un solo coautor identificado"** → `penal` / `sustantivo`.
- *"El recurso de impugnación debe ser rechazado cuando la defensa… se limita a expresar una
  discrepancia subjetiva con la valoración probatoria."* → **"Rechazo del recurso por discrepancia
  subjetiva con la valoración probatoria"** → `procesal_penal` / `admisibilidad`.

## The ÍTERA Reading (`resumen_itera`)

The **plain reading** shown on the card **next to** the official criterio (which stays as the
authoritative reference). Where the official criterio is dense and formal, `resumen_itera` is the
**"lectura fácil"**: the same rule, grasped at a glance. The reader always has the official text
beside it, so this is a reading aid — but it must still be **faithful**.

- **1–2 sentences, ~15–40 words.** Lighter and shorter than the criterio.
- **Plain but technical (llana-técnica).** Direct, active phrasing; keep the precise legal terms
  (`amparo`, `casación`, `prisión preventiva`, `impugnabilidad objetiva`). Do **not** dumb it down —
  the audience is lawyers. Strip the heavy scaffolding: no `cf.`/fallo citations, no `(Voto de los
  Dres. …)`, no "En lo que respecta a…", "se entiende que…", "es oportuno recordar que…".
- **States the rule directly.** "El juez puede…", "El amparo solo procede cuando…", "Se configura X
  cuando…", "Corresponde rechazar el recurso cuando…". Say what the rule is and its condition/effect.
- **Faithful — same rule, no reinterpretation.** It re-expresses the criterio; it does not add,
  narrow, or broaden it. **No invented specifics** (article numbers, amounts, dates, names, outcomes
  absent from `texto_oficial`). Every claim traces to the criterio.
- **Mirror the source anonymization**; never mentions itself, its classification, or the review flow.
- **Distinct from the titular.** Titular = a nominal *label* ("Carácter excepcional de la acción de
  amparo"). `resumen_itera` = a *sentence stating the rule* ("El amparo solo procede ante…").

Examples (criterio → resumen_itera):

- *"La consulta al CIF es una facultad privativa de la judicatura, que resulta atinada cuando la
  opinión del médico tratante no alcanza para dar base científica suficiente a la sentencia a dictarse
  (cf. STJRNS4 Se. 43/24 'DÍAZ')."* → **"El juez puede convocar al Cuerpo Médico Forense cuando la
  opinión del médico tratante no alcanza para fundar científicamente la sentencia."**
- *"El amparo constituye un proceso excepcional que exige para su apertura circunstancias muy
  particulares, caracterizadas por la presencia de arbitrariedad o ilegalidad manifiesta y la
  demostración de un daño concreto y grave…"* → **"El amparo solo procede ante una arbitrariedad o
  ilegalidad manifiesta y un daño concreto y grave que exija una vía urgente."**
- *"En lo que respecta a los fundamentos expuestos, se entiende que el escrito de interposición del
  recurso extraordinario de inaplicabilidad de ley, satisface suficientemente los requisitos de
  admisibilidad formal…"* → **"El recurso de inaplicabilidad de ley se concede cuando su escrito
  plantea una crítica seria y cumple los requisitos formales de admisibilidad."**
- *"La arbitrariedad o el absurdo son la excepción que como remedio último permiten, solo en casos
  extremos, adoptar la grave determinación de descalificar una sentencia como acto jurisdiccional…"*
  → **"Solo en casos extremos de arbitrariedad o absurdo puede descalificarse una sentencia; es un
  remedio de última instancia."**

## The Criterio Anchor

There is no dispositive. `anclas.criterio` is a **verbatim** fragment of `texto_oficial` — the core
rule clause (usually the "cuando/que…" statement of the holding). It must be copied exactly (same
words, same anonymization) so the gate can match it (≥60% token overlap). Do not include the vote
attribution tail (`(Voto de los Dres. … sin disidencia)`) — anchor the rule, not the signature.

## Anonymization: Mirror the Source

Use exactly the identity treatment of the official criterio. Río Negro sumarios are already
abstracted: victims appear as roles (`la víctima`, `la víctima menor`, `el imputado`), judges are
named (`Dr. Cardella` — public, keep). Never de-anonymize, never expand initials, never invent a
name, never add a stricter layer than the source. If the source is inconsistent for the same person,
use the **most-anonymized form** consistently in `titular` and `anclas`. Anonymization is **not** a
review trigger.

## Sensitivity and Review — v1 Publishes

A sumario is an **abstract holding**, not a narration of facts, and the source already anonymizes.
The penal/juris corpus is heavy on `abuso_menores` / `violencia_sexual` **as doctrine** (e.g. "el
testimonio de la víctima menor es suficiente cuando…") — these are legal criteria, low PII risk.

- **v1 policy:** flag `sensibilidad` for chips/filters, but it does **not** force review. All publish
  (mirror-the-source), prioritizing feed coverage. The gate's `SUMARIO_SENSIBILIDAD_REVIEW` is empty,
  and `requires_review` is not an operational blocker.
- Still: never restate a sensitive holding in a way that asserts a specific person's facts as proven;
  keep the titular abstract ("suficiencia del testimonio de la víctima menor", not a named case).
- Set `needs_review: true` yourself only for a real problem: a genuine dissent in the criterio, a
  criterio you cannot classify without approximating (`taxonomia:*`), or a criterio that leaks a
  private full name the source elsewhere masks (`anonimizacion:*`).

## Never Talk About Yourself

Neither the `titular` nor the `resumen_itera` may mention itself, its classification, the review flow,
internal tokens (`needs_review`, `tier=escape`), backticks, or field names. They are editorial text
about the criterio, not about the pipeline. The gate hard-fails (`meta_texto_editorial`) any titular
or resumen_itera that references itself or leaks tokens.

## Classification First

Read `references/taxonomia-sumarios.md`. The gate validates as **closed vocabulary**:
`materia_principal` and `tipo_criterio`, plus `sensibilidad` (subset of the vocab). The fields
`instituto`, `sub_voces`, `tags_busqueda` are **free text in v1** (promoted to controlled sets after
calibration). Derive materia and tipo_criterio from the **criterio text**, cross-checked with `voces`
— not guessed from the carátula.

## Output

Return one compact JSON object (JSONL discipline for batches), keyed by the same `extracto_id`:

```json
{
  "extracto_id": 39908,
  "titular": "Carácter excepcional de la acción de amparo",
  "resumen_itera": "El amparo solo procede ante una arbitrariedad o ilegalidad manifiesta y un daño concreto y grave que exija una vía urgente y expeditiva.",
  "clasificacion": {
    "materia_principal": "constitucional",
    "tipo_criterio": "admisibilidad",
    "instituto": "amparo",
    "sub_voces": ["amparo", "caracter excepcional", "requisitos"],
    "tags_busqueda": ["amparo", "arbitrariedad manifiesta", "via excepcional"],
    "sensibilidad": []
  },
  "anclas": { "criterio": "El amparo constituye un proceso excepcional que exige para su apertura circunstancias muy particulares, caracterizadas por la presencia de arbitrariedad o ilegalidad manifiesta" },
  "needs_review": false,
  "review_reasons": []
}
```

## Declare What The Gate Will Force (output = persistence)

The historical JSON accepts `needs_review`, but v1 publishes when the gate passes. The gate forces
nothing from sensitivity, so use `review_reasons` only as audit metadata: if you set
`needs_review: true`, add a specific reason (`taxonomia:*`, `voto:*`, `anonimizacion:*`); if
`false`, leave `review_reasons` empty. Never emit the list form `"sensibilidad:['salud']"`.

## JSONL Batch Discipline

- Keep `extracto_id` exactly as it appears in `batch.jsonl`.
- One compact JSON object per line; no markdown, no pretty-print.
- `titular` within 4–16 words; `resumen_itera` within ~15–40 words; no invented digits/articles/names.
- `anclas.criterio` is verbatim from `texto_oficial`.
- Only controlled values for `materia_principal`, `tipo_criterio`, `sensibilidad`.
- Always include non-empty `clasificacion.tags_busqueda`.

## Final Check

1. The titular is a topic phrase (4–16 words), not a rewrite of the holding, with no dispositive verb.
2. The `resumen_itera` (1–2 sentences, ~15–40 words) states the SAME rule as the criterio in plain,
   direct language — no citations, no formal scaffolding, no invented specifics, faithful to the criterio.
3. No number/article/name/date in the titular or resumen_itera that is not verbatim in `texto_oficial`.
4. `anclas.criterio` is copied verbatim from the criterio (not the vote tail, not a paraphrase).
5. `materia_principal` and `tipo_criterio` are taxonomy values; nothing invented or left empty.
6. `sub_voces` reflect the real `voces`; the classification agrees with the criterio, not the carátula.
7. Anonymization mirrors the source; no private full name that the source masks elsewhere.
8. Anything genuinely unclear is flagged in `review_reasons`, not guessed.
