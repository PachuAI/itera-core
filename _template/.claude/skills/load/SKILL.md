---
name: load
description: 'Carga contexto al iniciar sesion. Ejecutar despues de /clear.'
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

- Las reglas preventivas ya vienen cargadas en las project instructions del CLAUDE.md (seccion Guardrails) — NO leerlas aparte (ya no hay `GUARDRAILS.md`)
- NO leer CHANGELOG.md
- NO leer codigo fuente
- NO asumir que quiere hacer el usuario
- PREGUNTAR antes de actuar
