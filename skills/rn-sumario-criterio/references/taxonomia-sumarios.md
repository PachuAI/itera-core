# Taxonomía — Sumarios Río Negro (`sintesis_criterio`)

> **SSOT compartida con el gate.** Estos vocabularios deben estar **1:1** con los frozensets de
> `SUMARIO_PROFILE` en `itera-lex-tools/api/app/jurisprudencia/rio_negro_index/extract_gate.py`
> (`SUMARIO_MATERIA_VOCAB`, `SUMARIO_TIPO_CRITERIO_VOCAB`, `SUMARIO_SENSIBILIDAD_VOCAB`) y con los
> tests en `tests/test_rio_negro_extract_gate.py`. Cambiar un valor acá = cambiarlo en el gate + test.

El objeto es un **titular editorial + clasificación** sobre un headnote doctrinario. NO hay
dispositivo, resultado ni perfil (a diferencia de fallos). Ámbito (STJ / jurisdiccional) es eje
menor: el mismo vocabulario sirve para ambos.

## Campos controlados (el gate los valida como vocabulario cerrado)

### `materia_principal` (uno, obligatorio)

Materia gruesa del criterio, derivada del **texto** (cruzada con `voces`), no de la carátula.

| valor | uso |
| --- | --- |
| `penal` | derecho penal de fondo (tipicidad, autoría, agravantes, pena) |
| `procesal_penal` | proceso penal: impugnación, recursos, prueba en el proceso, nulidades |
| `ejecucion_penal` | ejecución de la pena, libertad condicional, cómputo, unificación |
| `civil` | civil general (obligaciones, contratos, familia patrimonial no-daños) |
| `civil_danos` | responsabilidad civil, daños y perjuicios |
| `comercial` | societario, concursal, comercial |
| `laboral` | derecho del trabajo y seguridad social |
| `contencioso_administrativo` | contencioso administrativo, empleo público, tributario contencioso |
| `constitucional` | amparo, control de constitucionalidad, garantías, derechos fundamentales |
| `familia` | familia, violencia, alimentos, NNyA, capacidad |
| `salud` | derecho a la salud, cobertura, prestaciones, amparo de salud |
| `tributario_fiscal` | ejecución fiscal, tributario sustantivo |
| `sucesiones` | sucesorio, declaratoria de herederos |
| `administrativo` | administrativo sustantivo (no contencioso) |
| `procesal` | procesal civil/general no penal (competencia, recursos, costas procesales) |
| `honorarios_costas` | regulación de honorarios y costas como materia principal del criterio |

### `tipo_criterio` (uno, obligatorio) — el eje nuevo que aporta ÍTERA

Función doctrinaria del headnote: **qué tipo de regla** enuncia. Es lo que las `voces` crudas no dan.

| valor | qué regla enuncia | ejemplo de criterio |
| --- | --- | --- |
| `sustantivo` | regla de derecho de fondo (elementos de un tipo, estándar de responsabilidad) | "se configura el robo agravado cuando…" |
| `procesal` | regla de procedimiento (cargas, plazos, formas, competencia funcional) | "el contraexamen es el medio idóneo para cuestionar la pericia…" |
| `admisibilidad` | admisibilidad/impugnabilidad de un recurso o queja | "corresponde rechazar la queja cuando… no existe impugnabilidad objetiva" |
| `probatorio` | estándar de valoración o suficiencia de la prueba | "la prueba indiciaria resulta suficiente cuando…" |
| `cautelar` | estándar de medidas cautelares/protectorias | "procede la medida de protección cuando…" |
| `competencia` | reglas de competencia/jurisdicción | "corresponde la competencia del juez del centro de vida…" |
| `interpretacion_normativa` | interpretación de una norma/instituto (doctrina interpretativa) | "el art. X debe interpretarse en el sentido de…" |

Si dudás entre dos (p. ej. `procesal` vs `admisibilidad`, `probatorio` vs `procesal`): elegí el más
específico al **núcleo** del criterio. Si ninguno encaja, el más cercano **+** `needs_review`
(`taxonomia:tipo_criterio`).

### `sensibilidad` (lista, puede ser vacía)

Marca dominios protegidos para chips/filtros. **v1: NO fuerza revisión** (los sumarios son holdings
abstractos ya anonimizados por la fuente → publican todos, mirror-the-source).

`nnya` · `violencia_familiar` · `violencia_sexual` · `abuso_menores` · `salud` · `salud_mental` ·
`discapacidad` · `persona_privada_libertad` · `anonimizacion`

Regla: marcá lo que el criterio realmente toca, sin narrar hechos sensibles como probados. Ninguna de
estas fuerza `needs_review` en v1 (el gate `SUMARIO_SENSIBILIDAD_REVIEW` está vacío).

## Campos libres en v1 (documentados, NO gateados)

Se promueven a vocabulario cerrado tras calibrar sobre el corpus real.

- **`instituto`** — el instituto jurídico concreto en minúsculas: `amparo`, `robo agravado`,
  `prisión preventiva`, `prueba pericial`, `cuota alimentaria`, `queja`, `desobediencia judicial`…
- **`sub_voces`** — las `voces` oficiales normalizadas a minúsculas (sin cambiar su contenido); es el
  puente entre el tesauro crudo y los filtros. Ej.: `["amparo","caracter excepcional","requisitos"]`.
- **`tags_busqueda`** — 3–8 tokens estables de búsqueda, en minúsculas, sin duplicar el titular ni
  incluir `sumario`/`stj`/`fallo`/nombres de partes. Ej.: `["cif","discrecionalidad judicial","prueba pericial"]`.

## Titular (no es taxonomía, pero se valida junto)

Frase nominal de tópico, **4–16 palabras**, sin verbo dispositivo, sin cifra/artículo/nombre/fecha que
no esté verbatim en `texto_oficial`. Ver `SKILL.md` → "The Titular".

## Ancla

`anclas.criterio` = fragmento **verbatim** de `texto_oficial` (la cláusula-regla del holding), sin la
cola de atribución de voto. El gate exige ≥60% de solape de tokens (`criterio_anclado`).
