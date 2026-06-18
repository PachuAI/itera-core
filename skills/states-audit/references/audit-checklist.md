# Checklist exhaustivo — states-audit

**OBLIGATORIO**: completar **cada item** antes de cerrar el reporte. Si un item no aplica o no se puede evaluar, declararlo como `N/A — razón concreta`. **NUNCA omitir un item en silencio**.

Auto-check al final: releer este archivo punto por punto y confirmar cobertura.

---

## 1. Empty states

| Item | Qué validar |
|---|---|
| 1.1 | ¿Hay un componente compartido `EmptyState`? ¿Dónde vive? |
| 1.2 | ¿Se usa consistentemente o hay empty states con markup ad-hoc? (contar) |
| 1.3 | Estructura: ícono + título + descripción + acción |
| 1.4 | ¿Distingue **sin-datos** (CTA crear) de **sin-resultados** (CTA limpiar filtros)? |
| 1.5 | ¿Todo empty state tiene una ACCIÓN? (un próximo paso, no un callejón) |
| 1.6 | Tamaños según contexto (page / card / inline-en-tabla) |
| 1.7 | ¿Usa los roles tipográficos del sistema o `text-lg`/`text-sm` genéricos? |

---

## 2. Loading

| Item | Qué validar |
|---|---|
| 2.1 | ¿Existe un componente `Skeleton`? ¿Se USA en páginas o solo está declarado? |
| 2.2 | Contenido (tablas/listas/cards): ¿carga con skeleton que preserva layout? |
| 2.3 | Acciones (submit/export): ¿spinner inline + label gerundio + disabled? |
| 2.4 | Transiciones (sección/filtro): ¿overlay del dominio Motion? |
| 2.5 | ¿Hay spinner full-page para DATOS? (anti-pattern → debería ser skeleton) |
| 2.6 | Spinners: ¿ad-hoc por página (SVG inline) o de un componente compartido? |
| 2.7 | El skeleton, ¿tiene color con contraste real sobre la card? (no casi-invisible) |

---

## 3. Error

| Item | Qué validar |
|---|---|
| 3.1 | Form inline: `aria-invalid` en el campo + texto semántico debajo |
| 3.2 | ¿Colores semánticos (tokens) o hardcodeados (`border-red-500`, `text-red-600`)? |
| 3.3 | Error de sección/fetch: ¿patrón con "Reintentar"? |
| 3.4 | Crash: ¿hay `ErrorBoundary`? ¿con fallback usable? |
| 3.5 | Async (submit/delete): ¿`toast.error`? |
| 3.6 | ¿Mezcla inconsistente de toast + mensaje local para el mismo tipo de error? |
| 3.7 | Mensajes: ¿accionables ("probá de nuevo") o crípticos ("Error 500")? |

---

## 4. Success

| Item | Qué validar |
|---|---|
| 4.1 | Acción efímera: ¿`toast.success`? |
| 4.2 | Estado persistente: ¿badge (`StatusBadge variant success`)? |
| 4.3 | Confirmación contextual: ¿inline con check? |
| 4.4 | ¿Abuso de check marks por todos lados sin criterio? |
| 4.5 | ¿Colores success de token o hardcodeados (`text-green-600`, `bg-green-50`)? |

---

## 5. Disabled

| Item | Qué validar |
|---|---|
| 5.1 | ¿`--disabled-opacity` tokenizado o `opacity-50` ad-hoc disperso? |
| 5.2 | ¿`cursor-not-allowed`? |
| 5.3 | ¿`disabled` nativo o `aria-disabled`? |
| 5.4 | ¿Se distingue disabled de loading (spinner+aria-busy) y de readonly? |
| 5.5 | ¿El control disabled tiene un motivo descubrible (tooltip/texto)? |

---

## 6. Máquina de estado de vista

| Item | Qué validar |
|---|---|
| 6.1 | ¿Las vistas async tienen una máquina clara (idle/loading/content/empty/error)? |
| 6.2 | ¿Orden de chequeo `error → loading → empty → content`? |
| 6.3 | ¿Alguna vista muestra dos estados a la vez (loading+empty, etc.)? |
| 6.4 | Re-fetch por filtro: ¿overlay sutil o la vista entera vuelve a skeleton (parpadeo)? |

---

## 7. Aria de estado

| Item | Qué validar |
|---|---|
| 7.1 | Loading (región): `role="status"` + `aria-busy` |
| 7.2 | Loading (acción): `aria-busy` en el botón |
| 7.3 | Disabled: `disabled` / `aria-disabled` |
| 7.4 | Error de form: `aria-invalid` en el campo + `role="alert"` en el mensaje |
| 7.5 | Error de sección: `role="alert"` |

---

## 8. Tokenización y reuso

| Item | Qué validar |
|---|---|
| 8.1 | `--disabled-opacity` declarado |
| 8.2 | `--skeleton` (color) declarado, par light/dark |
| 8.3 | Semánticos (success/danger/warning/info): ¿REUSADOS del color domain, no reinventados? |
| 8.4 | Spinner/overlay: ¿reusados del motion domain? |
| 8.5 | Modo de consumo correcto (arbitrary value si CSS satélite) |

---

## 9. reduced-motion del loading

| Item | Qué validar |
|---|---|
| 9.1 | Skeleton pulse: ¿se apaga bajo `prefers-reduced-motion`? |
| 9.2 | Spinner: ¿`motion-reduce:animate-none`? |
| 9.3 | ¿Coordinado con el dominio Motion (tokens self-zeroing)? |

---

## Auto-check final

- [ ] §1 Empty states (7 items)
- [ ] §2 Loading (7 items)
- [ ] §3 Error (7 items)
- [ ] §4 Success (5 items)
- [ ] §5 Disabled (5 items)
- [ ] §6 Máquina de estado de vista (4 items)
- [ ] §7 Aria de estado (5 items)
- [ ] §8 Tokenización y reuso (5 items)
- [ ] §9 reduced-motion del loading (3 items)

**Total: 48 items**. Si quedó alguno sin cubrir y sin declarar `N/A — razón`, completarlo antes de presentar.

Atención a los ejes que suelen saltearse:
- **§6 Máquina de estado de vista**: no se infiere de findings sueltos; se mapea explícito por vista.
- **§7 Aria de estado**: el feedback de accesibilidad de estado se olvida; es eje propio.
- **§8.3 Reuso de semánticos**: el hallazgo más común es color hardcodeado (`border-red-500`) que debería ser token.
- **§9 reduced-motion**: el skeleton `animate-pulse` por defecto NO respeta reduced-motion.
