# Método de user journeys (Track 2)

Cómo pasar de "tengo la UI etiquetada" a "tengo una suite E2E que protege los flujos reales". El
principio: **un journey por persona-intención**, no un test por feature aislada. Destilado de la
suite de ÍTERA Lex (personas P1–P9, ~13 journeys + smokes).

## Índice

1. [Mapa de personas (clases de usuario)](#1-mapa-de-personas-clases-de-usuario)
2. [Formato de un journey](#2-formato-de-un-journey)
3. [Criterio: qué va a E2E vs qué baja a service/unit](#3-criterio-qué-va-a-e2e-vs-qué-baja-a-serviceunit)
4. [El patrón de oro](#4-el-patrón-de-oro)
5. [Qué verificar por DB vs qué alcanza con UI](#5-qué-verificar-por-db-vs-qué-alcanza-con-ui)
6. [Helpers a crear primero](#6-helpers-a-crear-primero)
7. [Aislamiento: serial vs paralelo](#7-aislamiento-serial-vs-paralelo)
8. [Estructura de carpetas](#8-estructura-de-carpetas)

---

## 1. Mapa de personas (clases de usuario)

Antes de escribir tests, enumerar las **clases de usuario** que el producto reconoce. Salen de los
roles, los tipos de cuenta, la capa de admin y la capa pública. Para cada una: en qué se encarna en
el repo (rol, tenant, flag) y qué le importa.

Arquetipos típicos de un SaaS multi-tenant (adaptar al dominio):

| Clase | Encarna en | Qué le importa |
|---|---|---|
| Usuario nuevo (onboarding) | cuenta recién activada, sin datos | entrar, entender, primer valor |
| Usuario en rutina | cuenta operativa con datos | CRUD diario, que nada se pierda, velocidad |
| Admin de la organización | rol admin del tenant | equipo, configuración, billing, visión global |
| Colaborador / rol limitado | rol sin permisos de admin | operar lo asignado; NO administrar |
| Superadmin / operador interno | flag superadmin, panel admin, impersonation | alta/soporte/flags, "acceder como usuario" |
| Usuario demo / comercial | tenant demo read-only o sandbox | demos en vivo sin pegarle a prod |
| Prospecto público (sin sesión) | marketing, formularios, recuperación | evaluar, pedir acceso |
| Destinatario externo (sin login) | abre un recurso por token (`/p/[token]`) | ver/aceptar lo que le mandaron |

**Por qué importa para E2E**: cada clase es un journey (o varios), y los cruces son los seams de más
riesgo — p. ej. *superadmin impersona a un usuario de tenant* cruza dos route groups + cookies, y un
bug ahí = fuga cross-tenant. Esos cruces **merecen su propio journey**.

## 2. Formato de un journey

Documentar cada journey antes de codearlo (sirve de spec y de mapa de cobertura):

- **Intención**: la frase del usuario ("cargar mi primer caso").
- **Persona** + **precondiciones**.
- **Pasos** (la secuencia de UI).
- **Datos seed** necesarios.
- **Resultado visible** (lo que confirma la UI).
- **Estado durable** (las tablas/registros que tienen que quedar — para el assert por DB/API).
- **Criticidad** (de negocio: P0 confianza diaria / P1 regresión / P2 borde).
- **Tipo**: E2E journey · E2E smoke · o "baja a service/unit".
- **Por qué (no) automatizar**: la justificación honesta.

Darle a cada journey un **ID estable** (`J-XXX-n`) para referenciarlo en la matriz de cobertura.

## 3. Criterio: qué va a E2E vs qué baja a service/unit

E2E es caro y más frágil que un unit test. Un flujo **merece E2E** cuando suma puntaje en:

| Eje | Empuja a E2E si… |
|---|---|
| Frecuencia real | lo hace el usuario todos los días |
| Criticidad | un bug pierde un dato, un caso o dinero |
| Cantidad de seams | cruza auth + tenant + service + DB + revalidación + UI |
| Persistencia/auditabilidad | tiene que quedar grabado y auditado |
| Valor comercial/demo | se muestra en una venta o tutorial |

**Anti-criterios (NO E2E aunque tiente):**

- Validaciones de formulario / branches de Zod / formato de fechas → **unit**.
- Combinatorias (toda permutación de permisos, toda cláusula) → **service** + 1 happy-path E2E.
- Lógica pura (cálculos, límites, timezone) → **unit/service**.
- Algo que solo se testea bien con red externa real → **contract test con mock**, nunca E2E.
- Concurrencia / locks / races → **service test dirigido**.
- Aislamiento multi-tenant exhaustivo → **service** (la extensión/ownership) + **1–2 guards E2E**
  puntuales de que la ruta real respeta el scope (no la matriz completa).

Regla práctica: **E2E = wiring de muchos seams + persistencia + frecuencia/riesgo alto.** Lo demás,
más barato y estable abajo. La suite E2E sana es **chica y de alta señal** (decenas, no cientos).

## 4. El patrón de oro

Cada journey:

```
reset por seed  →  login real  →  recorrer la UI por rol/nombre accesible  →  assert del estado durable
```

1. **Reset determinístico**: sembrar el estado por el mecanismo del repo (endpoint seed Bearer,
   factories, `/api/demo-login`). Nunca depender de datos casuales del entorno.
2. **Login real**: por la UI o por un `storageState` preparado en `auth.setup`. Nunca credenciales
   reales de prod; usar cuentas demo/seed.
3. **Recorrer por nombre accesible**: `getByRole`/`getByLabel` (Track 1). Si algo no es apuntable,
   volver a etiquetar, no meter `data-testid`.
4. **Assert doble**:
   - lo **visible** (toast, fila nueva, heading, empty state) con web-first assertions;
   - el **efecto durable** real (registro en DB con el `tenantId`/owner correcto, campo de control,
     audit trail) por **SQL/`pg` directo o API**, no por la UI.

```ts
test('J-DAY-1 · alta de cliente persiste', async ({ page }) => {
  await seedViaHttp('demo-independiente')              // reset
  await loginAs(page, 'abogado-demo')                  // login real
  await page.goto('/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const dlg = page.getByRole('dialog', { name: /nuevo cliente/i })
  await dlg.getByLabel('Nombre').fill('Pérez, Juan')
  await dlg.getByLabel('Email').fill('juan@example.com')
  await dlg.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByText('Cliente creado')).toBeVisible()      // visible
  const row = await waitForClientByName('Pérez, Juan')              // durable (pg)
  expect(row.tenantId).toBe(EXPECTED_TENANT_ID)
  expect(row.actividadCount).toBeGreaterThan(0)                     // audit trail
})
```

## 5. Qué verificar por DB vs qué alcanza con UI

| Verificar por **DB/API** | Alcanza con **UI** |
|---|---|
| Persistencia real (la fila quedó, con sus campos) | Render de listados / headings / empty states |
| `tenantId`/owner correcto y ownership de FKs | Navegación entre rutas y tabs |
| Campos de control (`deletedAt`, `status`, `activo`) | Toasts de éxito |
| Audit trail (actividad, before/after, actor real vs impersonado) | Visibilidad/disabled de botones por rol |
| Joins sin `tenantId` directo (ownership por parent) | Apertura/cierre de dialogs/wizards |
| Conteos no regresivos tras sync/import | Estados intermedios (preview, badges) |

El assert por UI confirma el **wiring**; el assert por DB confirma el **efecto**. Un E2E sin assert
durable es un "no explotó" disfrazado.

> **Footgun**: los nombres de tabla/columna para los asserts SQL salen del **schema real**, no de
> los nombres del ORM. Con Prisma `@@map`/`@map` (snake_case, tablas singular/plural según el repo),
> leer el `schema.prisma` antes de escribir cada query. Ver `stack-adapters.md`.

## 6. Helpers a crear primero

Ningún journey debería abrir su propia conexión a DB ni hardcodear credenciales. Crear el andamiaje
**antes** de los journeys:

1. **`helpers/sql.ts`** (o equivalente): `withClient(fn)` (connect/end), queries reutilizables
   tipadas (`findClientByName`, `countRows`), y `pollUntil(queryFn, { describe })` para esperar
   efectos durables sin dormir.
2. **`helpers/seed.ts`**: `seedViaHttp(target)` con el secreto Bearer; `skipIfNoSeedSecret()`.
3. **`helpers/tenants.ts`**: constantes de slugs/emails/creds demo (centralizadas, no dispersas) +
   `loginAs(page, tenant)`.
4. **`helpers/navigation.ts`**: `dismissModalsIfVisible` (cerrar tour/welcome que bloquean la UI),
   helpers de navegación comunes.

Estos helpers son **reusables entre repos** con mínimos cambios — son el núcleo portable de la suite.

## 7. Aislamiento: serial vs paralelo

- **Serial** dentro de un proyecto/spec cuando varios specs mutan el **mismo** tenant/fixture
  compartido (`--workers=1` o `test.describe.serial`). Nunca dos specs en paralelo mutando el mismo
  estado.
- **Paralelizable** cuando cada spec write-capable tiene su **tenant/fixture dedicado** o hace
  cleanup/reset propio.
- **Cleanup por test**: borrar solo los artefactos que el test creó, para que una corrida fallida no
  contamine la siguiente. Imitar el cleanup acotado del flujo más complejo (en ÍTERA Lex, el wizard
  PUMA).

## 8. Estructura de carpetas

Patrón validado (adaptar a la convención del repo):

```
e2e/
  fixtures/
    auth.setup.ts          # storageState write-capable (login una vez)
  helpers/
    sql.ts                 # withClient, queries, pollUntil
    seed.ts                # seedViaHttp(target)
    tenants.ts             # slugs/creds + loginAs
    navigation.ts          # dismiss modals, navegación
  smoke/                   # baratos, por superficie (público, demo, upload, …)
  journeys/                # jornadas completas por persona, terminan en assert durable
```

- **smoke**: rápidos, una superficie, confirman "esto carga / el wiring básico anda".
- **journeys**: una persona-intención de punta a punta, con assert durable. Reemplazan a los viejos
  "tests de feature aislada" (login suelto, CRUD sin persistencia) que dan falsos verdes.

Mantener una **matriz de cobertura** viva (`E2E-COVERAGE.md` o similar): flujo / estado
(protegido/parcial/falta) / evidencia durable / gap. Regla: antes de sumar un test, ubicar el hueco
exacto.
