---
name: security-audit
description: 'Auditoría de seguridad: ownership, auth guards, campos de control, endpoints públicos. Ejecutar después de modificar API routes, services con writes, o modelos nuevos.'
model: sonnet
---

# Security Audit

Auditoría de seguridad enfocada en lo que `/check` no ve: aislamiento de datos, ownership, campos de control, y sesión vs DB.

Ejecutar DESPUÉS de: API routes nuevas/modificadas, services con writes, modelos nuevos, endpoints públicos, o antes de release.

---

## 1. API Routes — guard central

```bash
grep -r "export async function" src/app/api --include="*.ts" -l
grep -r "requireApiAccess\|getSession\|requireSession" src/app/api --include="*.ts" -l
```

Comparar ambas listas. ¿Hay routes en la primera que no están en la segunda?

- [ ] Toda route con datos de usuario tiene guard de auth al inicio
- [ ] No hay auth inline ad-hoc en routes sensibles
- [ ] Las routes públicas están excluidas intencionalmente y documentadas

---

## 2. Ownership checks en API routes

```bash
grep -n "findUnique.*where.*id" src/app/api --include="*.ts" -r
```

Para cada resultado: ¿tiene solo `{ where: { id } }` sin userId/tenantId?

- [ ] Toda route con ID de recurso usa `findFirst({ where: { id, userId } })` — nunca `findUnique({ where: { id } })` solo
- [ ] Mutaciones (update/delete) verifican ownership antes de operar

---

## 3. [Multi-tenant] Tablas JOIN — ownership via parent

> Saltar si el proyecto es single-tenant.

Buscar tablas JOIN del proyecto (sin `tenantId` directo) y verificar:

```bash
# Ajustar con los nombres de modelos JOIN del proyecto
grep -n "\.\(update\|delete\|upsert\)(" src/lib/services --include="*.ts" -r | grep -i "join\|equipo\|clausula\|asistente"
```

- [ ] Toda mutación sobre tablas JOIN verifica el parent con tenantId antes de operar
- [ ] No hay `update({ where: { id } })` sin join al parent

---

## 4. [Multi-tenant] FK de entrada sin ownership check

> Saltar si el proyecto es single-tenant.

```bash
# Buscar FKs de entrada en services — ajustar con los nombres del proyecto
grep -n "clienteId\|causaId\|entityId" src/lib/services --include="*.ts" -r | grep -v "where.*tenantId"
```

- [ ] Para cada FK recibido del cliente: hay `findFirst({ where: { id: fkId, tenantId } })` ANTES del write
- [ ] Si retorna null → throw

---

## 5. Campos de control — verificar enforcement

Identificar campos de control en el schema (`activo`, `expiresAt`, `deletedAt`, etc.) y verificar que aparecen en TODOS los query sites donde deberían:

```bash
grep -rn "deletedAt" src --include="*.ts"
grep -rn "activo\|isActive" src/lib --include="*.ts"
grep -rn "expiresAt\|tokenExpires" src --include="*.ts"
```

- [ ] Cada campo de control está en el WHERE de TODOS los queries relevantes
- [ ] No hay query que seleccione registros sin el filtro de control correspondiente

---

## 6. Endpoints públicos (sin auth)

Para cada endpoint público o page con token:

- [ ] Valida `expiresAt > now()` si existe en el modelo
- [ ] Incluye `deletedAt: null` si el modelo tiene soft-delete
- [ ] Tiene protección anti-replay si es una acción one-time

---

## 7. Estado de usuario — sesión vs DB

```bash
grep -n "session.*delete\|deleteMany.*session" src/lib/services --include="*.ts" -r
```

- [ ] El guard verifica `user.activo` contra DB (no solo la sesión cacheada)
- [ ] Al desactivar usuario → se borran sus registros de la tabla `session`

---

## 8. Upload de archivos

- [ ] El límite de tamaño usa `file.size` del servidor — no valor declarado por el cliente
- [ ] El buffer se lee DESPUÉS de validar el tamaño
- [ ] El tipo MIME se valida server-side

---

## 9. [Con IA] Autorización granular

> Saltar si el proyecto no tiene features de IA que acceden a datos.

```bash
grep -rn "DEFAULT_.*PERMISSION\|defaultPermission" src --include="*.ts"
```

- [ ] Features de IA respetan permisos del usuario — no exponen todo por estar autenticado
- [ ] No hay defaults permisivos que abran acceso sin ACL explícito
- [ ] Prueba negativa: usuario con rol limitado → la IA no devuelve datos que la UI le oculta

---

## Veredicto

| Área                        | Estado | Notas |
| --------------------------- | ------ | ----- |
| API Routes — guard          |        |       |
| Ownership en routes         |        |       |
| JOIN tables (multi-tenant)  |        |       |
| FK de entrada (multi-tenant)|        |       |
| Campos de control           |        |       |
| Endpoints públicos          |        |       |
| Sesión vs DB                |        |       |
| Upload                      |        |       |
| Autorización granular (IA)  |        |       |

**GO** = áreas relevantes OK → se puede mergear/deployar
**NO-GO** = ítem crítico sin resolver → no mergear hasta resolverlo
