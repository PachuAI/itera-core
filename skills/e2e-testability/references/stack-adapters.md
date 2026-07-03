# Adaptadores por stack

El método (Track 1 + Track 2) es el mismo; cambia el setup de Playwright, cómo se hace el assert
durable, y el mecanismo de seed. Detectar el stack en el Bootstrap y usar el adaptador que aplique.

## Índice

1. [Setup base de Playwright (común)](#1-setup-base-de-playwright-común)
2. [Next.js + React/JSX](#2-nextjs--reactjsx)
3. [Laravel + Inertia (React/Vue)](#3-laravel--inertia-reactvue)
4. [Laravel Blade (server-rendered)](#4-laravel-blade-server-rendered)
5. [Backend de asserts durables](#5-backend-de-asserts-durables)
6. [Mecanismos de seed/reset](#6-mecanismos-de-seedreset)

---

## 1. Setup base de Playwright (común)

Si el repo no tiene Playwright:

```bash
pnpm add -D @playwright/test     # o npm/yarn
pnpm exec playwright install --with-deps chromium
```

`playwright.config.ts` mínimo:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,            // empezar serial; paralelizar cuando haya fixtures dedicados
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',       // trace para debugear flakes
    testIdAttribute: 'data-testid', // si el repo usa otro (data-test/data-cy), cambiarlo acá
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/fixtures/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',   // o el comando del repo
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      // forzar mocks deterministas de integraciones externas (IA, etc.)
      AI_RUNTIME_POLICY: 'mock',
    },
  },
})
```

Clave del `webServer`: setear **env de mock** para que las integraciones externas (runtime de IA,
proveedores) sean deterministas y el E2E nunca pegue a red real.

## 2. Next.js + React/JSX

- Las recetas de etiquetado son las de `accessible-name-contract.md` §3 (JSX).
- `webServer.command`: `next build && next start` (probar contra el build prod, no `next dev`, para
  acercarse a producción). Si el build necesita DB, ver que `DATABASE_URL` apunte a la DB de test.
- App Router: las Server Actions no son apuntables directo; el test ejercita la **UI** que las
  dispara y verifica el efecto por DB.
- Flujos iniciados desde cliente que dependen de una Server Action stale post-deploy → considerar un
  endpoint estable; pero para E2E local da igual.

## 3. Laravel + Inertia (React/Vue)

- **El frontend es React/Vue** → usar las recetas **JSX** del contrato (no Blade). Inertia renderiza
  componentes, no templates server.
- `webServer.command`: levantar el server PHP + el build de assets, p. ej.
  `php artisan serve` + Vite build (o `composer run dev` si el repo lo define). Ajustar `baseURL` al
  puerto de `artisan serve` (`http://127.0.0.1:8000`).
- Preparar entorno de test: `.env.testing` + `APP_ENV=testing`, DB de test (sqlite en memoria o
  Postgres dedicado), `php artisan migrate:fresh --seed --env=testing` antes de la corrida.
- Inertia expone `data-page` en el root; no testear contra eso — usar roles/nombres como siempre.

## 4. Laravel Blade (server-rendered)

- Recetas de etiquetado: `accessible-name-contract.md` §4 (Blade).
- Mismo setup de server que Inertia. La diferencia es solo de markup (templates `.blade.php` vs
  componentes).
- Modales con Livewire/Alpine: asegurar `role="dialog"` + nombre apuntable; los toggles Alpine
  (`x-show`) deben exponer `aria-expanded` para ser apuntables por estado.

## 5. Backend de asserts durables

El assert durable lee la DB **por fuera del ORM de la app** cuando el runner no banca importarlo.

### Prisma (Next.js / Node)

- **No importar el cliente Prisma de la app en el spec**: el runner E2E corre los tests como ES
  modules y puede romper con `exports is not defined` o por `import 'server-only'`. Usar **`pg`
  directo** con queries acotadas y transaccionales.
- **Nombres físicos**: leer el `schema.prisma`. Con `@@map`/`@map` las tablas/columnas en SQL no son
  los nombres del modelo. Footguns comunes:
  - BetterAuth: tablas **singular** (`"user"`, `"account"`, `"session"`) y `"user"` requiere comillas.
  - snake_case en columnas (`"tenantId"`, `"deletedAt"` citadas; `causa_parte`, `evento_asistente`).
- La URL de Prisma puede traer query params (`?schema=`) que libpq no acepta → sanitizar:
  `const url = process.env.DATABASE_URL.split('?')[0]`.

```ts
// helpers/sql.ts (Prisma + pg)
import { Client } from 'pg'
export async function withClient<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL!.split('?')[0] })
  await c.connect()
  try { return await fn(c) } finally { await c.end() }
}
```

### Eloquent / Laravel

- Para asserts, dos caminos: (a) un **endpoint de test** protegido que devuelva el estado, o (b)
  query directa con `pg`/sqlite a la DB de test. Si el spec corre en Node (Playwright), (a) suele ser
  más simple que cargar Eloquent.
- Nombres de tabla: los de las migrations (plural snake_case por convención Laravel).

### API como backend de asserts

Si exponer la DB es incómodo, un **endpoint de lectura protegido** (Bearer de test) que devuelva el
registro recién creado es un assert durable válido y portable entre stacks.

## 6. Mecanismos de seed/reset

De más portable a menos:

1. **Endpoint seed Bearer** (`POST /api/admin/seed` o `/api/test/seed` con secreto): el más usado en
   ÍTERA. Resetea targets deterministas (tenant demo vacío, dataset rico, dos tenants disjuntos para
   aislamiento). El spec lo llama con `seedViaHttp(target)`. **No** sembrar con el ORM desde el spec.
2. **Login demo instantáneo** (`/api/demo-login?tipo=...`): para smokes que solo recorren superficies.
3. **Factories + migrations** (Laravel): `migrate:fresh --seed` por corrida; factories para fixtures
   puntuales vía endpoint de test.
4. **SQL directo transaccional**: para preparar un fixture chico y acotado cuando no hay target seed
   (insertar + capturar IDs + limpiar en `finally`).

Reglas de seed:

- **Idempotente** y con IDs/prefijos reconocibles (`e2e-*`) para poder limpiar.
- **Sin emails reales**: neutralizar SMTP en el `webServer` (env) para flujos que disparan mails.
- **Targets separados**: vacío (onboarding), rico (rutina/demo), disjuntos (aislamiento multi-tenant).
- Documentar los comandos `test:e2e:*` y los targets en el `docs`/`OPERATIONS` del repo.
