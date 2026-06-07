# Estado Actual - itera-claude-system

**Ultima actualizacion**: 2026-06-04
**Sesion**: infra docs — egress AR + autofill RN Tools

## Que es este proyecto

Sistema de productividad para proyectos Next.js con Claude Code. Incluye:
- Template curado (`_template/`): CLAUDE.md (Full + Simple), /save, /load, /check, /commit, scripts de enforcement
- Auditorias: /security-audit, /operational-audit
- Mapa de proyectos por capas y afinidad (`PROJECT-MAP.md`)
- Indice de infraestructura y deploy (`INFRA.md`)
- Comando `/sync` para propagar reglas entre proyectos del mismo grupo
- Global `~/.claude/CLAUDE.md` con reglas cross-proyecto

## Actualizacion 2026-06-04 — Infra Tools RN sin drift

Se actualizó `INFRA.md` para reflejar el estado productivo real de ÍTERA Lex
Tools:

- egress jurisprudencial productivo en VPS AR `38.180.185.41`, expuesto a
  Hetzner por `10.0.1.1:18767`;
- autofill productivo PJ Río Negro `fallos/stj` activado en Hetzner como
  systemd de host, wrapper `/opt/itera-rio-negro-autofill/run.sh`;
- timers documentados:
  `itera-rio-negro-autofill-canary.timer`,
  `itera-rio-negro-autofill-canary-stop.timer` e
  `itera-rio-negro-recientes-diario.timer`;
- la vía externa `https://api.iteralex.com` no queda como scheduler porque
  Cloudflare respondió `1010` antes de FastAPI; la vía vigente llama
  `http://127.0.0.1:8000` dentro del contenedor API y mantiene egress por
  `http://10.0.1.1:18767`.

## Lo que cambio en esta sesion (2026-04-27 — sesion #5)

### Sesion #4 (cerrada antes)

- Eliminado folder duplicado `itera-claude-system/bambu-web-corporativa-catalogo/`.
- Migrado `model: 'claude-sonnet-4-6'` → `model: sonnet` en 5 commands del template + propagado a `itera-lex`.

### Sesion #5 — Construido el plugin `solodev/session` (LOCKED IN)

Continuamos el revamp y **lo construimos completo localmente**. El detalle del razonamiento sigue en [`revamping-save-system.md`](./revamping-save-system.md), pero las decisiones quedaron implementadas.

**Decisiones arquitectonicas cerradas:**

- **Marketplace publico** llamado `solodev` (marca personal del autor: Pachu, https://pachu.dev — separado de Itera que es B2B).
- **Plugin** `session` adentro del marketplace. Estructura marketplace + plugin (modelo Anthropic), no plugin monolitico.
- **4 skills** en el plugin: `setup`, `save`, `load`, `brainstorm`.
- **1 agent** worker: `session-worker` (model: sonnet, ejecutor mecanico del save).
- **Comandos en ingles** + filenames en ingles + contenido 100% en español (decision deliberada para target hispano amplio).
- **Tiers adaptativos**: T1 brainstorming, T2 construyendo, T3 producto. Cada tier scaffolda lo que necesita, ni mas ni menos. Save graceful detecta lo que existe.
- **Modos de save**: quick (solo STATE), standard (+ check + guardrails + commit), deep (+ changelog + audits). Argumento explicito o heuristica + confirmacion.
- **Schema worker** definido: paquete JSON con mode/checks/state/guardrails/changelog/commit/audits. El orquestador piensa, el worker ejecuta.
- **Brainstorm** destilado del skill homonimo de superpowers, en español, sin spec formal — actualiza STATE.md directo. Integrado al setup T1 como offer post-scaffold + standalone en cualquier tier.

**Estructura del plugin** (en `~/projects/solodev/`):

```
solodev/
├── README.md
├── .claude-plugin/marketplace.json
└── plugins/session/
    ├── .claude-plugin/plugin.json
    ├── agents/session-worker.md
    └── skills/
        ├── setup/         (SKILL + 5 references: state, guardrails, changelog, brief, claude-md-block)
        ├── save/          (SKILL + 4 references: heuristic, worker-package-schema, state-update, guardrails)
        ├── load/          (SKILL solo)
        └── brainstorm/    (SKILL + 2 references: question-patterns, decomposition)
```

19 archivos del plugin + 1 doc de contenido (`content/video-pilot.md`). 3 commits en el repo `solodev`.

### Estrategia de contenido + video pilot (LOCKED IN)

Tambien cerramos la filosofia de contenido para el canal de YouTube de Pachu sobre el plugin. Vive en `~/projects/solodev/content/video-pilot.md`. Resumen:

- **Filosofia:** el plugin es sistema de memoria, no kickstarter de proyectos. Demos sobre trabajo real propio (doble valor: plugin + showcase del autor). Casos demo armados se reservan solo para contenido trending puntual.
- **Script del video pilot** (7-9 min, 6 beats): hook before/after → apertura conceptual → instalacion → setup en proyecto real propio → brainstorm de decision real chica (no "diseñar app") → save+load entre sesiones → cierre.
- **Filtro clave:** no usar narrativas tipo "vamos a hacer una app de cero" — over-prometen y subutilizan la fortaleza real del plugin (memoria entre sesiones de trabajo existente).

### Estado del plugin

- ✅ Construido localmente y commiteado (3 commits en solodev).
- ✅ Doc de contenido y script del video pilot escrito.
- ⏳ **Sin testear todavia** — no se instalo ni se probo en ningun repo real.
- ⏳ Sin pushear a GitHub (queda como repo local hasta que pase el primer test exitoso).
- ⏳ Sin grabar video (script existe, falta refinar elecciones concretas: que proyecto usar para demo, que decision real usar para brainstorm).

## Proximos pasos

### Inmediato (proxima sesion)

1. **Instalar localmente** el plugin desde `~/projects/solodev/`:
   ```
   /plugin marketplace add ~/projects/solodev
   /plugin install session@solodev
   /reload-plugins
   ```

2. **Testear en orden de complejidad creciente**:
   - Repo de juguete vacio + `/session:setup` tier 1 sin git → confirmar scaffold minimo.
   - Mismo repo + `/session:save` → confirmar que worker se despacha y actualiza STATE.
   - Repo de juguete con git inicializado + `package.json` + `/session:setup` tier 2 → confirmar deteccion de stack, creacion de GUARDRAILS, inyeccion en CLAUDE.md.
   - Tier 1 con offer de brainstorm → confirmar que la integracion inline (setup leyendo brainstorm SKILL.md) funciona.
   - Por ultimo, `itera-lex` real → simular tier 3, confirmar que NO sobrescribe nada existente.

3. **Iterar sobre lo que falle** — primer build siempre tiene gaps. Editar archivos en `~/projects/solodev/`, correr `/reload-plugins`, re-probar.

### Despues del test exitoso

4. Push a GitHub (repo publico `PachuAI/solodev`).
5. Refinar el script del video (`solodev/content/video-pilot.md`): elegir proyecto concreto para demo, decision real para brainstorm, definir background/setup de grabacion.
6. Grabar video pilot.
7. Decidir si seguimos `/save` y `/load` legacy en paralelo unas semanas o si migramos directo a `/session:save` y `/session:load`.
8. Empezar a planificar el siguiente plugin del marketplace `solodev` (candidatos discutidos: `coolify-operator`, `cloudflare-operator`, `self-hosted-postgres-ops`).

### Pendientes laterales (no bloquean)

- Propagar `model: sonnet` al resto de repos Tier 1+2 (shope-ar, linkea2, itera-estudio). Capaz conviene esperar — si reemplazamos `/save` legacy por `/session:save`, los commands del template van a quedar obsoletos.
- Completar Coolify UUIDs faltantes en INFRA.md (5 proyectos sin UUID documentado).
- Considerar migrar itera-tube, alquimica-hub, presskit-ar de Prisma 5 a 7 (pendiente desde sesion #3).

## Referencias

- Plan completo del revamp y su contexto: [`revamping-save-system.md`](./revamping-save-system.md). Cuando los tests del plugin pasen y este pusheado, ese doc se mueve a `archive/`.
- Plugin construido: `~/projects/solodev/`.
