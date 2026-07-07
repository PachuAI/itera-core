# Quality Gate Report

## Header

- Proyecto:
- Stack:
- Fecha:
- Modo:
- Archivos analizados:
- Baseline previo:

## Score

- Score global: `/10`
- Veredicto: `GO` / `NO-GO`

### Score por fase

- Mechanical gate:
- Structure and anti-drift:
- Next.js and React:
- Data layer and Prisma:
- Security:
- Multi-tenancy:
- Performance:
- Testing:
- Deploy and operations:
- Readability and maintainability:
- Timezone and localization:
- AI runtime, credits, and provenance:

## CRÍTICOS

- [ ] **[Categoria]** descripción — `archivo:línea` | Esfuerzo: S/M/L | Riesgo: bajo/medio/alto

## ALTOS

- [ ] **[Categoria]** descripción — `archivo:línea` | Esfuerzo: S/M/L | Riesgo: bajo/medio/alto

## MEDIOS

- [ ] **[Categoria]** descripción — `archivo:línea` | Esfuerzo: S/M/L | Riesgo: bajo/medio/alto

## BAJOS

- [ ] **[Categoria]** descripción — `archivo:línea` | Esfuerzo: S/M/L | Riesgo: bajo/medio/alto

## Fortalezas

- Punto fuerte comprobable

## Acciones

### Quick wins

- Cambio chico con impacto alto

### Estabilización

- Cambio de mediano alcance para bajar riesgo operativo

### Escala

- Cambio estructural para sostener crecimiento del codebase

## Comparación con baseline

### Resuelto

- Hallazgo previo que ya no aparece

### Regresión

- Algo que antes estaba bien y volvió a romperse

### Persiste

- Hallazgo previo que sigue abierto

### Nuevo

- Hallazgo no presente en el baseline anterior

## Checklist de re-auditoría

- [ ] `pnpm run typecheck`
- [ ] `pnpm run lint`
- [ ] `pnpm run test:run`
- [ ] `pnpm run build`
- [ ] `pnpm run quality:check`
- [ ] Repetir `scripts/check-all.sh`
- [ ] Releer áreas tocadas con foco en seguridad y multi-tenancy
- [ ] Si hubo IA/créditos/runtime: reauditar pricing, reserve/finalize/release, ledger y prompt boundary
