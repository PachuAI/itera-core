---
name: load
description: 'Cargar contexto al iniciar sesión en un repo ITERA (después de /clear): lee .planning/STATE.md y resume el estado + próxima acción, sin leer código. Invocación manual al arrancar: /load en Claude, $load en Codex.'
model: sonnet
disable-model-invocation: true
---

# Carga de Contexto

## Pasos

1. Leer `.planning/STATE.md` (unico archivo obligatorio)
2. Presentar resumen conciso (max 15 lineas):

```markdown
## Sesion Cargada

**Ultima sesion**: [fecha] — [que se hizo en 1 linea]

**Estado modulos**: [solo si hay algo incompleto o bloqueado]

**Deuda tecnica pendiente**: [bullets de Proxima Accion del STATE.md]

---

Continuamos con esto o tenes algo nuevo para arrancar?
```

## Reglas

- Las reglas preventivas viven en la seccion Guardrails del CLAUDE.md (ya cargado como project instructions); no hay GUARDRAILS.md separado
- NO leer CHANGELOG.md
- NO leer codigo fuente
- NO asumir que quiere hacer el usuario
- PREGUNTAR antes de actuar
