# Assets del skill remotion-vertical-shorts

Componentes y templates listos para copiar a un proyecto Remotion nuevo. Todos están diseñados para vivir bajo `src/compositions/` (los `.tsx`) y `src/` (los `.template.ts`) del proyecto.

## Inventario

### Componentes core (copiar tal cual)

| Archivo | Función |
|---|---|
| `LaptopFrame.tsx` | Mock visual del laptop. Children renderiza dentro de la screen. Acepta `scale` + `offsetX/Y` para macro-zoom. |
| `DashboardCamera.tsx` | Wrapper del variant del gallery con transform scale + translate (focus + zoom). Acepta `overlay` para meter motion graphics en coords del canvas nativo. |
| `WordmarkBanner.tsx` | Wordmark contextual con `zone` configurable + `verticalAlign` + `enableEnterAnimation`. Usado para el plate inicial. |
| `WordmarkOutro.tsx` | Placa final del wordmark centrado vertical + horizontal. Manejo propio de fade-in / hold / fade-out por timings. |
| `PainTabsStack.tsx` | 4 (o N) tabs apiladas en diagonal para el beat de PAIN abstracto antes de que emerja el laptop. Parametrizable por `tabs[]` array. |
| `WordByWordText.tsx` | Captions sincronizadas al JSON. Soporta `breakAfter` (control de wrap) y `oneAtATime` (palabra por palabra). |
| `PhaseWrap.tsx` | Cross-fade entre beats sin "negro suave". Usar para envolver cada chunk de captions y cada beat narrativo. |
| `CalibrationGrid.tsx` | Overlay debug — grilla cada 100px en coords del variant. Usar como `overlay` del DashboardCamera para calibrar coords (eg. posición de tabs internas). Borrar después de calibrar. |

### Templates (copiar y editar)

| Archivo | Destino en el proyecto | Qué editar |
|---|---|---|
| `tokens.template.ts` | `src/tokens.ts` | `colors.accent` (brand), `VARIANT_NATIVE` (size del canvas del SaaS) |
| `bridge.template.ts` | `src/bridge.ts` | Path relativo al `dist/` del component library del SaaS |

## Estructura sugerida del proyecto consumer

```
projects/<saas>/stages/vertical-shorts/<short-slug>/remotion/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── pnpm-workspace.yaml
├── public/
│   ├── audio.mp3          ← TTS del guion (ElevenLabs)
│   ├── scribe-words.json  ← timestamps word-level (ElevenLabs Scribe)
│   └── wordmark.png       ← logo del brand
└── src/
    ├── index.ts           ← `registerRoot(RemotionRoot)`
    ├── Root.tsx           ← define la Composition + importa el CSS del dist
    ├── tokens.ts          ← copia de tokens.template.ts, brand-adjusted
    ├── bridge.ts          ← copia de bridge.template.ts, path-adjusted
    ├── globals.css        ← reset base
    ├── types.d.ts         ← declaraciones del dist (si la lib no genera .d.ts)
    └── compositions/
        ├── <Short>Composition.tsx   ← la composition principal
        ├── LaptopFrame.tsx          ← copia del asset
        ├── DashboardCamera.tsx      ← copia
        ├── WordmarkBanner.tsx       ← copia
        ├── WordmarkOutro.tsx        ← copia
        ├── PainTabsStack.tsx        ← copia (si el short empieza con pain abstracto)
        ├── WordByWordText.tsx       ← copia
        ├── PhaseWrap.tsx            ← copia
        └── CalibrationGrid.tsx      ← copia (uso transitorio durante calibración)
```

Los assets están diseñados para importar `from "../tokens"` y `from "../bridge"`. Si el consumer renombra o reubica esos archivos, ajustar los imports al copiarlos.

## Setup rápido

1. Inicializar el proyecto Remotion (copiar `package.json` / `tsconfig.json` / `remotion.config.ts` de un short existente del taller, eg. `causas-pestañas`).
2. Copiar el wordmark del brand a `public/wordmark.png`.
3. Generar audio + JSON con ElevenLabs (TTS + Scribe). Ver `references/captions-json-timing.md` del skill.
4. Copiar `tokens.template.ts` → `src/tokens.ts`. Ajustar `colors.accent` y `VARIANT_NATIVE` si el SaaS es distinto.
5. Copiar `bridge.template.ts` → `src/bridge.ts`. Ajustar el path al `dist/` del component library.
6. Copiar los componentes core a `src/compositions/`.
7. Crear la composition principal:
   - Definir timestamps clave en `const T = { ... }`.
   - Definir chunks de captions (uno por frase del guion).
   - Render: `<AbsoluteFill bg>` → mainScene wrapper con `opacity: mainSceneOpacity` → laptop + captions + wordmark inicial. Hermano del wrapper: `<WordmarkOutro />`.

Ver `references/outro-pattern.md` para el pattern de cierre y `references/contextual-text-zones.md` para el placement de wordmark + captions durante el body.

## Anti-patterns

- **No anidar `WordmarkOutro` dentro del wrapper de `mainSceneOpacity`** — el wordmark heredaría el fade-out del body.
- **No hardcodear coords del variant** (eg. tabs internas) sin calibrar primero. Usar `CalibrationGrid` con una still del frame target.
- **No usar `breakAfter` para "frase sola en una línea"** — un chunk con `fontSize` apropiado y sin breaks ya hace eso. `breakAfter` es para forzar saltos internos dentro de una frase larga.
- **No mezclar `oneAtATime` con `pastInAccent` / `emphasis`** — en `oneAtATime` solo una palabra vive a la vez, y siempre con accent. Los otros props no aplican.
- **No tocar `LaptopFrame.transformOrigin`** — está anclado al centro de `MOCKUP_ZONE` para que el macro-zoom quede contenido. Cambiarlo desalinea el zoom respecto del layout 3 zonas.
