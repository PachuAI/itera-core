# Tooling Standard

Estandar canonico para repos `Next.js 16 + Prisma 7 + BetterAuth`.

## Scripts canonicos

- `typecheck`: solo `tsc --noEmit`
- `lint`: solo `eslint`
- `test:run`: corrida deterministica de tests
- `build`: build de app
- `quality:check`: checks custom de calidad
- `release:check`: agregador de pre-release
- `db:generate`: solo `prisma generate`
- `db:push`: solo `prisma db push`

## Reglas del contrato

- Un script, una responsabilidad.
- `test` puede existir para ergonomia local, pero no es parte del contrato compartido.
- `build` puede depender de `db:generate`, pero no debe duplicar logica ad hoc repo por repo.
- `release:check` debe correr `typecheck && lint && test:run && build && quality:check`.
- `quality-gate` debe invocar solo `quality:check`.
- No se aceptan aliases permanentes como `check:quality`, `quality-check` o `check-quality`.

## Estandar de entorno

- `packageManager` debe estar pinneado a `pnpm`.
- `engines.node` debe estar declarado y ser coherente en todo el cluster.

## Notas

- Este contrato prioriza claridad y mantenibilidad sobre compatibilidad heredada.
- `quality:check` y `release:check` nacen del hardening hecho primero en `shope-ar`, pero se canonizan por consistencia `namespace:action`, no por frecuencia de uso.
- Si un repo del stack no cumple este contrato, se normaliza el repo; no se expande el skill para tolerar drift.
