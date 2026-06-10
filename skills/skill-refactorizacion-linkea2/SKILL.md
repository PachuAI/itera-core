---
name: skill-refactorizacion-linkea2
description: Repeat large seam-based refactors in a Next.js 16 + React 19 + Prisma 7 + BetterAuth multi-tenant SaaS. Use when a mixed page, module, route, or feature area needs to be split into clearer seams without breaking tenant guards, cache invalidation, preview/public parity, or legacy contracts.
---

# Refactorizacion Linkea2

Variante **repo-specific** del método de `seam-construction`, aplicada a Linkea2 (Next.js 16 + React 19 + Prisma 7 + BetterAuth multi-tenant).

> **El método de seams vive en `seam-construction`** — catálogo de seams, execution loop, seam quality test, core rules y red flags. Aplicá ESE método y sumale el contexto + invariantes de Linkea2 de abajo. Este skill solo aporta lo propio del repo (no duplica el método).

## Por qué existe (además de seam-construction)

Linkea2 agrega invariantes propias (preview/public parity, contratos legacy, env split), baselines concretos del repo y sincronización de `.planning/`.

## Bootstrap (Linkea2)

1. Leer `AGENTS.md`, `package.json` (comandos + versiones), `.planning/GUARDRAILS.md`.
2. Si existen, leer `.planning/CODEBASE-MAP.md` y `.planning/API-MAP.md`.
3. Baselines de referencia en este repo: `e80d696` public landing split · `79276c2` env split · `1f1264e` atomic quota fix.
4. Si vas a tocar cache/metadata/dynamic APIs/routing y existe `node_modules/next/dist/docs/`, leé la guía Next 16 relevante.
5. Grep de tests alrededor del target antes de mover código.

## Invariantes de Linkea2 (sumar al método de seam-construction)

- Preservar **preview/public parity** y contratos legacy hasta el último corte.
- Server/client boundary explícito; los helpers extraídos no lo cruzan en silencio.
- **Env split**: acceso public vs server no se mezcla.
- No romper tenant isolation al "limpiar" shared code.
- No remover compatibilidad legacy hasta cubrir todos los callers + registros persistidos.
- Este stack tiene fallos **runtime-only**: no confiar solo en lint.
- Si cambian API routes / server actions / guards / cache tags / shared modules → sincronizar `.planning/CODEBASE-MAP.md` y `.planning/API-MAP.md`.

## Verificación (Linkea2)

`pnpm lint` → targeted tests → `pnpm build` → scans extra de `references/checklist.md` cuando aplique.

## Resources

- Método base de seams: skill **`seam-construction`**.
- Seam patterns con ejemplos de archivos de este repo: `references/seams.md`
- Obstacles ya pagados en este repo: `references/obstacles.md`
- Checklist operacional y comandos: `references/checklist.md`
