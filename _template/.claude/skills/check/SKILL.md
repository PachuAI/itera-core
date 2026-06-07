---
name: check
description: 'Chequeo de calidad adaptativo. Detecta que cambio y ejecuta solo los checks relevantes.'
model: sonnet
---

# Check - Auditoria de Calidad Adaptativa

Chequeo inteligente que analiza que cambio en la sesion y ejecuta SOLO los checks relevantes.

## Cuando usar /check

### SI ejecutar

- Despues de implementar una feature (3+ archivos tocados)
- Despues de un refactor que toca logica de negocio
- Antes de `/save` si hubo cambios de codigo significativos
- Cuando se creo o modifico un service, action, o schema
- Cuando se replico un patron de otro modulo

### NO ejecutar (ahorro de tokens)

- Cambios solo en docs/planning/changelog
- Fix de 1-2 lineas obvio (typo, import faltante)
- Cambios solo de estilos CSS/Tailwind sin logica
- Despues de `/load` sin haber codeado

---

## Paso 1: Detectar alcance de cambios

```bash
git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached
```

Si no hay diff (ya commiteado), usar:

```bash
git diff --name-only HEAD~1..HEAD
```

Clasificar cada archivo en categorias:

| Categoria | Patron de archivo                             |
| --------- | --------------------------------------------- |
| `service` | `src/lib/services/*.ts`                       |
| `action`  | `src/app/**/actions.ts`, `*-actions.ts`       |
| `schema`  | `src/lib/schemas/*.ts`                        |
| `ui`      | `src/app/**/*.tsx`, `src/components/**/*.tsx`  |
| `prisma`  | `prisma/schema.prisma`                        |
| `util`    | `src/lib/utils/*.ts`, `src/lib/hooks/*.ts`    |
| `config`  | `next.config.*`, `globals.css`, `.env*`       |
| `test`    | `**/*.test.ts`, `**/*.test.tsx`               |
| `docs`    | `.planning/*`, `*.md`                         |

**Si TODOS los archivos son `docs` o `config` -> reportar "Sin checks de codigo necesarios" y TERMINAR.**

---

## Paso 2: Seleccionar checks segun categorias

Ejecutar SOLO los checks donde la categoria aplica:

### Check A: Transacciones (si `service` o `action`)

Buscar funciones con 2+ operaciones de escritura Prisma (`create`, `update`, `delete`, `upsert`, `createMany`, `updateMany`, `deleteMany`) que NO esten dentro de `$transaction`.

**Verificar que audit log este DENTRO de la transaccion.**

### Check B: Limites de query (si `service`)

Buscar `findMany` sin `take` en servicios modificados.

### Check C: Indices Prisma (si `prisma` o `service` con nuevos WHERE/ORDER BY)

Si se modifico schema.prisma, verificar que campos usados en WHERE/ORDER BY tengan `@@index`.

### Check D: DRY de componentes (si `ui`)

En componentes modificados, buscar:

1. **Codigo copiado**: Patron que ya existe en `src/components/shared/`?
2. **Formateo local**: Funciones de fecha/moneda inline en vez de `src/lib/utils/`
3. **Patron repetido**: Mismo bloque aparece 2+ veces en archivos distintos

### Check E: Seguridad y Auth (si `action`, `service`, o `api`)

En actions/routes modificadas, verificar:

**Server Actions**:
1. `getSessionOrRedirect()` o guard equivalente
2. `authorize()` si tiene permisos
3. Validacion Zod (safeParse)
4. Llamada a service (NO prisma directo)
5. `revalidatePath/revalidateTag` si muta datos

**API Routes**:
1. Guard de auth en la primera linea (`requireApiAccess()` o equivalente)
2. Ownership check antes del primer read/write (`findFirst({ where: { id, userId } })`)
3. Upload: validar `file.size` del servidor, NO metadata del cliente

**Services** (si reciben FK del cliente: `userId`, `causaId`, `clienteId`, etc.):
1. Para CADA `create()` o `update()` con FK del cliente -> verificar que hay `findFirst` del FK ANTES
2. Si no hay -> es bug de aislamiento, reportar como Critico

### Check F: Zod y tipos (si `schema` o `action`)

En schemas modificados:

- `.optional().default()` -> incompatible con zodResolver (usar required + defaultValues)
- `error.flatten()` -> deprecado en Zod 4 (usar `z.flattenError(error)`)
- `new Date(v)` en transforms -> debe ser `parseDateLocal(v)`
- `!=` o `==` -> debe ser `!==` o `===`

### Check G: React/Next.js (si `ui`)

En componentes modificados:

- `useParams()` en page dinamica -> debe ser Server Component con props
- `fetch()` a URL propia en Server Component -> usar Prisma directo
- Elementos interactivos anidados (`<button>` dentro de `<button>`)
- `as Type` en datos de DB sin validacion runtime
- `Button size="icon"` sin `aria-label`

### Check I: Multi-tenant (si `service`, `prisma`, o `api` en proyecto multi-tenant)

Si el proyecto tiene extension Prisma multi-tenant:

1. Modelo nuevo en schema.prisma -> tiene `tenantId String` + `@@index([tenantId])` + esta en `TENANT_MODELS`?
2. `db.user.findMany()` -> tiene `where: { tenantId }` explicito? (User NO esta en TENANT_MODELS)
3. Tablas JOIN (`*Clausula`, `*Equipo`, `*Asistente`) -> mutacion por `id` -> verifica ownership del parent?
4. `findUnique({ where: { id } })` sin tenantId/userId -> potencial leak cross-tenant

### Check H: Lint (si cualquier archivo `.ts` o `.tsx`)

```bash
pnpm exec eslint src prisma --quiet 2>/dev/null | head -50
```

**SIEMPRE correr si hubo cambios de codigo.**

### Check J: Scaffold y enforcement (cada 5+ archivos nuevos o en /save)

Ejecutar los scripts de verificacion si existen:

```bash
bash scripts/check-all.sh 2>/dev/null
```

Si no existen los scripts, verificar manualmente:

1. **findMany sin take**: `grep -rn "\.findMany(" src/ --include="*.ts" --include="*.tsx"` → cada uno debe tener `take`
2. **Upload sin validacion**: rutas de upload en `src/app/api/` → deben validar `file.type` y `file.size`
3. **API admin sin auth**: `src/app/api/admin/` → cada route debe tener `auth()` o equivalente
4. **Pages sin metadata**: `src/app/**/page.tsx` publicas → deben tener `metadata` o `generateMetadata`
5. **Archivos scaffold**: `.nvmrc`, `Dockerfile`, `src/lib/env.ts`, `src/lib/types/actions.ts`, error.tsx, loading.tsx

### Check K: Tipos compartidos (si `action` o `ui` con interfaces nuevas)

Buscar interfaces/types definidas localmente que ya existen en `src/lib/types/`:

1. Buscar `interface` o `type` en archivos modificados
2. Si es identica o casi identica a algo en `src/lib/types/` → reportar como Warning
3. Si la misma interface aparece en 2+ archivos → reportar como Warning con sugerencia de extraer

---

## Paso 3: Reporte

```markdown
## /check — Resultado

**Archivos analizados**: [N] ([categorias detectadas])
**Checks ejecutados**: [lista de checks A-H que aplicaron]
**Checks omitidos**: [lista de checks que no aplicaron y por que]

### Hallazgos

#### [Severidad] Check [X]: [Nombre]

- **Archivo**: `path/to/file.ts:NN`
- **Problema**: [descripcion concisa]
- **Fix**: [que hacer]

### Resumen

| Severidad    | Cantidad               |
| ------------ | ---------------------- |
| Critico      | N                      |
| Warning      | N                      |
| OK           | N checks sin problemas |

[Si hay criticos]: **Corregir antes de commitear.**
[Si solo warnings]: **Considerar corregir. Ninguno es bloqueante.**
[Si todo OK]: **Codigo limpio. Listo para commit.**
```

### Severidades

- **Critico**: Bugs potenciales, seguridad, datos corruptos ($transaction faltante, auth faltante, `!=`, upload sin validar)
- **Warning**: Calidad/mantenibilidad (DRY, take faltante, patron repetido, tipos duplicados, scaffold faltante)
- **OK**: Check ejecutado sin problemas

---

## Paso 4: Fix automatico (opcional)

**Si hay hallazgos criticos**, preguntar:

> Corrijo los [N] problemas criticos ahora?

Si el usuario acepta, corregir en orden de severidad.
Si no, dejar el reporte como referencia.

**NUNCA corregir automaticamente sin preguntar.**

---

## Reglas

- **LEER los archivos modificados** antes de reportar — no adivinar por nombre
- **NO reportar falsos positivos** — verificar cada hallazgo leyendo el codigo real
- **NO sugerir mejoras no pedidas** — solo reportar problemas de los checks definidos
- **Ser conciso** — una linea por hallazgo, no parrafos explicativos
- Si un check no encuentra problemas, listar como OK en el resumen, no detallar
- Si no hay archivos de codigo modificados, reportar rapido y terminar
