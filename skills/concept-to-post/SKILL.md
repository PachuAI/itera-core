---
name: concept-to-post
description: Expandir un concepto corto — una frase, el nombre de una pantalla, un par de palabras sueltas (como las piezas del pool de ÍTERA o ÍTERA Lex) — en una pieza de Instagram RICA en contenido: un single enriquecido o un carrusel completo. El método restituye el "frame" que a un one-liner suelto le falta (quién lo construye, para quién, por qué importa) y produce SIEMPRE las dos versiones de cada concepto (single enriquecido + carrusel), marcando cuál conviene de primaria según si una pantalla alcanza o el valor es un proceso/flujo/antes-después. Product-aware — enchufa la voz y las pantallas reales de cada marca (ÍTERA marca madre → manual-de-marca + UI Lab de Alquímica; ÍTERA Lex → skill iteralex-copy-voice + biblioteca de componentes lex). Devuelve un SPEC estructurado (copy por slide + qué pantalla + formato), listo para que lo rendericen los skills visuales. Usar cuando el usuario diga "expandí este concepto", "hacé esto rico", "esto da para carrusel", "desarrollá el post N del pool", "convertí esta frase en un post", "/concept-to-post". NO es el renderizador de píxeles — es el cerebro de copy+estructura; la producción visual la hacen los otros skills.
---

# concept-to-post

Motor de expansión: **semilla corta → pieza rica** (single enriquecido o carrusel), en la voz correcta de la marca, con el frame de marca restituido.

**Por qué existe**: hay pools enormes de conceptos de una línea (75 en ÍTERA, ~50 en ÍTERA Lex). Cada concepto es *una frase + una pantalla*, y leído solo suena a feature huérfana, no a un mensaje. Este skill captura el proceso de convertir esa semilla en algo publicable sin re-derivar el método cada vez.

**Qué NO es**: no genera HTML ni PNG. Produce el **spec** (formato + copy por slide + qué pantalla por slide). El render lo hacen los skills visuales (ver §Output).

---

## Cuándo usar

- Tomar un concepto suelto del pool (una fila de `IDEAS-POSTS.md`, una pieza `pool-NN`) y desarrollarlo.
- El usuario tira una frase o el nombre de una pantalla y quiere "algo rico" para feed o historia.
- Decidir si un concepto rinde como single o como carrusel.
- Cualquier marca del ecosistema (el adapter del Paso 1 enchufa voz + pantallas).

## Cuándo NO usar

- Renderizar la pieza a HTML/PNG → eso lo hacen `iteralex-typographic-post` (covers), `iteralex-device-mockup` (frames laptop/mobile), `feed-tpl.css` (template product-first).
- Componetizar un screenshot real en React → `screenshot-to-component`.
- Escribir voz de un producto sin pasar por su fuente de voz (eso es el Paso 1, no saltearlo).

---

## El concepto central: el frame

Una semilla corta casi siempre viene **sin frame**: dice *qué* (la feature) pero no *quién la construye, para quién, ni por qué importa*. Por eso "Tus clientes, en un sistema propio" suena a producto presentando su feature, no al estudio diciendo qué hace por vos. **Expandir = restituir el frame + sumar la prueba (las pantallas).**

Dos formatos, y de **cada** concepto se sacan **los dos** (ver Paso 3):
- **Carrusel** → una **tapa-frame** abre y un **CTA-frame** cierra; la pantalla del módulo queda *adentro* como prueba.
- **Single enriquecido** → el frame entra en una pieza: **eyebrow** = el acto de marca, **support** = el cierre de marca, **screenshot** enriquecida (pantalla real compuesta o montage desktop+mobile).

---

## Paso 1 — Identificar la marca y cargar sus fuentes (adapter)

Antes de escribir una palabra, cargá la voz y las pantallas reales de la marca de la semilla:

| Marca | Voz (leer / invocar ANTES de escribir) | Pantallas reales (mock source) | Frame |
|---|---|---|---|
| **ÍTERA** (itera.lat, marca madre) | `~/projects/itera-context/marca/manual-de-marca.md` | UI Lab de Alquímica: `~/projects/clientes/alquimica-crm/resources/js/components/ui-lab/` | estudio: *"lo construimos para tu negocio"* (1ª persona plural) |
| **ÍTERA Lex** (SaaS legal) | skill **`iteralex-copy-voice`** (+ `~/projects/itera-context/proyectos/itera-lex/VOICE-GUIDE.md`, `PAIN-POINTS-MAP.md`) | biblioteca `~/projects/itera-social/projects/iteralex/components/` | producto al abogado (registro un grado más formal) |

Regla dura (de las memorias del taller): **no inventar copy fingiendo basarse en una doctrina no leída.** Si no consultaste la fuente de voz, no le atribuyas la decisión — leela o invocá el skill primero.

## Paso 2 — Diagnosticar la semilla

- ¿Está en **voz de producto / feature huérfana**? ¿Qué frame le falta (quién/para quién/por qué)?
- ¿Qué **pantalla real** la prueba? Si no hay pantalla componible del mock source, la idea no se sostiene visualmente — replanteala.
- ¿Trae algún **patrón banned**? (ver Paso 5).

## Paso 3 — Sacar SIEMPRE las dos (single + carrusel)

Política del taller (2026-06-19): de **cada** concepto se extraen **ambos** formatos — un single enriquecido **y** un carrusel. No se elige uno; se exprime el concepto al máximo (sirve para feed, historia, o publicar en otro momento). Ya no hay deliberación "single vs carrusel" ni "lockear o no".

La heurística S/F (misma que `SCORING-POSTS.md` — **S** = fuerza como single, **F** = potencial de flujo) ya **no decide** el formato; solo marca cuál es la **primaria** (la más fuerte, va al feed) y cuál la **secundaria** (historia / repurpose):

- **S** alto (una pantalla ya muestra mucho: dashboard, panel, widget) → la **single** es primaria.
- **F** alto (proceso, flujo, antes/después, valor abstracto) → el **carrusel** es primario.

Si el carrusel se solapa fuerte con otro concepto, se arma igual y se **anota** el solapamiento (para elegir al publicar, no para descartarlo).

## Paso 4a — Skeleton: single enriquecido

```
eyebrow   → el acto de marca       (ej ÍTERA: "CRM A MEDIDA", "GESTIÓN DE STOCK")
headline  → el valor nombrado sobre lo que se ve   (qué hace, concreto, sin metáfora)
screenshot→ enriquecida: pantalla real compuesta del mock source, o montage desktop+mobile
support   → cierre de frame        (ej ÍTERA: "Lo construimos para tu negocio.")
```

## Paso 4b — Skeleton: carrusel

```
S1  tapa-frame   → engancha + ubica quién/para quién  ("Armamos el cotizador de tu negocio")
S2..N módulo/flujo→ UNA idea por slide, cada una atada a una pantalla real
S_last cierre+CTA → cierra el mensaje + CTA de marca   ("Te armamos el tuyo. Hablemos.")
```

Estructura validada (de `PLAN.md`): slide 1 = tapa clara · slides 2-5 = módulo/flujo/beneficio concreto · slide final = cierre o CTA. Una idea por pieza, texto grande, la imagen hace parte del trabajo.

## Paso 5 — Pasada de voz (banned)

Globales del ecosistema:
- **"sin vueltas"** — IA-slop, prohibido.
- **Imperativos de producto cuando habla el estudio** ("Cotizá", "Pasá del Excel", "Tomá pedidos") → el estudio dice "armamos", "construimos", "conectamos".
- **El estudio construye la herramienta, no ejecuta la actividad** (frame de ÍTERA): si el concepto es una *actividad* (repartos, ventas, cobranzas, turnos), la tapa dice *"armamos la herramienta / el sistema para [actividad]"* — nunca *"armamos los repartos / las ventas"* (suena a operador logístico o servicio, no a estudio de software). Con *artefactos* (catálogo, cotizador, CRM, carta, panel) *"armamos el X"* está bien.
- **Clichés**: "automatizá todo", "transformación digital", "soluciones innovadoras", "revolucionamos".
- **Aperturas de pregunta sin `¿`** (convención del taller): la pregunta abre sin `¿` y cierra con `?`.
- **Balance de line-wrap**: distribuir los saltos para filas parejas; nunca una palabra suelta colgando abajo.

Por marca: además pasar el copy por su fuente de voz del Paso 1.

## Paso 6 — Aterrizar cada pantalla en algo construible

Cada slide referencia una pantalla **real o componible** del mock source. No inventar UI que no se puede armar. Si la pantalla no existe pero se compone de primitivas (caso UI Lab de Alquímica: DataTable, FilterControls, DetailHeader, InfoGrid, StatTile, badges, MiniBarChart, MobileShellFrame…), anotá **de qué componentes** se arma.

---

## Output — dónde cae el spec

Volcá el spec (formato de las entradas `LOCK-NN` del CARRUSELES.md de ÍTERA: pantalla real + slides con `[pantalla] — texto`):

- **ÍTERA feed** → `~/projects/itera-social/projects/itera/campañas/feed-relanzamiento/CARRUSELES.md`
- **ÍTERA Lex** → el `PLAN.md` de la campaña correspondiente en `projects/iteralex/campañas/<stage>/`

Después, la **producción visual** la hacen los skills de render, no éste:
- cover tipográfica → `iteralex-typographic-post`
- frames laptop/mobile con screenshot → `iteralex-device-mockup`
- template product-first (eyebrow→headline→frame→support) → `feed-tpl.css` del stage

---

## Ejemplo end-to-end (de la sesión 2026-06-19)

**Semilla** (pool 03 de ÍTERA): `COTIZADOR · "Cotizá en minutos, sin vueltas" · Conectado a tus productos y precios`.

1. **Marca/fuentes**: ÍTERA → `manual-de-marca.md` + UI Lab de Alquímica.
2. **Diagnóstico**: voz de producto ("Cotizá", le habla al usuario del SaaS), "sin vueltas" banned, y el valor es un **circuito** (cliente → productos → totales → PDF → venta).
3. **Formato**: 🔵 CARRUSEL (una pantalla queda corta; el flujo es el valor).
4. **Frame**: estudio → *"Armamos el cotizador de tu negocio."*
5. **Spec** (pantalla real `Cotizador/Index` 3 columnas):
   - S1 tapa · `COTIZADOR A MEDIDA` — **Armamos el cotizador de tu negocio.** · *Conectado a tu catálogo y tus clientes.*
   - S2 [selección de cliente] — Elegís el cliente: trae su lista de precios y condiciones.
   - S3 [productos + carrito] — Sumás productos con precio y stock ya conectados.
   - S4 [panel de totales] — Ajustás cantidades, descuentos y total.
   - S5 [resumen / PDF] — Sale la cotización, lista para enviar.
   - S6 cierre — Y si la acepta, sigue a venta y cobro, en el mismo sistema. → *Te armamos el tuyo. Hablemos.*
6. **Output**: spec volcado a `CARRUSELES.md` (entrada LOCK-03); render con `feed-tpl.css` + `iteralex-device-mockup`.

Contraste — la misma semilla en formato **single** (concepto 04 stock, que sí rinde solo): eyebrow `GESTIÓN DE STOCK` · headline *Qué tenés, qué falta y qué reponer.* · support *Lo construimos para que lo veas en tiempo real.*

---

## Archivos / referencias

- ÍTERA — voz: `~/projects/itera-context/marca/manual-de-marca.md` · pool: `projects/itera/campañas/feed-relanzamiento/IDEAS-POSTS.md` · scoring: `SCORING-POSTS.md` · specs: `CARRUSELES.md` · template: `feed-tpl.css`.
- ÍTERA Lex — voz: skill `iteralex-copy-voice`.
- UI Lab Alquímica (mock source ÍTERA): `~/projects/clientes/alquimica-crm/resources/js/components/ui-lab/`.
- Render: `iteralex-typographic-post`, `iteralex-device-mockup`, `~/projects/itera-social/render.mjs`.
