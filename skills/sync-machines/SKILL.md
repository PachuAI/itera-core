---
name: sync-machines
description: Usar cuando el usuario pide explicitamente sincronizar trabajo entre el desktop (pachu-desktop-linux) y la notebook (pachu-notebook-linux, 192.168.0.3) — tanto para traer updates de la notebook ("pull") como para llevarlos ("push"). Solo corre desde el desktop, que es la unica maquina con SSH configurado hacia la otra.
---

# Sync entre desktop y notebook

Procedimiento operativo para mantener en sync las dos maquinas del usuario: `pachu-desktop-linux` (principal) y `pachu-notebook-linux` en `192.168.0.3`.

## Contexto obligatorio leer antes de ejecutar

- **SSH es unidireccional**: solo el desktop tiene clave autorizada en la notebook. La notebook NO puede iniciar conexiones al desktop. Por lo tanto este skill **solo corre desde el desktop**. Si `hostname` devuelve cualquier cosa distinta de `pachu-desktop-linux`, abortar y avisar.
- **Git va aparte**: los repos de `~/projects/` se sincronizan via GitHub (cada maquina pushea/pullea a origin). Este skill cubre dos piezas que git no maneja:
  1. Pull masivo de los repos locales (conveniencia, no sync real).
  2. `rsync` filtrado de `~/.claude/` y `~/.codex/` (contenido de usuario: skills, commands, rules, CLAUDE.md, config.toml) — que no viven en git.

## Direccion

El usuario indica la direccion explicitamente o se infiere del lenguaje:

- **PULL** — "traer updates de la notebook", "volvi de laburar afuera", "sync con lo que hice en la notebook". La notebook es la fuente, el desktop el destino.
- **PUSH** — "llevar updates a la notebook", "voy a salir con la notebook", "preparar la notebook". El desktop es la fuente, la notebook el destino.

Si la direccion es ambigua, preguntar antes de tocar nada.

## Guardrails (NUNCA romper)

- **Nunca `rsync -avz ~/.claude/ ...` sin filtros.** Eso pisa `sessions/`, `history.jsonl`, `sqlite` logs, `auth.json`, `.credentials.json`, `state_5.sqlite`, `installation_id`, `shell_snapshots`, `file-history`, `session-env`, `cache`. Esas cosas son per-machine y borrar la sesion activa. Si se propone un comando `rsync` sin `--include`/`--exclude`, rechazarlo.
- **`.claude/settings.json` queda per-machine.** La notebook tiene `"model": "sonnet"` intencional (maquina modesta), el desktop usa default (Opus). **NO incluir `settings.json` en el rsync.**
- **`.claude/settings.local.json` queda per-machine** (idem).
- **Nunca tocar**: `~/.claude/{sessions,history.jsonl,.credentials.json,cache,file-history,shell-snapshots,session-env,tasks,telemetry,plans,downloads,backups,paste-cache,mcp-needs-auth-cache.json}` ni `~/.codex/{auth.json,*.sqlite*,cache,log,shell_snapshots,tmp,.tmp,installation_id,session_index.jsonl,sessions,history.jsonl,state_*.sqlite*,models_cache.json}`.
- **Verificar antes de pullear**: que no haya trabajo sin commitear/pushear en la fuente. Avisar al usuario y pedir confirmacion si hay untracked files o commits ahead.

## Procedimiento

### Paso 0 — Verificacion de precondiciones

```bash
[ "$(hostname)" = "pachu-desktop-linux" ] || { echo "Este skill solo corre desde el desktop"; exit 1; }
ssh -o ConnectTimeout=5 -o BatchMode=yes pachu@192.168.0.3 "hostname" 2>/dev/null && NB_UP=1 || NB_UP=0
echo "notebook=$( [ $NB_UP = 1 ] && echo UP || echo DOWN )"
```

Si la notebook esta DOWN: NO abortar. Igual chequear repos locales del desktop (Paso 1 local) y reportar al usuario que no se pudo verificar el estado de la notebook. Solo abortar las partes que requieren SSH (Paso 1 remoto, Paso 2 PUSH, rsync).

### Paso 1 — Inspeccion de trabajo pendiente (en TODOS los repos de AMBAS maquinas)

Aunque la "fuente" formal sea la notebook (PULL) o el desktop (PUSH), siempre conviene chequear los repos de las DOS maquinas: el usuario puede tener trabajo sin pushear o sin pullear en cualquiera de las dos, independientemente de que ahora estemos haciendo PULL o PUSH. Reportar todo lo que tenga `dirty != 0`, `ahead != 0` o `behind != 0`.

El script itera `~/projects/*/` y para cada repo:
1. **Hace `git fetch` explicito** (no asumir refs frescos — sin esto el calculo de `behind` es contra refs viejos y miente).
2. **Reporta errores de fetch en voz alta** (timeout, auth, sin red). Un fetch que falla y se silencia genera un falso "todo OK" — esto YA paso (2026-05-03 incidente: itera-lex aparecia behind=0 porque el fetch del loop habia fallado silenciosamente).
3. Lee `dirty`, `ahead`, `behind` con `git -C` (no con `cd`, evita problemas de directorio actual).
4. Usa sentinel `?` cuando un calculo no se puede hacer (ej: branch sin upstream) — NUNCA `|| echo 0` que enmascara errores reales.

Si hay cosas, mostrar al usuario y **preguntar** si quiere:
- abortar y resolverlo manualmente
- commitear + pushear desde la fuente antes de continuar
- continuar ignorando lo untracked (acepta que se queda solo en esa maquina)

Template del loop (correrlo local en el desktop, y de nuevo prefijado con `ssh pachu@192.168.0.3 '...'` para la notebook):

```bash
cd ~/projects && for d in */; do
  d="${d%/}"
  [ -d "$d/.git" ] || continue
  fetch_out=$(GIT_TERMINAL_PROMPT=0 timeout 30 git -C "$d" fetch 2>&1)
  fetch_status=$?
  if [ $fetch_status -ne 0 ]; then
    echo "FETCH-FAIL $d (exit=$fetch_status) :: $fetch_out"
    continue
  fi
  branch=$(git -C "$d" branch --show-current 2>/dev/null)
  dirty=$(git -C "$d" status --porcelain 2>/dev/null | wc -l)
  ahead=$(git -C "$d" rev-list --count @{u}..HEAD 2>/dev/null)
  behind=$(git -C "$d" rev-list --count HEAD..@{u} 2>/dev/null)
  ahead=${ahead:-?}
  behind=${behind:-?}
  if [ "$dirty" != "0" ] || [ "$ahead" != "0" ] || [ "$behind" != "0" ]; then
    printf "%-32s branch=%-10s dirty=%-3s ahead=%-3s behind=%s\n" "$d" "$branch" "$dirty" "$ahead" "$behind"
  fi
done
```

Notas:
- **NUNCA usar `2>/dev/null` en `git fetch`** dentro de este loop. El skill depende de saber que el fetch realmente paso. Errores silenciados ya causaron un reporte falso de "todo al dia" (incidente 2026-05-03 con itera-lex).
- `dirty=$(git status --porcelain | wc -l)` incluye untracked. Untracked en `.gitignore` NO aparece — es lo deseado.
- Si `ahead=?` o `behind=?`, el branch probablemente no tiene upstream configurado — investigar caso por caso, no asumir.
- Para chequear notebook: prefijar todo el loop con `ssh pachu@192.168.0.3 'bash -s' <<'EOF' ... EOF` o usar heredoc — el SSH agrega latencia, asi que es razonable correrlo solo cuando hace falta (PULL o cuando el usuario sospecha trabajo pendiente alla).

### Paso 2 — Pull masivo git en el destino

El destino es el desktop (para PULL) o la notebook (para PUSH, via SSH). Fast-forward only, con timeout y `GIT_TERMINAL_PROMPT=0` para evitar cuelgues:

```bash
cd ~/projects && for d in */; do
  if [ -d "$d/.git" ]; then
    out=$(cd "$d" && GIT_TERMINAL_PROMPT=0 timeout 20 git pull --ff-only 2>&1)
    status=$?
    if [ $status -eq 0 ] && echo "$out" | grep -qE "Already up to date|Ya está actualizado"; then
      echo "OK     $d"
    elif [ $status -eq 0 ]; then
      echo "PULL   $d -> $(echo "$out" | grep -E "Fast-forward|Actualizando|files? changed" | head -2 | tr '\n' ' ')"
    else
      echo "FAIL   $d (exit=$status)"
    fi
  fi
done
```

### Paso 3 — `rsync` filtrado de `.claude` y `.codex`

**PULL (notebook → desktop):**

```bash
rsync -avz --delete \
  --include='skills/***' \
  --include='commands/***' \
  --include='CLAUDE.md' \
  --exclude='*' \
  pachu@192.168.0.3:~/.claude/ ~/.claude/

rsync -avz --delete \
  --include='skills/***' \
  --include='rules/***' \
  --include='memories/***' \
  --include='config.toml' \
  --exclude='*' \
  pachu@192.168.0.3:~/.codex/ ~/.codex/
```

**PUSH (desktop → notebook):** los mismos comandos con fuente y destino invertidos:

```bash
rsync -avz --delete \
  --include='skills/***' \
  --include='commands/***' \
  --include='CLAUDE.md' \
  --exclude='*' \
  ~/.claude/ pachu@192.168.0.3:~/.claude/

rsync -avz --delete \
  --include='skills/***' \
  --include='rules/***' \
  --include='memories/***' \
  --include='config.toml' \
  --exclude='*' \
  ~/.codex/ pachu@192.168.0.3:~/.codex/
```

Por que estos includes:
- `skills/***` — triple asterisco = la carpeta y todo su contenido recursivo.
- `commands/***` — solo en `.claude` (codex no tiene).
- `rules/***` — solo en `.codex`.
- `memories/***` — solo en `.codex` (`.claude/projects/*/memory/` es otra historia, ver paso 4).
- `CLAUDE.md` / `config.toml` — archivos sueltos a nivel raiz.
- `--delete` solo borra dentro de lo incluido, asi que es seguro: no toca `sessions/`, `auth.json`, sqlite, etc.

### Paso 4 — (opcional) Memorias de Claude

Las memorias viven en `~/.claude/projects/<proyecto-encoded>/memory/`. Son point-in-time por maquina y pueden divergir legitimamente (sesiones distintas guardan cosas distintas). **Por default no se sincronizan.**

Sincronizar solo si el usuario lo pide explicitamente. En ese caso, por proyecto especifico:

```bash
# Ej: memoria del proyecto global ~/projects
# PULL:
rsync -avz pachu@192.168.0.3:~/.claude/projects/-home-pachu-projects/memory/ ~/.claude/projects/-home-pachu-projects/memory/
# PUSH: invertir fuente/destino
```

### Paso 5 — Verificacion por checksum

Para los archivos sueltos criticos, confirmar byte-exactitud despues del rsync:

```bash
for f in ~/.claude/CLAUDE.md ~/.codex/config.toml; do
  local_h=$(md5sum "$f" | cut -d' ' -f1)
  remote_h=$(ssh pachu@192.168.0.3 "md5sum $f" | cut -d' ' -f1)
  [ "$local_h" = "$remote_h" ] && echo "OK  $f" || echo "DIFF $f"
done
```

## Modo dry-run

Si el usuario pide "simular" o "solo mostrar que cambiaria", agregar `--dry-run` a todos los `rsync`. El comando imprime la lista de transferencias sin tocar nada.

## Resumen ejecutivo para el usuario al terminar

Reportar siempre:
- Direccion ejecutada (PULL o PUSH).
- Repos que tenian trabajo pendiente en la fuente y como se resolvio.
- Lista de archivos/skills transferidos por rsync.
- Checksums OK/DIFF.
- Que quedo per-machine y no se toco (`settings.json`, `settings.local.json`, sessions, etc.).

## Historia del metodo

- 2026-04-16: rsync sin filtros usado para setup inicial desktop→notebook (notebook era fresca, sin riesgo de pisar estado).
- 2026-04-23: se descubre que rsync sin filtros es peligroso cuando la maquina destino ya esta en uso. Se define la version filtrada con `--include/--exclude` como metodo canonico. Validado en ambas direcciones.
- 2026-05-03: incidente "falso al-dia". El loop del Paso 1 hacia `git fetch --quiet 2>/dev/null` con `timeout 15` y `|| echo 0` en el rev-list. La notebook estaba apagada (no route to host) y otros fetchs timeoutearon, todo silencioso → `behind=0` contra refs stale → reporte falso de "ningun repo necesita pull". Realidad: `itera-lex` tenia 1 commit pusheado desde notebook esperando pull. Se reescribe Paso 1: fetch sin silenciar errores, `git -C` en vez de `cd`, sentinel `?` en vez de `|| echo 0`, y se chequean SIEMPRE las dos maquinas (no solo "la fuente").
