---
name: skill-refactorizacion-shope-ar
description: Refactorizar features mixtas de Shopear con cortes iterativos por seam, preservando tenant-by-host, contratos client-to-API estables y el comportamiento runtime de Next.js 16 antes de rediseñar semántica o arquitectura.
---

# Skill Refactorizacion Shope Ar

Variante **repo-specific** del método de `seam-construction`, aplicada a Shopear (Next.js 16, multi-tenant **por host**).

> **El método de seams vive en `seam-construction`** — catálogo, execution loop, seam quality test, core rules y red flags. Aplicá ESE método y sumale las invariantes y seams propios de Shopear de abajo. Este skill solo aporta lo del repo.

## Bootstrap (Shopear)

1. Leer `CLAUDE.md`, `AGENTS.md`, `package.json`, `.planning/GUARDRAILS.md`.
2. Leer la spec/doc viva del feature si existe en `docs/` o `.planning/`.
3. Mapear solo la superficie del módulo: rutas/page/layout · componentes client/server · API routes o server actions · helpers de auth/host/cache/tenancy · tests existentes.
4. Inspeccionar commits recientes del área (seams ya abiertos / deuda pagada).
5. Si vas a tocar cache/dynamic APIs/metadata/routing/behavior App Router y existe `node_modules/next/dist/docs/`, leé la guía Next 16.

## Invariantes de Shopear (sumar al método)

- **Tenant por host solamente.** No inferir `storeId` desde params, body o estado cliente.
- Flujos client-initiated de auth/onboarding/admin → `fetch('/api/...')` o `authClient`; evitar Server Actions dentro de Client Components salvo razón muy fuerte.
- Guards de auth/ownership, cache tags y revalidation en el **boundary**, no en leaves.
- Redirects/URLs cross-host con helpers de request/host, no concatenando strings.
- Onboarding pendiente = `PendingStore` + cookie `onboarding_pending` + sesión: **no mover una pieza sin revisar las otras dos**.
- Lint no alcanza en este stack: cambios en App Router/auth/cache se validan también con `build`.

## Seams priorizados (Shopear)

`view-model` · `shared taxonomy` (labels/metadata duplicados en wizard/aside/summary/cards) · `route shell` (resolver/redirect/guards vs UI) · `client-to-API` (aislar payload/view-state sin romper el endpoint estable) · `pending onboarding` (cookie ↔ sesión ↔ `PendingStore`) · `guard/cache` · `provisioning boundary` (helpers puros de claim/restore/cleanup/serialization). Detalle: `references/onboarding-seams.md`.

## Validación (Shopear)

`pnpm run typecheck` → `pnpm run lint` → tests focalizados del seam → `pnpm run build` (si tocaste App Router/auth/cache/rutas/Prisma o client-server seams) → `pnpm run quality:check` antes de cerrar.

## Resources

- Método base de seams: skill **`seam-construction`**.
- Patrones y seam map del onboarding actual: `references/onboarding-seams.md`
