// bridge.template.ts — single point of import del component library del SaaS.
//
// COPIAR a `src/bridge.ts` del proyecto Remotion y AJUSTAR el path relativo
// `../../../../../components/dist/...` según la profundidad del proyecto
// respecto del component library del SaaS.
//
// El proyecto Remotion consume el `dist/` buildeado (Vite library mode) en
// vez del source porque webpack de Remotion no resuelve CSS Modules
// cross-project. Ver `references/lib-bridge.md` del skill remotion-camera-tour
// para el flujo `pnpm build:lib`.
//
// Cuando cambies un componente de la lib y querás verlo acá:
//
//   cd <path>/components && pnpm build:lib
//
// El studio de Remotion no detecta cambios en dist/ automáticamente —
// refrescar el browser después del rebuild.
//
// El CSS del dist se importa desde `Root.tsx` con un import side-effect:
//
//   import "../../../../../components/dist/index.css";
//
// (Codex aprendió que dejar el CSS import sólo en este bridge no es
// suficiente para Remotion — debe estar en Root.tsx también.)

// ─── Re-exports principales ──────────────────────────────────────────
// Adaptar el path relativo según la estructura del proyecto consumer.

export {
  ClickRipple,
  CursorOverlay,
  GalleryCanvasFrame,
  GalleryVariant,
  GALLERY_CANVAS,
} from "../../../../../components/dist/index.js";

export type {
  ClickRippleProps,
  CursorOverlayProps,
  CursorVariant,
  GalleryCanvasFrameProps,
  GalleryCanvasSize,
  GalleryVariantProps,
} from "../../../../../components/dist/index.js";

// Si necesitás más exports (iconos del producto, primitives, widgets
// concretos), agregarlos acá manteniendo el mismo path.
