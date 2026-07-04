# Perfiles Por Materia — Fallos Jurisdiccionales RN

Harvested and RN-scoped from `extractos-jurisprudenciales-itera/references/rules.md`
(itself derived from an Itera Lex audit of RAULI AI extracts: 360 classified summaries,
8.510 observed, 40 full-text audits). Each block maps to a `perfil` and gives the length,
the safe formulations and what to omit. When in doubt about tone, prefer triage over doctrine.

---

## operativo_formulaico

Value is procedural triage, not doctrine. 55–110 words. Avoid "el tribunal sostuvo/analizó/
reafirmó" unless there is a real holding. Do not make it read like precedent.

### Fiscal monitoria / ejecución fiscal (biggest bucket: ARB, municipal)

Open with the monitoria result: execution carried forward or rejected. Include capital,
interests/costs, fixed fees and provisional budget **only when in the dispositive section**.
Mention the notice + exception period as practical effect. Omit boilerplate (payment channels,
digital notice mechanics, generic embargo list).

```text
La [unidad/juzgado] dictó sentencia monitoria en una ejecución fiscal de [actor]. Ordenó llevar
adelante la ejecución contra [demandado] hasta el pago del capital de $X, con más intereses y
costas. Reguló honorarios en $Y y dispuso notificar al ejecutado el plazo para oponer
excepciones.
```

If the amounts in the boleta/certificado and the dispositive differ, use the dispositive amount
and set `needs_review: true` if unexplained.

### Homologación

`homologó el acuerdo` as the first operative verb. Do not imply the court decided the underlying
claim. Include total amount, installments, default consequence, costs, fees and tax/contribution
orders only if stated. For labor settlements, mention "justa composición" only if the ruling uses
it as the basis. 70–110 words.

### Material rectification / aclaratoria

50–80 words. Open with the correction and the affected prior decision. Quote the corrected item
only as needed. Do not make it sound like a merits decision. `tipo_decision=rectifica`,
`grupo_editorial=registro`.

### Liquidations / fees-only / beneficio de litigar sin gastos / oficios

State the operative act (approved liquidation, regulated fees, granted benefit) and the concrete
figure/effect. Stop. `grupo_editorial=operativo_procesal` (or `registro` for clerical).

### Menor cuantía monitorias

80–120 words. Open with the monitoria result. One phrase for the debt origin. Include amount,
payment term, costs, fees. Omit bank accounts, emails, operational payment instructions.

### Cautelares operativas

Separate granted, denied and deferred measures. State the immediate procedural effect. Do not
present a cautelar as deciding the merits (`alcance_decision=cautelar`).

### Sucesiones (declaratoria de herederos)

55–90 words. The dispositive is a **formal** `RESUELVO: Declarar que por fallecimiento de <causante>
le sucederán <herederos>…` — treat it as a normal header, **never** `sin_resuelve_formal`.
`tipo_decision=declara_herederos`, `alcance_decision=fondo`, `grupo_editorial=registro`. Names of
causante/herederos are mirrored (successions come named). Open with the declaratoria; state who is
declared heir and the reserved rights of the cónyuge supérstite if the dispositive fixes them. Omit
edicts, registry mechanics and testamentary-report boilerplate.

---

## familia_sensible

90–130 words. Cautious language, source-mirroring anonymization (initials + generic roles),
concrete measures only. See the hard anti-patterns in `SKILL.md`.

### Violencia / medidas de protección

Use "denuncia", "situación de riesgo", "medidas preventivas/cautelares". Do not state that
violence occurred unless expressly proven. List only the operative measures: exclusión del hogar,
perímetro (metros), prohibición de acercamiento/contacto, rondines policiales, restitución de
efectos, plazo (días), derivación a la unidad de familia. Include duration when fixed. Omit
police-notification formulas unless they are the core order. `sensibilidad` includes
`violencia_familiar` (Tier A) — escalate to `violencia_sexual`/`abuso_menores` (Tier B) only when
the text is about sexual violence or child abuse.

### Alimentos / cuota alimentaria

State whether the demand was granted and the amount/percentage and payment mechanics if
dispositive (retención directa, plazo). NNyA present → `sensibilidad: ["nnya", "anonimizacion"]`
(Tier A, publishable). Do not narrate the family conflict.

**Alimentos + medidas protectorias in the same ruling:** if the new/express dispositive is the
fixing of the cuota and the protective measures come only ratified, lead with alimentos
(`tipo_decision=fija_cuota_alimentaria`) and keep the ratified measures in the extract as the
second order. Anchor the `DISPONGO la fijación de alimentos…` clause; do not anchor a secondary
`ratifíquese`/`líbrese`.

### Divorcio / autorización para viajar / régimen de comunicación

Operative result + concrete effect. `decreta_divorcio` / `autoriza` / `rechaza_autorizacion`.
Keep initials. Usually Tier A.

### Medida de protección de derechos (NNyA)

If the ruling only dictates precautionary protection, `alcance_decision=cautelar`, Tier A. If it
decides guarda/adoptabilidad/on the merits, set `needs_review: true` and describe cautiously.

### Capacidad / salud mental (Ley 26.657)

Sensitive. `sensibilidad` includes `salud_mental`/`discapacidad` (Tier B → review). Say the
concrete order (internación, revisión, restricción a la capacidad) without diagnosis detail.

---

## ejecucion_penal

80–120 words. Current procedural result first. Care with conditions/health. Keep initials;
mirror the source if the person is named.

- Excarcelación / libertad condicional: `concede_*` / `rechaza_*`; state the ground at decisive
  level (presupuestos, informes, cómputo). Routine grants publish (Tier A: `persona_privada_libertad`).
- Habeas corpus / condiciones de detención: separate the inmate/defense allegation from what the
  prison/medical reports established; if it became abstract, say what changed. If health/conditions
  are the object → `sensibilidad` includes `salud` (Tier B → review).
- Unificación / cómputo de pena: instrumental; state the resulting pena/fecha.
- Do not turn an execution-stage decision into a pronouncement on the offence
  (`alcance_decision=ejecucion_penal`).

---

## sustantivo

120–170 words. The STJ-like substantive object, single instance. Separate allegation, proof and
result; anchor every reinforcement.

### Laboral / ART

Extract final disability % and final amount only from the dispositive/recomposition. Separate
physical vs psychological disability, weighting factors, excluded items. For DNU 669/2019,
`Trotelli`, interest, capitalization or anatocismo, say the concrete change. If congruence is
central, name the pathology/item not claimed.

### Civil daños / honorarios

Separate liability, quantification, interest, costs and fees. Unproven exculpatory defense →
"no se acreditó", never "era falso". Distinguish first-instance, appeal and both-instance costs.
If fees are the object of the appeal, open with fees (base, %, JUS, stages); do not treat the
legal minimum or the claim as the result.

### Contencioso administrativo (de fondo) / amparo salud

Amparo salud/discapacidad → say whether there was manifest arbitrariness/illegality and whether
urgency was proven; `sensibilidad` includes `salud`/`discapacidad` (Tier B → review). For CA
merits, state the concrete administrative act reviewed and the outcome.

### Cámara appeals (confirma / modifica / revoca)

Name who appealed; derive the result from the effect on the original claim (see `SKILL.md`).
Structure the extract in five beats: (1) **quién apeló**, (2) **qué se revoca/modifica**, (3)
**qué se confirma**, (4) **qué queda para ejecución**, (5) **costas/honorarios** if they are in the
dispositive. This is the shape for patrimonial/familia-patrimonial appeals (liquidación de sociedad
conyugal, daños de alzada).

- Confirmatoria: explain why the grievance does not defeat the lower decision; "mantiene/confirma".
- Modificatoria: open with the concrete delta; separate what changes from what stands; fees/
  interest/costs as their own delta.
- Revocatoria: say what is revoked and what happens next; if it only opens a procedural path, do
  not present it as a merits ruling; if it annuls and remands → `alcance_decision=nulidad_reenvio`.

---

## Common omissions (all perfiles)

Headers, court integration, secretaries, signatures, protocol formulas; long citations and
precedent chains; full procedural history unless it explains the result; non-decisive alternative
calculations; evidence transcripts; accessory amounts not fixed/changed by the dispositive section.

## Safe formulations

Use: "no se acreditó suficientemente"; "el tribunal consideró que el agravio no desvirtuaba";
"la decisión no trató el fondo"; "se mantuvo la condena dispuesta en primera instancia"; "ordenó
llevar adelante la ejecución"; "homologó el acuerdo"; "dispuso medidas preventivas".

Avoid: "era falso" unless expressly declared; "se descartó la violencia" when the issue is
insufficient proof; "la Cámara condenó" when it only confirmed; "costas del proceso" when only
one instance's costs were fixed; "regla general" for a case-specific ruling.
