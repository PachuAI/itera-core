# [Nombre del Proyecto]

[Una linea describiendo que es]

## Proceso

1. Planificar antes de codear: disenar pantallas/flujo UX. Implementar DESPUES de aprobacion.
2. Verificar en navegador: resultado verificable en `localhost:3000` al final de cada feature.
3. **Lint obligatorio**: correr `pnpm lint` despues de terminar cambios y ANTES de commitear.
4. **Lint en Windows**: si `pnpm lint` falla por paths con espacios -> fallback: `pnpm exec eslint src prisma` directo.
5. Referencias en `.planning/` — STATE.md en raiz. Producto en `product/`. Guias operativas en `guides/`. Checklists en `audits/`. Las reglas preventivas viven inline en la seccion Guardrails de este archivo (ya no hay `GUARDRAILS.md`).
6. **Write tool**: archivos >300 lineas -> Write esqueleto base + Edit en partes -> NUNCA 1-shot con todo el contenido (falla con "missing content").
7. **Auditoria de seguridad**: despues de agregar/modificar API routes, services con writes, modelos nuevos, o endpoints publicos -> correr `.planning/audits/SECURITY-AUDIT.md` -> cubre IDOR, ownership, campos de control, sesion vs DB.
8. **Auditoria operacional**: despues de agregar/modificar features con IA, integraciones externas, o acciones de dominio sensibles -> correr `.planning/audits/OPERATIONAL-AUDIT.md` -> cubre observabilidad, costos IA sin techo, audit trail dentro de $transaction.
9. **CODEBASE-MAP**: `.planning/CODEBASE-MAP.md` es el indice del sistema — leerlo al entrar en plan mode ANTES de explorar el codigo. Al crear/modificar cualquier service, API route, server action, shared component, schema, util o hook -> actualizar la entrada correspondiente antes de commitear.
10. **Mini-audit por archivo**: al terminar de escribir un action, API route, service o page -> ANTES de pasar al siguiente archivo, verificar los 5 puntos del checklist correspondiente de Guardrails. NO acumular archivos sin verificar.
11. **Tipos compartidos desde el primer uso**: al definir un `type` o `interface` -> si puede usarse en 2+ archivos -> crearlo en `src/lib/types.ts` desde el inicio, NUNCA local. Si ya existe algo similar en `src/lib/types.ts` -> importar, NUNCA redefinir.
12. **Scripts de enforcement OBLIGATORIO**: `bash scripts/check-all.sh` -> correr SIEMPRE antes de commitear, sin excepcion. Exit code 1 = NO commitear hasta resolver. "Los errores son preexistentes" NO es excusa — si el check falla, arreglarlo en esa sesion. No reemplaza `/check` pero atrapa errores mecanicos que se acumulan silenciosamente.
13. **Datos configurables desde admin -> NUNCA hardcodear en componentes publicos**: banners, sliders, mensajes, colores, toggles de features -> SIEMPRE leer de la DB/config (ej: `getCachedSiteConfig()`). El toggle del admin DEBE controlar la visibilidad real en el frontend — hardcodear datos de demo que ignoran el estado del admin es un bug de diseño.

## Convenciones fijas

Estas convenciones son obligatorias en todo proyecto nuevo. No hay alternativas.

- **Route groups**: `(public)` para paginas publicas, `(admin)` para admin — NO usar `(protected)`, `(auth)`, `(dashboard)` como route groups
- **Admin pages**: `src/app/(admin)/admin/` — NO `src/app/admin/(protected)/`
- **Componentes compartidos**: kebab-case — `empty-state.tsx`, NO `EmptyState.tsx` (consistente con shadcn)
- **Types**: flat — `src/lib/types.ts`, NO `src/lib/types/actions.ts` subdirectorio
- **Auth guards en API routes**: `requireApiAccess()` o `getSession()` — importar de `src/lib/session.ts` o `src/lib/auth-action.ts`
- **Services**: `src/lib/services/[modulo].service.ts`
- **Utils**: `src/lib/utils/[nombre].ts`

---

## Scopes de Commits

[auth | db | ui | api | config] — adaptar al proyecto

---

## Guardrails

> Reglas preventivas de errores conocidos del proyecto (que / por que / cuando). Esta seccion es la SSOT — ya no hay `GUARDRAILS.md`. Un error recurrente o no-trivial -> agregar aca una linea concisa (lo hace `/save`). Lo cubierto por el global `~/.claude/CLAUDE.md` queda como remision, no se recopia.

### Checklists de Implementacion

#### Al crear/modificar un service:

- Contar writes -> 2+ writes relacionados -> `$transaction` (incluir audit log DENTRO)
- **Audit log -> SIEMPRE dentro de `$transaction`** — si falla la accion queda sin trazabilidad
- CADA write nuevo -> verificar si la funcion ya tiene `$transaction` -> si no, agregar AHORA
- Verificar que cada modelo en WHERE/ORDER BY tenga `@@index` en schema
- Write que puede fallar + audit despues -> try-catch o meter ambos en $transaction
- **CADA `findMany` -> verificar que tiene `take`** — limite razonable: 100-500. Si no tiene, agregar AHORA.
- **Tablas JOIN sin `tenantId` directo** (tablas intermedias de relaciones N:M o hijas sin tenantId propio) -> mutacion por `id` -> SIEMPRE verificar ownership del parent con `tenantId` antes de operar -> NUNCA `update/delete({ where: { id } })` sin validar la cadena relacional
- **FK de entrada** (`userId`, `entityId`, `parentId`, etc. recibidos del cliente) -> ANTES de `create()` o `update()` -> `db.[modelo].findFirst({ where: { id: fkId } })` (la extension tenant inyecta tenantId; si retorna null = FK de otro tenant o invalido) -> throw -> NUNCA confiar en que la extension protege el create: inyecta tenantId en el modelo CREADO, pero NO valida que los FK dentro de `data` pertenezcan al mismo tenant
- **DESPUES de implementar**: grep `create\|update` en el service -> para CADA uno que recibe FK del cliente -> verificar que hay findFirst del FK ANTES -> si no hay, es bug de aislamiento, no se commitea
- **Cuota/limite con check + consumo** -> SIEMPRE atomico -> patrón: `UPDATE ... SET used = used + 1 WHERE used < limit` (la DB es el lock) -> NUNCA check-then-process-then-increment (race condition)
- **Recurso externo (R2, Drive, S3) persistido antes de procesar** -> el catch DEBE limpiar el recurso -> patron: `try { upload -> process -> save } catch { deleteUploaded -> rethrow }`

#### Al crear/modificar una API route:

- API route sensible -> `requireApiAccess()` en la primera linea + ownership antes del primer read/write -> si no, es bug de seguridad
- Mismo nivel de ownership check que la Server Action equivalente
- Recurso propio del usuario recibido por parametro -> SIEMPRE `findFirst({ where: { id, userId } })` o `{ id, tenantId }` -> NUNCA `findUnique({ where: { id } })` solo
- Upload de archivos -> validar MIME type (whitelist), extension, y `file.size` del servidor -> NUNCA metadata declarada por el cliente
- Upload de imagenes -> whitelist: `['image/jpeg','image/png','image/webp','image/avif','image/gif']` + limite 5MB
- DESPUES de implementar: verificar que la route usa el guard al inicio del handler antes de commitear

#### Al crear/modificar una server action:

- Flujo obligatorio: auth -> authorize -> validate -> service -> audit -> **revalidate**
- CADA action con write -> DEBE tener `revalidatePath()` o `revalidateTag()` al final — sin esto los datos quedan stale
- Verificar: el path de revalidate cubre TODAS las paginas que muestran este dato?

#### Al crear una page:

- SIEMPRE `export const metadata` (estaticas) o `generateMetadata()` (dinamicas) con titulo descriptivo
- Verificar que el route group tenga `error.tsx`
- Considerar `loading.tsx` si la page tiene queries pesadas
- Page con layout fijo (viewport completo, sin scroll de pagina) -> `h-[calc(100svh-3.5rem)] overflow-hidden` en el wrapper -> NUNCA confiar en `h-full` (cadena rota con SidebarProvider que usa `min-h-svh`)

#### Despues de `prisma db push` en dev:

- SIEMPRE reiniciar el dev server -> el cliente Prisma se cachea en memoria -> causa errores `Unknown argument` aunque el schema este correcto

#### Antes de escribir una funcion de formateo/utilidad:

- Buscar en `src/lib/utils/` si ya existe -> NUNCA crear formatDate/formatSize/formatCurrency local
- `toLocaleDateString()` / `toLocaleString()` inline en componentes = PROHIBIDO -> usar `formatDate()` de utils
- Si no existe -> crearla en el util correcto, no en el componente
- ANTES de importar hook de `@/lib/hooks/` -> Grep para verificar que existe -> NO asumir

#### Al implementar un patron UI por 2da vez:

- Al copiar codigo de otro modulo -> PRIMERO grep componentes compartidos en `components/shared/` y `components/ui/`
- Empty states -> usar/crear `<EmptyState />` compartido
- Dialogos de confirmacion -> usar/crear `<ConfirmDialog />` compartido -> `window.confirm()` = PROHIBIDO
- Si el patron ya existe 2+ veces inline -> extraer AHORA

---

### TypeScript / ESLint

- Despues de cambios -> `pnpm lint` — unused imports es el error MAS comun
- ANTES de modificar interface compartida -> grep TODOS los usos -> actualizar cada uno
- ANTES de usar campo/prop -> verificar que existe en schema/interface, no asumir
- Union types -> `'key' in object` para type narrowing, no acceder directo
- Evitar `as Type` en datos de DB/APIs -> validar runtime con `Array.isArray()` o checks
- Object spread con props duplicadas -> spread PRIMERO, props explicitas DESPUES
- SIEMPRE `===` y `!==` -> NUNCA `==` o `!=`
- **Grep de directivas** (`'use client'`, `'use server'`) -> SIEMPRE buscar ambas variantes de comillas (`"use client"` y `'use client'`) -> conteos con una sola variante dan resultados incorrectos

---

### Prisma 7

- Import SIEMPRE desde `@/lib/generated/prisma/client` -> NUNCA `@prisma/client`
- `prisma.config.ts` requerido en raiz (datasource URL ahi, NO en schema.prisma)
- **`prisma.config.ts` DEBE cargar dotenv**: `try { await import("dotenv/config"); } catch {}` en la primera linea -> sin esto `prisma generate` dentro de `pnpm build` falla con `Cannot resolve environment variable: DATABASE_URL`
- `db push` NO es seguro para ENUMs -> SQL manual
- `db push` NO regenera client -> siempre `db push && prisma generate` juntos
- 2+ writes relacionados -> `$transaction` — incluir audit/actividad DENTRO de la transaccion, no despues
- DATABASE_URL en AMBOS `.env` y `.env.local` (CLI lee .env, Next.js runtime lee .env.local)
- Campos en WHERE/ORDER BY frecuentes -> agregar `@@index` (especialmente userId, status, fechas, tenantId)
- `findMany` en tablas que crecen -> SIEMPRE `take` con limite razonable
- **Errores P2002 (unique)** -> catch en create/update con slug o campos unique -> retornar error amigable al usuario
- **Errores P2025 (not found)** -> catch en delete/update -> retornar error amigable en vez de 500 genérico
- **Queries publicas** (sin auth) -> SIEMPRE filtrar por estado (`published: true`, `active: true`) -> NUNCA exponer borradores o inactivos
- **Campos `Decimal`** de Prisma -> NO pasar directo a Client Components -> serializar con `Number(v)` en la page -> crear tipo `SerializedX` con `Omit + { campo: number | null }`
- **Campos `Date`** de Prisma -> NO pasar directo a Client Components -> serializar con `.toISOString()` en la page -> crear tipo con `campo: string`
- Queries ad-hoc desde terminal -> `psql` directo (tablas en snake_case) -> `source .env && psql "${DATABASE_URL%%\?*}" -c "SELECT ..."` -> NUNCA `tsx -e` / `node -e` (Prisma 7 client es ESM-only)
- **Scripts CLI** (`prisma/seed.ts`, `scripts/*.ts` via `tsx`) -> NUNCA importar `@/lib/{auth,env,db}` -> tiran por `import "server-only"` o por validacion Zod de envs que el script ni usa -> patron: instancias locales (`new PrismaClient({ adapter })`, `betterAuth({...})` inline leyendo `process.env.X` puntual)
- **`new PrismaClient(...)` SIEMPRE necesita argumento explicito** -> sin args tira `Cannot read '__internal' of undefined`. Engine type "client" (default Prisma 7) ademas requiere `adapter` o `accelerateUrl`. Patron Postgres self-hosted: `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })` (instalar `@prisma/adapter-pg` + `pg`)
- **Catch de errores Prisma con `instanceof Prisma.PrismaClientKnownRequestError`** falla el narrowing de TS en Prisma 7 (re-exports forwarded) -> usar duck-typing guard sobre `e.code` (string que arranca con `P`)
- **Phantom dep `@prisma/client-runtime-utils`**: el client generado hace `require("@prisma/client-runtime-utils")`, pnpm NO lo expone como dep directa -> Next dev tira `Module not found`. Agregar como dep directa y meter `@prisma/client`, `@prisma/adapter-pg`, `@prisma/client-runtime-utils`, `pg` en `serverExternalPackages` de `next.config.ts`

---

### Prisma Extension (Multi-tenant)

- `db.user.findMany()` -> SIEMPRE agregar `where: { tenantId }` manualmente -> User NO esta en TENANT_MODELS -> la Extension NO inyecta tenantId -> sin filtro = leak cross-tenant
- `as any` en creates: TS no ve `tenantId` inyectado -> `data: { ...data } as any` + `eslint-disable` obligatorio
- El `eslint-disable @typescript-eslint/no-explicit-any` va en la MISMA linea del `} as any,` (no una linea antes)
- Modelo nuevo -> debe tener `tenantId String` + `@@index([tenantId])` + estar en `TENANT_MODELS` de `tenant.ts`
- **TENANT_MODELS debe estar sincronizado con schema** -> despues de agregar modelo con `tenantId` -> grep `tenantId` en schema.prisma vs lista en tenant.ts -> si hay diferencia = bug silencioso (queries no filtran por tenant)

---

### Zod v4

- `z.flattenError(error).fieldErrors` -> NUNCA `error.flatten().fieldErrors` (deprecado en v4)
- Despues de safeParse -> usar `result.data` -> NUNCA el body original
- Schema con `.default()` -> `z.input<typeof schema>` para params de funcion
- Forms (RHF) -> schema SIN transforms -> schema separado con transforms para actions
- Forms (RHF) -> schema SIN `.optional().default()` -> genera mismatch input/output type con `zodResolver` -> usar campos required + `defaultValues` en `useForm`
- `errorMap` no existe en Zod 4 -> usar `{ message: '...' }` en z.enum
- Union order con validadores -> `z.union([z.string().url(), z.literal('')])` -> NUNCA `.url().or(z.literal(''))`
- `new Date()` en defaults de schema -> PROHIBIDO -> usar `parseDateLocal(new Date().toISOString())`
- Fechas en schemas Zod -> SIEMPRE `parseDateLocal(v)` de `@/lib/utils/date.ts` -> NUNCA `new Date(v)` con strings sin hora (GMT-3 off-by-one)
- Campo nullable + string -> `z.union([z.string(), z.null()])` + `.transform()` -> NUNCA `.nullable()` directo con `.url()` u otros validadores
- Cambiar schema rompe tipos inferidos -> grep usos del tipo antes de modificar

---

### BetterAuth

- NO usar middleware.ts para auth -> verificar session en Server Components/Actions
- **`auth.ts` DEBE usar patron `globalThis` singleton** -> sin esto, hot reload crea nueva instancia -> cookies firmadas por instancia anterior invalidas -> `getSession() = null` -> logout espontaneo en dev
- **`nextCookies()` obligatorio como ultimo plugin** en `auth.ts` -> sin esto, Server Actions pierden `Set-Cookie` -> logout espontaneo
- Session en Server -> `auth.api.getSession({ headers: await headers() })` -> SIEMPRE pasar headers
- `getSession()` server-side -> SIEMPRE `query: { disableRefresh: true }` -> aplica a Server Components, Server Actions Y Route Handlers -> sin esto BetterAuth intenta renovar sesion y el `Set-Cookie` se pierde
- Server imports: `better-auth`, `better-auth/adapters/prisma`, `better-auth/plugins`, `better-auth/next-js`
- Client imports: `better-auth/react`, `better-auth/client/plugins`
- Schema Prisma: tablas SINGULAR (user, session, account, verification), campos exactos de BetterAuth
- Password hashing interno -> NO usar bcryptjs -> NO double-hash -> SIEMPRE crear/resetear passwords via `auth.api.signUpEmail()` o `auth.api.setUserPassword()`
- `account.accountId` -> BetterAuth genera ID random, NO el email -> NUNCA escribir manualmente en la tabla `account`
- Botones dev login -> SIEMPRE usar server action (lee vars server-side) -> NUNCA `NEXT_PUBLIC_*` para credenciales
- `globalForAuth` tipo -> SIEMPRE `ReturnType<typeof createAuth>` -> NUNCA `ReturnType<typeof betterAuth>` -> el tipo amplio no matchea y rompe el build
- CLI `@better-auth/cli generate` falla con `import 'server-only'` en archivos importados -> comentar temporalmente durante la generacion

---

### Next.js 16

- Pages de impresion/standalone -> NUNCA `<html>/<body>` propios (App Router ya tiene root layout)
- `<title>` con valor dinamico -> SIEMPRE template literal `` {`Texto ${expr}`} `` -> NUNCA `Texto {expr}` (crea array)
- `searchParams`, `params`, `cookies()`, `headers()` -> TODAS son Promises -> await ANTES de usar
- Pages dinamicas (`[id]`, `[slug]`) -> SIEMPRE Server Component async -> NUNCA `useParams()`
- Server Components -> Prisma directo -> NUNCA fetch a URL propia
- `next/dynamic` con `ssr: false` -> solo en Client Components, crear wrapper si es Server
- `next/image` CDN externo -> agregar a `images.remotePatterns` en next.config.ts
- **CSP `unsafe-eval`** -> SOLO en development -> condicionar con `process.env.NODE_ENV` -> produccion NUNCA debe tener `unsafe-eval`
- **CSP `script-src`** -> Next.js App Router REQUIERE `'unsafe-inline'` para scripts de hidratacion, chunks y metadata -> `script-src 'self' 'unsafe-inline'` es el minimo viable -> sin esto los inline scripts se bloquean y la app no hidrata
- Defensive parsing de API responses -> verificar `res.ok` PRIMERO -> solo setear state si estructura valida
- `serverExternalPackages` en next.config.ts para libs con bindings nativos (ssh2, bcrypt, etc)
- **Turbopack**: si cachea `globals.css` agresivamente y hot reload CSS no funciona -> sacar del script `dev`
- SearchInput con debounce -> `router.replace` (NO `router.push`) + `inputRef` + `useEffect` sin deps para restaurar foco -> `router.push` remonta y pierde foco en cada keystroke
- URL sin query params -> usar `pathname` solo, NO `${pathname}?${''}` (el `?` vacio causa navegacion extra)
- `import 'server-only'` en archivos lib/ con Prisma, auth, secrets -> excepto utils puras

---

### React 19

- Hydration mismatch con `window`/`Date.now()`/`Math.random()` -> useEffect + mounted + Skeleton
- Sincronizar props a state -> SIEMPRE en useEffect con deps, NUNCA en cuerpo del componente
- Reset UI state ANTES del await en handlers async -> `const val = value; setEditing(null); await save(val)`
- `setState` directo en useEffect body -> ESLint `set-state-in-effect` -> key trick: `key={prop}` DIRECTO en componente interno (SIN `useState` para el key — `setMountKey` en useEffect tambien falla)
- `useCallback` externo que llama `dispatch/setState` desde useEffect -> inline el fetch con `.then()` en el effect
- `ref.current` en cuerpo del componente -> ESLint lo bloquea -> SOLO en effects o event handlers
- Elementos interactivos anidados (`<a>` en `<a>`, `<button>` en `<button>`) -> hydration error -> card clickeable: usar `<div role="button" tabIndex={0} onKeyDown>` + `e.stopPropagation()` en acciones hijas
- No asignar `ref.current` en cuerpo del componente -> mover a useEffect
- Orden de hooks en el componente: `useState`/`useRef` -> SIEMPRE declarar ANTES del `useEffect` que los usa -> `const` no tiene hoisting -> `Cannot access X before initialization` en runtime
- Context en componente compartido -> Hook tolerante que retorna `undefined` sin provider -> NUNCA hook que throwea si no hay provider
- Client state optimista con arrays -> `router.refresh()` + `useEffect(() => setState(props), [props])` -> NUNCA poblar con `[]` (no refresca desde SSR)

---

### UI / Tailwind v4

- shadcn Tabs -> `variant="line"` va en `<TabsList>`, NO en `<TabsTrigger>`
- Tema dual: `bg-itera` para fondos de botones -> `text-itera-ink` / `bg-itera-ink-subtle` para texto/lineas
- CSS vars custom -> registrar en `@theme inline` de globals.css (`--color-X: var(--X)`)
- grid-cols arbitrario -> espacios NO comas: `grid-cols-[1fr_280px]`
- `h-full` requiere cascada completa -> todos los padres deben tener `h-full`
- AlertDialogDescription -> NO anidar `<p>` -> usar `asChild` + `<div>`
- **`Button size="icon"` -> SIEMPRE `aria-label` descriptivo** — sin excepcion. Error de a11y que se acumula.
- Animaciones con `delay` -> NUNCA `opacity: 0` inline -> usar `[animation-fill-mode:both]`
- `group-hover:` dentro de shadcn (Sidebar, Dialog, etc.) -> SIEMPRE named groups: `group/nombre` en elemento + `group-hover/nombre:` en hijos
- `ScrollArea` de Radix como contenedor de lista con `truncate` -> agregar `[&>[data-slot=scroll-area-viewport]>div]:!block`
- Boton de accion visible en hover de list item -> SIEMPRE en flujo flex con `invisible group-hover:visible` (`shrink-0`) -> NUNCA overlay `absolute`
- shadcn `Card` tiene `py-6 gap-6` built-in -> para padding custom: `py-0 gap-0` al `<Card>`, controlar desde `CardContent`
- `text-transform: capitalize` capitaliza TODAS las palabras -> para primera letra solo: JS `s.charAt(0).toUpperCase() + s.slice(1)`

---

### Seguridad

- Modelos con datos de usuario -> `userId` + `@@index([userId])` + filtrar en TODAS las queries y services
- Race conditions -> `@@unique` en schema + catch `P2002` en vez de check-then-insert
- API keys en logs -> sanitizar ANTES de loguear -> nunca loguear URLs con keys
- Credenciales -> indicar "agregalo directo a .env.local" -> NUNCA pedir secrets en chat
- Datos demo (credenciales, emails de prueba) -> SIEMPRE dentro de `if (process.env.NODE_ENV === 'development')`
- **"El campo existe en schema" ≠ "esta siendo aplicado"** -> campos de control (`*ExpiresAt`, `activo`, `deletedAt`, `status`) -> grep todos los query sites -> verificar que CADA WHERE lo incluye
- **`getSessionOrRedirect()` no reemplaza verificacion de estado** -> la sesion cacheada puede estar desactualizada -> toda accion privilegiada debe verificar `user.activo` y `tenant.activo` contra DB
- **Endpoints publicos (sin auth) no son excepcion** -> si existe `*ExpiresAt` -> validar `> now()` en el WHERE
- **Al desactivar usuario** -> SIEMPRE borrar sus registros de la tabla `session` -> NO solo actualizar `user.activo`

---

### Performance

- Loops con queries -> batch (`findMany`, `createMany`, `Promise.all`) -> NO N+1
- Campos en WHERE/ORDER BY -> agregar `@@index` (userId, status, fechas, tenantId)

---

### Arquitectura

- Service layer: `src/lib/services/[modulo].service.ts` -> NUNCA Prisma directo en actions
- Server actions: auth -> authorize -> validate -> service -> audit -> revalidate
- No numeros magicos -> `@/lib/constants`
- Tipos usados en 2+ archivos -> extraer a `src/lib/types.ts`
- Queries repetidas -> extraer a helper, no copiar
- Funciones de formateo (fecha, tamano, moneda) -> SIEMPRE en `src/lib/utils/` -> NUNCA locales en componentes
- Async fire-and-forget -> loguear con ID del recurso, no solo `.catch(console.error)`

---

### Vitest

- Mocks -> copiar estructura de test similar existente
- ActionResult -> `if (!result.success)` antes de `.error`, `if (result.success)` antes de `.data`
- ActionResult\<void\> mock -> `{ success: true, data: undefined }` (no omitir data)
- Componente importa otro con Server Actions -> agregar mocks a TODOS los tests afectados
- shadcn/ui -> testear render y estado -> NO testear clicks en Select/Dialog/DropdownMenu
- Texto > 50 chars -> `fireEvent.change()` no `userEvent.type()` (timeout en React 19)
- Cobertura minima por modulo: validaciones Zod + services con logica + utils
- **Tests de API routes sensibles** -> DEBEN incluir al menos un caso sin sesion valida -> esperar 401/403

---

### Timezone / Fechas en produccion

Containers Docker corren en UTC. Sin proteccion, TODAS las fechas del server se muestran con offset.

- **Dockerfile**: `ENV TZ=America/Argentina/Buenos_Aires` en el runner stage — es el fix mas importante y el mas facil de olvidar
- **Funciones de formateo**: TODA funcion en `src/lib/utils/date.ts` con `toLocaleDateString`/`toLocaleTimeString` DEBE incluir `timeZone: 'America/Argentina/Buenos_Aires'`
- `toLocaleDateString('es-AR')` -> el locale `es-AR` solo cambia el FORMATO, NO la timezone
- `new Date("2026-03-04T15:00")` (sin Z ni offset) -> se interpreta como hora LOCAL del servidor
- `toISOString()` SIEMPRE devuelve UTC con `Z` -> nunca usarlo para mostrar horas al usuario desde el server
- Argentina no tiene horario de verano desde 2009 -> offset fijo -03:00

---

### Deploy / Docker

- **Pipeline automatico**: `git push` -> auto-deploy -> post-deployment: `prisma db push` — NO hay pasos manuales
- `.dockerignore` obligatorio -> excluir: node_modules, .git, .env\*, .next, .planning
- Dockerfile multi-stage -> imagen de produccion SIN devDependencies
- **`ENV TZ=America/Argentina/Buenos_Aires`** obligatorio en Dockerfile runner stage
- `import "dotenv/config"` -> NUNCA directo en archivos de prod -> `try { await import("dotenv/config") } catch {}`
- **Queries ad-hoc en produccion**: ir al container de PostgreSQL en Coolify -> `psql -U postgres` -> `\c [dbname]`. El container de la app NO tiene `psql`.

---

### AI SDK v6 (Vercel) — si el proyecto usa Vercel AI SDK

- `convertToModelMessages(messages)` con messages de Zod -> castear: `messages as UIMessage[]` + `import { type UIMessage } from 'ai'`
- `toUIMessageStreamResponse()` (NO `toDataStreamResponse()`) -> AI SDK v6
- `maxOutputTokens` (NO `maxTokens`) -> AI SDK v6
- `useChat` `onFinish` recibe OBJETO `({ message, messages, isAbort }) => void` -> NUNCA `(message) => void`
- `sendMessage` con archivos -> `files: FileUIPart[]` con `{ type: 'file', mediaType, filename, url }` -> NUNCA `experimental_attachments`

---

### Gemini AI — si el proyecto usa Google Gemini

- SDK integrado vía `@ai-sdk/google` -> `import { google } from '@ai-sdk/google'`
- SDK standalone: `@google/genai` -> NUNCA `@google/generative-ai` (deprecado)
- Prompts a Gemini -> SIEMPRE en ingles (mejor calidad de generacion)

---

### Copilot / IA con datos del tenant — si el proyecto tiene features de IA

- Feature IA que usa datos del tenant -> permisos desde ACL real del usuario -> NUNCA DEFAULT permisivos en produccion
- Notas/documentos del tenant -> tratarlos como **contenido no confiable** -> van como contexto del usuario, no del sistema
- Cambio de modelo/system prompt/rate limit -> audit log con actor + before/after
- Copilot con side effects (writes, emails) -> confirmacion humana + idempotency key + audit trail -> NUNCA ejecutar writes directo desde salida del modelo

---

_Este archivo crece con el proyecto. Las reglas globales estan en `~/.claude/CLAUDE.md`._
_Eliminar las secciones de AI/Gemini/Copilot que no apliquen al proyecto._
