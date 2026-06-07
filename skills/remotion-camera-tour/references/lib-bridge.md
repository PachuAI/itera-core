# Lib bridge — Vite build:lib + import desde Remotion

Cómo importar una biblioteca de componentes React (que usa CSS Modules) desde un proyecto Remotion, sin que webpack de Remotion se pelee con los `*.module.css`.

## El problema

Remotion 4.x usa webpack con un default CSS loader que **NO maneja CSS Modules cross-project** consistentemente. Cuando importás componentes de una lib externa que tiene `import styles from "./X.module.css"`, pasan 2 cosas que se cruzan:

1. El loader default lo procesa como CSS plano → devuelve `undefined` para el objeto styles.
2. Si configurás `Config.overrideWebpackConfig` con style-loader + css-loader manualmente, el chain se duplica con el loader default → CssSyntaxError.

**No hay forma simple de configurar webpack de Remotion para que resuelva CSS Modules cross-project sin romper otra cosa.**

## La solución

**Buildear la lib con Vite library mode** → output a `dist/` con CSS pre-procesado + JS bundle. Remotion importa el dist (CSS plano + ES module), sin necesidad de procesar CSS Modules.

```
projects/<slug>/components/
├── vite.config.ts          ← dev (gallery)
├── vite.config.lib.ts      ← library build (este archivo)
├── package.json            ← suma "build:lib" script
├── src/
│   └── lib/                ← source con CSS Modules
└── dist/                   ← output del build:lib
    ├── index.js            ← ES module con classes hashed
    └── index.css           ← CSS plano consolidado
```

## Setup

### 1. `vite.config.lib.ts` (template)

Ver `assets/vite.config.lib.ts.template` para el archivo completo. Lo crítico:

```ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,      // ← un único CSS file, no splits
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      name: "IteralexComponents",  // ← cambiar por nombre del SaaS
      formats: ["es"],         // ← ES module, compatible con webpack moderno
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      // ← React es peerDependency, no se bundlea
      output: {
        assetFileNames: (asset) => {
          if (asset.name === "style.css") return "style.css";
          return asset.name ?? "[name][extname]";
        },
      },
    },
  },
});
```

### 2. Suma `build:lib` script al `package.json`

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:lib": "vite build -c vite.config.lib.ts",  // ← este
    "preview": "vite preview"
  }
}
```

### 3. Buildear

```bash
cd projects/<slug>/components
pnpm build:lib
# ✓ built in ~300ms
# Output:
#   dist/index.css  ~30 kB  (CSS consolidado)
#   dist/index.js   ~60 kB  (ES module, classes hashed)
```

## Importar desde Remotion

En el proyecto Remotion (`stages/<stage>/remotion/src/compositions/Tour.tsx`):

```tsx
// 1. Side-effect import del CSS — carga las styles en el DOM al ejecutarse.
import "../../../../../components/dist/index.css";

// 2. Named imports del JS — usa las classes hashed automáticamente.
import {
  DashboardShell,
  EscritorioView,
  EventModal,
} from "../../../../../components/dist/index.js";
```

El path relativo depende de la profundidad — ajustar `../` según la estructura.

## Cuándo rebuildear

- **Cambiaste un componente de la lib** (TSX o CSS): `pnpm build:lib`. El studio de Remotion NO detecta cambios en `dist/` automáticamente — refrescar el browser después.
- **Solo cambiaste el proyecto Remotion** (composition, Camera, Captions): NO rebuildear. HMR del studio detecta los cambios.
- **Solo cambiaste tokens**: si los tokens viven en `components/src/tokens.ts`, rebuildear. Si viven en `stages/<stage>/remotion/src/tokens.ts`, HMR.

## Path alias opcional

Para evitar `../../../../../components/dist/...` feo, configurar en `tsconfig.json` del proyecto Remotion:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@iteralex/components": ["../../../components/dist/index"]
    }
  }
}
```

Pero **webpack de Remotion no resuelve estos paths automáticamente** — quedaría typecheck-only. Para que webpack los resuelva, necesitarías `Config.overrideWebpackConfig` con `resolve.alias`. Si querés ese setup, es OK pero agrega complejidad. Para mocks-mode con un solo import, el path relativo feo es aceptable.

## Workflow dual recomendado

Mientras iterás:

- **Gallery (Vite dev, puerto 5173)**: `cd components && pnpm dev`. HMR instant para cambios visuales en componentes. **Acá iterás el visual del componente**.
- **Remotion Studio (puerto 3001)**: `cd stages/<stage>/remotion && pnpm dev`. HMR para cámara, captions, lógica de show/hide. **Acá iterás el motion**.
- **Cuando cambies un componente de la lib y querás verlo en el motion**: `cd components && pnpm build:lib`, después refresh del browser del studio.

## Issues conocidos

### "Cannot read properties of undefined (reading 'shell')"

Significa que `styles` está undefined porque el CSS Module no se importó bien. Probable causa: importaste del source en vez del dist. Verificar que el import sea `from "../../../components/dist/index.js"` y no `from "../../../components/src/lib"`.

### "Module not found: style-loader"

Significa que pusiste `Config.overrideWebpackConfig` con loaders manuales y faltan los packages. Quitá el override — la lib viene buildeada, no necesitás procesar CSS desde Remotion.

### El audio no se reproduce en el studio scrubeando

Es esperado. Remotion Studio toca el audio en play (espacio), no en scrub. Para verificar sync de audio + visual, play desde un punto antes del frame de interés.

### Las CSS animations del Popover/Modal se ven raras al scrubear

Es esperado. Las CSS @keyframes corren en tiempo real del browser, no frame-by-frame. En scrub se ven "saltadas". En render final (Chromium headless con mock-time) se ven frame-accurate.
