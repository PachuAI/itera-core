# Patrones de inspección — qué buscar en el código

Patterns para inventariar el manejo de estados. Usar `Grep` con `output_mode: "count"` o correr `scripts/states-inventory.mjs` que automatiza esto.

## Orden de inspección

1. Inventario cuantitativo (counts por patrón).
2. Inspección dirigida (leer archivos top-N).
3. Verificación del feel forzando cada estado (loading, vacío, error, disabled).

---

## A. Empty states

```regex
EmptyState|empty-state|sin resultados|no hay|sin datos
```

Glob: `**/*.{tsx,jsx}`. Ver si usan el componente compartido o markup ad-hoc. Contar usos del componente vs strings de "vacío" sueltos.

## B. Loading — skeleton

```regex
Skeleton|animate-pulse|data-slot="skeleton"
```

**Clave**: ver si `Skeleton` se IMPORTA en páginas (`Pages/`/`app/`) o solo está declarado en `ui/` sin uso. Un skeleton que existe pero no se usa = tablas que saltan al cargar.

## C. Loading — spinners

```regex
animate-spin|Loader2|Spinner|<svg[^>]*spin|processing|cargando|guardando|loading
```

Contar spinners inline ad-hoc (SVG a mano) vs un componente compartido. Mapear cuáles son para ACCIÓN (botón) vs si hay alguno full-page para DATOS (anti-pattern).

## D. Error — semánticos hardcodeados (el finding más común)

```regex
border-red-\d|text-red-\d|bg-red-\d|text-green-\d|bg-green-\d|border-green-\d|text-amber-\d|bg-amber-\d
```

Glob: `**/*.{tsx,jsx}`. **Cada hit es un finding**: un color de estado hardcodeado que debería ser token semántico (`--danger-*` / `--success-*`).

## E. Error — estructura

```regex
aria-invalid|ErrorBoundary|error-boundary|toast\.error|form\.errors|\.errors\.
```

Ver: form inline (`aria-invalid` + errors), crash (`ErrorBoundary`), async (`toast.error`).

## F. Success

```regex
toast\.success|CheckCircle|<Check\b|variant="success"|StatusBadge
```

Distinguir toast (acción) de badge (estado). Flag abuso de check marks.

## G. Disabled

```regex
\bdisabled\b|aria-disabled|opacity-50|cursor-not-allowed|disabled:opacity
```

Ver si sale de un token o es `opacity-50` repetido. ¿`aria-disabled` presente?

## H. Aria de estado

```regex
aria-busy|role="status"|role="alert"|aria-live
```

**Si el count es muy bajo → hallazgo** (§7). Loading sin `aria-busy`/`role=status`, errores sin `role=alert`.

## I. Tokens de estado existentes

```regex
--(?:skeleton|disabled|loading)[\w-]*
```

Glob: `**/*.css`. Si no existen, declararlos es Fase 1.

## J. Librería de toasts

```regex
sonner|react-hot-toast|react-toastify|<Toaster
```

Identificar la lib y dónde se monta el `<Toaster />`.

---

## Cómo reportar findings

```
- `resources/js/Pages/Auth/Login.tsx:122` — `border-red-500` hardcoded en input → debería ser aria-invalid + token danger.
- `resources/js/components/ui/skeleton.tsx:7` — `animate-pulse` sin reduced-motion.
- `resources/js/Pages/Clientes/Index.tsx:412` — EmptyState OK (2 variantes con acción). ✓
```

**Evidencia o descarte**. Sin `archivo:línea`, el finding no entra.

---

## Checks semánticos (no grep simple)

### S1. Máquina de estado de cada vista
Leer cada listado/form async y mapear: ¿qué estados maneja? ¿en qué orden los chequea? ¿muestra dos a la vez? No es grep — es leer el render y el orden de los `if`. Ejemplo:
```
ClientesIndex: if (deleting) overlay; else tabla. ¿loading inicial? ¿empty? ¿error de fetch?
→ falta estado loading (SSR completo) y error de fetch (Inertia maneja). Documentar.
```

### S2. Skeleton declarado pero sin usar
Si `Skeleton` existe en `ui/` pero el grep B no lo encuentra importado en `Pages/`, es deuda: el loading de contenido no usa el patrón correcto. Finding de §2.

### S3. Spinner full-page para datos
Buscar un `Loader2`/spinner centrado que reemplace TODO el contenido mientras carga una lista/tabla. Anti-pattern: debería ser skeleton (preserva layout). Leer el render condicional.

### S4. Color de estado hardcodeado vs token
Por cada hit de §D, confirmar que existe el token semántico equivalente (en el reporte de color / globals.css) y que el reemplazo es directo. Documentar el mapeo (`border-red-500 → border-[var(--danger)]` o `aria-invalid`).

### S5. Disabled vs loading vs readonly confundidos
Buscar controles `disabled` que en realidad están "procesando" (deberían ser `aria-busy` + spinner) o "no editables" (deberían ser `readonly`). Leer el porqué del disabled.
