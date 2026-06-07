---
name: remotion-camera-tour
description: Armar un video de tour de producto en Remotion combinando una biblioteca de componentes React (mocks visuales del SaaS) + voz en off + zooms/pans cinematográficos con keyframes + captions word-level sincronizadas a timestamps de ElevenLabs Scribe. El método incluye el componente `Camera` (scale + translate animado con ease-out-cubic), el componente `BeatCaptions` (highlight gradient en la palabra current, sin flash negro, sin overlap entre chunks), reglas de coreografía validadas en producción (highlights al final del zoom, saltar views intermedias innecesarias, popover/modal con CSS @keyframes en la lib), y el bridge build:lib (Vite library mode) → dist → Remotion (resuelve el conflict de CSS loaders cross-project). Usar SIEMPRE para tours de producto, demos de UI, walkthroughs de features, intros de SaaS, videos explicativos con dashboard + voz en off. Funciona tanto en 16:9 (landscape, YouTube) como 9:16 (vertical, Instagram/TikTok). Triggers: "armemos un tour del producto", "video con dashboard y voz", "demo de iteralex en video", "captions word-level", "zoom motion para redes", "video Remotion con voz en off", "tour video con biblioteca", "/remotion-camera-tour". Complementa el skill `motion-storyboard` (que es para el plan HTML previo); este skill es la EJECUCIÓN en Remotion del plan motion.
---

# Remotion Camera Tour

Método validado para armar videos de tour de producto con **biblioteca de componentes React + voz en off + zoom/pan cinematográfico + captions word-level**. Producido en una sola pasada en Remotion Studio, con iteración HMR sobre coords/timings.

## Cuándo invocar

Invocar siempre que:
- Hay un **producto/SaaS con UI** que se quiere mostrar narrativamente en video
- Existe **biblioteca de componentes** del producto (o se va a construir antes con `brandboard-creator` + componentización)
- Se cuenta con (o se va a generar) **audio narrativo + JSON timestamps**
- El video tiene **transiciones de cámara** (zoom, pan, switch entre vistas)

Casos típicos:
- Tour de bienvenida (onboarding video) del SaaS
- Demo de una feature específica
- Walkthrough cross-módulo (dashboard → calendario → modal)
- Video corto para redes sociales mostrando el producto

**Cross-reference**: si necesitás el plan visual del motion **antes** de codear (un storyboard HTML), usá `motion-storyboard`. Este skill es la implementación; el otro es la planificación.

**No usar para**:
- Videos sin UI del producto (typography-only social posts, hooks de cita) — para eso ver `iteralex-typographic-post` o `social-motion`
- Videos sin voz en off (los timings se calibran al audio; sin audio el método pierde sentido)
- Videos largos cinematográficos (>2 min) — el método está optimizado para 15-60s

## Workflow

### 0. Verificar pre-requisitos

**Mínimo:**
- **Biblioteca de componentes** del producto, exportable como ES module + CSS (Vite library mode). Si no existe, ver `brandboard-creator` para arrancar.
- **Audio narrativo** (MP3/WAV) ya grabado/generado. Ver `references/elevenlabs-flow.md` para el flujo de generación.
- **JSON con timestamps word-level** (ElevenLabs Scribe formato `[{text, start, end}]`). Para corregir transcripciones del nombre del producto, editar el JSON manualmente.

**Setup del proyecto Remotion** (si no existe): copiar molde de un proyecto existente del taller (`itera-social/projects/<slug>/stages/<stage>/remotion/`). Estructura mínima:

```
stages/<stage>/remotion/
├── package.json + pnpm-workspace.yaml (allowBuilds esbuild)
├── remotion.config.ts (NO override webpack para CSS — la lib viene buildeada)
├── tsconfig.json (target ES2020+ para Array.includes)
├── public/
│   └── audio.mp3              ← copia del WAV/MP3 del audio narrativo
└── src/
    ├── index.ts
    ├── Root.tsx
    ├── tokens.ts              ← @remotion/google-fonts loads
    ├── globals.css            ← espejo del globals.css de la biblioteca
    └── compositions/
        ├── Camera.tsx         ← copia de assets/Camera.tsx
        ├── BeatCaptions.tsx   ← copia de assets/BeatCaptions.tsx
        └── <Composition>.tsx  ← la composition principal del tour
```

### 1. Buildear la biblioteca

La biblioteca debe estar buildeada en `dist/` (Vite library mode) para que Remotion la importe sin conflict de CSS loaders. Ver `references/lib-bridge.md` para el setup completo.

```bash
cd projects/<slug>/components
pnpm build:lib   # genera dist/index.js + dist/index.css
```

Rebuildear cada vez que se cambia un componente de la biblioteca.

### 2. Mapear el guion al JSON de timestamps

Por cada palabra clave del guion, anotar su `start` y `end` del JSON. Estos son los puntos de anclaje del motion.

**Convención**: los keyframes de cámara se disparan **antes** de la palabra clave (anticipación), de modo que la cámara esté quieta cuando se dice. Típicamente 0.5-0.7s antes.

### 3. Componer la timeline en `<Composition>.tsx`

**Pattern recomendado: multi-Phase con `PhaseWrap`**. Cada beat narrativo (Pain → Sync → Upload → ...) es un componente Phase independiente con su propia `<Camera>`, keyframes, cursor y lógica de show/hide. Un helper `PhaseWrap` orquesta el cross-fade entre phases sin que se vea fondo negro (ver `references/coreografia.md` regla 9).

Estructura:

```tsx
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Camera } from "./Camera";
import { BeatCaptions } from "./BeatCaptions";
import { F, colors } from "../tokens";

// IMPORTANTE: importar del dist buildeado, no del source.
import "../../../../../components/dist/index.css";
import {
  DashboardShell, View1, View2, Modal,
  CursorOverlay, ClickRipple,
  DEMO,                  // ← constants compartidas (client name, file, causa, ...)
} from "../../../../../components/dist/index.js";

// 1. Targets de cámara en coords del "stage".
const VIEW_FULL = { x: STAGE.width / 2, y: STAGE.height / 2, scale: 1.0 };
const VIEW_WIDGET = { x: ..., y: ..., scale: 1.55 };

// 2. Timestamps clave del JSON (cada palabra que dispara un beat).
const T = { intro: 0.099, carpetas: 1.659, ... };

// 3. PhaseWrap helper — fadeIn cross-fadea, fadeOut es instantáneo,
//    saliente sobrevive hasta que entrante terminó (sin fondo negro).
const PhaseWrap: React.FC<{
  t: number; from: number; to: number;
  fadeIn?: number; fadeOut?: number;
  children: React.ReactNode;
}> = ({ t, from, to, fadeIn = 0.45, fadeOut = 0.05, children }) => {
  const enter = fadeIn <= 0 ? (t >= from ? 1 : 0) : progress(t, from, from + fadeIn);
  const exit  = fadeOut <= 0 ? (t < to ? 1 : 0) : 1 - progress(t, to - fadeOut, to);
  const op = Math.min(enter, exit);
  if (op === 0) return null;
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

// 4. Cada Phase es su propio componente con keyframes + lógica local.
const PhasePain: React.FC<{ t: number }> = ({ t }) => { /* ... */ };
const PhaseUpload: React.FC<{ t: number }> = ({ t }) => { /* ... */ };
const PhaseClasificar: React.FC<{ t: number }> = ({ t }) => { /* ... */ };

// 5. Captions chunks con palabras del JSON.
const CAPTIONS = [{ from: 0.099, to: 3.819, words: [...] }, ...];

export const Tour: React.FC = () => {
  const t = useCurrentFrame() / fps;
  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Audio src={staticFile("audio.mp3")} />

      {/* Regla: prevPhase.to = nextPhase.from + nextPhase.fadeIn (~0.45s) */}
      <PhaseWrap t={t} from={0}    to={4.68} fadeIn={0}><PhasePain t={t} /></PhaseWrap>
      <PhaseWrap t={t} from={4.23} to={10.30}><PhaseSync t={t} /></PhaseWrap>
      <PhaseWrap t={t} from={9.37} to={14.17}><PhaseUpload t={t} /></PhaseWrap>
      {/* ... */}

      <BeatCaptions chunks={CAPTIONS} fadeFrames={3} />
    </AbsoluteFill>
  );
};
```

**Beneficios de multi-Phase**:
- Cada Phase aísla su lógica de cursor + cámara + show/hide → más fácil de iterar sin romper otras.
- Re-grabar el VO solo requiere re-mapear los `T.*` y los `from/to` de cada PhaseWrap (no refactorear toda la composición).
- Phases pendientes (componente todavía no integrado) pueden quedar como placeholders (`AbsoluteFill` con "TODO · Nombre del componente") sin bloquear el render — ver coreografía regla 16.

### 4. Aplicar reglas de coreografía

Las reglas detalladas viven en `references/coreografia.md`. Resumen:

**Reglas estéticas (1-8)**:
1. **Highlights aparecen al FINAL del zoom** (sensación "zoomeamos y mostramos"), no al inicio.
2. **Saltar views intermedias innecesarias**. Si vas de A a B y no necesitás pasar por full view, andá directo.
3. **Sin overlap entre captions**. El cross-fade vive **dentro** del rango `[from, to]` del chunk (no fuera).
4. **Popover/Modal con CSS @keyframes en la lib** (mount-in animation). En Remotion el mount sucede al cambiar el flag `show`, y el browser ejecuta la animation.
5. **Sombra siempre como `filter: drop-shadow`** en todos los estados de un texto animado. NO mezclar `text-shadow` con `drop-shadow` — causa flash negro cuando el color del texto está transicionando.
6. **Ease-out-cubic en Camera** — desacelera natural al llegar al target.
7. **Coords del stage**, no del frame total — los targets son portables y legibles.

**Reglas operativas (9-16, validadas en producción)**:
9. **Cross-fade entre Phases sin "negro suave"** — separar `fadeIn` y `fadeOut`, saliente al 100% hasta que entrante termine. Default `fadeIn=0.45`, `fadeOut=0.05`.
10. **Click → zoom out → modal en orden secuencial** — separar los tres beats por 200-300ms cada uno. NO simultáneos.
11. **Cámaras DEBEN coincidir en target durante el cross-fade** — sino se ve "doble visión".
12. **Cards fade-in temprano + highlights cronometrados** — la fase A introduce todas las cards antes del primer highlight (densidad visual desde el primer segundo).
13. **Iconos del producto reutilizables del component library** — importar `IconGoogleDrive` del dist antes que inventar SVGs custom.
14. **Cursor fade durante cambios de vista interna** — fade out 100ms + pausa visual + fade in en posición coherente.
15. **Modal con doble selección acumulativa** — `activeKind` + `selectedX/Y` separadas, chips al pie que se suman, no se reemplazan.
16. **Phase placeholder cuando falta un componente** — AbsoluteFill con "TODO · Nombre", no comentar la PhaseWrap (rompe los `to=` calculados).

### 5. Iterar en el Studio

```bash
cd stages/<stage>/remotion
pnpm dev   # abre Remotion Studio en localhost:3001 (o el puerto disponible)
```

HMR detecta cambios en `Camera.tsx`, `BeatCaptions.tsx`, `<Composition>.tsx`, y `tokens.ts`. **NO** detecta cambios en la biblioteca — para eso rebuildear (`pnpm build:lib` en `components/`).

Iterar:
- Coords de los targets de cámara hasta que enfoquen donde querés
- Timing de los keyframes (anticipación de cámara antes de la palabra)
- Apariciones de Popover/Modal coordinadas con el zoom
- Highlights al final del zoom

### 6. Render final (cuando esté lockeado)

```bash
pnpm render   # genera ../motion/<filename>.mp4
```

Solo cuando estás conforme. El render toma ~30-60s para video corto. Antes de renderizar, revisar:
- Audio se reproduce correctamente
- Captions sin flashes
- Cámara no tiene saltos
- Componentes de la lib se ven con sus CSS animations

## Reglas de calidad

### MOTION debe ser narrativo, no decorativo

Cada movimiento de cámara debe tener un propósito ligado al guion. Si la voz no menciona algo, la cámara no debería ir ahí. Ejemplos:
- Voz dice "los eventos del día" → cámara zoom a Agenda
- Voz dice "y las tareas" → cámara pan a Tareas
- Voz pasa de Tareas a Calendario sin pausa → NO zoom out + reorient; ir directo

### Captions deben competir lo mínimo con el zoom

El zoom es protagonista. Las captions son apoyo. Por eso:
- Captions abajo del frame, fuera del stage
- Highlight gradient en current word para enganche visual
- Past/future atenuados (no compiten)

### Audio sync es el norte

El timing de cámara, highlights, popover/modal, captions — todo se ancla a los timestamps del JSON. Si la voz cambia (regrabás), todos los `at` y `from/to` cambian con ella. No inventar timing arbitrario.

### Si el motion se siente apurado, re-grabá el VO — no aceleres el motion

**Regla operativa validada**: el motion calmo necesita ~0.7s × cantidad_de_clicks de audio mínimo en cada phase. Si una phase tiene 6 clicks en 3.2s de VO, no entra cómodo aunque optimices todo. La solución es **expandir el guion con más palabras/pausas** y re-grabar el audio, no comprimir el motion. Re-grabar + re-mapear `T.*` toma ~10-20 min; meter 6 clicks en 3.2s toma horas y queda mal igual. Ver `references/elevenlabs-flow.md` sección "El VO debe darle SPACE al motion" para la heurística completa de clicks vs segundos y el patrón "describir lo que va a pasar antes que pase".

## Diseño de flows cross-módulo pre-Codex

Cuando el usuario te trae un guion, un copy o un pain point y te pide armar **los flows** (todavía no el video Remotion), el output va a `projects/iteralex/components/ACTION_FLOWS.md` para que después Codex los implemente en la gallery. Antes de listar steps, aplicar la **regla del step handoff**.

### Regla del step handoff

Para cada par adyacente `step N -> step N+1`, preguntar: **"¿qué deja visible step N que permite entrar a step N+1?"** Si la respuesta es "nada visible", el flow tiene un agujero. No alcanza con que ambos variants existan en gallery — el ojo del viewer (y el cursor del video) necesitan ver la affordance (fila, chip, tab, CTA, toast, resultado filtrado) que dispara la siguiente pantalla.

### Tabla rápida de patrones

| Tipo de salto | Estados intermedios requeridos | Error común |
|---|---|---|
| Lista -> detalle de entidad | `lista -> fila visible -> detalle` (o vía búsqueda: `lista -> typing -> resultados asentados -> detalle`) | Saltar de lista directo a detalle sin que la fila clickeada sea visible. |
| Búsqueda interna -> detalle | `lista -> input vacío -> typing -> resultados filtrados asentados -> detalle` | Saltar de `typing` directo a `Ficha: información` sin paso por resultados asentados. |
| Tab A -> tab B (misma ficha) | Salto válido si el shell de la ficha muestra tabs visibles | Usar `Highlight: tab X` como step. El tab visible YA es la affordance. |
| Detalle A -> entidad B (otro módulo) | `detalle A -> tab/lista de relación con B visible -> detalle B` | Salto directo de `Ficha cliente: información` a `Ficha causa: información` sin pasar por `Ficha cliente: causas`. |
| Lista -> modal "Nuevo X" | `lista con CTA visible -> modal default` | Usar `Highlight: nuevo cliente` como step en vez del estado natural donde el CTA es visible. |
| Modal step N -> modal step N+1 | `step previo con selección o CTA habilitada -> step siguiente` | Saltar de "modal default" a "destino seleccionado" sin el paso intermedio que muestra la elección. |
| Acción -> terminal | `CTA habilitada o selección final visible -> toast/sonner` | Cortar el flow en el modal sin mostrar el toast post-acción. |
| Módulo A -> módulo B (sin relación de entidades) | `estado A -> bridge (sidebar nav o búsqueda global) -> default/lista B -> detalle` | Saltar entre módulos sin affordance de navegación visible. |
| Búsqueda global -> destino | `contexto -> overlay vacío -> typing -> resultados con target visible -> destino` | Saltar del typing al destino sin pasar por resultados asentados. |

Si el step intermedio que requiere la tabla **no existe** como variant limpio en gallery, marcarlo como **gap obligatorio** de componentización con el nombre exacto del variant propuesto. Nunca usar `Highlight:*` como step de relleno.

### Continuidad de entidades demo

Anchors canónicos del proyecto:
- Cliente: `Ana María Pereyra`
- Causa: `Pereyra, Ana M. c/ Supermercado Norte SRL s/ Igualdad salarial`

No cambiar la identidad entre steps salvo que el flow lo indique explícitamente. Si el step N selecciona/filtra a Pereyra, el step N+1 debe mostrar exactamente esa entidad (no otra causa de la lista demo).

### Salida esperada

Cuando completés el diseño:

1. Persistir el flow en `ACTION_FLOWS.md`, sección `Flows Cross-Módulo`, con steps en formato `screen/<modulo>-framed` -> `<Variant Name>`. Cada step con descripción corta de qué deja visible.
2. Marcar el estado del flow:
   - `Listo` — todos los handoffs resuelven a variants existentes.
   - `Parcial` — uno o dos handoffs requieren componentización menor.
   - `Gap mayor` — el módulo destino o el bridge no está documentado en gallery todavía.
3. Listar gaps explícitos con nombre de variant propuesto, no `Highlight:*` como fill-in.
4. Solo después de eso, traducir el flow a Phases de Remotion (cada step = una Phase o sub-beat, según el VO).

### Skill de Codex canónico

La regla completa, con audits validados, ejemplos antes/después y reglas de cross-module traceability, vive en `projects/iteralex/.agents/skills/iteralex-action-flow-planner/SKILL.md` (skill de Codex). Si necesitás profundizar en algún caso particular o ver el audit de los 5 flows del primer batch, leer ese skill. La tabla de acá es la versión operativa para el momento de diseño rápido pre-implementación.

## Cross-references

- `motion-storyboard` — para el plan HTML previo si lo necesitás (no es bloqueante)
- `iteralex-copy-voice` (o equivalente del SaaS) — para el guion del audio
- `brandboard-creator` — para arrancar la biblioteca de componentes si no existe
- `iteralex-action-flow-planner` (Codex side) — fuente canónica del step handoff rule y del audit pattern

## Pointers

- `assets/Camera.tsx` — componente Camera listo para copiar al proyecto Remotion
- `assets/BeatCaptions.tsx` — componente BeatCaptions con fix del flash negro
- `assets/vite.config.lib.ts.template` — config Vite para library build
- `references/coreografia.md` — reglas detalladas de motion con ejemplos antes/después
- `references/lib-bridge.md` — flujo Vite build:lib + import desde Remotion (CSS Modules gotcha)
- `references/elevenlabs-flow.md` — guion → TTS → JSON timestamps → integración

## Idioma

Captions y voz en **español rioplatense** cuando el proyecto está en español (default del taller). Tokens técnicos (CSS classes, props, types) en inglés.
