# Anti-patrones — qué NO conviene hacer

Lista canónica de errores comunes al manejar estados de UI. Cada uno con su razón.

## 1. No usar spinner full-page para datos

```tsx
/* MAL: la vista entera colapsa a un spinner centrado */
{loading ? <Loader2 className="animate-spin mx-auto" /> : <Table data={rows} />}
```

**Razón**: el layout desaparece y vuelve a aparecer → la vista "salta", el usuario pierde el contexto, y se siente lento aunque no lo sea.

**Regla**: skeleton que imita la forma del contenido (preserva el layout). El spinner es para ACCIONES (un botón), no para cargar datos.

## 2. No hardcodear colores de estado

```tsx
/* MAL */
<input className={error ? "border-red-500" : "border-slate-300"} />
<p className="text-green-600 bg-green-50">Guardado</p>
```

**Razón**: rompe la consistencia con el sistema de color, ignora el dark mode calibrado, y desalinea de los tokens semánticos. El mismo "rojo de error" termina con 3 valores distintos en la app.

**Regla**: tokens semánticos (`--danger-*`, `--success-*`) del dominio Color. Para el campo en error: `aria-invalid` (que pinta el borde danger tokenizado) + texto semántico.

## 3. No dejar empty states sin acción

```tsx
/* MAL: callejón sin salida */
<EmptyState title="No hay clientes" />
```

**Razón**: el usuario ve "no hay nada" pero no sabe qué hacer. Un empty state es una oportunidad de guiar, no un mensaje de error.

**Regla**: siempre una acción. Sin-datos → CTA "Crear". Sin-resultados → CTA "Limpiar filtros".

## 4. No mostrar dos estados a la vez

**Razón**: loading + empty juntos (o error + content) confunden y suelen ser un bug del orden de chequeo.

**Regla**: un estado a la vez. Orden: `error → loading → empty → content`. El primero que matchea gana.

## 5. No confundir disabled con loading con readonly

**Razón**: son tres cosas distintas. Disabled = no podés todavía. Loading = procesando. Readonly = no editable pero presente. Tratarlas igual (todo `disabled opacity-50`) pierde información.

**Regla**: disabled (con motivo) · loading (`aria-busy` + spinner) · readonly (`readonly`, sin opacity). Cada una con su tratamiento.

## 6. No dejar el skeleton sin reduced-motion

```tsx
/* MAL: el pulse no para con prefers-reduced-motion */
<div className="animate-pulse bg-muted" />
```

**Razón**: `animate-pulse` de Tailwind no respeta `prefers-reduced-motion` por defecto → molesta a usuarios con sensibilidad al movimiento.

**Regla**: skeleton tokenizado que apaga el pulse bajo `prefers-reduced-motion` (coordinar con el dominio Motion); spinner con `motion-reduce:animate-none`.

## 7. No reinventar los semánticos / spinner / tipografía

**Razón**: States es composición. Si definís un color de success, un timing de spinner o una escala tipográfica DENTRO de States, duplicás lo que ya viven en Color / Motion / Sizing y se desincronizan.

**Regla**: reusar. States orquesta patrones con los tokens de los otros dominios. Si te encontrás definiendo un color o un timing, parate.

## 8. No olvidar el aria de estado

**Razón**: un lector de pantalla no "ve" el spinner ni el borde rojo. Sin `aria-busy`/`role="status"`/`aria-invalid`/`role="alert"`, el estado es invisible para tecnología asistiva.

**Regla**: cada patrón de estado lleva su aria (eje §7 del checklist).

## 9. No usar skeleton con color casi invisible

```tsx
/* MAL: bg-accent sobre card blanca = no se ve */
<Skeleton className="bg-accent" />
```

**Razón**: muchos defaults (`bg-accent`, `bg-muted`) tienen muy poco contraste sobre una card → el skeleton no se percibe y parece que no carga nada.

**Regla**: `--skeleton` calibrado por tema con contraste real sobre la card.

## 10. No abusar de los check marks de éxito

**Razón**: un check en cada acción genera ruido visual y le quita peso al éxito que importa.

**Regla**: toast para acción efímera completada; badge para estado persistente; inline solo en confirmaciones contextuales puntuales.

## 11. No volver la vista entera a loading en cada re-fetch

**Razón**: filtrar/buscar/paginar NO debería volver toda la vista a skeleton — parpadea y pierde el scroll/contexto.

**Regla**: el skeleton full es para la PRIMERA carga; el re-fetch usa un overlay sutil sobre el contenido existente (dominio Motion, `preserveState`).
