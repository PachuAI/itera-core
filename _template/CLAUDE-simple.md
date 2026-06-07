# [Nombre del Proyecto]

[Una linea describiendo que es — ej: "Web informativa + panel admin para gestión de contenido"]

> **Tier: Simple** — Next.js sin multi-tenant, sin service layer obligatorio, sin IA.
> Para proyectos SaaS complejos usar `CLAUDE.md` en lugar de este archivo.

## Proceso

1. Planificar antes de codear: disenar pantallas/flujo UX. Implementar DESPUES de aprobacion.
2. Verificar en navegador: resultado verificable en `localhost:3000` al final de cada feature.
3. **Lint obligatorio**: correr `pnpm lint` despues de terminar cambios y ANTES de commitear.
4. **Lint en Windows**: si `pnpm lint` falla por paths con espacios -> fallback: `pnpm exec eslint src` directo.
5. Referencias en `.planning/` — STATE.md en raiz. Reglas preventivas inline en la seccion Guardrails de este archivo (ya no hay `GUARDRAILS.md`).
6. **Mini-audit por archivo**: al terminar de escribir un action, API route o page -> ANTES de pasar al siguiente archivo, verificar los 5 puntos del checklist correspondiente de Guardrails. NO acumular archivos sin verificar.
7. **Tipos compartidos desde el primer uso**: al definir un `type` o `interface` -> si puede usarse en 2+ archivos -> crearlo en `src/lib/types/` desde el inicio. Si ya existe similar -> importar, NUNCA redefinir.
8. **Scripts de enforcement**: si existen `scripts/check-*.sh` -> ejecutar `bash scripts/check-all.sh` antes de commitear features que tocan 3+ archivos.

## Scopes de Commits

[ui | api | auth | db | config | content] — adaptar al proyecto

---

## Guardrails

> Reglas preventivas de errores conocidos del proyecto (que / por que / cuando). Esta seccion es la SSOT — ya no hay `GUARDRAILS.md`. Un error recurrente -> agregar aca una linea concisa (lo hace `/save`).

### Checklists de Implementacion

#### Al crear/modificar una page o componente con datos:

- Server Components con datos -> Prisma directo en la page/layout (NO fetch a URL propia)
- Mutation con datos -> server action con: auth -> validate -> write -> revalidate
- CADA action con write -> DEBE tener `revalidatePath()` o `revalidateTag()` al final
- 2+ writes relacionados -> `$transaction`
- **CADA `findMany` -> verificar que tiene `take`** — limite razonable: 100-200

#### Al crear/modificar una API route:

- API route admin -> guard de auth en las primeras lineas -> si no, es bug de seguridad
- Upload de archivos -> validar MIME type (whitelist), extension, y `file.size` del servidor -> NUNCA confiar en metadata del cliente

#### Al crear una page:

- SIEMPRE `export const metadata` (estaticas) o `generateMetadata()` (dinamicas)
- Verificar que el route group tenga `error.tsx`
- Considerar `loading.tsx` si la page tiene queries pesadas

#### Antes de escribir una funcion de formateo/utilidad:

- Buscar si ya existe en `src/lib/utils/` -> NUNCA duplicar formatDate/formatCurrency
- `toLocaleDateString()` inline en componentes = PROHIBIDO -> usar utils centrales

#### Al implementar un patron UI por 2da vez:

- PRIMERO grep componentes en `components/shared/` y `components/ui/`
- Si el patron ya existe 2+ veces inline -> extraer AHORA

---

### TypeScript / ESLint

- Despues de cambios -> `pnpm lint`
- ANTES de usar campo/prop -> verificar que existe en schema/interface
- SIEMPRE `===` y `!==` -> NUNCA `==` o `!=`
- Evitar `as Type` en datos de DB -> validar runtime si hay duda

---

### Prisma 7

- Import SIEMPRE desde `@/lib/generated/prisma/client` -> NUNCA `@prisma/client`
- `prisma.config.ts` requerido en raiz (datasource URL ahi, NO en schema.prisma)
- `db push` NO regenera client -> siempre `db push && prisma generate` juntos
- DATABASE_URL en AMBOS `.env` y `.env.local`
- Campos en WHERE/ORDER BY frecuentes -> agregar `@@index`
- `findMany` que puede crecer -> SIEMPRE `take` con limite razonable
- **Errores P2002 (unique)** -> catch en create/update con slug o campos unique -> retornar error amigable
- **Errores P2025 (not found)** -> catch en delete/update -> retornar error amigable en vez de 500
- **Queries publicas** -> SIEMPRE filtrar por estado (`published: true`, `active: true`) -> NUNCA exponer borradores
- **Campos `Decimal`** -> NO pasar directo a Client Components -> serializar con `Number(v)` en la page
- **Campos `Date`** -> NO pasar directo a Client Components -> serializar con `.toISOString()` en la page
- Despues de `prisma db push` en dev -> SIEMPRE reiniciar el dev server

---

### Zod v4

- `z.flattenError(error).fieldErrors` -> NUNCA `error.flatten().fieldErrors` (deprecado en v4)
- Despues de safeParse -> usar `result.data` -> NUNCA el body original
- Forms (RHF) -> schema SIN `.optional().default()` -> usar required + `defaultValues` en `useForm`
- Fechas en schemas -> SIEMPRE `parseDateLocal(v)` de `@/lib/utils/date.ts` -> NUNCA `new Date(v)` sin hora

---

### BetterAuth (si el proyecto usa auth)

- NO usar middleware.ts para auth -> verificar session en Server Components/Actions
- **`auth.ts` DEBE usar patron `globalThis` singleton** -> sin esto logout espontaneo en dev
- **`nextCookies()` obligatorio como ultimo plugin** en `auth.ts`
- Session en Server -> `auth.api.getSession({ headers: await headers() })` -> SIEMPRE pasar headers
- `getSession()` server-side -> SIEMPRE `query: { disableRefresh: true }`

---

### Next.js 16

- `searchParams`, `params`, `cookies()`, `headers()` -> TODAS son Promises -> await ANTES de usar
- Pages dinamicas (`[id]`, `[slug]`) -> SIEMPRE Server Component async -> NUNCA `useParams()`
- Server Components -> Prisma directo -> NUNCA fetch a URL propia
- `next/image` CDN externo -> agregar a `images.remotePatterns` en next.config.ts
- `import 'server-only'` en archivos lib/ con Prisma, auth, secrets

---

### React 19

- Hydration mismatch con `window`/`Date.now()`/`Math.random()` -> useEffect + mounted + Skeleton
- Sincronizar props a state -> SIEMPRE en useEffect con deps, NUNCA en cuerpo del componente
- Elementos interactivos anidados (`<button>` dentro de `<button>`) -> hydration error
- `ref.current` en cuerpo del componente -> SOLO en effects o event handlers

---

### UI / Tailwind v4

- CSS vars custom -> registrar en `@theme inline` de globals.css
- grid-cols arbitrario -> espacios NO comas: `grid-cols-[1fr_280px]`
- **`Button size="icon"` -> SIEMPRE `aria-label` descriptivo**
- `h-full` requiere cascada completa -> todos los padres deben tener `h-full`

---

### Seguridad

- Route o action con datos de usuario -> verificar que hay guard de auth
- Recurso recibido por ID -> `findFirst({ where: { id, userId } })` -> NUNCA `findUnique({ where: { id } })` solo
- Race conditions -> `@@unique` en schema + catch `P2002` en vez de check-then-insert
- Credenciales -> indicar "agregalo directo a .env.local" -> NUNCA pedir secrets en chat
- Datos demo -> SIEMPRE dentro de `if (process.env.NODE_ENV === 'development')`
- Upload de archivos -> validar tamano con `file.size` del servidor, NO metadata del cliente

---

### Performance

- Loops con queries -> batch (`findMany`, `createMany`, `Promise.all`) -> NO N+1
- Campos en WHERE/ORDER BY -> agregar `@@index`

---

### Timezone / Fechas en produccion

- **Dockerfile**: `ENV TZ=America/Argentina/Buenos_Aires` en el runner stage — critico para Server Components
- Funciones de formateo con `toLocaleDateString` -> DEBEN incluir `timeZone: 'America/Argentina/Buenos_Aires'`
- `toLocaleDateString('es-AR')` solo cambia el FORMATO, NO la timezone

---

### Deploy / Docker

- `.dockerignore` obligatorio -> excluir: node_modules, .git, .env*, .next, .planning
- Dockerfile multi-stage -> imagen de produccion SIN devDependencies
- **`ENV TZ=America/Argentina/Buenos_Aires`** obligatorio en Dockerfile runner stage
- `prisma db push` como post-deployment command en Coolify — NO en Dockerfile

---

_Este archivo crece con el proyecto. Las reglas globales estan en `~/.claude/CLAUDE.md`._
