# Estrategia de locators Playwright

Cómo apuntar a la UI de forma que el test **no se rompa** con cualquier cambio de markup, y cuándo
(y solo cuándo) bajar a `data-testid`.

## Índice

1. [Prioridad de locators](#1-prioridad-de-locators)
2. [Recetas por tipo de elemento](#2-recetas-por-tipo-de-elemento)
3. [Scoping: encadenar locators](#3-scoping-encadenar-locators)
4. [Auto-waiting y web-first assertions](#4-auto-waiting-y-web-first-assertions)
5. [El escape hatch: data-testid](#5-el-escape-hatch-data-testid)
6. [Anti-patrones de locator](#6-anti-patrones-de-locator)

---

## 1. Prioridad de locators

De preferido a último recurso (alineado con la doc oficial de Playwright):

1. **`getByRole(role, { name })`** — el principal. Refleja cómo el usuario (y la tecnología
   asistiva) percibe la página. `name` matchea el **nombre accesible** (ver contrato).
2. **`getByLabel(text)`** — para form controls con `<label>` asociado.
3. **`getByPlaceholder` / `getByText` / `getByTitle`** — texto visible cuando no hay rol claro
   (mensajes, encabezados). `getByText` es bueno para asserts, frágil para clicks si el texto cambia.
4. **`getByTestId('…')`** — solo cuando NO existe un nombre accesible posible (ver §5).

Regla mental: **si un humano con lector de pantalla puede encontrar el elemento por su nombre,
Playwright también debería.** Si no puede, el problema es de la UI (falta etiquetado), no del test.

## 2. Recetas por tipo de elemento

```ts
// Botones / acciones
page.getByRole('button', { name: 'Guardar' })
page.getByRole('button', { name: /acciones de pérez/i })   // scoped por entidad

// Links / navegación
page.getByRole('link', { name: 'Clientes' })

// Inputs
page.getByLabel('Email')
page.getByLabel('Carátula')

// Combobox / select (rol nativo o ARIA)
page.getByRole('combobox', { name: 'Cliente' })

// Dialog y su contenido
const dlg = page.getByRole('dialog', { name: /editar cliente/i })
await dlg.getByRole('button', { name: /cerrar editar cliente/i }).click()

// Tabs (nombre estable, sin el contador)
page.getByRole('tab', { name: 'Movimientos' })

// Tabla: fila por su contenido, luego el control de esa fila
const fila = page.getByRole('row', { name: /Causa Nº 1234/ })
await fila.getByRole('button', { name: /acciones/i }).click()

// Heading (asserts de "estoy en la página correcta")
await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible()

// Estado activo de nav
await expect(page.getByRole('link', { name: 'Causas' })).toHaveAttribute('aria-current', 'page')
```

## 3. Scoping: encadenar locators

El antídoto contra la ambigüedad: acotar el contenedor antes del control.

```ts
// dentro de un dialog
const dlg = page.getByRole('dialog', { name: /nuevo cliente/i })
await dlg.getByLabel('Nombre').fill('Pérez, Juan')
await dlg.getByRole('button', { name: 'Guardar' }).click()

// dentro de una fila
const fila = page.getByRole('row', { name: /Pérez/ })
await expect(fila.getByText('Activo')).toBeVisible()

// dentro de una región nombrada (landmark / section con aria-label)
const agenda = page.getByRole('region', { name: 'Agenda próxima' })
await expect(agenda.getByText(/audiencia/i)).toBeVisible()
```

Esto también es **por qué** conviene scopear los nombres por entidad (Track 1): habilita el patrón
"contenedor → control" que es el más robusto.

## 4. Auto-waiting y web-first assertions

- Playwright **espera solo** a que el locator sea accionable (visible, habilitado, estable) antes de
  click/fill. **No** usar `waitForTimeout(...)` — es la causa #1 de flakes.
- Usar **web-first assertions** que reintentan hasta cumplirse:
  ```ts
  await expect(page.getByText('Cliente creado')).toBeVisible()   // reintenta hasta timeout
  await expect(page.getByRole('row', { name: /Pérez/ })).toBeVisible()
  ```
- Para estado que tarda en persistir (jobs, sync), no dormir: **pollear el efecto durable** (ver
  `e2e-journey-method.md`, helper `pollUntil`) o `expect.poll(...)`.
- Navegación: `await page.goto(url)` y dejar que los `expect` esperen el render; evitar
  `waitForLoadState('networkidle')` salvo casos puntuales.

## 5. El escape hatch: data-testid

`data-testid` es legítimo, pero es **último recurso**. Usarlo solo cuando **no hay nombre accesible
posible**:

- un canvas de gráfico / mapa / visualización sin texto;
- un contenedor genérico que hay que scopear pero no tiene rol natural (preferir antes darle un
  `role` + `aria-label` si es semánticamente una región);
- un widget de terceros cuyo markup no controlás.

Reglas:

- **Justificar cada `data-testid`** en el PR/commit: por qué no alcanzó un nombre accesible.
- Mantener el **ratio sano**: `getByRole`+`getByLabel` >> `getByTestId`. Si el repo se llena de
  testids, es señal de que la UI no está etiquetada — volver a Track 1.
- Convención de atributo: por default Playwright usa `data-testid`. Si el repo ya usa otro
  (`data-test`, `data-cy`), configurarlo con `testIdAttribute` en `playwright.config` en vez de
  pelear con el existente.

```ts
// solo cuando no hay alternativa semántica
await page.getByTestId('mrr-chart').hover()
```

## 6. Anti-patrones de locator

| ❌ Anti-patrón | Por qué falla | ✅ En su lugar |
|---|---|---|
| `page.locator('.btn-primary')` | clase = detalle de estilo, cambia con refactor | `getByRole('button', { name })` |
| `page.locator('div:nth-child(3) > button')` | posición frágil, se rompe al reordenar | scoping por nombre/contenido |
| `page.locator('text=Acciones').nth(4)` | índice mágico, depende del orden | scoped por entidad |
| `await page.waitForTimeout(2000)` | sleep fijo = flake | auto-waiting / `expect` / `expect.poll` |
| `getByText('Guardar')` para un click de botón | matchea cualquier "Guardar" del DOM | `getByRole('button', { name: 'Guardar' })` |
| XPath largo (`//div[@class=...]//span`) | acoplado al árbol exacto | rol + nombre |
| `data-testid` en todo | esconde UI no etiquetada, no mejora a11y | etiquetar (Track 1), testid solo si no hay opción |

> Diagnóstico rápido de un E2E frágil: si el spec está lleno de `.locator('...')` con clases/CSS,
> `nth()` y `waitForTimeout`, el problema casi siempre es **falta de nombres accesibles** en la UI.
> Arreglar la UI (Track 1) suele eliminar la mayoría de esos selectores.
