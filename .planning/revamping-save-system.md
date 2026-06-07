# Revamping del sistema /save y /load

> Doc temporal de captura — sesion del 2026-04-27.
> Aca queda todo lo que descubrimos hoy + lo pendiente para retomar en la proxima.
> Cuando este implementado y empaquetado, este doc se borra o se mueve a archive/.

---

## Punto de partida

Arrancamos investigando por que `/save` y `/load` "a veces no andan". Sospecha inicial: el spec del campo `model:` en el frontmatter quedo desactualizado por los nuevos nombres internos de Sonnet (4.6, variante 1M context).

Nuestros comandos del template tenian:
```yaml
model: 'claude-sonnet-4-6'
```

Y queriamos asegurar que corran con **Sonnet comun**, NO con Opus, NO con Sonnet 1M.

---

## Lo que descubrimos

### 1. Spec actual del campo `model:` (Claude Code 2.1+)

Confirmado via docs oficiales (code.claude.com/docs/en/model-config):

- Acepta aliases cortos: `sonnet`, `opus`, `haiku` — apuntan al ultimo estandar de cada familia.
- Acepta IDs completos: `claude-sonnet-4-6`, con o sin sufijo de fecha.
- Sufijo `[1m]` activa la variante 1M context: `sonnet[1m]`, `opus[1m]`. Sin sufijo = estandar (200k).
- El alias `sonnet` se mantiene estable cuando salga 4.7 — el alias se actualiza solo.

### 2. Cambios aplicados al template (LOCKED IN hoy)

En `_template/.claude/commands/`:
- `save.md`, `load.md`, `check.md`, `security-audit.md`, `operational-audit.md` → `model: 'claude-sonnet-4-6'` reemplazado por `model: sonnet`.

Tambien propagado a `~/projects/saas/iteralex/itera-lex/.claude/commands/` (mismos 5 archivos, via sed). Pendiente propagar al resto de repos del Tier 1 + 2.

### 3. El bug real (sorpresa de la sesion)

Pero el cambio de `model:` no resolvio el problema. Al ejecutar `/load` desde una sesion en Opus[1m], salta:
```
API Error: Extra usage is required for 1M context
```
Aunque `extra-usage` este activado en la cuenta.

**Diagnostico (confirmado por research):** el frontmatter `model: sonnet` cambia la **familia** del modelo, pero el **context tier `[1m]` se hereda de la sesion padre**. Si la sesion esta en `opus[1m]`, el slash command termina invocando algo equivalente a `sonnet[1m]` y choca con el wall de billing.

- No existe sintaxis documentada para forzar tier estandar desde el frontmatter (`sonnet[200k]` NO es valido).
- Issue abierto: [anthropics/claude-code#7795](https://github.com/anthropics/claude-code/issues/7795) pide exactamente esta feature. Sin resolver.
- Workaround manual que ya hacemos: cambiar `/model` a Sonnet 4.6 antes de ejecutar.

### 4. Por que skills > slash commands para nuestro caso

El usuario tiro la idea de migrar a skills. Inicialmente la rebote ("no resuelve el problema del modelo"), pero discutiendo cerro el razonamiento:

- Si el orquestador corre en el modelo activo del usuario (sin override), no hay problema de tier.
- Skills tienen primitivas que commands no tienen: `references/` con lazy loading, descubrimiento semantico via `description`, empaquetado nativo via plugins.
- El harness de Claude Code ya **trata `/<name>` como invocacion de skill** (literal en el system prompt: *"When users reference a 'slash command' or '/<something>', they are referring to a skill"*). Anthropic esta unificando el primitive.
- Si no se necesita `model:` override, el slash command no aporta nada que el skill no tenga, y skill aporta varias cosas mas.

**Decision: migrar `/save` y `/load` a skills puros, sin slash command.**

### 5. Por que NO funciona un subagente como reemplazo total

Tambien evaluamos: que pasa si todo el `/save` lo ejecuta un subagente Sonnet?

Problema: el subagente tiene su propio context window (200k) y NO ve la conversacion del padre. `/save` necesita saber que paso en la sesion (bugs, decisiones, features visibles) — informacion que vive en la memoria de la conversacion del padre.

Pasarle al subagente toda la conversacion como prompt seria caro y desperdicia tokens.

### 6. La arquitectura final acordada

**Orquestador (skill) + Worker (subagente).** El skill es el orquestador y corre en el modelo activo del usuario (Opus o lo que sea). El worker es un subagente con `model: sonnet` que recibe un paquete estructurado y ejecuta lo mecanico.

```
.claude/
├── skills/
│   ├── save-session/
│   │   ├── SKILL.md              ← orquestador (modelo del padre)
│   │   └── references/
│   │       ├── state-template.md
│   │       ├── guardrails-escalation-rules.md
│   │       ├── changelog-format.md
│   │       └── worker-package-schema.md
│   └── load-session/
│       ├── SKILL.md              ← simple, sin worker
│       └── references/
│           └── load-output-format.md
└── agents/
    └── session-worker.md         ← model: sonnet, ejecutor mecanico
```

**Flujo `/save`:**
1. Usuario escribe `/save` → harness rutea al skill `save-session`.
2. Skill (en Opus) piensa: que paso en la sesion, que bugs, que features, decisiones, proxima accion. Redacta el contenido.
3. Skill arma un paquete estructurado y lo entrega al `session-worker` via `Task` tool con `model: sonnet`.
4. Worker ejecuta scripts, edits a STATE/GUARDRAILS/CHANGELOG, commit. Devuelve resumen breve.
5. Skill cierra con confirmacion al usuario.

**Por que cierra:**
- Cache de Opus de la sesion padre se mantiene (el orquestador es contiguo, cache hit).
- Tokens caros de I/O van al worker en Sonnet.
- Subagente recibe ~3-5k tokens estructurados, no 1M de conversacion — le sobra window.
- Cero fricción de modelo para el usuario.

---

## Lo que queda pendiente para la proxima sesion

### A. Diseno arquitectonico

1. **Definir el schema del paquete orquestador → worker.** Es la pieza load-bearing del sistema. Probable estructura:
   ```
   {
     run_checks: bool,
     state_content: string (texto completo del nuevo STATE.md),
     guardrails_candidates: [{ problema, check_preventivo, fecha }],
     feature_changelog_entry: string | null,
     commit_message: string,
     run_audits: ["security" | "operational"] | [],
   }
   ```
   El worker valida el schema antes de ejecutar.

2. **Routing de progressive disclosure dentro del skill.** SKILL.md tiene que ser corto y derivar a `references/` solo cuando hace falta. Decidir que va inline vs que va en references.

3. **Disenar `load-session`.** Probablemente queda como skill unico, sin worker (es solo lectura de STATE.md). Confirmar.

### B. Modos de `/save` — DECIDIDO (sesion #5, 2026-04-27)

Tres modos. Cada paso del pipeline activo segun esta matriz:

| Paso | Quick | Standard | Deep |
|---|---|---|---|
| `/check` (scripts mecanicos) | ❌ | ✅ | ✅ |
| STATE.md update | ✅ | ✅ | ✅ |
| GUARDRAILS analisis + posible promocion a CLAUDE.md | ❌ | ✅ | ✅ |
| CHANGELOG.md entry | ❌ | ❌ | ✅ |
| Commit | ✅ (solo STATE.md) | ✅ | ✅ |
| Audits (security / operational) | ❌ | ❌ | ✅ |

**Por que esos splits:**
- **Quick** = estas a mitad de algo, queres limpiar contexto con `/clear` y seguir. Commit acotado a STATE.md (un solo archivo entra y sale del worktree, no toca codigo en progreso).
- **Standard** = chunk logico cerrado, codigo estable, queres persistir aprendizajes y dejar el repo limpio. Skip CHANGELOG (no es feature done) y audits (caros, no cada save).
- **Deep** = feature completa o cierre de sesion grande. CHANGELOG porque hay algo que merece quedar en la historia. Audits porque vale la pena chequear antes de cerrar.

**Trigger del modo:**
- **Argumento explicito** (`/save quick`, `/save standard`, `/save deep`) → ejecuta sin preguntar. Si el usuario se tomo la molestia de tipearlo, no se pregunta.
- **Sin argumento** → heuristica decide + el skill imprime un resumen breve del razonamiento ("segun la complejidad: X archivos modificados, Y, Z → vamos con TIPO") + pide confirmacion antes de avanzar.

**Heuristica (cuando no hay argumento):**
- 0 archivos modificados, o solo docs/scratch/.planning → **quick**
- Cambios en superficie sensible (auth, env, middleware, secrets) → sugiere **deep**
- Feature visible cerrada (API route nueva + UI + test) → sugiere **deep**
- Default → **standard**

### C. Implementacion

1. Migrar el flujo actual de `/save` (saver.md) a `save-session` skill — preservando logica.
2. Crear `session-worker` agent con `model: sonnet` y tools acotadas (Read, Edit, Write, Bash, Skill).
3. Disenar `load-session` skill (simple).
4. Testear end-to-end en `itera-lex`.
5. Iterar hasta que el flujo se sienta natural.

### D. Empaquetado para distribucion publica

Cuando este validado en uso real:

1. **Hacer repo aparte** o subdirectorio dedicado dentro de `itera-claude-system`. NO contaminar el monolitico actual.
2. **Stack-agnostic core**: el flujo (STATE / GUARDRAILS / CLAUDE.md escalation / CHANGELOG / commit) aplica a cualquier proyecto. Los pedazos stack-specific (audits con vocabulario Prisma/BetterAuth) van como adapters opcionales.
3. **Plugin de Claude Code**: empaquetar como plugin instalable.
4. **README rico** explicando la filosofia, no solo el "como instalar". El "por que" es lo que diferencia el paquete.
5. **Examples** para distintos stacks: nextjs-prisma, python-fastapi, generic.

### E. Decisiones laterales tomadas hoy (no son pendientes, ya estan)

- Eliminado el folder duplicado `itera-claude-system/bambu-web-corporativa-catalogo/` (la copia activa esta en `~/projects/`, sincronizada con `master` de GitHub).
- Cambio de `model: 'claude-sonnet-4-6'` → `model: sonnet` en los 5 commands del template + propagado a itera-lex.
- Pendiente propagar el cambio del `model:` al resto de repos Tier 1 + 2 (shope-ar, linkea2, itera-estudio). Pero ojo: si vamos a migrar el sistema entero a skills, esto puede ser efimero — quizas conviene esperar a tener la version skill lista y propagar todo de una.

---

## Notas para retomar

- El usuario confirmo independientemente que slash commands estan en proceso de unificarse con skills (no verifique yo personalmente, pero el harness ya los trata como uno).
- La parte de "modos de save" (quick/standard/deep) es lo mas innovador respecto al flujo actual — vale la pena pensarla bien porque es lo que va a hacer que el sistema sea util en lugar de tedioso. Si lo validamos en uso propio antes de publicarlo, sabemos que sirve a otros.
- Test sugerido: cuando este la primera version del skill, dejar `/save` viejo en paralelo unas semanas y comparar uso real.
