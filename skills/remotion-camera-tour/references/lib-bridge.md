# Lib bridge — Vite build:lib + consumo workspace desde Remotion

Cómo consumir una biblioteca de componentes React (que usa CSS Modules) desde un proyecto Remotion, sin que el bundler de Remotion se pelee con los `*.module.css`.

> **Patrón actual (desde 2026-06-10 · Fase 4)**: el taller `itera-social` es **un único pnpm workspace** (root = raíz del taller). Los proyectos Remotion consumen la biblioteca como dependencia `workspace:*` del paquete **`@iteralex/components`**. El **mecanismo de import cambió** (path relativo → paquete workspace); el **porqué se consume el `dist/`** buildeado (y no el source) **no cambió**.
>
> **Patrón viejo, DEPRECADO** (no usar en proyectos nuevos): el bridge relativo de 5 niveles `../../../../../components/dist/index.js`. Era frágil ante cambios de profundidad del consumer, y el bundler no resolvía el alias de tsconfig (sólo el typecheck). Si lo ves en un proyecto sin migrar, reemplazalo por el paquete workspace.

## El problema

Remotion 4.x usa un bundler (webpack/esbuild) que **NO maneja CSS Modules cross-project** consistentemente. Cuando importás componentes de una lib externa que tiene `import styles from "./X.module.css"`, pasan 2 cosas que se cruzan:

1. El loader default lo procesa como CSS plano → devuelve `undefined` para el objeto styles.
2. Si configurás `Config.overrideWebpackConfig` con style-loader + css-loader manualmente, el chain se duplica con el loader default → CssSyntaxError.

**No hay forma simple de configurar el bundler de Remotion para que resuelva CSS Modules cross-project sin romper otra cosa.**

## La solución

Dos piezas combinadas:

1. **Buildear la lib con Vite library mode** → output a `dist/` con CSS pre-procesado + JS bundle. Remotion importa el dist (CSS plano + ES module), sin necesidad de procesar CSS Modules. (Esto **no cambió** respecto del patrón viejo.)
2. **Consumir ese `dist/` como paquete workspace `@iteralex/components`**, no por path relativo. El bundler de Remotion resuelve el paquete como cualquier dep de `node_modules` (symlink del workspace → campo `exports` del `package.json` de la lib → `dist/`), independiente de la profundidad del consumer.

```
itera-social/                              ← pnpm workspace root (un solo install/store/lockfile)
├── pnpm-workspace.yaml                    ← packages: components + glob projects/**/remotion
├── projects/iteralex/components/          ← la biblioteca @iteralex/components
│   ├── vite.config.ts                     ← dev (gallery)
│   ├── vite.config.lib.ts                 ← library build
│   ├── package.json                       ← name + "exports" → dist/ + script build:lib
│   ├── src/lib/                           ← source con CSS Modules
│   └── dist/                              ← output del build:lib (COMMITEADO en git)
│       ├── index.js                       ← ES module con classes hashed
│       └── index.css                      ← CSS plano consolidado
└── projects/<slug>/campañas/<campaña>/remotion/   ← proyecto consumer
    ├── package.json                       ← declara "@iteralex/components": "workspace:*"
    └── src/                               ← importa from "@iteralex/components"
```

El `dist/` está **commiteado** en git: un clone fresco renderiza sin tener que rebuildear la lib.

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

### 2. `package.json` de la biblioteca: scripts + `exports`

La biblioteca expone el `dist/` como paquete consumible:

```jsonc
{
  "name": "@iteralex/components",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./styles": "./dist/index.css"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:lib": "vite build -c vite.config.lib.ts",
    "preview": "vite preview"
  }
}
```

**La condición `default` en `exports["."]` es obligatoria** además de `import` — sin ella el bundler/Node fallan con `ERR_PACKAGE_PATH_NOT_EXPORTED` según la condición de resolución que pidan. La subpath `./styles` apunta al CSS consolidado.

### 3. `package.json` del proyecto Remotion: declarar la dep workspace

```jsonc
"dependencies": {
  "@iteralex/components": "workspace:*"
}
```

Después correr **`pnpm install` desde la raíz del taller** (`itera-social/`), nunca desde la campaña. pnpm linkea el paquete workspace en el `node_modules` del consumer. Las campañas nuevas se suman solas al workspace por el glob `projects/**/remotion` del `pnpm-workspace.yaml` de la raíz, pero **deben declarar la dep `workspace:*` a mano**.

### 4. Buildear el dist

```bash
# Desde cualquier lado del workspace:
pnpm --filter @iteralex/components build:lib
# (equivalente: cd projects/iteralex/components && pnpm build:lib)
# ✓ built in ~300ms
# Output:
#   dist/index.css  ~30 kB  (CSS consolidado)
#   dist/index.js   ~60 kB  (ES module, classes hashed)
```

## Importar desde Remotion

En el proyecto Remotion (`bridge.ts`, `Root.tsx` o la composition):

```tsx
// 1. Side-effect import del CSS — carga las styles en el DOM al ejecutarse.
//    Resuelve a dist/index.css vía la subpath "./styles" del exports.
import "@iteralex/components/styles";

// 2. Named imports del JS — usa las classes hashed automáticamente.
//    Resuelve a dist/index.js vía el exports ".".
import {
  DashboardShell,
  EscritorioView,
  EventModal,
} from "@iteralex/components";
```

Sin paths relativos ni `../` que ajustar: el paquete resuelve igual desde cualquier profundidad del consumer.

> **Nota CSS**: el side-effect `import "@iteralex/components/styles"` debe estar en `Root.tsx` (no alcanza con dejarlo sólo en un `bridge.ts` de re-exports — Remotion necesita verlo en el árbol que renderiza).

## Tipos

El `dist/` **no genera `.d.ts`**. Dos formas válidas de tener tipos:

- **`declare module`** (subset hand-maintained): el consumer con un `bridge.ts` trae un `src/types.d.ts` con `declare module "@iteralex/components" { ... }` declarando sólo lo que usa.
- **Alias de tsconfig al source** (tipos reales): mapear `@iteralex/components` → `../../../components/src/lib/index` en `paths` del `tsconfig.json`. Typecheck contra el source, bundle contra el dist (vía el paquete). Es el patrón de `product-tour`.

En ambos casos el **bundle** sigue resolviendo al `dist/` por el paquete workspace — el alias de tsconfig es sólo para el typecheck.

## Cuándo rebuildear

- **Cambiaste un componente de la lib** (TSX o CSS): `pnpm --filter @iteralex/components build:lib`. El studio de Remotion NO detecta cambios en `dist/` automáticamente — refrescar el browser después.
- **Solo cambiaste el proyecto Remotion** (composition, Camera, Captions): NO rebuildear. HMR del studio detecta los cambios.
- **Solo cambiaste tokens**: si los tokens viven en la biblioteca, rebuildear. Si viven en `remotion/src/tokens.ts`, HMR.

## Workflow dual recomendado

Mientras iterás:

- **Gallery (Vite dev, puerto 5173)**: `pnpm --filter @iteralex/components dev`. HMR instant para cambios visuales en componentes. **Acá iterás el visual del componente**.
- **Remotion Studio (puerto 3001)**: `cd projects/<slug>/campañas/<campaña>/remotion && pnpm dev`. HMR para cámara, captions, lógica de show/hide. **Acá iterás el motion**.
- **Cuando cambies un componente de la lib y querás verlo en el motion**: `pnpm --filter @iteralex/components build:lib`, después refresh del browser del studio.

> **`pnpm install` SIEMPRE desde la raíz del taller** (`itera-social/`). Un solo install/store/lockfile cubre lib + stills + todos los proyectos Remotion.

## Issues conocidos

### "Cannot read properties of undefined (reading 'shell')"

Significa que `styles` está undefined porque el CSS Module no se importó bien. Probable causa: el bundle está resolviendo al source en vez del dist. Verificar que el import sea `from "@iteralex/components"` (resuelve al `dist/` vía `exports`) y no un alias que apunte directo al source de CSS Modules.

### "ERR_PACKAGE_PATH_NOT_EXPORTED"

El `exports` del `package.json` de la biblioteca no cubre la condición de resolución que el bundler pidió. `exports["."]` necesita **ambas** condiciones `import` **y** `default`. Ver Setup paso 2.

### "ERR_PNPM_WORKSPACE_PKG_NOT_FOUND" al correr pnpm desde una campaña

Quedó un `pnpm-workspace.yaml` "stray" en un subdir de proyecto (artefacto de migración a pnpm 11). Cada `pnpm-workspace.yaml` extra hace que ese subdir se auto-detecte como su propio workspace root y rompe la resolución de `workspace:*`. **El único `pnpm-workspace.yaml` válido es el de la raíz del taller** — borrar los demás (y los lockfiles huérfanos que arrastren).

### Remotion no bundlea / esbuild no corre

En pnpm 11 los build scripts se habilitan con **`allowBuilds:` (mapa) en `pnpm-workspace.yaml`**, NO con `onlyBuiltDependencies`. Sin habilitar `esbuild` (y `sharp`/`ffmpeg-static`), Remotion no bundlea. Sumar `verifyDepsBeforeRun: false` en el workspace.yaml evita el install implícito de pnpm 11 antes de cada `pnpm run/exec`.

### "Module not found: style-loader"

Significa que pusiste `Config.overrideWebpackConfig` con loaders manuales y faltan los packages. Quitá el override — la lib viene buildeada, no necesitás procesar CSS desde Remotion.

### El audio no se reproduce en el studio scrubeando

Es esperado. Remotion Studio toca el audio en play (espacio), no en scrub. Para verificar sync de audio + visual, play desde un punto antes del frame de interés.

### Las CSS animations del Popover/Modal se ven raras al scrubear

Es esperado. Las CSS @keyframes corren en tiempo real del browser, no frame-by-frame. En scrub se ven "saltadas". En render final (Chromium headless con mock-time) se ven frame-accurate.
