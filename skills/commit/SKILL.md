---
name: commit
description: 'Crear un commit en formato Conventional Commits (tipo(scope): descripción en imperativo, ≤72 chars, minúsculas, sin punto final, sin Co-Authored-By). Analiza el diff y propone el mensaje, o usa el que pases. Invocación manual: /commit [mensaje] en Claude, $commit en Codex.'
argument-hint: [mensaje de commit opcional]
model: haiku
disable-model-invocation: true
---

# Commit - Conventional Commits

Crear un commit siguiendo el estandar Conventional Commits.

## Pasos

### 1. Ver estado actual

```bash
git status --porcelain
```

Si no hay cambios, informar al usuario y terminar.

### 2. Analizar cambios

```bash
git diff --stat
git diff --staged --stat
```

### 3. Generar mensaje

**Formato**: `<tipo>(<scope>): <descripcion>`

**Tipos**:
| Tipo | Uso |
|------|-----|
| feat | Nueva funcionalidad |
| fix | Correccion de bug |
| refactor | Refactoring sin cambio funcional |
| style | Cambios de formato/estilo |
| test | Agregar o modificar tests |
| docs | Solo documentacion |
| chore | Mantenimiento, dependencias |

**Scopes comunes**:

- Nombre del modulo/feature relevante
- `ui` para componentes compartidos
- `api` para endpoints
- `auth` para autenticacion
- `db` para migraciones/esquema

**Reglas**:

- Primera linea: max 72 caracteres
- Descripcion en imperativo ("agregar", no "agregado")
- Minusculas
- Sin punto final
- NO agregar Co-Authored-By

### 4. Ejecutar commit

```bash
git add -A
git commit -m "<mensaje>"
```

### 5. Confirmar

```
Commit creado: <hash corto>
<tipo>(<scope>): <descripcion>
[N] archivos modificados
```

## Ejemplos

```bash
# Nueva feature
git commit -m "feat(productos): agregar filtro por categoria"

# Bug fix
git commit -m "fix(auth): corregir validacion de email duplicado"

# Refactor
git commit -m "refactor(api): extraer logica de descuentos a service"

# Documentacion
git commit -m "docs: actualizar changelog sesion 15"

# Tests
git commit -m "test(ventas): agregar tests para cambio de estado"
```

## Uso con argumentos

**`/commit`** - Analiza cambios y genera mensaje automaticamente

**`/commit "mensaje"`** - Usa el mensaje provisto (valida formato)

**`/commit --suggest`** - Solo muestra mensaje sugerido, no commitea

## Notas

- Si el usuario proporciona mensaje, usarlo directamente
- Si no, analizar los cambios y proponer uno
- Siempre ejecutar `git add -A` antes del commit (a menos que el usuario pida otra cosa)
- NO usar `--no-verify` a menos que el usuario lo pida explicitamente
