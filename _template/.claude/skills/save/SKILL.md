---
name: save
description: 'Guarda progreso al finalizar sesion. Actualiza docs de planificacion.'
model: sonnet
disable-model-invocation: true
---

# Guardado de Sesion

## Pasos

### 1. /check + enforcement scripts (condicional)

Hubo cambios de codigo (.ts/.tsx)?

- **SI** -> `/check` primero. Si reporta criticos, corregir antes de continuar.
- **SI** + existen `scripts/check-all.sh` -> ejecutar `bash scripts/check-all.sh` ademas. Si reporta fallos, corregir antes de continuar.
- **NO** -> saltar.

### 2. Autoevaluacion de auditorias especificas

El `/check` del paso 1 ya cubre calidad general. Evaluar ademas:

| Si en la sesion hubo...                                                                | Lanzar               |
| -------------------------------------------------------------------------------------- | -------------------- |
| API routes nuevas/modificadas, services con writes, modelos nuevos, endpoints publicos | `/security-audit`    |
| Features IA, integraciones externas (Google, Gemini), acciones de dominio sensibles    | `/operational-audit` |
| Solo docs/planning, sin codigo                                                         | ninguna              |

### 3. Errores/bugs de la sesion -> CLAUDE.md (seccion Guardrails)

Hubo bugs, ida-y-vuelta, soluciones que no funcionaron a la primera?

- **SI** -> para cada error **recurrente o no-trivial** (no un typo de una sola vez), agregar UNA linea preventiva concisa (que / por que / cuando) en la subseccion que corresponda de la seccion **Guardrails** del `CLAUDE.md`. Si ya existe una linea equivalente, reforzarla — NUNCA duplicar.
- **NO** -> saltar

> Flujo de 1 nivel: ya NO hay `GUARDRAILS.md`. El conocimiento preventivo vive inline en la seccion Guardrails del `CLAUDE.md`. Lo cubierto por el global `~/.claude/CLAUDE.md` no se recopia. No volcar errores triviales de una sola vez ni detalle verboso (eso va a `docs/`).

### 4. Actualizar FEATURE-CHANGELOG.md (si hubo features nuevas o modificadas)

Se agrego o cambio funcionalidad visible para el usuario?

- **SI** -> Agregar entradas en `.planning/FEATURE-CHANGELOG.md` bajo el modulo correspondiente: `- descripcion de la feature — Mes Ano`
- **NO** (solo fixes tecnicos, docs, infra) -> saltar

> El FEATURE-CHANGELOG es opcional. Crearlo cuando el proyecto tiene features de usuario.

### 5. Actualizar STATE.md (sobrescribir)

```markdown
## Sesion Actual

**Fecha**: [YYYY-MM-DD]
**Trabajando en**: [descripcion breve]

## Progreso por Modulo

[tabla actualizada — solo modulos con cambio, resto mantener]

## Decisiones Recientes

[ultimas ~10 — las anteriores estan en CHANGELOG]

## Bloqueadores

[ninguno / lista]

## Proxima Accion

[el usuario dicta que continuar en la proxima sesion]
```

**Max 120 lineas.** Si crece, condensar Decisiones Recientes.

### 6. CHANGELOG + Commit (en paralelo)

**Changelog** via agente:

```
Task tool:
  subagent_type: "doc-changelog"
  prompt: |
    Sesion del [fecha].
    Que se hizo: [lista]
    Archivos clave: [lista]
    Decisiones: [si las hubo]
```

**Commit**:

```bash
git status --porcelain  # sin cambios -> skip
git add -A
git commit -m "<tipo>(<scope>): <descripcion en imperativo>"
```

Tipos: feat/fix/refactor/style/test/docs/chore | Max 72 chars | Sin punto final

### 7. Confirmar al usuario

```markdown
## Sesion Guardada

**Auditorias**: [ejecutadas / ninguna]
**Guardrails (CLAUDE.md)**: [N lineas preventivas agregadas / sin cambios]
**STATE.md**: actualizado
**CHANGELOG.md**: entrada agregada
**Commit**: `<mensaje>`

Proxima sesion: [1 linea de que sigue]

Podes hacer /clear tranquilo.
```

## Notas

- STATE.md se **SOBRESCRIBE** (no acumula historial)
- CHANGELOG.md **ACUMULA** (nunca borrar entradas del activo) — si supera 400 lineas -> rotar a `archive/CHANGELOG-[fechas].md`
- La "Proxima Accion" la dicta el usuario en este momento
