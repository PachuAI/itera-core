---
name: cleanup-boilerplate
description: "Limpia residuos del kickstart después del setup. Ejecutar cuando el proyecto ya está andando y queda algún archivo fuera de lugar."
disable-model-invocation: true
model: sonnet
---

# Cleanup Boilerplate

Eliminar archivos y carpetas residuales del proceso de kickstart.

## Cuándo ejecutar

- Después del kickstart completo (pasos 0-10)
- Cuando `pnpm build` pasa sin errores
- Cuando ya se hizo el primer commit
- Cuando sospechas que quedó algo del setup sin limpiar

## Pre-verificación

ANTES de limpiar, verificar que el proyecto está sano:

```bash
pnpm build
```

Si falla, NO limpiar. No es problema de limpieza.

---

## Archivos a detectar

### 1. Directorio temporal en el padre

El Paso 0 del kickstart crea `.itera-setup-NOMBRE/` en el directorio padre:

```bash
ls -d ../.itera-setup-* 2>/dev/null
```

Si existe, eliminar:
```bash
rm -rf ../.itera-setup-*
```

### 2. Archivos del kickstart en raíz del proyecto

Estos archivos son de setup y no deben quedar en el proyecto final:

| Archivo | Por qué debe irse |
|---------|-------------------|
| `KICKSTART.md` | Prompt de inicio, ya se ejecutó |
| `CLAUDE-simple.md` | La versión que no se usó (solo debe quedar `CLAUDE.md`) |

```bash
for file in KICKSTART.md CLAUDE-simple.md; do
  [ -f "$file" ] && echo "  $file"
done
```

### 3. Carpetas del sistema en raíz (si el paso 0 falló parcialmente)

Estas carpetas pertenecen al sistema itera-claude-system, NO al proyecto:

| Carpeta | Debería estar en proyecto final |
|---------|---------------------------------|
| `templates/` | NO |
| `nextjs-boilerplate-betterauth/` | NO |
| `skills/` | NO |
| `global/` | NO |
| `agents/` en raíz | NO (sí en `.claude/agents/`) |
| `commands/` en raíz | NO (los comandos ahora son skills en `.claude/skills/`) |

```bash
for dir in templates nextjs-boilerplate-betterauth nextjs-boilerplate skills global; do
  [ -d "$dir" ] && echo "  $dir/"
done
# Solo raíz, no confundir con .claude/
[ -d "agents" ] && echo "  agents/ (raíz)"
[ -d "commands" ] && echo "  commands/ (raíz)"
```

### 4. Git del sistema

Si quedó el `.git` del repo itera-claude-system:

```bash
git remote -v
```

Si el remote apunta a `itera-claude-system` en vez del proyecto nuevo → NO eliminar automáticamente. Reportar al usuario — es un problema que requiere intervención manual.

### 5. Archivos de planning con referencias al sistema

Si `.planning/` tiene contenido genérico del template (menciona "itera-claude-system" o tiene placeholders sin completar):

```bash
grep -l "itera-claude-system\|\[Nombre del Proyecto\]" .planning/*.md 2>/dev/null
```

Si hay matches → esos archivos necesitan ser completados con datos del proyecto (no eliminarlos).

---

## Workflow

```
Cleanup:
- [ ] Pre-check: pnpm build pasa
- [ ] Detectar: listar todos los residuos encontrados
- [ ] Confirmar: mostrar al usuario qué se va a eliminar
- [ ] Eliminar: borrar archivos y carpetas residuales
- [ ] Verificar: confirmar estructura correcta
- [ ] Post-check: pnpm build sigue pasando
```

### Paso 1: Detectar

```bash
echo "=== Directorio temporal en padre ==="
ls -d ../.itera-setup-* 2>/dev/null || echo "  (ninguno)"

echo "=== Archivos de kickstart en raíz ==="
for file in KICKSTART.md CLAUDE-simple.md; do
  [ -f "$file" ] && echo "  $file"
done

echo "=== Carpetas del sistema en raíz ==="
for dir in templates nextjs-boilerplate-betterauth nextjs-boilerplate skills global agents commands; do
  [ -d "$dir" ] && echo "  $dir/"
done

echo "=== Git remote ==="
git remote -v 2>/dev/null

echo "=== Planning con placeholders ==="
grep -l "itera-claude-system\|\[Nombre del Proyecto\]" .planning/*.md 2>/dev/null || echo "  (ninguno)"
```

### Paso 2: Confirmar con el usuario

Mostrar la lista y pedir confirmación antes de eliminar cualquier cosa:

```markdown
## Residuos detectados

**Para eliminar:**
- [item] — razón

**Requiere revisión manual:**
- [item] — razón

¿Procedo con la limpieza?
```

### Paso 3: Eliminar

```bash
# Directorio temporal del padre
rm -rf ../.itera-setup-*

# Archivos de kickstart
rm -f KICKSTART.md CLAUDE-simple.md

# Carpetas del sistema (si quedaron)
rm -rf templates nextjs-boilerplate-betterauth nextjs-boilerplate skills global
# Solo raíz:
[ -d "agents" ] && rm -rf agents
[ -d "commands" ] && rm -rf commands
```

### Paso 4: Verificar estructura

```bash
echo "=== Estructura del proyecto ==="
ls -la

echo ""
echo "=== Sistema de memoria ==="
ls .claude/skills/ .claude/agents/ .planning/

echo ""
echo "=== Git remote ==="
git remote -v
```

Confirmar que:
- ✅ `.claude/skills/` tiene load, save, check, commit, kickstart-nextjs, cleanup-boilerplate, security-audit, operational-audit (cada uno como `<name>/SKILL.md`)
- ✅ `.claude/agents/` tiene doc-changelog.md
- ✅ `.planning/` tiene PROJECT.md, STATE.md, CHANGELOG.md, CODEBASE-MAP.md, audits/
- ✅ `CLAUDE.md` existe con datos del proyecto (no placeholders)
- ❌ No hay carpetas/archivos del boilerplate en raíz

### Paso 5: Post-check

```bash
pnpm build
```

Reportar:

```markdown
## Limpieza completa

**Eliminado:** [lista]
**Build:** ✅ OK
**Sistema de memoria:** ✅ Intacto
**Residuos:** ✅ Ninguno
```

---

## Reglas

- SIEMPRE verificar build ANTES y DESPUÉS
- NUNCA eliminar `.claude/`, `.planning/`, `CLAUDE.md`
- NUNCA eliminar sin confirmar con el usuario
- Si git remote apunta a itera-claude-system → alertar, NO tocar
- Si `.planning/` tiene placeholders → completar, no eliminar
- Este skill es idempotente — se puede correr múltiples veces
