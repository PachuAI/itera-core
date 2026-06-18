# Estructura del reporte — plantilla canónica

Las 7 secciones que todo reporte de `states-audit` debe tener, en este orden. Path: `<repo>/.planning/STATES-AUDIT.md` (o suffix `-vN.md` si ya existe).

---

## Encabezado mínimo

```markdown
# Auditoría de estados — <Nombre del proyecto>

**Fecha**: <YYYY-MM-DD>
**Scope**: estados de UI (empty / loading / error / success / disabled)
**Stack**: <Next.js o Laravel+Inertia, React, Tailwind v4, shadcn, lib de toasts>
**Objetivo**: feedback consistente y predecible — patrones canónicos por estado, máquina de vista clara, tokens chicos, reuso de los semánticos.

**Inventario baseline**: `node ~/.claude/skills/states-audit/scripts/states-inventory.mjs`.

**Estado**: no se modificó código. Plan previo a tocar.
```

---

## 1. Diagnóstico general

```markdown
## 1. Diagnóstico general

La app <lo que ya está bien: ej. EmptyState compartido + Sonner> pero <causa raíz: loading sin sistema / errores hardcodeados / etc.>.

| Estado | Cómo está |
|---|---|
| Empty | <✅/⚠️ — componente compartido? acción?> |
| Loading | <skeleton usado? spinners ad-hoc?> |
| Error | <semánticos o hardcoded? aria-invalid? boundary?> |
| Success | <toast/badge con criterio?> |
| Disabled | <token o opacity-50 ad-hoc? aria?> |

**Causa raíz** (4 ejes): 1. loading sin sistema · 2. colores de estado hardcodeados · 3. empty/aria incompletos · 4. sin tokens ni reuso explícito.
```

### 1.1 Máquina de estado de las vistas críticas

```markdown
### 1.1 Máquina de estado de las vistas críticas

Para cada listado/form async, qué estados maneja y en qué orden:

**Clientes (`Pages/Clientes/Index.tsx`)**:
- estados: content + empty (2 variantes) + delete-overlay. Falta: loading inicial (SSR), error de fetch.
- orden: `if (deleting) overlay; else (empty ? EmptyState : Table)`. ✓ un estado a la vez.

**<otra vista>**: …
```

---

## 2. Inventario de estados actual

```markdown
## 2. Inventario de estados actual

### Componentes compartidos
- `EmptyState` (`shared/empty-state.tsx`), `Skeleton` (`ui/skeleton.tsx`, sin uso en páginas), `ErrorBoundary`, `StatusBadge`, `ConfirmDialog`.

### Usos por patrón
| Patrón | Ocurrencias | Notas |
|---|---|---|
| EmptyState | N | siempre con acción ✓ |
| Skeleton | N (solo en X) | infrautilizado |
| Spinner inline | N | ad-hoc por modal |
| aria-invalid | N | forms |
| Colores hardcoded | N | `border-red-500` en Login |
| toast.* | N | Sonner |

### Toasts
- Sonner (`ui/sonner.tsx`), íconos semánticos, montado en `<Layout>`.
```

---

## 3. Findings concretos (archivo:línea)

```markdown
## 3. Findings concretos (archivo:línea)

### A. Loading sin sistema
- `ui/skeleton.tsx:7` — `animate-pulse` sin reduced-motion; `bg-accent` casi invisible.
- `Pages/.../Index.tsx` — tabla sin skeleton (salta al cargar).

### B. Colores de estado hardcodeados
- `Auth/Login.tsx:122` — `border-red-500` (→ aria-invalid + token danger).
- `Auth/Login.tsx:209` — `text-green-600 bg-green-50` (→ token success).

### C. Empty states
- `Pages/Clientes/Index.tsx:412` — OK, 2 variantes con acción ✓.

### D. Aria de estado faltante
- `<archivo>` — loading sin `aria-busy`/`role=status`.

### E. Disabled
### F. Success
### G. <específicos del repo>
```

---

## 4. Sistema de estados recomendado

Copiar/adaptar de `references/states-system.md`:

```markdown
## 4. Sistema de estados recomendado

### 4.1 Patrones por estado
- Empty (sin-datos / sin-resultados, con acción)
- Loading (skeleton contenido / spinner acción / overlay transición)
- Error (inline aria-invalid+danger / sección retry / crash boundary / toast async)
- Success (toast / badge / inline)
- Disabled (token + cursor + aria-disabled; ≠ loading ≠ readonly)

### 4.2 Máquina de estado de vista
`error → loading → empty → content`, un estado a la vez.

### 4.3 Tokens chicos
`--disabled-opacity`, `--skeleton` (par light/dark) + pulse con reduced-motion.

### 4.4 Reuso
semánticos ← Color · spinner/overlay ← Motion · tipografía ← Sizing.

### 4.5 Aria de estado
aria-busy / aria-disabled / aria-invalid / role=status / role=alert.
```

---

## 5. Qué NO conviene hacer

Lista de `references/anti-patterns.md` con el por qué corto:

```markdown
## 5. Qué NO conviene hacer

1. **Spinner full-page para datos** → usar skeleton.
2. **Hardcodear colores de estado** → tokens semánticos.
3. **Empty sin acción** → callejón.
4. **Dos estados a la vez** → un estado, orden de chequeo.
5. **Disabled = loading = readonly** → tres tratamientos.
6. **Skeleton sin reduced-motion**.
7. **Reinventar semánticos/spinner/tipografía** → reusar.
8. **Olvidar el aria de estado**.
9. **Skeleton casi invisible** → contraste real.
10. **Abusar de check marks**.
11. **Volver toda la vista a loading en cada re-fetch** → overlay.
```

---

## 6. Plan de implementación por fases

```markdown
## 6. Plan de implementación por fases

### Fase 0 — Inventario baseline (hecho)
### Fase 1 — Tokens chicos + skeleton tokenizado (con reduced-motion) (≤ 1h)
### Fase 2 — Empty states: componente compartido + 2 variantes + acción (≤ 1.5h)
### Fase 3 — Loading: skeletons en listados; spinner solo para acciones (≤ 2h)
### Fase 4 — Errores: hardcoded → semánticos; aria-invalid; sección con retry (≤ 2h)
### Fase 5 — Máquina de estado de vista + aria de estado + cleanup (≤ 1.5h)
### Fase 6 (opcional) — primitiva `<ViewState>` reutilizable (loading/empty/error/content)

**Riesgo**: bajo. Fase 1 no toca componentes; el resto es aislable.
```

---

## 7. Checks de validación

```markdown
## 7. Checks de validación

Forzar cada estado (no alcanza con leer):
- **Loading**: throttle de red / delay → ¿skeleton preserva el layout?
- **Empty**: vaciar la tabla / filtro sin matches → ¿2 variantes con acción?
- **Error**: romper el fetch / submit inválido → ¿borde danger + texto + aria-invalid? ¿sección con retry?
- **Success**: completar una acción → ¿toast? estado persistente → ¿badge?
- **Disabled**: condición no cumplida → ¿opacity token + cursor + aria-disabled? ¿se distingue del spinner de loading?
- **reduced-motion**: toggle del SO → skeleton deja de pulsar, spinner no gira.
- **Un estado a la vez**: ninguna vista muestra loading+empty o error+content juntos.
```

---

## Notas finales

- Español rioplatense si el repo lo usa. Inglés en código.
- Cada finding cita `archivo:línea`.
- Tamaño objetivo: 250–400 líneas.

## Auto-check final OBLIGATORIO

Releer `references/audit-checklist.md` y confirmar que **cada uno de los 48 items** aparece (finding o `N/A — razón`). Atención a §6 (máquina de vista), §7 (aria de estado), §8.3 (reuso de semánticos), §9 (reduced-motion del skeleton).
