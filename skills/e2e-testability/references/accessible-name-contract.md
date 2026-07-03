# Contrato de nombres accesibles (Track 1)

El conjunto mínimo de cambios de markup que hace cada elemento **apuntable por un locator semántico
estable** y, de paso, accesible. Es el subconjunto de a11y que Playwright consume; la a11y
estructural completa (foco/teclado/landmarks) es de `a11y-audit`.

## Índice

1. [La regla de oro: scoping por entidad](#1-la-regla-de-oro-scoping-por-entidad)
2. [Tabla del contrato](#2-tabla-del-contrato)
3. [Recetas JSX (Next.js / Inertia-React)](#3-recetas-jsx-nextjs--inertia-react)
4. [Recetas Blade (Laravel server-rendered)](#4-recetas-blade-laravel-server-rendered)
5. [Cómo se computa el nombre accesible](#5-cómo-se-computa-el-nombre-accesible)
6. [Cómo aplicar el contrato sin romper la UI](#6-cómo-aplicar-el-contrato-sin-romper-la-ui)

---

## 1. La regla de oro: scoping por entidad

El error #1 que hace que un E2E se corte: un nombre accesible **repetido** en una lista. Si 20 filas
tienen un botón `aria-label="Acciones"`, `getByRole('button', { name: 'Acciones' })` matchea 20
elementos → Playwright tira *strict mode violation* o el test apunta al equivocado.

**Regla**: en cualquier colección (tabla, lista, grilla de cards), el nombre accesible de cada
control debe incluir **el dato que identifica esa fila**.

```
❌ aria-label="Acciones"                 → ambiguo en N filas
✅ aria-label={`Acciones de ${cliente.nombre}`}
✅ aria-label={`Editar causa ${causa.caratula}`}
✅ aria-label={`Eliminar evento ${evento.titulo}`}
```

Y del lado del test, eso permite **scopear primero la fila y después el control** (más robusto aún):

```ts
const fila = page.getByRole('row', { name: /Pérez, Juan/ })
await fila.getByRole('button', { name: /acciones/i }).click()
```

El mismo principio aplica a dialogs con identidad: el botón de cierre de un modal "Editar cliente"
debe llamarse `"Cerrar Editar cliente"`, no `"Cerrar"` genérico, para que conviva con otros modales.

## 2. Tabla del contrato

| Elemento | Qué se agrega | Por qué (test + a11y) |
|---|---|---|
| Botón icon-only | `aria-label` **scoped por entidad** | sin texto no tiene nombre → ni el lector ni `getByRole({name})` lo encuentran; scoped = único en listas |
| Icono decorativo (dentro de botón/link con texto) | `aria-hidden="true"` | el icono no debe sumar al nombre accesible del control ni duplicar texto |
| Dialog / Sheet / Modal | nombre de cierre accesible; scoped si tiene identidad (`"Cerrar <nombre>"`) | el test apunta al cierre del modal correcto; el lector anuncia qué cierra |
| Contador en una tab/badge | `aria-hidden` en el número | la tab se llama `"Movimientos"`, no `"Movimientos 5"` → nombre estable aunque cambie el conteo |
| Input / textarea / select | `<label htmlFor>` + `id` (o `aria-label` si no hay label visible) | habilita `getByLabel('Email')`; required para lectores |
| Date picker / combobox / select custom | `id` + label asociado, `role` correcto | los widgets custom suelen perder el rol/nombre nativo |
| Fila / card clickeable | celda primaria = `<a>`/`<Link>`/`<button>` real (no `<div onClick>`) | da un rol apuntable (`link`/`row`) + foco por teclado |
| Empty state / mensajes | componente compartido, texto consistente, un idioma | locators por texto estables; sin "English/Español" mezclados |
| Nav item activo | `aria-current="page"` | apuntable como estado; el lector anuncia "actual" |
| Toggle / disclosure | `aria-expanded` | estado apuntable y anunciado |

> El aria **DE ESTADO** más fino (`aria-busy`, `aria-disabled`, `aria-invalid`, `role=status/alert`)
> es de `states-audit`, no de este skill. Acá: nombres + `aria-current`/`aria-expanded`/`aria-hidden`
> estructural, que es lo que un journey necesita para apuntar y esperar.

## 3. Recetas JSX (Next.js / Inertia-React)

### Botón icon-only scoped (el caso más frecuente)

```tsx
// ❌ antes — no apuntable, y ambiguo en una tabla
<Button variant="ghost" size="icon">
  <MoreHorizontal className="size-4" />
</Button>

// ✅ después
<Button variant="ghost" size="icon" aria-label={`Acciones de ${user.name}`}>
  <MoreHorizontal className="size-4" aria-hidden="true" />
</Button>
```

### Dialog/Sheet con `closeLabel` scoped (patrón de primitiva)

Hacer que la primitiva acepte un `closeLabel` con default seguro; los modales con identidad lo pasan.

```tsx
// components/ui/dialog.tsx (primitiva) — extracto del contrato
function DialogContent({ closeLabel = "Cerrar", children, ...props }) {
  return (
    <DialogPrimitive.Content {...props}>
      {children}
      <DialogPrimitive.Close>
        <X aria-hidden="true" />
        <span className="sr-only">{closeLabel}</span>   {/* nombre accesible del botón de cierre */}
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  )
}

// uso con identidad
<DialogContent closeLabel="Cerrar Editar cliente"> … </DialogContent>
```

### Tab con contador estable

```tsx
// ❌ el nombre accesible queda "Movimientos 5" y cambia con el dato
<TabsTrigger value="mov">Movimientos {count}</TabsTrigger>

// ✅ el número no entra al nombre accesible → la tab se llama "Movimientos"
<TabsTrigger value="mov">
  Movimientos <span aria-hidden="true" className="ml-1 …">{count}</span>
</TabsTrigger>
```

### Input con label asociado

```tsx
// ❌ placeholder no es nombre accesible confiable
<input placeholder="Email" />

// ✅ getByLabel('Email') funciona
<label htmlFor="email">Email</label>
<input id="email" name="email" type="email" />
// (o, sin label visible) <input aria-label="Email" />
```

### Fila clickeable → link real (apuntable + teclado)

```tsx
// ❌ <div onClick> — sin rol, sin foco por teclado, no apuntable como link
<div onClick={() => router.push(`/clientes/${c.id}`)}>{c.nombre}</div>

// ✅ celda primaria como <Link>; el onClick de la fila queda como conveniencia de mouse
<Link href={`/clientes/${c.id}`} onClick={(e) => e.stopPropagation()}>{c.nombre}</Link>
```

## 4. Recetas Blade (Laravel server-rendered)

El concepto es idéntico; cambia la sintaxis. En proyectos Inertia+React usar las recetas JSX de
arriba — Blade aplica solo a vistas server-rendered (`.blade.php`).

### Botón icon-only scoped

```blade
{{-- ❌ --}}
<button class="btn-icon"><x-heroicon-o-ellipsis-horizontal class="size-4"/></button>

{{-- ✅ --}}
<button class="btn-icon" aria-label="Acciones de {{ $user->name }}">
  <x-heroicon-o-ellipsis-horizontal class="size-4" aria-hidden="true"/>
</button>
```

### Input con label

```blade
{{-- ✅ --}}
<label for="email">Email</label>
<input id="email" name="email" type="email" />
```

### Fila clickeable

```blade
{{-- ✅ link real como celda primaria --}}
<a href="{{ route('clientes.show', $cliente) }}">{{ $cliente->nombre }}</a>
```

### Componente Blade con `aria-hidden` en icono decorativo

```blade
<a href="…">
  <x-heroicon-o-pencil class="size-4" aria-hidden="true"/>
  Editar
</a>
```

> Si el proyecto usa Livewire/Alpine para abrir modales, asegurar que el contenedor del modal tenga
> `role="dialog"` + un `aria-label`/`aria-labelledby` apuntable, igual que la primitiva JSX.

## 5. Cómo se computa el nombre accesible

Prioridad (resumen operativo de la spec accname), de mayor a menor:

1. `aria-labelledby` (referencia a otro/s elemento/s por id)
2. `aria-label`
3. nombre nativo: para form controls, el `<label>` asociado; para `<img>`, el `alt`; para
   `<button>`/`<a>`, su **texto visible** (incluido el de hijos no `aria-hidden`)
4. `title` (fallback débil)
5. en algunos controles, `placeholder` (poco confiable — no depender de él en tests)

Implicancias prácticas para el test:

- Texto **dentro** de un botón/link **es** su nombre accesible → `getByRole('button', { name:
  'Guardar' })` funciona sin tocar nada. El etiquetado solo hace falta cuando **no hay** texto
  (icon-only) o cuando el texto es **inestable** (incluye un contador, un estado, una fecha).
- Un icono visible sin `aria-hidden` dentro de un botón con texto puede **inyectar ruido** al nombre
  (algunos sets de iconos exponen `title`). Marcarlos `aria-hidden="true"` deja el nombre limpio.
- `getByRole` también filtra por **rol** → asegurarse de que el elemento tenga el rol correcto
  (`button` vs `link` vs `row`). Un `<div onClick>` no tiene rol → no es apuntable por rol.

## 6. Cómo aplicar el contrato sin romper la UI

- **Cambios aditivos primero.** `aria-label`, `aria-hidden`, `htmlFor`/`id` no cambian el render →
  riesgo casi nulo. Empezar por esos.
- **`<div onClick>` → elemento semántico es el cambio más delicado**: puede alterar estilos
  (display, foco). Hacerlo con cuidado, preservar el handler de mouse, y verificar en navegador.
- **Verificar con el inventario** (`scripts/testability-inventory.mjs`) antes y después: el ratio
  `getByTestId`/(`getByRole`+`getByLabel`) debe **bajar**, el conteo de icon-only sin label debe
  tender a 0 en las superficies tocadas.
- **No barrer todo de una.** Aplicar por superficie/journey (ver "Orden de trabajo" en SKILL.md):
  cada label agregado se valida con el test que lo ejercita.
- **Idioma consistente.** Si la app es en español, los nombres accesibles también (locators por
  texto/`name` estables). Si hay strings en inglés sueltos, normalizarlos de paso.
