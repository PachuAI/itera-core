---
name: skill-refactorizacion-shope-ar
description: Refactorizar features mixtas de Shopear con cortes iterativos por seam, preservando tenant-by-host, contratos client-to-API estables y el comportamiento runtime de Next.js 16 antes de rediseñar semántica o arquitectura.
---

# Skill Refactorizacion Shope Ar

Usar este skill cuando una feature de Shopear mezcla UI, efectos cliente, páginas App Router, API routes, server actions, auth o provisioning y hace falta bajar complejidad sin romper onboarding, multi-tenant o contratos legacy.

Es la variante repo-specific para este proyecto. Toma la estrategia de corte incremental de los otros SaaS, pero agrega invariantes propias de Shopear: tenant resuelto por host, onboarding client-initiated contra endpoints estables, auth multi-subdomain y chequeos runtime que lint no detecta.

## Outcome

- archivos más chicos con una razón dominante de cambio
- seams explícitos entre render, view-model, guards, cache y efectos
- contratos públicos preservados antes de rediseñar comportamiento
- invariantes de tenant/auth/onboarding concentradas en los bordes
- tests más cerca de la lógica extraída

## Bootstrap

1. Leer `CLAUDE.md` y `AGENTS.md`.
2. Leer `package.json` y `.planning/GUARDRAILS.md`.
3. Leer la spec o doc viva del feature si existe en `docs/` o `.planning/`.
4. Mapear solo la superficie del módulo:
   - rutas/page/layout
   - componentes client/server
   - API routes o server actions
   - helpers de auth, host, cache y tenancy
   - tests existentes
5. Inspeccionar commits recientes del área para detectar seams ya abiertos o deuda pagada.
6. Si vas a tocar cache, dynamic APIs, metadata, routing o behavior App Router y existe `node_modules/next/dist/docs/`, leer la guía relevante de Next 16.

## Invariantes De Shopear

- Tenant por host solamente. No inferir `storeId` desde params, body o estado cliente.
- Flujos client-initiated de auth/onboarding/admin crítico prefieren `fetch('/api/...')` o `authClient`; no meter Server Actions directo dentro de Client Components salvo razón muy fuerte.
- Guards de auth, ownership, cache tags y revalidation se quedan en el boundary; no se filtran a helpers leaf.
- Redirects y URLs cross-host se arman con helpers de request/host, no concatenando strings.
- Onboarding pendiente puede depender de `PendingStore` + cookie `onboarding_pending` + sesión. No mover una pieza sin revisar las otras dos.
- En este stack lint no alcanza: cualquier cambio en App Router/auth/cache se valida también con `build`.

## Seams Priorizados

1. `view-model seam`
   Mover labels, defaults, taxonomías, validaciones derivadas y disabled states fuera del componente gigante.
2. `shared taxonomy seam`
   Si wizard, aside, summary o cards duplican labels/metadata, extraer módulo compartido antes de seguir puliendo UI.
3. `route shell seam`
   Separar resolver/redirect/guards de la UI cuando una page mezcla host/session/pending-state/render.
4. `client-to-API seam`
   Si un Client Component mezcla fetch, payload assembly, loading y copy, aislar payload/view-state sin romper el endpoint estable.
5. `pending onboarding seam`
   Resolver en un helper la relación entre cookie, sesión y `PendingStore` antes de tocar pantallas de registro/verificación/crear tienda.
6. `guard/cache seam`
   Auth, tenant ownership y cache invalidation viven en helpers o boundaries dedicados; no en leaves.
7. `provisioning boundary seam`
   En acciones grandes, extraer helpers puros de claim/restore/cleanup/serialization antes de rediseñar reglas de negocio.

## Execution Loop

1. Congelar contrato.
   Listar inputs, outputs, side effects, redirects, guards, cache tags y expectativas del caller.
2. Elegir un solo seam con alto retorno y bajo radio de ruptura.
3. Extraer primero la parte más estable.
   Preferir config, view-model, helpers puros o adapters antes que reescribir semantics.
4. Rewire imports y compilar temprano.
5. Agregar o mover tests hacia la pieza nueva.
6. Medir si el archivo original realmente bajó en branching y razones de cambio.
7. Frenar si el siguiente paso ya implica rediseño de producto, arquitectura o semántica de provisioning.

## Heurísticas

- Si el valor del refactor es solo “quedó más prolijo”, todavía no encontraste el seam correcto.
- Si un wizard repite labels, metadata o navegación entre varias piezas, extraer shared config casi siempre paga primero.
- Si una page de onboarding mezcla sesión, pending store y redirects, partir por route shell antes que por componentes visuales.
- Si un helper cruza server/client boundary sin declararlo, retroceder: ese corte está mal elegido.
- Si una acción server crece mucho, extraer helpers puros y dejar auth/tenant/revalidate en la acción.
- Si el refactor exige cambiar contratos serializados, endpoint URLs o reglas de negocio, hacerlo en otra iteración.
- Si tocás mocks de `headers()`, `cookies()`, `auth()` o helpers de store context, actualizarlos en el mismo cambio.

## Validación

1. `pnpm run typecheck`
2. `pnpm run lint`
3. Tests focalizados del seam extraído
4. `pnpm run build` si tocaste App Router, auth, cache, rutas, Prisma o client/server seams sensibles
5. `pnpm run quality:check` antes de cerrar el corte

## Deliverable

- explicar qué seam se aplicó y por qué
- indicar qué contrato público quedó estable
- listar tests/validaciones corridas
- dejar el siguiente punto de corte recomendado
- anotar deuda que se difirió a propósito

## Referencias

- Patrones y seam map del onboarding actual: `references/onboarding-seams.md`
