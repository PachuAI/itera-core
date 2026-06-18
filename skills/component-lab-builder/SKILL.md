---
name: component-lab-builder
description: Construir y EXTENDER cualquiera de nuestras bibliotecas de componentes / UI-Labs (React) sin redescubrir la arquitectura cada vez. Es el complemento de "construcción" de los skills `*-audit` (color/responsive/motion/states/a11y), que diseñan/auditan las fundaciones pero no dicen cómo AGREGAR cosas. Está estructurado como CORE AGNÓSTICO + ADAPTERS POR STACK, porque el MÉTODO es compartido pero la capa de estilo no. Core (sirve igual en todas): registry de stories + categorías + modos de canvas (flat/responsive/shell), gallery + iframe-host, el provider de portal del iframe + EL footgun grande (toda primitiva con `<Portal>` se escapa del iframe en canvas con iframe → hay que pasarle el `container` del iframe), y las recetas primitiva→composición→pantalla→registry con la disciplina de motion/states/a11y/color. Adapters: (1) **shadcn + Tailwind v4 + bridge `[data-slot]`** — LISTO (referencia: Alquímica UI-Lab, `resources/js/components/ui-lab/` + `resources/css/alquimica-tokens.css`): consumo de tokens por arbitrary value (`@theme` inerte fuera del root → `text-[length:var(--x)]`), bridge que tematiza shadcn por `data-slot` (doctrina superficie/elevación/sin-borde), y el espejo iframe-aware de primitivas Radix (`container={useIframePortalContainer()}`); (2) **base-ui + CSS Modules** (referencia: itera-ui) — STUB honesto, se completa cuando se trabaje ahí. Usar SIEMPRE que haya que agregar o modificar UI en una biblioteca de componentes / UI-Lab: "agregá un componente al lab", "nueva primitiva", "una pantalla nueva en el UI-Lab", "componetizar X fiel al sistema", "modificar el modal/tabla/etc del design system", "prototipar un flujo en componentes reales", "/component-lab-builder", o cuando estés por ponerte a redescubrir cómo está armado el lab para tocar algo. NO usar para diseñar/auditar fundaciones (eso son los `*-audit`); para "screenshot → componentes para mocks/video" en la lib CSS-Modules usar `screenshot-to-component`; para mocks HTML standalone de marketing, `prototipo-itera-lex`.
---

# Component Lab Builder

Construir y extender **cualquiera de nuestras bibliotecas de componentes / UI-Labs**: agregar primitivas, componentes de composición y pantallas/flujos enteros **fieles al sistema**, listos para prototipar — sin volver a investigar cómo está armado el lab en cada cambio.

Es el **complemento de construcción** de la familia `*-audit` (esos **diseñan/auditan** fundaciones y dejan tokens + reportes; este **usa** las fundaciones para construir).

## Arquitectura del skill: CORE + ADAPTERS

El **método** de construir un lab es compartido entre nuestras bibliotecas, pero la **capa de estilo** cambia por stack. Por eso:

- **CORE (agnóstico)** — sirve igual en todas: arquitectura del lab (registry/canvas/iframe), el provider de portal del iframe + el footgun de portal-escaping, y las recetas con disciplina de las fundaciones. Ver `references/lab-anatomy.md` y `references/recipes.md`.
- **ADAPTER por stack** — los detalles de estilo (cómo se consumen tokens, cómo se tematiza una primitiva, cómo se hace el espejo de portal):
  - `references/adapter-shadcn-tailwind.md` — **shadcn + Tailwind v4 + bridge `[data-slot]`. LISTO.** Referencia: **Alquímica UI-Lab**.
  - `references/adapter-baseui-cssmodules.md` — **base-ui + CSS Modules. STUB** (referencia: itera-ui), se completa al trabajar ahí.

**Primer paso SIEMPRE: detectar el stack** (mirar `package.json` + cómo se estilan los componentes) y abrir el adapter que corresponda. Si no hay adapter (ej. otro stack), construirlo respetando el core.

## Cuándo usar

- "Agregá una primitiva / un componente de composición / una pantalla al lab."
- "Modificá el modal / la tabla / el form / la columna de acciones del design system."
- "Prototipá este flujo en componentes REALES" (no mocks HTML).
- Antes de leer 5 archivos para entender cómo conectar algo al lab → leé este skill primero.

## Cuándo NO usar

- Diseñar/auditar una fundación (paleta, tamaños, motion, estados, a11y) → el `*-audit` correspondiente.
- "Screenshot → componentes para mocks/video" en la lib CSS-Modules (itera-ui) → `screenshot-to-component`.
- Mocks HTML standalone para marketing/redes → `prototipo-itera-lex`.

## Modelo mental (core — leer antes de tocar nada)

Detalle en `references/lab-anatomy.md`. Las 3 cosas que se redescubren siempre:

1. **Anatomía del lab**: registry plano de stories, categorías, los 3 **modos de canvas** (`flat`/`responsive`/`shell`) y cuándo cada uno, cómo el visor monta la story en el iframe. Esta arquitectura es el **ancestro común** de nuestras libs (Alquímica la portó de itera-ui).
2. **Provider de portal + footgun (AGNÓSTICO)**: en un canvas con iframe el árbol vive DENTRO del iframe pero el JS corre en la ventana padre → TODA primitiva con `<Portal>` (Dialog/Select/Menu/Popover/Tooltip, sea Radix o base-ui) portalea al `document.body` del PADRE y se **escapa del iframe** (sin estilo, mal ubicada). Solución agnóstica: capturar el `body` del iframe (`IframePortalProvider`/`useIframePortalContainer`) y pasárselo como `container` al `<Portal>`. El **provider es core**; el **espejo concreto de la primitiva es del adapter**.
3. **Recetas con disciplina** (`references/recipes.md`): primitiva → composición → pantalla → registry, aplicando SIEMPRE las reglas de las fundaciones (abajo). Los detalles de estilo de cada paso se resuelven con el adapter del stack.

## Reglas que SIEMPRE se aplican (de los `*-audit`)

No reinventar — heredar de las fundaciones (los valores concretos viven en el adapter del stack):

- **Color**: superficies por rol + semánticos por token (NO colores hardcodeados). Color del DATO (tags) con tinte (`color-mix`/equivalente), no fills saturados. Respetar la escalera de elevación (no anidar un campo en un contenedor de la misma superficie).
- **Sizing/tipografía**: roles (`title/label/meta/eyebrow`) + control-heights + spacing por token.
- **Motion**: TODO cambio de estado transiciona (disabled↔enabled, focus, invalid, hover), no solo enter/exit. Collapse/reveal con grid-rows `0fr→1fr` (el padre height:auto sigue suave); swap de contenido de distinta altura = FLIP de altura (sin `key`+fade, que flashea). `reduced-motion` siempre respetado.
- **States**: skeleton-first para contenido, spinner para acción, overlay para transición; máquina `error→loading→empty→content`; aria de estado.
- **A11y**: target-min en icon-buttons, foco visible (inset dentro de contenedores con clip / halo en espacio abierto), labels/aria, landmarks.

## Verificación

- `npx tsc --noEmit` + `eslint` sobre lo tocado. El lab corre por Vite/HMR → **sin rebuild**. NUNCA matar el dev server del usuario.
- Validación visual en la ruta del lab (`/dev/ui-lab` o equivalente), dark Y light, 2+ resoluciones si toca layout.
- Cierre significativo → reflejar en `.planning/STATE.md` (vía `/save`).

## Resources

- `references/lab-anatomy.md` — **core**: registry, categorías, modos de canvas, visor, provider de portal + footgun.
- `references/recipes.md` — **core**: recetas paso a paso con checklist + patrones de motion + footguns transversales.
- `references/adapter-shadcn-tailwind.md` — **adapter LISTO**: tokens por arbitrary value, bridge `[data-slot]`, tematizar un slot, espejo iframe-aware Radix. (Alquímica UI-Lab).
- `references/adapter-baseui-cssmodules.md` — **adapter STUB**: lo que sabemos de itera-ui (base-ui + CSS Modules) + qué falta relevar. Cross-link a `screenshot-to-component`.
