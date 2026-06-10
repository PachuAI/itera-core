# Anatomía — kit, contrato data-step y primitivos

## Contrato `data-step` (motor de reveal)

- Root: `<div class="feed is-vertical story" data-max-step="N">` (clase `story` para el JS, `feed is-vertical` para el sistema del feed).
- Cada elemento que "entra" lleva `data-step="k"` → visible cuando el paso actual `>= k` (acumulativo).
- Elementos SIN `data-step` = scaffolding, siempre visibles: `.band-top/bottom`, `.wordmark-hero`, `.flex-top/bottom/spacer`, el wrapper del device, `.brand-hero__mark`.
- `data-enter-label="..."` opcional → la escalera lista "qué entra" en ese paso (sirve para decidir el motion).
- `data-max-step` autoritativo; el JS usa `Math.max(declarado, computado)`.
- **Reserve-space**: los ocultos mantienen su caja (`visibility:hidden; opacity:0`, NO `display:none`) → la composición no reflowea entre pasos. El último frame ES la pieza real, construida fielmente.
- Regla del CSS: por defecto `[data-step]` está VISIBLE; solo se oculta cuando el JS agrega `.is-stepping` al `.story`. Así, sin JS (o si falla), la pieza final igual se ve completa.

## Tres vistas (story-kit.js, vía `location.search`)

- sin query → no-op (queda la composición final). Es lo que rasteriza `render.mjs`.
- `?view=ladder` → reemplaza el body por la escalera: clona el `.story` por paso, escalado, en filas, con caption "qué entra" y el final resaltado.
- `?step=N` → frame único con visibilidad acumulada hasta N (para export PNG por paso).

## Primitivos (story-kit.css)

**Artboard / layout** (de `iteralex-typo.css`): `.feed.is-vertical` (1080×1920), `.band-top/bottom`, `.wordmark-hero` (wordmark 64px arriba), `.flex-top/flex-bottom/flex-spacer` (centrado que respira), `.flex-mid-top/bottom` (gaps fijos 40px alrededor del mock).

**Texto**:
- `.statement` + `.statement__lead` (72px, peso 800) + `.statement__sub` (40px, peso 500, gris, **centrado**). `.accent` (naranja) para el keyword. Para statements SIN mock (tipográficas) y para el lead de las con-mock.
- `.text-bottom` (40px, peso 600, blanco) + `.text-bottom__accent` (naranja). **Para el texto DEBAJO del mock** (más peso que statement__sub → balancea con el lead).
- `.text-top__eyebrow` (24px naranja) + `.text-top__headline` (72px) — patrón del feed con eyebrow (úsalo si la cadena lleva eyebrow; las narrativas NO).
- `.grad` — gradiente naranja sobre un keyword (alternativa a `.accent`).
- `.brand-text` / `.brand-text__lex` — "ÍTERA Lex" inline (ÍTERA blanco + Lex naranja).

**Device mocks**:
- `.laptop` (`__screen` 16:10, `__topbar` con dots + `__url`, `__img`, `__base`) — features de escritorio web.
- `.phone` (`__frame` 9:19.5, `__img`) — features mobile.
- `.mock-ph` (`__eyebrow` "Vista previa" + `__name`) — placeholder hasta la captura real. Sombra del mock sutil (tokenizada con `--brand-accent-glow` vía `color-mix`).

> **SSOT del diseño del frame** (bezel/sombra/topbar/dynamic island) = skill `iteralex-device-mockup`. Los `.laptop`/`.phone` del kit son un **port calibrado** para stories (tamaños propios). Si cambia el DISEÑO del frame, actualizar `iteralex-device-mockup` primero y re-portar al kit. (Mismo frame vive además inline en feed-launch; converge al diseño de device-mockup.)

**Cierre / fine print** (texto, NO pills):
- `.story-domain` — dominio chico (claro) con divider fino faded debajo. Para CTA de cierre.
- `.story-note` — nota chica muted (ej framing piloto honesto).

**Brand-hero**: `.brand-hero` + `.brand-hero__mark` (wordmark 140px centrado) — opener de cadena.

**Escalera** (namespaced `.ladder-*`): chrome de la vista `?view=ladder`. No tocar para piezas; solo afecta el browser.

## Numeración por cadena (bloques de decenas)

Cada cadena ocupa una decena para que el orden de archivo siga el de publicación: cadena A = `10-…14`, B = `20-…`, C = `30-…`. El orden REAL lo define `CONFIG.chains[].stories` en `index.html`.

## Patrones de cadena

- **Feature suite**: intro (qué es) → N tools (un mock por tool) → cierre/CTA. Todas con mock. (Ref: cadena Suite del stage.)
- **Narrativa**: hilo de 4 beats (origen/observación → qué hacemos → acceso). 1ª brand-hero, 2 tipográficas, 2 con mock. (Ref: cadenas Patagonia / "En la web".)
- Cierre: el dominio (`.story-domain`) cierra cada pieza, o una pieza-CTA tipográfica al final.

## Project-agnostic / portar a otra marca

El kit usa solo tokens `--brand-*` → reskinnea con el `shared.css` del proyecto. PERO depende de `iteralex-typo.css` (stage-local de iteralex). Para otra marca (ej itera madre): portar un `iteralex-typo.css` equivalente con sus tokens, o generalizar. Los device mocks y el motor de reveal son agnósticos.
