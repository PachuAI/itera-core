#!/usr/bin/env bash
# Symlinkea un skill del directorio canónico (itera-claude-system/skills/) hacia
# ~/.claude/skills y ~/.codex/skills. Convención ITERA: 1 sola copia REAL (canónica),
# symlinks en ambos agentes → cero drift. Correr después de crear o renombrar un skill.
#
# Uso:
#   scripts/link-skill.sh <skill-name>   # symlinkea ese skill en ambos lados
#   scripts/link-skill.sh --all          # re-symlinkea TODO el canónico (idempotente)
set -euo pipefail

CANON="$(cd "$(dirname "$0")/../skills" && pwd)"
TARGETS=("$HOME/.claude/skills" "$HOME/.codex/skills")

link_one() {
  local n="$1"
  if [ ! -d "$CANON/$n" ]; then echo "✗ no existe $CANON/$n"; return 1; fi
  for base in "${TARGETS[@]}"; do
    mkdir -p "$base"
    rm -rf "$base/$n"
    ln -s "$CANON/$n" "$base/$n"
  done
  echo "✓ $n  →  ~/.claude/skills + ~/.codex/skills"
}

name="${1:-}"
if [ -z "$name" ]; then
  echo "uso: link-skill.sh <skill-name> | --all"; exit 1
fi

if [ "$name" = "--all" ]; then
  for d in "$CANON"/*/; do link_one "$(basename "$d")"; done
else
  link_one "$name"
fi
