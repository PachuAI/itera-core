---
name: email-visor
description: Scaffoldear un "visor de previews de emails" en un repo Next.js (app router) + shadcn. Genera una página admin que lista los templates de email transaccional del proyecto agrupados por estado (active/pending/legacy/dev-only) y los renderiza con datos de ejemplo en un iframe con viewport desktop/mobile, inputs editables en vivo y botón copiar HTML — sin disparar envíos reales. Incluye un registry central + tipos + el andamiaje de páginas y componentes, adaptando 4 puntos al repo (ruta admin, guard de auth, assets CID, iconos/EmptyState). El registry es la única fuente del listado: agregar un email = una entrada. Usar cuando el usuario quiera ver / previsualizar / terminar de diseñar los emails que envía un proyecto, armar un catálogo o galería de emails transaccionales, portar el visor de emails de itera-lex o shope-ar a otro repo, o pida "email previews", "visor de emails", "ver los mails que mandamos", /email-visor. Pensado para el ecosistema ITERA (Next 16 + shadcn + Nodemailer/Brevo); itera-lex y shope-ar ya lo tienen y son la referencia.
---

# Email Visor

Método para scaffoldear un **visor de previews de emails transaccionales** en un repo Next.js + shadcn: una página admin que lista los templates del proyecto y los renderiza con datos de ejemplo en un iframe, **sin disparar envíos reales**. Sirve para diseñar y revisar los emails antes de mandarlos.

Validado en **itera-lex** (`/admin/dev/emails`) y **shope-ar** (`/admin/platform/dev/emails`). Este skill consolida la versión canónica: tokens shadcn neutrales (sin hardcode de marca) y la ruta como constante única.

## Cuándo invocar

- "quiero ver / previsualizar los emails que manda este repo"
- "terminar de diseñar los emails transaccionales"
- "un visor / catálogo / galería de emails"
- "portar el visor de emails (de itera-lex / shope-ar) a este repo"
- "email previews", `/email-visor`

**Pre-requisito**: repo Next.js con app router + shadcn/ui + al menos un template de email (una función que devuelve un HTML string). Si todavía no hay templates, no hay nada que previsualizar — primero se escriben los builders.

## Qué entrega

Una ruta admin con:

- **Lista lateral** de templates agrupados por estado: `active` / `pending` / `legacy` / `dev only`.
- **Detalle por template**: header (label, estado, audience, trigger, subject, call site) + form de **inputs editables** + **iframe de preview** con toggle desktop/mobile + **copiar HTML**.
- Templates `pending` (declarados sin builder todavía) muestran un placeholder con su metadata.

## Archivos que genera

`<ADMIN>` = el route group admin del repo (`src/app/(admin)/admin`, `src/app/admin`, etc.).

| Template del skill | Destino en el repo |
|---|---|
| `email-preview.types.ts` | `src/lib/types/email-preview.ts` |
| `registry.example.ts` | `src/lib/email/registry.ts` *(adaptar)* |
| `layout.tsx` | `<ADMIN>/dev/emails/layout.tsx` |
| `page.tsx` | `<ADMIN>/dev/emails/page.tsx` |
| `detail-page.tsx` | `<ADMIN>/dev/emails/[key]/page.tsx` |
| `components/preview-frame.tsx` | `<ADMIN>/dev/emails/_components/preview-frame.tsx` |
| `components/input-form.tsx` | `<ADMIN>/dev/emails/_components/input-form.tsx` |
| `components/pending-empty-state.tsx` | `<ADMIN>/dev/emails/_components/pending-empty-state.tsx` |
| `lib/constants.ts` | `<ADMIN>/dev/emails/_lib/constants.ts` |
| `lib/render-preview.ts` | `<ADMIN>/dev/emails/_lib/render-preview.ts` |
| `lib/input-encoder.ts` | `<ADMIN>/dev/emails/_lib/input-encoder.ts` |

## Los 4 puntos de adaptación

Todo lo que cambia entre repos está marcado con `// ADAPT:` en los templates.

| # | Punto | Archivo | Qué cambiar |
|---|---|---|---|
| 1 | **Ruta base** | `_lib/constants.ts` | `EMAIL_PREVIEWS_BASE_PATH` al path real del visor |
| 2 | **Guard de auth** | `layout.tsx` | import + `await` del guard de admin del repo |
| 3 | **Assets CID** | `_lib/render-preview.ts` | replace `cid:` → `/public/...`, o dejar no-op si no hay CID |
| 4 | **Iconos / EmptyState** | `page.tsx`, `_components/*` | lucide ↔ tabler; usar el `EmptyState` compartido del repo o el inline que ya trae |

## Workflow

### 0. Reconocer el terreno (antes de copiar nada)

En el repo destino, averiguar:

1. **Templates**: localizar las funciones que generan HTML (`grep -rE "build.*Email|Email\(|htmlContent" src/lib`). Anotar de cada una: nombre, path, y **firma** (¿recibe un objeto o args posicionales?).
2. **Ruta admin + route group**: mirar `src/app/` → ¿`(admin)/` o `admin/`? Definir el `EMAIL_PREVIEWS_BASE_PATH`.
3. **Guard**: ver cómo se protege el área admin (el `layout.tsx` admin, o el guard que llaman las pages). Anotar import + llamada.
4. **UI**: confirmar shadcn (`button`, `badge`, `input`, `label`, `switch`), `sonner`, y la familia de iconos (lucide vs tabler). ¿Existe `@/components/shared/empty-state`?
5. **Assets**: ¿los emails embeben imágenes por `cid:`? Si sí, anotar el CID y su asset público.

### 1. Copiar el andamiaje

Copiar los 11 archivos según el mapeo de arriba. Crear `src/lib/types/email-preview.ts` desde `email-preview.types.ts`.

### 2. Aplicar los 4 puntos de adaptación

Recorrer los `// ADAPT:` y resolverlos con lo anotado en el paso 0.

### 3. Armar el registry

Copiar `registry.example.ts` → `src/lib/email/registry.ts`. Una entrada por template real del repo:

- Builder con **args posicionales** → envolver: `builder: (i) => fn(i.a, i.b)`. Los keys del objeto son los campos editables que muestra el form.
- Builder que ya recibe un **objeto** → referencia directa.
- Template **pendiente** (sin builder) → `builder: null`, `status: 'pending'`.
- `defaultInputs`: datos **realistas del dominio** (es lo que se ve al diseñar — no "test"/"foo").

### 4. Verificar

- typecheck + lint del repo.
- `dev server` → navegar a la ruta → por cada template: render correcto, toggle desktop/mobile, editar un input + Aplicar, copiar HTML.
- los `pending` muestran el placeholder con metadata.

## Gotchas

- **El registry es la única fuente del listado.** Agregar un email = una entrada. No hay autodescubrimiento.
- **Tokens neutrales, no marca.** El andamiaje usa solo `bg-card`, `text-muted-foreground`, `border`, `bg-muted`, `bg-accent`, `bg-primary`. NO hardcodear colores de marca en el scaffold — si querés branding, vive en tus tokens shadcn. (shope-ar hardcodeó `var(--shope-*)` y quedó no-portable; itera-lex metió `bg-itera` y `shadow-elevation-1` que son suyos. Esta versión los saca.)
- **El visor NO envía.** Solo renderiza. "Copiar HTML" es para pegar en un cliente real si querés probar inbox.
- **iframe `sandbox="allow-same-origin"`** sin `allow-scripts`: los emails no corren JS (igual que un cliente de email real). No agregar `allow-scripts`.
- **Detrás del guard de admin.** No exponer la ruta sin auth, ni en prod.
- **Drift**: si Lex y shope vuelven a divergir, esta es la versión de referencia. Re-aplicar el skill > editar a mano cada copia.

## Referencias en el ecosistema

- **itera-lex**: `src/lib/email/registry.ts` + `src/app/(admin)/admin/dev/emails/`
- **shope-ar**: `src/lib/email/registry.ts` + `src/app/(admin)/admin/platform/dev/emails/` (tipos en `src/lib/types/email-preview.ts`)
