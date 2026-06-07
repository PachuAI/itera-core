# Detailed Rules

These rules come from an Itera Lex audit of RAULI AI extracts: 360 classified summaries, 8.510 observed documents with `extractoIA`, and 40 full-text manual audits.

## By Decision Type

### Batch Ordering / Feed Coverage

- For public feeds, fill extractos from newest to oldest using the same ordering as the endpoint/UI.
- For PJ Rio Negro indexed feeds, treat `jurisprudencia`, `operativo_procesal`, `registro`, and optional `ejecucion_penal` as separate visible segments.
- Do not report a page as complete unless every visible result in that segment has `manual`, `generado`, or `revisado`.
- If the UI still shows pending after DB insertion, check frontend/server cache before regenerating text.
- Keep an audit-friendly count after each batch: generated/manual/pending and the newest pending date.
- Persist model metadata literally. If the extract was produced by `gpt-5.4-mini`, do not record a stronger model name.
- Use prompt/version names that match the real work class. Prefer `operativo_formulaico_mini` for mixed operational batches; reserve `penal_operativo_mini` for strictly criminal-execution operational batches.

### Model Tiering / Delegation

Mini models are acceptable for bounded operational extractos after spot-checking:

- fiscal monitorias and tax executions with clear dispositive amounts;
- simple executive monitorias with no substantive defense resolved;
- homologations where the only decision is approval of an agreement;
- material rectifications, fee-only orders, registry/protocol orders;
- routine criminal execution records, detention-condition hearings, abstract habeas corpus, remissions, or communications.

Escalate to a stronger model or mark `needs_review: true` when:

- the decision resolves a real appeal, revocation, modification, admissibility, or merits issue;
- the ruling involves NNyA/tutela, violence/family risk, health, disability, ART calculations, civil damages, or a sensitive factual matrix;
- the extract must separate allegation, risk report, proof, and practical measure with little room for error;
- the operative result includes several competing amounts, percentages, interest formulas, or partially granted/rejected items;
- the official text is based on audio/video minutes, annexes, or truncated snippets.

For mini-generated batches, audit at least a small sample against the official text for first verb, dispositive amounts, costs/fees, sensitive wording, and model metadata.

### Confirmatory Decisions

- Explain why the grievance does not defeat the lower decision.
- Distinguish "the appellate court confirms a judgment that ordered payment" from "the appellate court orders payment".
- If the confirmation preserves a measure, amount, or disability percentage, use "mantiene" or "confirma".

### Modifying Decisions

- Open with the concrete delta.
- Separate what changes from what remains confirmed.
- Include modified fees, interest, costs, or procedural effects as their own deltas.
- Do not hide an arancelario change behind the substantive dispute.

### Revoking Decisions

- Say what is revoked and what happens next.
- If revocation only opens a procedural path, do not present it as a merits ruling.
- For fees, final numbers must come only from the dispositive section.

### Interlocutory Decisions

- Use "resolución", "auto", "providencia", or "decisión"; avoid "sentencia" unless the text uses it.
- Explain the immediate procedural effect.
- For injunctions/cautelares, separate granted, denied, and deferred measures.
- If the ruling is only operational or administrative inside the case, treat the extract as a practical index entry. The useful value is fast triage, not doctrine.

### TSJ, Quejas, And Extraordinary Appeals

- First decide whether the court resolved admissibility or merits.
- Separate appealed decision, recursory grievance, and current decision.
- If merits were not reached, say so explicitly.
- Name the real procedural piece: queja, recurso extraordinario, RIL, RNE, providencia, recurso mal concedido.
- In cassation with recomposition, include the recomposed result, amount, and costs if present.

## By Matter

### Laboral / ART

- Extract final disability percentage and final amount only from the dispositive section or recomposition.
- Separate physical disability, psychological disability, weighing factors, and excluded items.
- For DNU 669/2019, `Trotelli`, interest, capitalization, or anatocismo, say the concrete change: rate, period, capitalization, unconstitutionality, or removal of anatocismo.
- If congruence is central, name the pathology or item that was not claimed.
- If the grievance is rejected because it does not match the lower decision, state that.

### Civil Damages / Fees

- Separate liability, quantification, interest, costs, and fees.
- For an unproven exculpatory defense, say "no se acreditó"; do not say "era falso" unless the decision expressly declares falsity.
- If fees or interest change, include them as their own delta.
- Distinguish first-instance costs, appeal costs, and both-instance costs.
- In prescription or gender-violence damages cases, formulate the rule as case-specific.

### Family / NNyA / Violence / Health

- Preserve anonymity and initials.
- Distinguish denunciation, risk, indicators, and reports from proven fact.
- Do not state merits if the decision is precautionary or procedural.
- Do not use "interés superior" as an empty formula; say what concrete consequence it protects.
- In quejas, separate opening the recursory path from deciding the protected measure.
- Treat tutela, guardianship, parental responsibility, and NNyA precautionary orders as sensitive. Do not delegate them unattended to a mini model unless the task explicitly allows review; otherwise escalate or set `needs_review: true`.

### Fees / JUS

- If fees are the object of the appeal, open with fees.
- Identify base, percentage, JUS, stages, or distribution when fixed by the dispositive section.
- Do not treat the legal minimum or requested amount as the result.
- If grievance and dispositive section conflict, set `needs_review: true`.

### Fiscal Monitorias / Tax Executions

- Prefer a compact, structured extract; do not force a long narrative.
- Open with the monitoria result: the execution is carried forward or rejected.
- Include capital, interests/costs, fixed fees, provisional budget, and embargo limit only when they are in the dispositive section.
- If fees or a provisional interests/costs budget are fixed in the dispositive section, include them unless doing so would obscure the main operative result. For RAULI-like feed quality, capital + provisional budget + fees is usually the useful triage set.
- Mention the notice and exception period if it is part of the practical effect.
- Omit boilerplate about payment methods, registration, digital notice mechanics, and generic procedural rules.
- If the amount in the claim, certificate, and dispositive section differ, use the dispositive amount and set `needs_review: true` if the discrepancy is not explained.

Recommended pattern:

```text
La [unidad/juzgado] dictó sentencia monitoria en una ejecución fiscal de [actor]. Ordenó llevar adelante la ejecución contra [demandado] hasta el pago del capital de $X, con más intereses y costas. Reguló honorarios en $Y y fijó provisoriamente $Z para intereses y costas, sujeto a liquidación definitiva. También ordenó notificar al ejecutado y hacerle saber el plazo para oponer excepciones.
```

Do not repeat every possible embargo channel. If an embargo limit is important, add one short sentence: `Previó embargo hasta $X si la actora lo solicita`.

### Formulaic Operational Rulings

Use this profile for rulings whose value is procedural triage rather than legal doctrine: routine monitorias, execution-fee orders, simple payment intimations, registry instructions, clerical orders with a dispositive effect, and homologation-adjacent operational decisions.

- Keep 55-95 words unless the dispositive section fixes several independent obligations.
- Open with the procedural act: ordered execution, approved liquidation, intimated payment, corrected record, registered decision, or homologated arrangement.
- Include only operative data that helps a user decide whether to open the official text: amount, obligated party, payment term, exception period, embargo limit, costs, fees, and whether the order is provisional or definitive.
- If the dispositive section fixes fees or a provisional amount, prefer including the figure.
- Avoid "el tribunal sostuvo", "analizó", "reafirmó", or "consideró" unless there is an actual argumentative holding.
- Do not overvalue the item. A routine order may be relevant because it affects a party or amount, but it should not read like a doctrinal precedent.
- If no amount, deadline, or concrete obligation is fixed, say the procedural effect plainly and stop.

Recommended pattern:

```text
El [juzgado/organismo] [ordenó/aprobó/intimó/corrigió] [acto procesal] en el expediente [materia]. La decisión fijó [monto/obligación/plazo] y dispuso [notificación, excepciones, costas u honorarios]. La resolución tuvo alcance operativo y no trató el fondo del conflicto.
```

### Menor Cuantia Monitorias

- Open with "hizo lugar a la demanda de menor cuantía" or the exact monitoria result.
- Include what generated the debt or claim only in one phrase.
- If the defendant did not attend the hearing, say how that affected the proof only if the ruling relied on it.
- Include amount, payment term, costs, and fees.
- Omit bank account numbers, emails, and operational payment instructions.

### Habeas Corpus / Criminal Execution

- Open with the current procedural result: granted, rejected, or declared abstract.
- Identify the specific detention condition or medical issue raised, without expanding it into a general prison-conditions finding.
- Separate allegations by the inmate/defense/family from what the prison or medical reports established.
- When the object is satisfied during the proceeding, say what changed and why the court considered the action abstract.
- Preserve initials and avoid unnecessary references to conviction details unless they explain jurisdiction or urgency.

For abstractness, use this sequence: claim/condition raised -> report or remedial action -> court declares abstract. Do not turn the remedial action into a general finding that detention conditions are adequate.

### Violence / Protective Measures

- Use cautious language: "denuncia", "situación de riesgo", "medidas preventivas" or "cautelares".
- Do not state that violence occurred unless the decision expressly treats it as proven.
- List only the measures that define the practical effect: exclusion, perimeter, no contact, police rounds, restitution/removal of belongings, referral to family court.
- Include duration when fixed. Omit police notification formulas unless they are the core order.
- If the ruling is precautionary, do not describe it as deciding the merits.
- Avoid intimate factual detail when initials, locality, family ties, workplace, or health data could identify the people involved. Prefer "a partir de la denuncia" or "segun el informe de riesgo".

### Health Amparos

- Identify the requested treatment, medication, coverage, or benefit at a useful level of specificity.
- If the claim became abstract because the benefit was supplied, state that and explain costs only if the court decided them.
- When costs are imposed despite abstractness, include the concrete reason: delay, lack of timely answer, or litigation-causing conduct.
- Preserve initials and avoid unnecessary diagnosis details beyond what explains urgency and the benefit ordered.

### Labor Injunctions / Cautelares

- Make clear that the court resolved a precautionary request, not the merits of the labor credits.
- Identify the protected credit or interest, the affected funds/assets, and the entities ordered to retain, immobilize, report, or deposit.
- Include the urgency rationale only at the decisive level: alimentary nature, risk of frustration, closure/dismantling, lack of other realizable assets.
- Mention countersecurity only if the court accepted, rejected, or conditioned the measure on it.

### Material Rectifications / Succession

- Prefer 50-80 words when the ruling only corrects a name, date, or clerical point.
- Open with the correction and the affected prior decision.
- Quote the corrected item only as needed to avoid ambiguity.
- Omit the procedural history unless the correction changes a substantive effect.

### Homologations

- Use "homologó el acuerdo" as the first operative verb.
- Do not imply the court decided the underlying claim on the merits.
- Include total settlement amount, installments, default consequences, costs, fees, and tax/contribution orders only if stated.
- For labor settlements, mention "justa composición" only if the ruling uses it as the basis for homologation.
- If the only public value is that an agreement was approved, use a short operational extract. Do not add background facts from the original dispute unless the homologated terms need context.

## Common Omissions

Omit:

- headers, court integrations, secretaries, signatures, protocol formulas;
- long citations and precedent chains;
- full procedural history unless it explains the result;
- nondecisive alternative calculations;
- evidence transcripts;
- accessory amounts not fixed or changed by the dispositive section.

## Safe Formulations

Use:

- "no se acreditó suficientemente";
- "el tribunal consideró que el agravio no desvirtuaba";
- "se tuvo por habilitada la instancia en estas circunstancias";
- "la decisión no trató el fondo";
- "se mantuvo la condena dispuesta en primera instancia".

Avoid:

- "era falso" unless expressly declared;
- "se descartó la violencia" when the issue is insufficient proof for a measure;
- "la Cámara condenó" when it only confirmed a lower condemnation;
- "costas del proceso" when only appeal costs were fixed;
- "regla general" language for a case-specific prescription, interest, or admissibility ruling.
