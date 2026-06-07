---
name: check
description: 'Chequeo de calidad adaptativo de un repo ITERA (Next.js 16 + Prisma 7 + BetterAuth multi-tenant): detecta qué cambió y corre solo los checks relevantes — transacciones, findMany+take, aislamiento tenant, Zod, auth guards, lint y enforcement scripts. Usar tras implementar una feature (3+ archivos), un refactor de lógica, o antes de /save. /check en Claude, $check en Codex.'
model: sonnet
---

# Check - Auditoría de Calidad Adaptativa

Chequeo inteligente que analiza qué cambió en la sesión y ejecuta SOLO los checks relevantes.

## Cuándo usar /check

### SÍ ejecutar

- Después de implementar una feature (3+ archivos tocados)
- Después de un refactor que toca lógica de negocio
- Antes de `/save` si hubo cambios de código significativos
- Cuando se creó o modificó un service, action, o schema
- Cuando se replicó un patrón de otro módulo

### NO ejecutar (ahorro de tokens)

- Cambios solo en docs/planning/changelog
- Fix de 1-2 líneas obvio (typo, import faltante)
- Cambios solo de estilos CSS/Tailwind sin lógica
- Después de `/load` sin haber codeado

---

## Paso 1: Detectar alcance de cambios

```bash
git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached
```

Si no hay diff (ya commiteado), usar:

```bash
git diff --name-only HEAD~1..HEAD
```

Clasificar cada archivo en categorías:

| Categoría | Patrón de archivo                             |
| --------- | --------------------------------------------- |
| `service` | `src/lib/services/*.ts`                       |
| `action`  | `src/app/**/actions.ts`, `*-actions.ts`       |
| `schema`  | `src/lib/schemas/*.ts`                        |
| `ui`      | `src/app/**/*.tsx`, `src/components/**/*.tsx` |
| `prisma`  | `prisma/schema.prisma`                        |
| `util`    | `src/lib/utils/*.ts`, `src/lib/hooks/*.ts`    |
| `config`  | `next.config.*`, `globals.css`, `.env*`       |
| `test`    | `**/*.test.ts`, `**/*.test.tsx`               |
| `docs`    | `.planning/*`, `*.md`                         |

**Si TODOS los archivos son `docs` o `config` → reportar "Sin checks de código necesarios" y TERMINAR.**

---

## Paso 2: Seleccionar checks según categorías

Ejecutar SOLO los checks donde la categoría aplica:

### Check A: Transacciones (si `service` o `action`)

Buscar funciones con 2+ operaciones de escritura Prisma (`create`, `update`, `delete`, `upsert`, `createMany`, `updateMany`, `deleteMany`) que NO estén dentro de `$transaction`.

```
Grep en archivos modificados de tipo service/action:
- Contar writes por función
- Verificar que 2+ writes estén en $transaction
- Verificar que audit log esté DENTRO de la transacción
```

**Reportar**: funciones con writes sin $transaction.

### Check B: Límites de query (si `service`)

Buscar `findMany` sin `take` en servicios modificados.

```
Grep: findMany sin take en la misma llamada
```

**Reportar**: queries findMany sin límite.

### Check C: Índices Prisma (si `prisma` o `service` con nuevos WHERE/ORDER BY)

Si se modificó schema.prisma, verificar que campos usados en WHERE/ORDER BY tengan `@@index`.

### Check D: DRY de componentes (si `ui`)

En componentes modificados, buscar:

1. **Código copiado**: ¿Se copió un patrón que ya existe en `src/components/shared/`?

```
Grep en archivos UI modificados por:
- EmptyState inline (mensajes de "no hay datos" sin <EmptyState>)
- Confirm dialogs inline (AlertDialog sin <ConfirmDialog>)
- Formateo local de fechas/moneda (sin usar utils/)
```

2. **Patrón repetido**: ¿El mismo bloque aparece 2+ veces en archivos distintos?

**Reportar**: componentes compartidos no utilizados, patrones duplicados.

### Check E: Seguridad y Auth (si `action` o `service`)

En actions modificadas, verificar el flujo:

```
Cada action debe tener:
1. getSessionOrRedirect() o getSuperAdminOrRedirect()
2. authorize() si tiene permisos
3. Validación Zod (safeParse)
4. Llamada a service (NO prisma directo)
5. revalidatePath/revalidateTag si muta datos
```

**Reportar**: actions sin auth, sin validación, o con prisma directo.

### Check F: Zod y tipos (si `schema` o `action`)

En schemas modificados:

```
- .optional().default() → incompatible con zodResolver (usar required + defaultValues)
- error.flatten() → deprecado en Zod 4 (usar z.flattenError(error))
- new Date(v) en transforms → debe ser parseDateLocal(v)
- != o == → debe ser !== o ===
```

**Reportar**: patrones Zod incorrectos.

### Check G: React/Next.js (si `ui`)

En componentes modificados:

```
- useParams() en page dinámica → debe ser Server Component con props
- fetch() a URL propia en Server Component → usar Prisma directo
- Elementos interactivos anidados (<button> dentro de <button>, <a> dentro de <a>)
- as Type en datos de DB sin validación runtime
```

**Reportar**: anti-patrones React/Next.js.

### Check H: Lint (si cualquier archivo `.ts` o `.tsx`)

```bash
npx eslint src prisma --quiet 2>/dev/null | head -50
```

**Reportar**: errores de lint (SIEMPRE correr si hubo cambios de código).

### Check I: Multi-tenant (si `service`, `prisma`, o `api`)

Si el proyecto tiene extensión Prisma multi-tenant:

1. Modelo nuevo en schema.prisma → tiene `tenantId String` + `@@index([tenantId])` + está en `TENANT_MODELS`?
2. `db.user.findMany()` → tiene `where: { tenantId }` explícito? (User NO está en TENANT_MODELS)
3. Tablas JOIN (`*Clausula`, `*Equipo`, `*Asistente`) → mutación por `id` → verifica ownership del parent?
4. `findUnique({ where: { id } })` sin tenantId/userId → potencial leak cross-tenant

### Check J: Enforcement scripts (SIEMPRE ejecutar)

Ejecutar los scripts de verificación automática — NO es condicional:

```bash
node scripts/check-quality.mjs all
```

Reportar cada check que falla con los archivos y líneas específicas.
Los scripts cubren: scaffold, findMany+take, upload validation, auth guards, page metadata, $transaction, tenant isolation, FK validation.

### Check K: Tipos compartidos (si `action` o `ui` con interfaces nuevas)

Buscar interfaces/types definidas localmente que ya existen en `src/lib/types/`:

1. Buscar `interface` o `type` en archivos modificados
2. Si es idéntica o casi idéntica a algo en `src/lib/types/` → reportar como Warning
3. Si la misma interface aparece en 2+ archivos → reportar como Warning con sugerencia de extraer

---

## Paso 3: Reporte

Formato del reporte:

```markdown
## /check — Resultado

**Archivos analizados**: [N] ([categorías detectadas])
**Checks ejecutados**: [lista de checks A-K que aplicaron]
**Checks omitidos**: [lista de checks que no aplicaron y por qué]

### Hallazgos

#### [Severidad] Check [X]: [Nombre]

- **Archivo**: `path/to/file.ts:NN`
- **Problema**: [descripción concisa]
- **Fix**: [qué hacer]

### Resumen

| Severidad  | Cantidad               |
| ---------- | ---------------------- |
| 🔴 Crítico | N                      |
| 🟡 Warning | N                      |
| ✅ OK      | N checks sin problemas |

[Si hay críticos]: **Corregir antes de commitear.**
[Si solo warnings]: **Considerar corregir. Ninguno es bloqueante.**
[Si todo OK]: **Código limpio. Listo para commit.**
```

### Severidades

- **🔴 Crítico**: Bugs potenciales, seguridad, datos corruptos ($transaction faltante, auth faltante, `!=`)
- **🟡 Warning**: Calidad/mantenibilidad (DRY, take faltante, patrón repetido)
- **✅ OK**: Check ejecutado sin problemas

---

## Paso 4: Fix automático (opcional)

**Si hay hallazgos críticos**, preguntar:

> ¿Corrijo los [N] problemas críticos ahora?

Si el usuario acepta, corregir en orden de severidad.
Si no, dejar el reporte como referencia.

**NUNCA corregir automáticamente sin preguntar.**

---

## Reglas

- **LEER los archivos modificados** antes de reportar — no adivinar por nombre
- **NO reportar falsos positivos** — verificar cada hallazgo leyendo el código real
- **NO sugerir mejoras no pedidas** — solo reportar problemas de los checks definidos
- **Ser conciso** — una línea por hallazgo, no párrafos explicativos
- Si un check no encuentra problemas, listar como ✅ en el resumen, no detallar
- Si no hay archivos de código modificados, reportar rápido y terminar
