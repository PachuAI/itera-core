---
name: e2e-testability
description: Preparar un repo EXISTENTE para tests E2E fieles (Playwright) aplicando el contrato de NOMBRES ACCESIBLES a la UI ya escrita + construyendo una suite de user journeys por persona/rol que terminan en assert de estado durable. Stack-aware — Next.js+React/JSX y Laravel+Inertia (adaptadores Blade), backend de asserts en Prisma/pg o Eloquent/DB. Track 1 (etiquetado para testabilidad) convierte locators frágiles en locators semánticos estables (getByRole / getByLabel) agregando aria-label scoped por entidad, closeLabel en dialogs/sheets, <label htmlFor>+id en inputs, aria-hidden en iconos decorativos y contadores de tab, y filas clickeables a <Link>/<button> reales — el MISMO metadato que anuncia el lector de pantalla y que consume Playwright (data-testid solo como escape hatch justificado). Track 2 (user journeys) arma el mapa de personas/clases de usuario (roles, tenants, superadmin, público sin sesión), journeys por persona-intención, el criterio de qué va a E2E vs service/unit, el patrón de oro reset(seed)->login real->UI por rol/nombre->assert del efecto durable, los helpers (db/seed/tenants/navigation) y el aislamiento por tenant. Usar SIEMPRE que el usuario quiera "hacer tests e2e en un repo que no los tiene", "mejorar / arreglar tests e2e que se cortan a la mitad", "ponerle labels a los componentes para poder testear", "que Playwright encuentre los botones / inputs", "locators frágiles", "user journeys", "testear distintas clases de usuario / roles", "smoke tests de flujos de punta a punta", "preparar la UI para e2e", "etiquetar para accesibilidad y de paso para tests", "/e2e-testability". NO es el diagnóstico estructural completo de accesibilidad (foco-visible / teclado / landmarks / target sizes -> a11y-audit) NI la estrategia de riesgo de toda la suite de tests (qué invariantes proteger, gates, mutation -> test-protection-suite): este skill es la pieza concreta que hace la UI targeteable por locators semánticos y escribe los journeys encima.
---

# E2E Testability (etiquetado para Playwright + user journeys por persona)

Toma un repo que **no tiene E2E** (o tiene E2E frágiles que se cortan) y lo deja con tests de
flujo **fieles**: que recorren un journey real de principio a fin sin romperse, y que verifican
**tanto lo que ve el usuario como el efecto durable en el sistema**.

Son **dos tracks que se entrelazan**, no dos fases secuenciales:

- **Track 1 — Etiquetado para testabilidad**: aplicar a la UI **ya escrita** el contrato de
  *nombres accesibles*, para que Playwright pueda apuntar a cada elemento con un **locator
  semántico estable** (`getByRole`, `getByLabel`) en vez de selectores CSS/XPath frágiles.
- **Track 2 — User journeys**: mapear las **clases de usuario** (personas), elegir qué flujos
  merecen E2E, y escribirlos con el patrón **reset → login real → UI por rol/nombre → assert del
  estado durable**.

Este skill **sí toca código** (agrega labels, escribe tests). Eso lo distingue de la familia de
auditorías del design-system, que solo diagnostica.

## La idea central — por qué etiquetar = testabilidad = accesibilidad

Es la confusión más común y el corazón del skill: **es el mismo metadato.**

Playwright *puede* clickear por CSS/XPath, pero eso es frágil y se rompe con cualquier refactor de
markup. Un test "fiel" usa **locators semánticos**: `getByRole('button', { name: 'Guardar' })`,
`getByLabel('Email')`. Esos locators **no leen el DOM crudo**: resuelven contra el **árbol de
accesibilidad** que arma el browser, donde cada elemento tiene un **rol** + un **nombre accesible**.

El **nombre accesible** se computa por prioridad (spec accname):
`aria-labelledby` → `aria-label` → `<label htmlFor>` asociado → texto / `alt` / `title`.

Consecuencia directa: un botón icon-only sin texto **no tiene nombre accesible** → el lector de
pantalla dice solo "botón" **y** Playwright no lo puede encontrar por nombre. Ponerle
`aria-label="Acciones de Juan"` arregla **las dos cosas de un saque**. Por eso accesibilidad y
testabilidad van de la mano: **consumen exactamente el mismo metadato.**

`aria-label` (a veces maloído como "area label") es **una** de las formas de fijar el nombre
accesible, no una "etiqueta de test" aparte. `data-testid` **sí** es un atributo solo-para-tests
(`getByTestId`): es el **escape hatch**, para cuando genuinamente no hay un nombre accesible decente
(un canvas de gráfico, un contenedor sin rol). La disciplina se mide por el ratio: en una base sana,
`getByRole`+`getByLabel` >> `getByTestId` (referencia ÍTERA Lex: ~600 vs ~8).

## El seam — qué es y qué NO es este skill

Igual que la familia de auditorías declara seams entre dominios, este skill declara los suyos:

- **Diagnóstico estructural de accesibilidad** (foco-visible, navegación por teclado, target sizes,
  landmarks, skip-link, aria de estado) → **`a11y-audit`**. Este skill aplica **solo el subconjunto
  de NOMBRES accesibles** (label / role / `aria-current` / `aria-expanded` estructural) porque son
  el metadato que Playwright consume. Para la pasada profunda de a11y, correr `a11y-audit` aparte.
- **Estrategia de riesgo de toda la suite** (qué invariantes proteger, baseline, gates de release,
  mutation testing, auditor de cobertura) → **`test-protection-suite`**. Ese skill decide **QUÉ**
  vale la pena testear; este hace la UI **targeteable** y escribe la **capa E2E** encima.
- **Tests de integración / unit / service** → este skill los **referencia** (el criterio de "qué NO
  va a E2E") pero no los escribe. E2E es caro; la mayor parte del riesgo se cubre más barato abajo.

Si el usuario pide "auditar accesibilidad" o "armar el design system", NO es este skill. Si pide
"que los tests e2e dejen de cortarse" o "ponerle labels para poder testear", **sí** es este.

## Cuándo usar

- Un repo sin E2E donde se quiere empezar por los flujos críticos.
- E2E existentes **frágiles**: locators por CSS/clase/posición, `nth()`, `waitForTimeout`, que se
  rompen al refactorizar markup o que **no encuentran** el botón/input.
- Botones icon-only, menús de acciones por fila, dialogs, tabs con contador, inputs sin label —
  todo lo que un journey necesita tocar pero **no es apuntable** por nombre.
- Se quieren probar **distintas clases de usuario** (roles, tenants, admin, público) en el mismo flujo.
- Migrar la disciplina de testabilidad de ÍTERA Lex a otro repo (shope-ar, itera-lex-tools,
  alquimica-crm).

## Cuándo NO usar

- Auditoría de accesibilidad estructural / design system → `a11y-audit` (+ hermanos color/motion/…).
- Definir la estrategia de tests, invariantes de riesgo y gates → `test-protection-suite`.
- Lógica pura, validaciones, cálculos, ownership multi-tenant exhaustivo → **service/unit**, no E2E.
- Integraciones externas reales (IA, pagos, Google, fuentes oficiales) → contract test con mock.
  **Nunca** red externa real en E2E.

## Bootstrap

Antes de tocar nada, levantar el terreno (no asumir el stack):

1. **Detectar stack de UI y de tests** (decide qué adaptador usar — ver
   `references/stack-adapters.md`):
   - UI: Next.js + React/JSX · Laravel + Inertia (React/Vue) · Blade server-rendered · otro.
   - Runner E2E: ¿hay `playwright.config.*`? ¿`@playwright/test` en deps? Si no, hay que instalarlo.
   - Backend de asserts durables: Prisma (tablas físicas, a veces snake_case + `@@map`) vía `pg`,
     o Eloquent/DB de Laravel, o API. **Nunca** importar el ORM de la app dentro del spec si el
     runner rompe con ESM/`server-only` (caso ÍTERA: E2E usa `pg` directo, no Prisma).
   - Cómo se resetea el estado: endpoint seed Bearer, factories, migrations+seeders, login demo.
2. **Leer reglas del repo**: `CLAUDE.md` / `AGENTS.md`, `docs/`, `.planning/`, los tests que ya
   existan. Respetar convenciones locales (nombres de tablas, helpers de auth, idioma de la UI).
3. **Inventario de testabilidad** con `scripts/testability-inventory.mjs` (o Grep según
   `references/playwright-locators.md`). Mide el ratio `getByRole`/`getByLabel` vs `getByTestId`,
   cuenta `aria-label`, y **ubica los huecos**: icon-only sin `aria-label`, inputs sin `<label>`,
   `<div onClick>`/`<span onClick>`, dialogs sin nombre de cierre, contadores de tab sin
   `aria-hidden`. Ese inventario es el mapa de trabajo de la Track 1.
4. **NUNCA matar procesos**; detectar el dev server si está corriendo (útil para validar locators
   en vivo con el Playwright codegen / inspector).

## Orden de trabajo — driven por los journeys, NO "etiquetar todo a ciegas"

La trampa más cara es barrer toda la app poniendo labels sin un test que los ejercite. El método
que funcionó en ÍTERA Lex es **test-first scoping**, journey por journey:

1. **Elegir un journey** (Track 2): una persona + una intención (ej. "abogado independiente carga su
   primer cliente y causa").
2. **Recorrer ese flujo** y anotar cada elemento que el test necesita tocar **que no es apuntable**
   por nombre accesible.
3. **Etiquetar solo eso** (Track 1): aplicar el contrato a los elementos del flujo.
4. **Escribir el journey** con locators semánticos + assert del estado durable.
5. **Correr y estabilizar**: si un locator falla, **arreglar el nombre accesible** (mejora a11y +
   test a la vez) antes de caer en `data-testid`.
6. Repetir con el siguiente journey. El etiquetado de la app **emerge** de los journeys, priorizado
   por lo que de verdad se testea.

Así cada label agregado queda inmediatamente **justificado y ejercitado** por un test, y la
cobertura crece por valor real en vez de por barrido mecánico.

## Track 1 — Etiquetado para testabilidad

El contrato completo (con recetas before/after por stack JSX y Blade, y el **scoping por entidad**
que es la regla más importante) está en **`references/accessible-name-contract.md`**. Resumen:

- **Dialog / Sheet** → nombre de cierre accesible; si el modal tiene identidad, scopearlo
  (`"Cerrar <nombre>"`) para que el test apunte al cierre del modal correcto.
- **Botón icon-only** → `aria-label` **scoped por entidad** (`Acciones de ${cliente.nombre}`, no
  `"Acciones"`): con N filas, el locator debe ser **único**. Esta es la regla crítica.
- **Iconos decorativos** → `aria-hidden="true"` (no ensucian el nombre accesible del padre).
- **Contador de tab** → `aria-hidden` en el badge, para que la tab se llame `"Movimientos"` y no
  `"Movimientos 5"` (nombre **estable** aunque cambie el conteo).
- **Campo de form** → `<label htmlFor>` + `id` (incl. date pickers / selects custom) → habilita
  `getByLabel`.
- **Fila/card clickeable** → la celda primaria es un `<Link>`/`<a>`/`<button>` **real** (rol
  apuntable + foco por teclado), no un `<div onClick>`.
- **Texto / empty states** → strings consistentes (un idioma, componente compartido) → locators por
  texto estables.

La estrategia de locators de Playwright (prioridad rol→label→text→testid, cómputo del nombre
accesible, recetas, auto-waiting, web-first assertions, cuándo SÍ usar `data-testid`) está en
**`references/playwright-locators.md`**.

## Track 2 — User journeys por persona

El método completo (formato de journey, criterio de scoring E2E-vs-abajo, patrón de oro, helpers,
aislamiento por tenant, qué verificar por DB vs UI) está en **`references/e2e-journey-method.md`**.
Resumen del patrón de oro:

> **reset por seed → login real → recorrer la UI por rol/nombre accesible → assert del estado
> durable (DB/API) + de lo visible.** Serial dentro de cada spec que muta estado compartido.
> Nunca credenciales reales, nunca red externa, nunca el ORM de la app dentro del spec si el runner
> no lo banca.

Un journey vale E2E cuando suma **wiring de muchos seams + persistencia + frecuencia o riesgo
alto**. Lo combinatorio (toda permutación de permisos, todo branch de Zod), lo puro (cálculos,
fechas) y lo de red externa **bajan** a service/unit/contract. El detalle del scoring está en la
referencia.

El setup concreto por stack (config de Playwright, webServer con env de mock, acceso a DB para
asserts, mecanismo de seed) está en **`references/stack-adapters.md`**.

## Guardrails

- **El etiquetado se maneja desde el journey, no al revés.** No barrer la app a ciegas: scopear por
  el flujo que se va a testear. Cada label nuevo debe quedar ejercitado por un test.
- **Locator semántico primero, `data-testid` último.** Prioridad rol → label → text → testid. Si un
  locator falla, la primera reacción es **arreglar el nombre accesible**, no agregar un testid. Cada
  `data-testid` se justifica (no hay nombre accesible posible).
- **Scoping por entidad en listas.** Un `aria-label="Acciones"` repetido en 20 filas es un locator
  ambiguo = test frágil. Scopear con el dato de la fila. Es la causa #1 de E2E que se cortan.
- **Nombre accesible estable.** Que el contador, el estado o el spinner **no** cambien el nombre por
  el que apunta el test (`aria-hidden` en los adornos). Un nombre que muta = flake.
- **El test verifica DOS cosas.** Lo visible para el usuario **y** el efecto real (fila en DB,
  estado durable, audit trail). Un E2E que solo confirma "no explotó" o que aparece un toast no
  protege nada.
- **Reset determinístico, datos seed controlados.** Nada de depender de datos casuales del entorno.
  Aislar lo que se crea o limpiarlo. Serial cuando dos specs mutan el mismo tenant/fixture.
- **Sin red externa, sin credenciales reales.** Integraciones externas → mock/simulación; runtime
  de IA → mock determinístico vía env del webServer. El E2E confirma el wiring, no la calidad del
  proveedor.
- **No reimplementar la a11y estructural.** Foco-visible, teclado, landmarks, target sizes, aria de
  estado → `a11y-audit`. Acá solo nombres accesibles. Declarar el seam.
- **No inflar E2E.** Lo combinatorio/puro/externo va a service/unit/contract. E2E = pocos flujos
  críticos de punta a punta. El criterio de selección está en la referencia; respetarlo.
- **Respetar el stack del repo destino.** Las recetas JSX no se copian tal cual a Blade; los nombres
  de tabla para los asserts salen del schema real (footgun `@@map`/snake_case). Leer antes de
  escribir.

## Resources

- **Contrato de nombres accesibles** (recetas before/after JSX + Blade, scoping por entidad, tabla
  de patrones): `references/accessible-name-contract.md`
- **Estrategia de locators Playwright** (prioridad, cómputo del nombre accesible, recetas,
  auto-waiting, web-first assertions, escape hatch `data-testid`): `references/playwright-locators.md`
- **Método de user journeys** (personas, formato, scoring E2E-vs-abajo, patrón de oro, helpers,
  aislamiento, DB-vs-UI): `references/e2e-journey-method.md`
- **Adaptadores por stack** (Next.js · Laravel+Inertia · Blade · backend de asserts pg/Eloquent/API
  · seed): `references/stack-adapters.md`
- **Script de inventario de testabilidad** (ratio de locators, aria-label, icon-only sin label,
  inputs sin label, onClick no-semántico, dialogs/tabs): `scripts/testability-inventory.mjs`
  - Uso: `node ~/.claude/skills/e2e-testability/scripts/testability-inventory.mjs` desde la raíz del repo.
  - Env: `ROOT` (default `.`), `GLOBS` (CSV, default `src,app,resources,components`),
    `E2E_DIR` (default `e2e,tests/e2e`), `FORMAT` (`table` | `json`).
