# Guía: Claude dirige a Codex (relación entre agentes)

> SSOT del método para que un modelo de Claude (Fable/Opus/Sonnet) use a **Codex como ejecutor,
> segunda opinión o investigador** vía `codex exec`. El disparador operativo es el skill
> `~/projects/itera-core/skills/codex/` (progressive disclosure: el skill trae lo esencial,
> esta guía trae la profundidad). Validado en producción: reparación del design system de
> shope-ar, 2026-07-10 (ver memoria `metodo-ds-codex-executor` de ese proyecto).

---

## 1. Doctrina de reparto (por qué existe esto)

Dos suscripciones de $100 (Claude + Codex) = dos presupuestos de tokens. El reparto que funciona:

| Rol | Quién | Por qué |
|---|---|---|
| UX/UI, diseño, UI-Lab, primitivas, flujos de pantalla | **Claude** | Codex tiene asperezas en UX/UI; el lab y el DS siempre se diseñan con Claude |
| Planificación, specs, orquestación | **Claude** | Mejor especificando sin ambigüedad; Plan Mode nativo |
| Auditoría y verificación final | **Claude** | Evidencia real (computed styles, screenshots, gates propios); NUNCA confiar en el auto-reporte del ejecutor |
| Backend grueso, wiring, tests masivos, ejecución de specs cerrados | **Codex** | Rinde muy bien con dirección clara; es el trabajo de más volumen de tokens |
| Segunda opinión sobre planes/diffs, investigación de volumen | **Codex** | Punto de vista distinto; descarga la lectura masiva de la cuota de Claude |

**Regla de oro**: Claude nunca delega lo que no puede auditar después, y nunca da por bueno
lo que no verificó por su cuenta.

## 2. Comando base y variantes

```bash
# Ejecutor (escribe en el repo) — SIEMPRE prompt por stdin heredoc:
cat <<'SPEC' | codex exec --sandbox workspace-write -m gpt-5.6-sol -c model_reasoning_effort=medium -
<spec completo acá>
SPEC

# Segunda opinión / investigación (no escribe):
cat <<'PROMPT' | codex exec --sandbox read-only -m gpt-5.6-sol -c model_reasoning_effort=medium -
<pregunta + contexto acá>
PROMPT
```

- **Modelo y effort SIEMPRE explícitos** (`-m`, `-c model_reasoning_effort=...`): el default del
  `~/.codex/config.toml` puede ser otro modelo con effort high → quema cuota sin avisar.
  Default de trabajo: `gpt-5.6-sol` + `medium`. `high` solo para specs realmente duros;
  `low` para consultas triviales.
- **stdin heredoc con quote (`<<'SPEC'`)**: evita crear archivos de prompt y evita expansión
  de `$`/backticks. El `-` final es obligatorio para leer de stdin.
- **Runs largos (>2 min): background** (`run_in_background` del harness de Claude) y seguir
  trabajando; la notificación llega sola. Leer solo el `tail` del output, no todo.
- **Continuar una sesión**: `codex exec resume --last` (mantiene contexto de la corrida anterior).
- Codex lee solo el `AGENTS.md` del repo: no re-pegar lo que ya está ahí; referenciarlo.

## 3. Anatomía del spec (modo ejecutor)

Un spec sin ambigüedad tiene SIEMPRE estas secciones, en este orden:

1. **Misión** (1 línea) + declaración de roles: "Sos el ejecutor. Yo audito después con X evidencia."
2. **Restricciones duras** (arriba, no al final): NO commits (salvo que el usuario pida commit
   por fase — entonces dar la convención exacta de mensajes), NO tocar cambios ajenos del
   working tree, NO tocar archivos fuera de la lista, qué strings/tests exigen valores exactos.
3. **Contexto**: qué pasó, qué repo, qué carriles.
4. **Canon / SOT resumido**: los puntos de la guía de diseño/arquitectura que aplican,
   condensados. Si puede leer el SOT completo, dar el path y pedirle que lo lea.
5. **Diagnóstico con evidencia**: archivos + líneas + computed styles / traces / errores REALES.
   Nada de "parece que". Claude investiga ANTES de delegar.
6. **Cambios requeridos por archivo**: qué tocar, qué crear, qué API. Con nombres exactos.
7. **Tests y gates obligatorios**: comandos exactos (`pnpm run typecheck && lint && test:run &&
   quality:check`), y la regla "exit 1 = corregir, no excusar; no tocar baselines/allowlists".
8. **Criterios de aceptación verificables**: la lista contra la que Claude va a auditar.

Anti-patrón: spec vago tipo "mejorá los estilos del panel" → Codex inventa. El spec le quita
todos los grados de libertad de diseño y le deja los de implementación.

## 4. Auditoría post-ejecución (OBLIGATORIA, modo ejecutor)

Checklist de Claude al terminar Codex — **no confiar en su resumen**:

1. `git status` + diff completo archivo por archivo. ¿Tocó algo fuera de lo pedido?
2. Correr los gates POR CUENTA PROPIA (el sandbox de Codex produce falsos negativos: p.ej.
   `spawnSync(node)` da EPERM adentro → tests que "fallan" allá pasan afuera, y viceversa).
3. **Correr lo que Codex NO corre**: Playwright/e2e (no tiene browsers), smoke visual.
   Los asserts e2e afectados por sus cambios hay que revisarlos a mano (caso real:
   cambió placeholders y el assert quedó viejo).
4. Si es UI: verificación en browser real — computed styles + screenshots 1366/1920,
   y MIRAR las capturas con detenimiento (caso real: botones apilados pasaron una
   lectura rápida de screenshot). En design systems: barrido "todo data-slot emitido
   tiene receta CSS".
5. Verificar los criterios de aceptación uno por uno.
6. Lo que falle chico lo corrige Claude directo; lo que falle grande vuelve a Codex
   como spec de corrección (`resume --last` si el contexto ayuda).

## 5. Modos de uso

### A. Ejecutor de plan (el caso principal)
Claude diseñó (UI-Lab, primitivas, flujo) o planificó (Plan Mode) → escribe el spec §3 →
`codex exec` workspace-write → audita §4. Caso típico: **Claude hace el frontend/diseño,
Codex conecta el backend** (actions, services, schema, tests) contra las pantallas ya definidas.
Para planes multi-fase: una corrida por fase, commit por fase si el usuario lo pidió,
auditoría entre fases. Claude actualiza los docs de planning al final (Codex no).

### B. Segunda opinión
Sobre un plan de Claude, un diff, una decisión de arquitectura. `read-only`, effort medium.
Prompt: el plan/diff + "criticá: qué falta, qué riesgo hay, qué harías distinto. Sé específico,
no complaciente." El valor está en el desacuerdo: si coincide en todo, sospechar del prompt.

### C. Investigación / lectura de volumen
Barridos grandes de código, docs de librerías, comparación de APIs. `read-only`.
Pedir salida estructurada (lista de hallazgos con paths) para que Claude consuma barato.

## 6. Seguridad

- `--sandbox workspace-write` como techo para ejecución; `read-only` para consulta.
  NUNCA `--dangerously-bypass-approvals-and-sandbox` ni sandbox off.
- Codex NUNCA toca prod: ni creds `PROD_*`, ni Coolify, ni deploys, ni `git push`.
  Eso queda del lado de Claude + usuario.
- Commits: solo si el usuario los pidió explícitamente, con la convención del repo.

## 7. Economía de tokens

- El spec es una inversión: 5 min de spec de Claude ahorran una corrida entera de re-trabajo.
- No pegar archivos completos que Codex puede leer del repo; pegar solo evidencia puntual
  (líneas, computed styles) que él no puede reproducir.
- Leer del output de Codex solo `tail -30` + el diff real. El diff es la verdad, no el relato.
- Effort medium por default. La cuota de Claude se gasta en: diagnóstico, spec, auditoría.

## 8. Troubleshooting conocido

| Síntoma | Causa / fix |
|---|---|
| Tests fallan solo dentro de Codex con EPERM | Sandbox bloquea `spawnSync`/network → correrlos afuera antes de pedir fix |
| `codex models` falla | Necesita TTY; probar el modelo con un exec trivial (`Respondé solo: OK`) |
| Corrida "exitosa" pero el resultado no está | El exit 0 es del CLI, no del trabajo: auditar SIEMPRE por diff |
| Prompt con `$`/backticks roto | Usar heredoc con quote: `<<'SPEC'` |
| Se quedó a medias / contexto perdido | `codex exec resume --last` con instrucciones de continuación |

---

_Esta guía crece con el uso. Cambios de método → editarla acá; el skill `codex` solo referencia._
