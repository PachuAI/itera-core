# Skills — directorio canónico (fuente única para todos los agentes IA)

Esta carpeta es la **fuente de verdad** de los skills del ecosistema ÍTERA, compartida entre
**Claude Code** y **Codex** (y cualquier agente futuro). Está en git → tiene historial y entra en
`/sync`.

## Cómo funciona

- Cada skill vive **una sola vez** acá: `skills/<name>/SKILL.md` (+ `references/`, `scripts/`,
  `agents/` según el skill).
- `~/.claude/skills/<name>` y `~/.codex/skills/<name>` son **symlinks** a esta carpeta. Una edición
  acá la ven los dos agentes al instante. **Cero drift.**

## Convención (dejar por sentado)

1. **Skill nuevo** (creado desde Claude o Codex): crearlo/editarlo SIEMPRE acá, en
   `skills/<name>/`. NUNCA dejar una copia suelta en `~/.claude/skills` o `~/.codex/skills` — eso
   reintroduce el drift que este directorio elimina.
2. Después, symlinkearlo a ambos agentes:
   ```bash
   ~/projects/itera-claude-system/scripts/link-skill.sh <name>
   # o re-linkear todo de una (idempotente):
   ~/projects/itera-claude-system/scripts/link-skill.sh --all
   ```
3. **Renombrar** un skill: renombrar la carpeta acá y volver a correr `link-skill.sh <nuevo-name>`
   (borrá el symlink viejo si quedó). 

## Formato

Compatible con ambos agentes: `SKILL.md` con frontmatter `name` + `description` y el body en
markdown. Los dirs pueden traer `references/`, `scripts/` y `agents/openai.yaml`.

> **Caveat Codex**: los skills de origen Claude pueden no traer `agents/openai.yaml`. Si un skill
> no aparece/expone en Codex, agregarle ese archivo (Claude lo ignora; es inofensivo).

## No tocar

`~/.codex/skills/.system/` son los skills **built-in de Codex** (imagegen, skill-creator, etc.) — no
forman parte de este directorio y se dejan como están.

## Comandos = skills (workflow ITERA)

Los ex-comandos `/save /load /check /commit /security-audit /operational-audit` ahora viven acá como
skills (Claude Code fusionó commands en skills; Codex deprecó los custom prompts a favor de skills).
Se invocan `/<name>` en Claude y `$<name>` en Codex, en cualquier repo ITERA. Los per-repo
`.claude/commands/*.md` se eliminaron (un comando de repo tapaba el skill global).

- **Manual-only** (`disable-model-invocation: true` en el frontmatter): `save`, `load`, `commit` — el
  modelo NO los auto-dispara, solo vos al tipearlos. `check`/`security-audit`/`operational-audit` SÍ
  son invocables por el modelo (los encadena `/save`).
- `/save` usa el subagente `doc-changelog`, globalizado en `~/.claude/agents/doc-changelog.md`.

## Estado (consolidado 2026-06-07)

33 skills canónicos symlinkeados en ambos agentes (27 originales + 6 de workflow). Pendiente (iteración
futura): agrupar por dominio (`dev/`, `legal/`, `visual/`, `ops/`) y renombrar los que haga falta — al
hacerlo, re-correr `link-skill.sh --all`.
