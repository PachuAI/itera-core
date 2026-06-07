# Output Schema

Return this JSON shape for extract generation or audit tasks unless the user asks for another format.

```json
{
  "extracto": "string",
  "summary_source": "itera_ai",
  "needs_review": false,
  "review_reasons": [],
  "confidence": "high",
  "anchors": {
    "dispositivo": {
      "text": "string",
      "location_hint": "RESUELVE"
    },
    "planteo": {
      "text": "string",
      "location_hint": "agravios/recurso/demanda"
    },
    "fundamentos": [
      {
        "text": "string",
        "location_hint": "considerando"
      }
    ]
  },
  "extracted_facts": {
    "tribunal": null,
    "resultado": null,
    "tipo_decision": null,
    "monto_final": null,
    "porcentaje_incapacidad": null,
    "costas": null,
    "honorarios": null
  },
  "disclaimer": "Extracto generado por IA a partir del texto oficial. Puede contener errores y no sustituye la lectura del fallo."
}
```

## Field Rules

- `extracto`: publishable prose only when `needs_review` is false. Keep 120-150 words, up to 170 when justified. For formulaic monitorias, rectifications, and other purely operative rulings, 60-100 words is preferable when the dispositive data is complete.
- `summary_source`: always `itera_ai` for generated summaries.
- `needs_review`: true when automatic publication would be unsafe.
- `review_reasons`: short machine-readable Spanish strings, such as `no_dispositivo`, `monto_contradictorio`, `materia_sensible`, `honorarios_no_claros`, `admisibilidad_vs_fondo`.
- `confidence`: `high`, `medium`, or `low`.
- `anchors.dispositivo.text`: quote or close paraphrase of the dispositive result. Keep short.
- `anchors.planteo.text`: appeal, grievance, claim, incident, or petition resolved.
- `anchors.fundamentos`: decisive reasons only, not every cited doctrine.
- `extracted_facts`: normalized facts useful for UI/review. Use null when unavailable.

## Confidence

- `high`: dispositive, request, and decisive grounds are clear.
- `medium`: result is clear but a secondary item, fee, cost, interest, or sensitive phrasing needs caution.
- `low`: draft only; human review required before use.

## Needs Review Reasons

Use one or more:

- `no_dispositivo`
- `texto_incompleto`
- `anexo_no_disponible`
- `monto_contradictorio`
- `porcentaje_contradictorio`
- `honorarios_no_claros`
- `costas_no_claras`
- `materia_sensible`
- `anonimizacion_insegura`
- `admisibilidad_vs_fondo`
- `sentencia_recurrida_confusa`
- `fundamento_no_ubicado`
- `planteo_no_ubicado`
