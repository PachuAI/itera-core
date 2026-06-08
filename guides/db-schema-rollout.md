# Schema rollout en producción via manifest manual

Método canónico para aplicar cambios de schema (DDL, índices, enums) sobre una DB objetivo desde local, con manifest versionado, historial propio y verify antes/después.

Este es el **carril 3** de la doctrina de DB ops ITERA:

- Carril 1: seed / reset / provision de datos de aplicación → `guides/seed-via-api.md`
- Carril 2: query / `pg_dump` / `pg_restore` / GUI tools → `guides/db-via-tunnel.md`
- Carril 3: schema rollout → este documento

**No usa** `prisma migrate deploy`. Tampoco depende de `_prisma_migrations`. El historial vive en `schema_rollout_history`.

---

## Cuándo usar este método

- `ALTER TABLE`
- `CREATE INDEX` / `DROP INDEX`
- `ALTER TYPE`
- SQL manual que cambia estructura
- Verificación de drift antes y después del apply

**No usar** para:

- Seeds, resets, provisioning o datos de aplicación → carril 1
- Queries ad-hoc, backups, restores o GUI tools → carril 2

---

## Prerrequisitos

- `DATABASE_URL` apuntando a la DB objetivo
- Backup fresco antes de cualquier apply productivo
- Repo con:
  - `scripts/manual-schema-rollout.ts`
  - `prisma/manual/rollout-manifest.json`
  - scripts `pnpm db:migrate:prod` y `pnpm db:schema:verify`

Los datos específicos de cada repo viven en su `CLAUDE.md` o en su doc local de schema rollout. Acá vive solo el método.

---

## Qué define el manifest

`prisma/manual/rollout-manifest.json` define:

- baseline operativo del repo
- lista ordenada de archivos SQL ejecutables
- checks críticos esperados post-apply
- fuente de verdad para checksums contra `schema_rollout_history`

Un repo nuevo puede arrancar con baseline explícito y `files: []` si su estado actual ya coincide con `prisma/schema.prisma`.

---

## Procedimiento A — Agregar entrada al manifest

1. Crear el archivo SQL bajo la convención del repo. Ejemplo típico: `prisma/manual/executable/20260421_add_x.sql`
2. Agregar el path a `files[]` respetando orden de ejecución.
3. Agregar checks críticos mínimos si el cambio los requiere:
   - `criticalTables`
   - `criticalColumns`
   - `criticalUniqueIndexes`
   - `criticalEnums`

Regla: el SQL y el manifest se editan juntos. Si cambia el SQL después de aplicado, el checksum debe fallar y obligar a corregir el proceso en vez de mutar historia silenciosamente.

---

## Procedimiento B — Verify antes del apply

```bash
pnpm db:schema:verify
```

El verify debe dejar claro uno de estos estados:

- verde: sin drift y sin desajustes de historial
- rojo por drift real entre DB y `prisma/schema.prisma`
- rojo por manifest/checksum/historial

Si el verify da rojo, resolver eso ANTES del apply.

Si querés inspeccionar pendientes sin aplicar nada:

```bash
tsx scripts/manual-schema-rollout.ts plan
```

---

## Procedimiento C — Backup antes de tocar prod

Backup es requisito, no sugerencia.

Usar el carril 2 para abrir tunnel y sacar dump fresco:

- método: `~/projects/itera-core/guides/db-via-tunnel.md`
- caso típico: `pg_dump -Fc --no-owner --no-privileges ...`

No duplicar acá los comandos del tunnel; el método ya vive en esa guía.

---

## Procedimiento D — Apply

```bash
pnpm db:migrate:prod
```

Comportamiento esperado:

- aplica solo los archivos pendientes
- cada archivo SQL corre dentro de una transacción propia
- registra checksum en `schema_rollout_history`
- rehúsa continuar si detecta checksum distinto para un archivo ya aplicado

Si el runner falla a mitad de un archivo, esa transacción se revierte completa.

---

## Procedimiento E — Verify posterior

```bash
pnpm db:schema:verify
```

El estado final esperado es:

- sin drift contra `prisma/schema.prisma`
- sin faltantes en checks críticos
- sin mismatches de checksum

Si el verify posterior no queda verde, el rollout no está cerrado aunque el SQL haya corrido.

---

## Procedimiento F — Registrar historial operativo

Además de `schema_rollout_history` en la DB, registrar el rollout en la documentación viva del repo:

- `CLAUDE.md`
- `.planning/STATE.md`
- o el doc operativo local equivalente

Registrar:

- fecha exacta
- DB objetivo
- backup usado
- archivos SQL aplicados
- resultado del verify post

---

## Limitación actual del runner

Cada archivo SQL corre dentro de una transacción.

Eso implica que hoy **no soporta**:

- `CREATE INDEX CONCURRENTLY`
- `DROP INDEX CONCURRENTLY`
- `REINDEX CONCURRENTLY`
- operaciones que PostgreSQL obligue a correr fuera de transacción

Si aparece ese caso, extender el runner antes del apply.

---

## Gotchas reales ya observados

1. **Enums mal declarados en el manifest**: el verify puede dar rojo si los valores listados no coinciden exactamente con PostgreSQL.
2. **CamelCase vs snake_case en índices únicos**: Prisma puede definir columnas lógicas en camelCase mientras PostgreSQL persiste nombres físicos en snake_case. El verificador debe contemplar ambas formas.
3. **DB creada con `db push` y sin `_prisma_migrations`**: eso no bloquea este método. Es justamente el caso que este carril resuelve.

Cuando `pnpm db:schema:verify` falla, validar primero si el rojo es del manifest/parser o si el drift es real.

---

## Repos que implementan este método

| Repo | Estado | Datos específicos en |
|---|---|---|
| `shope-ar` | adoptado 2026-04-21 | `shope-ar/CLAUDE.md` § "Schema rollout" |
| `itera-lex` | sistema original, alineado a guía unificada | `itera-lex/.planning/guides/SCHEMA-ROLLOUT.md` |

Al agregar un repo nuevo: sumar fila acá + crear su sección o doc repo-específico con manifest, baseline y convenciones locales. **No duplicar el método**.
