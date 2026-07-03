# Taxonomía Para Extractos Jurisdiccionales (RN, instancias inferiores)

Controlled vocabulary for `fallos/jurisdiccional` extracts. The gate validates the
**structural, low-cardinality** fields against these closed sets:
`materia_principal`, `perfil`, `tipo_decision`, `alcance_decision`, `grupo_editorial`,
`sensibilidad`. The **descriptive, high-cardinality** fields (`resultado`,
`eje_argumental`, `submateria`, `tags_busqueda`) are **free text in v1** (documented
here, promoted to controlled sets after calibration) so the first batches do not fail
the gate on synonyms.

This is a **different** taxonomy from `rn-fallo-stj/references/taxonomia-stj.md`. Do not
mix. The classification field is `tipo_decision` (generic), **not** `tipo_decision_stj`.

Keep the vocabulary conservative and stable. If no exact value fits a controlled field,
pick the closest stable value, set `needs_review: true`, and add a `taxonomia:*` reason.

---

## Required (gate-validated) fields

### materia_principal

Coarse, stable matter. Derive from the ruling text (fall back to the caption when the
text is silent):

- `fiscal_tributario` — ejecución fiscal / monitoria fiscal (ARB and municipal tax executions). Biggest bucket.
- `civil_patrimonial` — private executives, ordinarios civiles, división de condominio, cobros.
- `civil_danos` — daños y perjuicios (including consumer Ley 24240).
- `laboral` — LCT reclamos, ART / accidentes de trabajo, conciliaciones laborales homologadas.
- `familia` — violencia, alimentos, divorcio, medida de protección de derechos (NNyA), autorización para viajar, régimen de comunicación, capacidad / Ley 26.657, restitución.
- `salud` — amparos de salud / cobertura / discapacidad.
- `ejecucion_penal` — condena a prisión efectiva/condicional as execution, excarcelación, libertad condicional, unificación/cómputo de pena, detenido en unidad carcelaria.
- `penal` — merits criminal decisions (condena/absolución/sobreseimiento de fondo). Rare in this corpus.
- `contencioso_administrativo` — CA merits (non-fiscal).
- `sucesiones` — sucesión ab intestato / testamentaria, declaratoria de herederos.
- `procesal` — beneficio de litigar sin gastos, oficios/exhortos, cautelares genéricas, incidentes, competencia.
- `honorarios_costas` — regulación / ejecución de honorarios as the object.

### perfil

Drives the editorial object and the length band the gate enforces. Infer from
`tipo_sentencia` + matter + text structure:

- `operativo_formulaico` — monitorias fiscales, homologadas, aclaratorias/rectificaciones, liquidaciones, honorarios-only, beneficio de litigar sin gastos, oficios/exhortos, cautelares operativas. **Length 45–120** (target 55–110). Mini, `review=false`.
- `familia_sensible` — violencia, alimentos, divorcio, protección NNyA, autorización, capacidad. **Length 75–150** (target 90–130). Cautious language + source-mirroring anonymization.
- `ejecucion_penal` — execution-penal operational rulings. **Length 65–135** (target 80–120). Cautious with conditions/health.
- `sustantivo` — definitivas laborales (Cámara del Trabajo), civil daños, contencioso-administrativo de fondo, amparo salud, apelaciones de Cámara (confirma/revoca/modifica). **Length 105–185** (target 120–170). Audit before bulk.

### tipo_decision

Generic dispositive act (closed, generous). Pick the closest; if none fits, closest +
`needs_review` + `taxonomia:*`:

- Monitoria / ejecución: `lleva_adelante_ejecucion`, `rechaza_ejecucion`, `manda_llevar_adelante_parcial`.
- Homologación: `homologa`.
- Familia: `dicta_medidas_proteccion`, `prorroga_medidas_proteccion`, `cesa_medidas_proteccion`, `fija_cuota_alimentaria`, `rechaza_alimentos`, `decreta_divorcio`, `autoriza`, `rechaza_autorizacion`, `dispone_proteccion_nnya`.
- Salud / amparo: `hace_lugar_amparo`, `rechaza_amparo`.
- Fondo civil/laboral/CA: `hace_lugar_demanda`, `rechaza_demanda`, `hace_lugar_parcial`.
- Cautelar: `hace_lugar_cautelar`, `rechaza_cautelar`.
- Penal de fondo: `condena`, `absuelve`, `sobresee`.
- Ejecución penal: `concede_excarcelacion`, `rechaza_excarcelacion`, `concede_libertad_condicional`, `rechaza_libertad_condicional`, `unifica_pena`, `resuelve_computo`, `revoca_condicionalidad`, `rechaza_habeas_corpus`, `hace_lugar_habeas_corpus`, `anula_sancion_disciplinaria`, `computa_pena`, `sustituye_pena`.
- Cámara (alzada): `confirma`, `revoca`, `modifica`, `declara_desierto`, `declara_mal_concedido`.
- Instrumental: `rectifica`, `regula_honorarios`, `aprueba_liquidacion`, `resuelve_impugnacion_liquidacion`, `ratifica_medidas`, `concede_beneficio_litigar`, `declara_abstracta`, `declara_nulidad`, `aprueba_acuerdo`, `declara_caducidad`, `declara_incompetencia`, `ordena_medida`.

### alcance_decision

Scope of the ruling (closed):

- `fondo` — resolves the merits.
- `cautelar` — precautionary / protective measure; not the merits.
- `monitorio` — monitoria / apremio structural stage.
- `homologatorio` — approves an agreement; not a merits ruling.
- `ejecucion_penal` — execution-stage decision; not a pronouncement on the offence.
- `registral` — registral/operational order inside the case.
- `procesal_cierre` — closes a route for a procedural defect / lack of critique.
- `abstracto` — moot after filing; no merits ruling.
- `nulidad_reenvio` — annuls and remands (Cámara); not a final merits ruling.
- `revision_limitada` — narrow procedural/execution review.

### grupo_editorial

Aligned to the RN feed segments (the feed excludes `ejecucion_penal` by default). Closed:

- `jurisprudencia` — substantive merits rulings (catch-all for high-value).
- `operativo_procesal` — operational/procedural triage (monitorias, cautelares operativas, liquidaciones, honorarios).
- `registro` — registral/clerical/rectification orders.
- `ejecucion_penal` — execution-penal (feed-gated).
- `familia_sensible` — family/violence/NNyA sensitive slice.
- `salud_amparo` — health amparos.

### sensibilidad

Array; empty if none. Closed vocab:

- `nnya`, `violencia_familiar`, `violencia_sexual`, `abuso_menores`, `salud`, `salud_mental`, `discapacidad`, `persona_privada_libertad`, `anonimizacion`.

**Two-tier review policy (the jurisdictional-specific decision).** Because family/violence
is ~28% of this corpus, mirroring the STJ policy (where any `nnya`/violence forces review)
would send the bulk to review and defeat the goal of a full, demo-presentable feed.

- **Tier A — cautious language + source-mirroring, `review=false` (publishable):**
  `nnya`, `violencia_familiar`, `persona_privada_libertad`, `anonimizacion`.
  Routine protective measures, alimentos, divorcio, autorización, and routine
  execution-penal publish with safeguards, not human review.
- **Tier B — forces `needs_review=true`:**
  `violencia_sexual`, `abuso_menores`, `salud`, `salud_mental`, `discapacidad`.
  Genuinely sensitive merits (sexual violence, child abuse, health/mental-health/capacity)
  always get a human glance before publication.

The gate forces review on Tier B only. Tier A relies on the skill's hard anti-patterns
(never assert violence as proven, initials/roles always, no intimate facts).

---

## Free (not gate-validated in v1) fields — document, promote after calibration

### resultado

Short normalized result. Expected shapes (free text for now):

`ejecucion_llevada_adelante`, `ejecucion_rechazada`, `acuerdo_homologado`,
`medidas_proteccion_dictadas`, `medidas_proteccion_cesadas`, `cuota_alimentaria_fijada`,
`divorcio_decretado`, `autorizacion_concedida`, `amparo_admitido`, `amparo_rechazado`,
`demanda_admitida`, `demanda_rechazada`, `condena_impuesta`, `absolucion_dispuesta`,
`excarcelacion_concedida`, `excarcelacion_denegada`, `libertad_condicional_concedida`,
`pena_unificada`, `sentencia_confirmada`, `sentencia_revocada`, `sentencia_modificada`,
`sentencia_anulada_reenvio`, `cautelar_concedida`, `cautelar_rechazada`,
`honorarios_regulados`, `liquidacion_aprobada`, `error_material_corregido`,
`accion_abstracta`, `beneficio_concedido`.

### eje_argumental

The decisive ground (free text, snake_case). Reuse where they apply
(`falta_critica_concreta`, `arbitrariedad_falta_fundamentacion`,
`cuestion_devenida_abstracta`, `urgencia_medica_acreditada`) and add jurisdictional ones
(`titulo_ejecutivo_habil`, `excepciones_no_opuestas`, `acuerdo_ajustado_a_derecho`,
`riesgo_acreditado_medida_preventiva`, `interes_superior_nino_concreto`,
`presupuestos_libertad_condicional`, `computo_pena`, `primacia_realidad`,
`nexo_causal_danos`, `base_regulatoria_honorarios`).

### submateria

1–4 word concrete topic (free text): `ejecucion_fiscal_arb`, `alimentos_menores`,
`violencia_familiar_medidas`, `divorcio_incausado`, `medida_proteccion_nnya`,
`amparo_salud_discapacidad`, `accidente_trabajo_art`, `libertad_condicional`,
`excarcelacion`, `honorarios_regulacion`, `sucesion_ab_intestato`, etc.

### tags_busqueda

5–10 stable tokens for future filters. Avoid `fallo`, `sentencia`, party names (unless
public/institutional), and long phrases.

---

## Notes

- `tipo_extracto` stays `sintesis_fallo`, `base_extracto` `fallo_completo` (the `ambito`
  axis lives on the document; no need to fork these).
- The gate profile `JURISDICCIONAL_PROFILE` in
  `api/app/jurisprudencia/rio_negro_index/extract_gate.py` must stay 1:1 with the
  gate-validated sets above. Changing a controlled value here → change it there + tests.
