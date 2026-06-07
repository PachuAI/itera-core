---
name: kickstart-nextjs
description: "Setup técnico del proyecto Next.js: create-next-app, deps, Prisma, BetterAuth, shadcn, git. Ejecutar DESPUÉS de que KICKSTART.md completó la fase de PRD y configuró los archivos de planificación."
disable-model-invocation: true
model: opus
---

# Kickstart Next.js — Setup Técnico

Este skill hace el setup técnico del proyecto. La fase de PRD y planificación ya fue hecha por `KICKSTART.md`.

## Contexto

Cuando se ejecuta este skill, ya existen en la carpeta del proyecto:
- `CLAUDE.md` — ya configurado con nombre y descripción del proyecto
- `.claude/skills/` y `.claude/agents/` — sistema de memoria instalado
- `.planning/` — PROJECT.md, STATE.md, CHANGELOG.md, CODEBASE-MAP.md, audits/ (las reglas preventivas viven inline en la seccion Guardrails del CLAUDE.md)

El objetivo ahora es instalar Next.js y el stack técnico.

## Input requerido

Preguntar TODO junto en un solo mensaje si falta alguno:

```
Módulos: [db, auth, ai, r2] — cuáles necesita este proyecto
PG master password: [password] — solo si módulo db
Repo: [private / public / solo local]
Puerto dev: [3000 por default, o el que el usuario prefiera]
```

NO hacer preguntas una a una. Si el usuario ya lo aclaró, no preguntar.

## Referencia técnica

El template del sistema ITERA esta en `C:\ALL MY PROJECTS\itera-claude-system\_template\`:
- `CLAUDE.md` / `CLAUDE-simple.md` — reglas del proyecto (Full SaaS / Simple)
- `.planning/` — templates de STATE, CODEBASE-MAP, etc.
- `scripts/` — scripts de enforcement

Para configuraciones especificas de cada tecnologia (Prisma 7, BetterAuth, etc.), consultar las secciones correspondientes del CLAUDE.md del tier elegido.

---

## ERRORES CRÍTICOS CONOCIDOS

### Prisma 7: requiere prisma.config.ts

Prisma 7 NO usa `url = env("DATABASE_URL")` en schema.prisma. Requiere `prisma.config.ts` en raíz:

```typescript
try { await import("dotenv/config"); } catch {}
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
})
```

El `try/catch` de dotenv es CRITICO: en local carga `.env`, en Docker/Coolify falla silencioso (dotenv es devDep) y las env vars vienen del container.

Schema usa `provider = "prisma-client"` (no `prisma-client-js`) y `output` custom:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

### create-next-app necesita carpeta completamente vacía

`create-next-app .` falla si hay CUALQUIER archivo. Por eso el Paso 0 mueve los archivos del template a un directorio temporal en el padre.

### create-next-app y shadcn: NO sobreescribir archivos generados

`create-next-app` y `shadcn init` generan `globals.css`, `layout.tsx`, `eslint.config.mjs`. **NO sobreescribirlos.** Solo editarlos.

### BetterAuth: patrón globalThis obligatorio

`auth.ts` DEBE usar `globalThis` singleton (igual que `db.ts`). Sin esto, hot reload crea nueva instancia → cookies inválidas → logout espontáneo en dev.

### DATABASE_URL en AMBOS archivos

Prisma CLI lee `.env`. Next.js runtime lee `.env.local`. El DATABASE_URL debe estar en ambos.

### lint-staged 16.x + archivos untracked

lint-staged 16.x falla con `fatal: Needed a single revision` si hay archivos untracked. Fix: `.husky/pre-commit` → `pnpm exec lint-staged --no-stash`.

---

## Workflow

```
Kickstart Técnico:
- [ ] Paso 0: Mover archivos del template a directorio temporal (padre)
- [ ] Paso 1: Crear proyecto Next.js (carpeta vacía)
- [ ] Paso 2: Instalar dependencias
- [ ] Paso 3: Inicializar shadcn/ui
- [ ] Paso 4: Crear base de datos PostgreSQL (si módulo db)
- [ ] Paso 5: Inicializar Prisma 7 + conectar DB (si módulo db)
- [ ] Paso 6: Escribir/editar archivos de configuración
- [ ] Paso 7: Restaurar archivos del template (desde temporal)
- [ ] Paso 8: Setup git hooks (Husky)
- [ ] Paso 9: Crear repo + primer commit
- [ ] Paso 10: Verificación final (build + dev server)
```

### Paso 0: Mover archivos del template al directorio padre

IMPORTANTE: `create-next-app .` falla si hay cualquier archivo. Mover a carpeta padre ANTES.

Leer el nombre del proyecto de `CLAUDE.md` (primera línea, sin el `#`).

```bash
PROJECT_NAME=$(head -1 CLAUDE.md | sed 's/# //')
SETUP_DIR="../.itera-setup-${PROJECT_NAME}"
mkdir -p "$SETUP_DIR"

# Mover archivos del template
mv .claude "$SETUP_DIR/"
mv .planning "$SETUP_DIR/"
mv CLAUDE.md "$SETUP_DIR/"
mv CLAUDE-simple.md "$SETUP_DIR/" 2>/dev/null
mv KICKSTART.md "$SETUP_DIR/" 2>/dev/null
```

Verificar: `ls -la` muestra carpeta COMPLETAMENTE vacía.

### Paso 1: Crear proyecto Next.js

```bash
pnpm create next-app@latest . --yes --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

**Flags críticos**:
- `--yes`: sin esto se cuelga en prompt interactivo de React Compiler
- Sin `--turbopack`: Turbopack cachea `globals.css` agresivamente, hot reload de CSS no funciona

### Paso 2: Instalar dependencias

```bash
# BASE + QUASI-BASE (producción)
pnpm add class-variance-authority clsx tailwind-merge lucide-react sonner tailwindcss-animate zod server-only

# BASE + QUASI-BASE (desarrollo)
pnpm add -D prettier vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react jsdom husky lint-staged postcss dotenv tsx kill-port
```

Si el usuario pidió módulos opcionales:

```bash
# db + auth — Prisma 7 + BetterAuth
pnpm add @prisma/client better-auth @prisma/adapter-pg pg
pnpm add -D prisma @types/pg

# ai — Google Gemini
pnpm add @google/genai

# storage — Cloudflare R2
pnpm add @aws-sdk/client-s3
```

### Paso 3: Inicializar shadcn/ui

```bash
pnpm dlx shadcn@latest init --defaults
```

`--defaults`: sin esto se cuelga en prompt de base color.

### Paso 4: Crear base de datos PostgreSQL

Solo si módulo `db`.

```bash
PGPASSWORD=MASTER_PASS psql -U postgres -c "CREATE USER NOMBRE_user WITH PASSWORD 'NOMBRE_dev_2026';"
PGPASSWORD=MASTER_PASS psql -U postgres -c "CREATE DATABASE NOMBRE OWNER NOMBRE_user;"
PGPASSWORD=MASTER_PASS psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE NOMBRE TO NOMBRE_user;"
```

Reemplazar `MASTER_PASS` con el password real del usuario. NO loguear el password.

### Paso 5: Inicializar Prisma 7 + conectar DB

Solo si módulo `db`.

```bash
pnpm exec prisma init
```

Post-init:
1. Crear `prisma.config.ts` en raíz (ver sección errores críticos)
2. Reescribir `prisma/schema.prisma` con formato Prisma 7 (provider = "prisma-client", output custom)
3. Si pidió `auth`, agregar modelos BetterAuth (ver `PRISMA-PATTERNS.md` en boilerplate)
4. Escribir DATABASE_URL en `.env` Y `.env.local` con Write tool (nunca echo en bash — escapa mal `$`, `!`, `#`)

```bash
pnpm exec prisma db push
pnpm exec prisma generate --generator client
```

### Paso 6: Escribir/editar archivos de configuración

**REGLA**: NO sobreescribir `globals.css`, `layout.tsx`, `eslint.config.mjs`. Solo editarlos.

#### 6a. Archivos de config (consultar CONFIGS.md del boilerplate si existe)

Crear nuevos:
- `next.config.ts` → sobreescribir con security headers + serverExternalPackages + CSP condicional + **`output: 'standalone'`**
- `tsconfig.json` → sobreescribir con strict + vitest exclusions
- `.prettierrc` → crear
- `vitest.config.ts` → crear
- `vitest.setup.ts` → crear
- `.env.example` → crear con las vars que apliquen

Editar existentes:
- `eslint.config.mjs` → agregar `"src/generated/**"` a `globalIgnores`
- `src/app/layout.tsx` → agregar `<Toaster>` de sonner, metadata del proyecto
- `.gitignore` → cambiar `.env*` por entradas específicas, agregar `!.env.example`

#### 6b. Archivos scaffold (SIEMPRE crear — estos previenen el 60% de issues de auditoría)

**Infraestructura (siempre)**:
- `.nvmrc` → contenido: `22`
- `Dockerfile` → multi-stage: deps (pnpm install --frozen-lockfile) → builder (build) → runner (standalone, `ENV TZ=America/Argentina/Buenos_Aires`)
- `.dockerignore` → excluir: node_modules, .git, .env*, .next, .planning, .claude

**Tipos y utils compartidos (siempre)**:

```typescript
// src/lib/types.ts
export type ActionResult = { success: true } | { success: false; error: string }
```

```typescript
// src/lib/utils/slugify.ts
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
})
// Adaptar al proyecto: quitar las vars que no apliquen, agregar las custom

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = z.flattenError(result.error).fieldErrors
    console.error('Environment validation failed:', formatted)
    throw new Error(`Missing or invalid environment variables: ${Object.keys(formatted).join(', ')}`)
  }
  return result.data
}

export const env = validateEnv()
```

**Componentes compartidos (siempre)**:

```tsx
// src/components/shared/empty-state.tsx
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="h-10 w-10 text-zinc-300 mb-3" />}
      <p className="text-zinc-400 font-medium">{title}</p>
      {description && <p className="text-zinc-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

**Error boundaries y loading (siempre)**:

```tsx
// src/app/(public)/error.tsx — 'use client', mensaje genérico + botón retry
// src/app/(public)/loading.tsx — spinner centrado
```

**Si módulo auth (admin)**:

```typescript
// src/lib/auth-action.ts
import 'server-only'
import { auth } from '@/lib/auth'
import type { ActionResult } from '@/lib/types/actions'

export async function requireAuthAction(): Promise<ActionResult | null> {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'No autorizado' }
  return null
}
```

```tsx
// src/app/(admin)/admin/error.tsx — 'use client', estilo admin + retry
// src/app/(admin)/admin/loading.tsx — spinner admin
```

**Scripts de verificación (siempre)**:
- Copiar carpeta `scripts/` del template (check-scaffold, check-findmany-take, check-upload-validation, check-auth-guards, check-page-metadata, check-all)
- Agregar a package.json: `"check:quality": "bash scripts/check-all.sh"`

#### 6c. Módulos opcionales

Si módulo `db`:
- Crear `src/lib/db.ts` (singleton con PG adapter — ver PRISMA-PATTERNS.md)

Si módulo `auth`:
- Crear `src/lib/auth.ts` (BetterAuth config con globalThis singleton)
- Crear `src/lib/auth-client.ts` (client hooks)
- Crear `src/app/api/auth/[...all]/route.ts` (catch-all)
- Crear `src/lib/session.ts` (getSessionOrRedirect helper)

### Paso 7: Restaurar archivos del template

```bash
SETUP_DIR="../.itera-setup-${PROJECT_NAME}"

# Restaurar sistema de memoria y planificación
mv "$SETUP_DIR/.claude" .
mv "$SETUP_DIR/.planning" .
mv "$SETUP_DIR/CLAUDE.md" .

# Limpiar directorio temporal
rm -rf "$SETUP_DIR"
```

`CLAUDE.md` ya está configurado con nombre y descripción del proyecto (lo hizo KICKSTART.md). No recrear.

### Paso 8: Setup git hooks

```bash
pnpm exec husky init
```

Editar `.husky/pre-commit` → reemplazar contenido con `pnpm exec lint-staged --no-stash`.

Agregar a `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

Agregar scripts:
```json
"dev": "kill-port 3000 && next dev",
"check:quality": "bash scripts/check-all.sh"
```

### Paso 9: Crear repo + primer commit

```bash
git add -A
git commit -m "feat: inicializar proyecto con stack ITERA"
```

Si GitHub:
```bash
gh repo create NOMBRE --private --source=. --push
```

### Paso 10: Verificación final

```bash
pnpm build
```

Si pasa, reportar:

```markdown
## Setup Completo

**Proyecto**: [nombre]
**Repo**: [URL o "local"]
**DB**: [nombre_db] (usuario: nombre_user) — o "sin DB"
**Puerto**: localhost:3000

### Instalado
- [x] Next.js [version] (sin Turbopack)
- [x] shadcn/ui
- [x] Prisma 7 + PostgreSQL (si aplica)
- [x] BetterAuth (si aplica)
- [x] AI / Gemini (si aplica)
- [x] Vitest + Testing Library
- [x] Husky + lint-staged (--no-stash)
- [x] Archivos scaffold (env.ts, ActionResult, slugify, EmptyState, error/loading.tsx)
- [x] Dockerfile + .dockerignore (standalone, TZ Argentina)
- [x] Scripts de enforcement (check-all.sh + 5 verificaciones)
- [x] Sistema de memoria (/load, /save, /check, /commit)
- [x] .planning/ con PROJECT.md, CODEBASE-MAP, audits/

### Próximo paso
Ejecutar `/load` para iniciar la primera sesión de desarrollo.
```

---

## Reglas

- Ejecutar UN paso a la vez, verificar antes de continuar
- Si un paso falla, arreglar ANTES de seguir
- NO inventar configs que no estén en el boilerplate
- NO sobreescribir archivos que generaron create-next-app o shadcn
- Las passwords de DB NO se guardan en archivos trackeados por git
- Escribir `.env` y `.env.local` con Write tool — NUNCA `echo` en bash
