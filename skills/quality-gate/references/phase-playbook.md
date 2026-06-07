# Quality Gate Playbook

## Core Phases

1. Mechanical gate
2. Structure and anti-drift
3. Next.js App Router and React correctness
4. Data layer and Prisma safety
5. Security
6. Multi-tenancy
7. Performance
8. Testing
9. Deploy and operations
10. Readability, maintainability, and low-confidence code
11. Timezone and localization

Read the artifact logs first, then inspect only the files implicated by the failing command or grep hit.

## Scan → Phase Map

Cada archivo en `artifacts/scans/` existe para alimentar una fase específica. Consultá la tabla antes de abrir código — el grep ya corrió, no lo repitas.

Columna **Tipo** define cómo interpretar el scan:

- **verdict**: cada hit = finding real. Reportar directo con `archivo:línea`. No hace falta re-verificar contexto.
- **checklist**: cada hit = "revisá este path". El agente debe leer el contexto y descartar falsos positivos antes de convertir en finding.

| Scan file                              | Tipo      | Phase | Qué buscar al leer                                                                    |
| -------------------------------------- | --------- | ----- | ------------------------------------------------------------------------------------- |
| `silent-catches.txt`                   | verdict   | 2     | Catches que descartan errores sin feedback ni logging.                                |
| `barrel-exports.txt`                   | verdict   | 2     | `export *` que pueden ocultar símbolos o romper tree-shaking.                         |
| `ts-escape-hatches.txt`                | checklist | 2     | `@ts-ignore`, `@ts-expect-error`, `eslint-disable` — verificar si hay comentario que justifique. |
| `largest-tsx.txt`                      | checklist | 2,10  | Archivos >300 líneas candidatos a split; revisar mezcla de responsabilidades.         |
| `findmany.txt`                         | checklist | 4     | Inventario completo de `.findMany(`. Usar como referencia, NO como lista de findings. |
| `findmany-no-take.txt`                 | verdict   | 4     | Cada hit = `.findMany(` sin `take` cercano = unbounded read.                          |
| `prisma-raw.txt`                       | verdict   | 4,6   | `$queryRaw`/`$executeRaw` — validar predicado tenant en cada uno.                     |
| `transactions.txt`                     | checklist | 4     | Contrastar con escrituras múltiples que deberían estar dentro de `$transaction`.      |
| `next-dynamic-apis.txt`                | checklist | 3     | Verificar `await` en `params`/`searchParams`/`headers()`/`cookies()`.                 |
| `next-revalidation.txt`                | checklist | 3     | `revalidatePath` donde correspondería `revalidateTag`; tags sin scope de tenant.      |
| `next-cache-signatures.txt`            | verdict   | 3     | `revalidateTag` con firma sospechosa (1 arg o demasiados args en la misma línea).     |
| `client-components.txt`                | checklist | 3,5   | `'use client'` en archivos que podrían ser server components.                         |
| `icon-buttons.txt`                     | checklist | 3     | `size="icon"` o `Icon*` sin `aria-label` cerca.                                       |
| `locale-date-without-timezone.txt`     | verdict   | 11    | `toLocaleDateString(` sin `timeZone:` dentro del bloque de opciones.                  |
| `date-parsing.txt`                     | checklist | 11    | Inventario de `new Date(`. Los relevantes son `new Date(someStringVar)` sin T/Z.      |
| `tenant-scope.txt`                     | checklist | 6     | Referencias a `storeId`/`tenantId`/`orgId` — validar ownership en call sites críticos.|
| `browser-storage.txt`                  | checklist | 6     | `localStorage`/`sessionStorage` sin namespace por `storeId`/`tenantId`.               |
| `console-calls.txt`                    | checklist | 10    | `console.*` en flujos de usuario en lugar de feedback accionable.                     |
| `any-types.txt`                        | verdict   | 10    | `: any`, `<any>`, `as any` en bordes de datos (DB, API, forms).                       |
| `img-tags.txt`                         | checklist | 7     | `<img>` donde correspondería `next/image`.                                            |
| `env-usage.txt`                        | checklist | 5     | Cruzar con `src/lib/env.ts` para validar que están declarados.                        |
| `client-env-leak.txt`                  | verdict   | 5     | **Release-blocker.** `NEXT_PUBLIC_*` y `NODE_ENV` filtrados por el script.            |
| `client-secret-names.txt`              | checklist | 5     | Identificadores tipo `API_KEY`/`SECRET_KEY` en `'use client'` — validar caso por caso.|

Regla: si un scan está vacío o con marcador `# sin hits`, la fase correspondiente parte con **cero findings de esa categoría** — no "buscar en otro lado por las dudas".

Regla para **verdict scans**: cada línea del scan se convierte directo en un finding del reporte. Si el scan sale vacío, cero findings de ese tipo.

Regla para **checklist scans**: el agente lee el contexto (file + líneas alrededor del hit) y decide si es finding. Si 3+ hits en un scan resultan ser falsos positivos, reportar la imprecisión del scan como señal para mejorar el skill, no como ruido a absorber.

## Bootstrap Reads

Stack-assumed (read always if present; missing = signal, not crash):

- `CLAUDE.md`
- `package.json`
- `tsconfig.json`
- `next.config.*`
- `prisma/schema.prisma`
- `src/lib/env.ts`, `lib/env.ts`, or equivalent env validation module
- `src/lib/auth.ts`, `lib/auth.ts`, or equivalent BetterAuth setup

Project-specific (read only if present; skip silently otherwise):

- `src/lib/stores/request-host.ts`, `lib/stores/request-host.ts`, or equivalent tenant/host resolver
- `scripts/quality-check.mjs` (or `scripts/quality-check.*`)
- `.planning/quality-gate-report.md` (baseline para comparación)
- `.claude/commands/security-audit.md`
- `docs/` (source-of-truth del proyecto: schema, api, admin, brand, etc.)
- `AGENTS.md`
- route-specific `loading.tsx`, `error.tsx`, `layout.tsx` implicados por los scans

For Next.js 16 issues, consult these local docs when available:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`
- `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
- `node_modules/next/dist/docs/01-app/02-guides/multi-tenant.md`

## Phase 1. Mechanical Gate

Use the logs from `scripts/check-all.sh`.

Required commands for a final gate:

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`
- `pnpm run build`
- `pnpm run quality:check` (or `quality-check`, `check:quality`, `check-quality`)

If any of those fail:

- the report must mention the failure in `CRÍTICOS` or `ALTOS`
- the numeric score cannot exceed `6.5/10`

## Phase 2. Structure and Anti-Drift

Primary searches:

- `catch {}` or catches that discard errors
- `export *` barrels
- `@ts-ignore`, `@ts-expect-error`, `eslint-disable`
- files with many lines
- files outside the expected `src/prisma/docs/.planning` conventions

Audit for:

- silent catches
- repeated utilities that should live in shared modules
- giant TSX files with UI, validation, fetching, and mutations mixed together
- patterns that contradict repo guardrails from `CLAUDE.md`

Flag as `ALTO` when:

- the drift creates bug risk, duplicate logic, or hidden behavior

Flag as `MEDIO` when:

- the issue mostly hurts maintainability but not correctness yet

## Phase 3. Next.js and React Correctness

Look for:

- `params`, `searchParams`, `headers()`, `cookies()` used without `await`
- dynamic pages implemented as client components without a strong reason
- missing `error.tsx` or `loading.tsx` where the route does heavy async work
- metadata gaps on public pages
- `revalidatePath` broad invalidation where tags should be used
- `use client` files that contain mostly server-safe code
- missing `key` in `.map()`
- icon-only buttons without `aria-label`
- hydration risks from `window`, `Date.now()`, `Math.random()`, or syncing props to state in render

Next.js 16 specifics to verify:

- `params` and `searchParams` are awaited in App Router server entries
- `headers()` and `cookies()` are awaited
- `revalidateTag(tag, 'max')` is preferred when stale-while-revalidate is acceptable
- `updateTag()` is considered for read-your-own-writes flows
- `next-cache-signatures.txt` is best-effort only: confirm suspicious `revalidateTag(...)` callsites manually before reporting

## Phase 4. Data Layer and Prisma Safety

Look for:

- multi-write flows without `$transaction`
- `findMany` without `take` on potentially large tables
- missing `@@index` on foreign keys or frequent filters
- raw Prisma errors leaking to the user
- missing handling for `P2002`, `P2025`, `P2003`
- check-then-write race conditions
- `Decimal` or `Date` objects crossing into client components without normalization

Flag as `CRÍTICO` when:

- data corruption, lost updates, or inconsistent writes are plausible

## Phase 5. Security

Look for:

- missing auth guards in server actions or route handlers
- env access without validation in `src/lib/env.ts`
- unsafe redirects
- unvalidated dynamic `href`/`src`
- XSS through user content or JSON-LD/script injection
- upload validation gaps
- timing leaks or existence leaks in auth/reset flows
- ID-based fetches or mutations without ownership validation
- secrets leaking to the client bundle: any `process.env.X` that is NOT `NEXT_PUBLIC_*` or `NODE_ENV` used inside a `'use client'` file (check `scans/client-env-leak.txt`)
- env vars used in code but not declared in `src/lib/env.ts` (cross-reference `scans/env-usage.txt`)
- hardcoded tokens, service-role keys, or DSNs in source (check `scans/client-secret-names.txt`)

Flag as `CRÍTICO` when:

- any hit in `scans/client-env-leak.txt` that confirms a real secret (not `NEXT_PUBLIC_*` and not `NODE_ENV`) is reachable in a client module — this is a release-blocker regardless of other scores

Use `.claude/commands/security-audit.md` as a secondary checklist when relevant.

## Phase 6. Multi-Tenancy

This phase is release-blocking for any multi-tenant SaaS repo.

Most critical patterns:

- tenant-owned models queried without `storeId`, `tenantId`, or equivalent ownership relation
- `findUnique({ where: { id } })` followed by update/delete on tenant-owned rows
- nested relations loaded across stores without validation
- tenant resolved from client-controlled input instead of request host/context
- `localStorage` and `sessionStorage` keys not namespaced by `storeId`, `tenantId`, or an equivalent tenant key
- cache tags or invalidation missing tenant scope
- actions that receive an entity `id` but have no cross-tenant/IDOR test
- raw SQL over tenant-owned tables without explicit tenant predicate

Global models to treat carefully before flagging:

- `User`
- `Account`
- `Session`
- `Verification`
- `Plan`
- `PendingStore`
- `SignupRateLimit`
- `PlatformAdmin`
- `PlatformAuditLog`

Tenant-owned models that normally require tenant scope:

- `StoreMember`
- `Subscription`
- `SubscriptionPayment`
- `Category`
- `Product`
- `Tag`
- `Lead`
- `Customer`
- `SiteConfig`
- `Coupon`
- `Order`
- `InternalComment`
- `OrderItem`
- `Payment`
- `CashMovement`
- `AnalyticsEvent`

Flag as `CRÍTICO` when:

- a user from store A could read or mutate store B data
- the host-derived tenant boundary is bypassed

## Phase 7. Performance

Look for:

- N+1 Prisma reads in loops
- serial awaits that should be `Promise.all`
- `<img>` where `next/image` is the right choice
- over-broad cache invalidation
- client components doing work that can live on the server

Only report performance issues that are real and evidence-backed.

## Phase 8. Testing

Look for:

- actions without success + validation + permission tests
- multi-tenant writes without IDOR tests
- host-resolution code without direct tests
- missing e2e around onboarding, auth, and cross-tenant flows
- mocks that no longer match Prisma shapes

If a risky module has no coverage, report it even if the test suite passes.

## Phase 9. Deploy and Operations

Look for:

- Dockerfile not multi-stage
- missing `.dockerignore`
- missing or stale `engines`
- scripts that do not reflect the actual workflow
- `pnpm audit` high issues worth action
- no health or release verification path

## Phase 10. Readability, Maintainability, and Low-Confidence Code

Objective heuristics only. Report under:

- `Legibilidad`
- `Mantenibilidad`
- `Código de baja confiabilidad`

Signals of low-confidence code:

- `any` or broad casts at data boundaries
- `@ts-ignore` without a reason
- `catch` that returns `null`, `[]`, or `false` without feedback
- `console.log/error` used instead of actionable handling in user flows
- generic helper abstractions used once
- dead branches, stale flags, unreachable code
- copied code that contradicts repo guardrails
- components mixing fetching, validation, mutations, routing, and rendering in one file

Only report it when there are at least two signals and a concrete maintenance or bug risk.

Readability heuristics:

- functions over ~50 lines with multiple responsibilities
- TSX files over ~300 lines
- vague names (`data`, `item`, `tmp`, `handleThing`) in complex flows
- magic numbers or strings without named constants
- comments explaining the obvious instead of the reason

## Phase 11. Timezone and Localization

Look for:

- `toLocaleString` / `toLocaleDateString` on the server without explicit `timeZone`
- `new Date(string)` where the repo expects `parseDateLocal`
- inconsistent es-AR strings
- money formatting inconsistent with ARS integer rules

For Shopear, favor:

- `America/Argentina/Buenos_Aires`
- shared date/format helpers
- field-aware validation messages in Spanish

## Severity Rubric

Use this rubric consistently:

- `CRÍTICO`: cross-tenant leak, auth bypass, destructive race, broken build, data corruption, release blocker
- `ALTO`: realistic production bug, stale cache after mutation, broken contract, missing cleanup, missing critical test coverage
- `MEDIO`: maintainability debt with near-term bug risk, incomplete loading/error states, weak feedback, performance issue with evidence
- `BAJO`: polish, consistency, or non-blocking readability debt

Effort rubric:

- `S`: localized change, small test update
- `M`: multiple files or one flow
- `L`: architectural refactor or many call sites

Risk rubric:

- **Riesgo = probabilidad de que el bug llegue a prod × blast radius si llega.**
- `alto`: alta probabilidad (flujo ejecutado en producción hoy) y blast radius que cruza tenants, auth, pagos, o corrompe datos.
- `medio`: probabilidad media (flujo menos frecuente o gated por estado) o blast radius limitado a un tenant / una feature.
- `bajo`: baja probabilidad (camino frío, caso borde) y blast radius acotado a UX o polish.

Evidence rule:

- **Si no podés apuntar a `archivo:línea` concreto, el finding se descarta.** No se aceptan hallazgos "por olfato" ni "parece que...". Evidencia o nada.
- Cada finding debe citar el artefacto que lo respalda: log de comando, scan file, o path+línea leído directamente.

## Scoring

Always produce:

- one global score `/10`
- one score per phase

Recommended weighting:

- Security: 20%
- Multi-tenancy: 20%
- Data layer and Prisma: 15%
- Next.js and React correctness: 15%
- Testing: 10%
- Performance: 8%
- Structure and anti-drift: 6%
- Readability and maintainability: 4%
- Deploy and operations: 2%

Score caps:

- any `CRÍTICO` => verdict `NO-GO`
- 3 or more `ALTOS` across Security, Multi-tenancy, or Data => global cap `6/10`
- failing `build` or `typecheck` => global cap `5/10`
- failing `test:run` => global cap `6/10`
- failing `quality:check` => global cap `6/10`
- any hit en `scans/client-env-leak.txt` confirmado como secreto real => `NO-GO` (no importa lo que pase con el resto)

## Output Length Cap

El reporte no es un dump exhaustivo. Límites duros:

- Máx **10 findings por severidad** en el reporte (`CRÍTICOS`, `ALTOS`, `MEDIOS`, `BAJOS`). Si hay más, elegí los de mayor riesgo y cerrá la sección con `- … +N hallazgos similares en <scan_file>`.
- Cada finding: **1 línea** siguiendo el formato exacto del template. No agregar párrafos explicativos — el detalle va en el scan file o log referenciado.
- `Fortalezas`: máx 5 bullets, evidencia explícita.
- `Quick wins` / `Estabilización` / `Escala`: máx 5 bullets cada una.

El auditor humano que lea el reporte tiene que poder procesarlo en <10 minutos. Si excede ese presupuesto, el reporte falló aunque los findings sean correctos.

## Baseline Comparison

If `.planning/quality-gate-report.md` exists:

- compare new findings against prior categories and files
- classify each notable item as `resuelto`, `regresión`, `persiste`, or `nuevo`
- avoid claiming “resolved” unless current evidence shows it is gone
