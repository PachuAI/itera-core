# Taxonomia Inicial Para Extractos STJ

Use this taxonomy as a controlled starting point. Prefer these values unless the source clearly needs a new category.

## Required Classification Fields

### materia_principal

- `penal`
- `ejecucion_penal`
- `salud`
- `constitucional_institucional`
- `contencioso_administrativo_laboral`
- `civil_danos`
- `civil_patrimonial`
- `familia_nnya`
- `laboral`
- `procesal`
- `honorarios_costas`

### submateria

Concrete topic, 1-4 words:

- `abuso_sexual_menores`
- `recurso_extraordinario_federal`
- `amparo_salud_insumos`
- `amparo_salud_cuota`
- `accion_inconstitucionalidad_municipal`
- `habilitacion_instancia`
- `hurto_tentado`
- `danos_cuantificacion`
- `libertad_asistida`
- `queja_casacion`
- `admisibilidad_extraordinaria`

Add new values conservatively and keep them stable.

### tipo_proceso

- `amparo`
- `accion_inconstitucionalidad`
- `queja`
- `recurso_extraordinario_federal`
- `incidente_ejecucion`
- `contencioso_administrativo`
- `danos_y_perjuicios`
- `proceso_penal`

### tipo_decision_stj

- `rechaza_queja`
- `rechaza_sin_sustanciacion`
- `declara_inadmisible_ref`
- `hace_lugar_apelacion`
- `rechaza_apelacion`
- `declara_abstracta_accion`
- `confirma`
- `revoca`
- `modifica`
- `anula_reenvia` (alta calibración 2026-06-30: anula y reenvía con distinta integración)
- `rechaza_planteo` (alta 2026-06-30: rechaza una presentación/conflicto sin entrar al fondo)
- `admite_recusacion` (alta 2026-06-30)

### resultado

Short normalized result:

- `via_extraordinaria_cerrada`
- `amparo_admitido`
- `amparo_rechazado`
- `accion_abstracta`
- `beneficio_denegado_sin_apertura_extraordinaria`
- `condena_no_reabierta`
- `indemnizacion_no_revisada`
- `habilitacion_instancia_no_reabierta`

### alcance_decision

This field is critical for STJ work:

- `admisibilidad`: only gateway/opening of review.
- `fondo`: current decision resolves merits.
- `amparo_urgente`: resolves immediate constitutional protection.
- `abstracto`: no merits decision because the issue became moot.
- `revision_limitada`: execution or procedural review with narrow scope.
- `procesal_cierre`: closes route for procedural defects or lack of critique.
- `nulidad_reenvio`: STJ admite el recurso y anula con reenvío; NO decide el fondo (≠ `fondo`). Alta 2026-06-30, outcome frecuente en casación/inaplicabilidad de ley.
- `improcedencia_preventiva`: no hay caso concreto y actual todavía (planteo prematuro/preventivo). Distinto de `abstracto` (que es por mootness sobrevenida). Alta 2026-06-30.
- `revision_correctora`: el STJ ejerce función correctora (p.ej. nulidad por pérdida de jurisdicción, art. 207 CP). Alta 2026-06-30.

### eje_argumental

The main reason that explains the result:

- `falta_cuestion_federal`
- `defecto_acordada_4_2007`
- `agravios_reiterativos`
- `falta_critica_concreta`
- `hecho_prueba_derecho_comun`
- `urgencia_medica_acreditada`
- `via_amparo_inadecuada`
- `cuestion_devenida_abstracta`
- `revision_ejecucion_limitada`
- `informes_tecnicos_desfavorables`
- `arbitrariedad_falta_fundamentacion` (alta 2026-06-30: la sentencia recurrida es arbitraria por motivación aparente/insuficiente)
- `falta_caso_concreto_actual` (alta 2026-06-30: no hay controversia actual y concreta que habilite la jurisdicción)

### sensibilidad

Array. Use empty array if no sensitivity marker.

- `nnya`
- `violencia_sexual`
- `salud`
- `discapacidad`
- `persona_privada_libertad`
- `anonimizacion`
- `publico_institucional`

### grupo_editorial

Use one:

- `penal_sensible`
- `ejecucion_penal`
- `salud_amparo`
- `constitucional_institucional`
- `procesal_admisibilidad`
- `civil_danos`
- `laboral_publico`
- `jurisprudencia`

## Tag Rules

`tags_busqueda` should contain 5-10 stable tokens that would help filtering later.

Good tags:

- `queja`
- `recurso_extraordinario_federal`
- `amparo_salud`
- `urgencia_medica`
- `accion_inconstitucionalidad`
- `abstracto`
- `falta_critica_concreta`
- `admisibilidad`
- `libertad_asistida`
- `danos_intereses`

Avoid tags:

- `fallo`
- `stj`
- `sentencia`
- party names unless public/institutional and necessary;
- long phrases that duplicate the extract.

## RAULI Comparison Notes

When building a comparison index against RAULI, keep these dimensions:

- result first: confirm, revoke, reject, admit, declare abstract, inadmissible;
- procedural object: appeal, queja, REF, action, incident;
- scope: admissibility vs merits;
- decisive ground;
- concrete practical effect;
- sensitive-domain marker.

RAULI-like extract style is useful, but Itera should preserve stronger internal metadata than RAULI exposes publicly.
