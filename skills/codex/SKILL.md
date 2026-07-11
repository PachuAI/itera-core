---
name: codex
description: Usar a Codex (codex exec) como ejecutor, segunda opinión o investigador bajo la dirección de Claude, para repartir cuota entre las dos suscripciones. Tres modos según el pedido del usuario que acompaña al skill: (A) EJECUTOR — Claude ya diseñó/planificó (UI-Lab, primitivas, design system, Plan Mode) y Codex implementa el grueso (backend, wiring, actions/services/schema, tests masivos, specs cerrados) bajo un spec sin ambigüedad, con auditoría posterior obligatoria de Claude; caso típico "Claude hizo el frontend, Codex conecta el backend". (B) SEGUNDA OPINIÓN — criticar un plan, diff o decisión de arquitectura de Claude, en sandbox read-only. (C) INVESTIGACIÓN — descargar lectura de volumen (barridos de código, docs, comparación de APIs) en read-only con salida estructurada. Usar cuando el usuario diga "/codex", "consultá con codex", "que codex ejecute/implemente", "dirigí a codex", "segunda opinión de codex", "delegale el backend a codex", "que codex investigue", "ejecutá el plan con codex", "codex exec". NO usar para diseño UX/UI ni para tocar prod/deploys — eso queda en Claude.
---

# Codex bajo dirección de Claude

**Guía madre** (profundidad, plantillas, doctrina de reparto): `~/projects/itera-core/guides/guia-claude-dirige-codex.md` — leerla si el caso se sale de lo cubierto acá.

**Regla de oro**: Claude nunca delega lo que no puede auditar después, y nunca da por bueno lo que no verificó por su cuenta. El diff es la verdad; el resumen de Codex es solo un relato.

## Reparto

- **Claude**: UX/UI, diseño, UI-Lab/primitivas, planificación, specs, auditoría, prod/deploys, docs de planning.
- **Codex**: backend grueso, wiring contra pantallas ya diseñadas, tests masivos, ejecución de specs cerrados, crítica de planes, investigación de volumen.

## Comando

```bash
# Ejecutor (escribe en el repo):
cat <<'SPEC' | codex exec --sandbox workspace-write -m gpt-5.6-sol -c model_reasoning_effort=medium -
<spec>
SPEC

# Segunda opinión / investigación (no escribe):
cat <<'PROMPT' | codex exec --sandbox read-only -m gpt-5.6-sol -c model_reasoning_effort=medium -
<pregunta + contexto>
PROMPT
```

- `-m` y `-c model_reasoning_effort=` SIEMPRE explícitos (el default del config puede ser otro modelo con effort high). Default: `gpt-5.6-sol` + `medium`; `high` solo specs duros; `low` consultas triviales.
- Heredoc con quote (`<<'SPEC'`) — nunca prompt inline con `$`/backticks. El `-` final lee stdin.
- Corridas >2 min: lanzar en background y seguir trabajando; leer solo `tail -30` del output al terminar.
- Continuación de una corrida: `codex exec resume --last`.
- Codex lee el `AGENTS.md` del repo solo: referenciar, no re-pegar.

## Modo EJECUTOR — spec obligatorio (en este orden)

1. **Misión** (1 línea) + roles: "Sos el ejecutor. Yo audito después con <evidencia>."
2. **Restricciones duras arriba**: NO commits (salvo pedido explícito del usuario → dar convención exacta), NO tocar cambios ajenos del working tree, NO salir de la lista de archivos, qué tests/strings exigen valores exactos.
3. **Contexto** + **canon/SOT resumido** (y path al SOT completo para que lo lea).
4. **Diagnóstico con evidencia real** (archivos:líneas, computed styles, traces) — Claude investiga ANTES de delegar; nada de "parece que".
5. **Cambios requeridos por archivo**, con nombres exactos de APIs/props/tokens.
6. **Gates obligatorios** con comandos exactos + "exit 1 = corregir, no excusar; no tocar baselines/allowlists".
7. **Criterios de aceptación verificables** (la lista contra la que Claude audita).

Planes multi-fase: una corrida por fase, commit por fase solo si el usuario lo pidió, auditoría entre fases. Los docs de planning los actualiza Claude al final.

## Auditoría post-ejecución (OBLIGATORIA)

1. Diff completo archivo por archivo — ¿tocó algo fuera de lo pedido?
2. Gates corridos POR CLAUDE (el sandbox de Codex da falsos negativos: `spawnSync` → EPERM).
3. Correr lo que Codex NO puede: **Playwright/e2e** y smoke visual; revisar a mano los asserts e2e afectados por sus cambios.
4. Si es UI: browser real — computed styles + screenshots 1366/1920, MIRADOS con detenimiento. En design systems: barrido "todo `data-slot` emitido tiene receta CSS".
5. Criterios de aceptación uno por uno.
6. Falla chica → la corrige Claude directo; falla grande → spec de corrección a Codex (`resume --last`).

## Modo SEGUNDA OPINIÓN

`read-only`. Prompt = plan/diff + "criticá: qué falta, qué riesgo, qué harías distinto. Específico, no complaciente." El valor está en el desacuerdo: si coincide en todo, sospechar del prompt.

## Modo INVESTIGACIÓN

`read-only`. Pedir salida estructurada (hallazgos con paths) para consumo barato de Claude.

## Seguridad

- Techo: `--sandbox workspace-write`. NUNCA bypass de sandbox/approvals.
- Codex NUNCA toca prod: ni `PROD_*`, ni Coolify, ni deploys, ni `git push`.

## Troubleshooting rápido

| Síntoma | Fix |
|---|---|
| Tests EPERM solo dentro de Codex | Sandbox: correrlos afuera antes de pedir fix |
| Exit 0 pero el trabajo no está | Exit 0 es del CLI: auditar por diff, siempre |
| Modelo dudoso | Probar con exec trivial: `Respondé solo: OK` |
| Quedó a medias | `codex exec resume --last` con instrucciones |
