# Anti-slop + marca — checklist

Reglas destiladas de `docs/brand.md` de itera-lex y de iteraciones reales. Repasalas antes de entregar
un prototipo: son las que separan "se ve ÍTERA" de "se ve generado por IA".

## Color (la regla que más se olvida)
- **Paleta cerrada**: negro / blancos-grises cálidos / naranja ÍTERA. NADA de azules, verdes, violetas,
  amarillos. El rojo (`--danger`) es la única excepción funcional (errores/destructivo).
- **`--itera` (naranja saturado) = SOLO acciones**: fondo del CTA gradient y del toggle/pill activo.
  Naranja en ambos temas.
- **`--itera-ink` = texto/líneas/seleccionado, y ADAPTA**: gris oscuro en light, naranja claro en dark.
  → En **light** la UI es sobria y neutra; el naranja aparece casi solo en los botones de acción. No
  metas naranja en textos/labels en light. En **dark** los acentos de ink sí son naranjas.
- NUNCA hex/oklch hardcodeado ni `shadow-[...]` ni `bg-gray-*`/`border-zinc-*`. Todo vía las clases que
  ya leen los tokens.

## Superficies y elevación
- Modal centrado vive en `var(--modal)` (= surface-2). El contenido **fluye sobre esa superficie**.
- **NO "box in the box"**: no metas un control dentro de un contenedor con borde/`bg` que a su vez
  contiene más cajas. Si ves 3 superficies anidadas con paddings sumados, aplaná.
- Inner card que eleva sobre un wrapper → `var(--surface-3)` (más clara). Hover de fila → `var(--raise)`.
- Sombras por token (`shadow-soft`, `shadow-modal`), nunca inventadas.

## Inputs y focus (anti-ring)
- El **ring naranja duro de focus está prohibido**. Dos caminos válidos:
  - **line** (`.line-input`/`.line-select`): underline que se pone naranja-ink al focus. Default para
    modales y forms simples.
  - **framed** (`.fr-input`/`.fr-select`): caja con `box-shadow: var(--focus-ring)` (glow naranja sutil
    en 2 capas, NO un borde grueso). Para forms en dialog que necesitan delimitar campos.
- Label SIEMPRE separado del campo (gap), nunca pegado/fusionado.
- `<select>` nativo = PROHIBIDO (abre popup blanco del SO). Usá `.xselect` (popover oscuro estilizado).
- Buscadores = `.combo` (un campo con lupa adentro + resultados flat debajo). NUNCA input + botón-lupa
  separado + caja de resultados aparte.

## Decisiones (modo/opciones)
- Una elección de modo (nueva/existente, qué cliente, etc.) se hace VISIBLE: **segmented** o **choice
  cards** o **radios slim**. Evitá esconderla en un `<select>` cuando el usuario tiene que decidir.
- Sugerencias del sistema/IA → preferí ofrecerlas como **una opción concreta** ("Cargar a X") antes que
  como un banner colgado arriba que el usuario tiene que interpretar.

## Iconos (anti-slop)
- Ícono representativo al lado del título (`flex items-center gap-3`), `strokeWidth=1.5`, color de marca.
  NO "frame dentro de frame" (no metas un cuadradito con `bg-muted` alrededor del ícono si la card ya es
  un frame).
- Empty states → ícono suelto centrado, no enmarcado.
- `aria-label` SIEMPRE en botones icon-only.

## Tipografía y radius
- Plus Jakarta Sans (UI) + Geist Mono (números/IDs/expedientes). `tracking-tight` en headings grandes.
- Radius 8px (`--radius`). Modales 14px (ya en `.modal`).

## Copy (voz ÍTERA Lex)
- Para abogados argentinos 40+. Directo, claro, sin marketing-speak, sin jerga en inglés, sin tono
  inspiracional. "Menos es más si la acción ya es clara."
- Vos/tu (rioplatense). "es obligatorio" (no "es requerido"). Recortá notices que explican lo obvio.
- Si vas a escribir copy fino, mirá el skill `iteralex-copy-voice`.

## Densidad
- Profesional y sobria, no "dashboard de startup". Cards del dashboard `shadow-soft` (sin halo difuso).
  Info card stand-alone genérica `shadow-elevation-1` (acá: `shadow-modal` para el modal).
