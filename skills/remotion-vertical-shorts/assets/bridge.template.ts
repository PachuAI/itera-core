// bridge.template.ts — single point of import del component library del SaaS.
//
// COPIAR a `src/bridge.ts` del proyecto Remotion. Re-exporta desde el paquete
// workspace `@iteralex/components` (NO con el viejo path relativo de 5 niveles
// `../../../../../components/dist/...`, deprecado).
//
// Pre-requisito: el proyecto Remotion declara la dependencia en su package.json
// y es miembro del pnpm workspace del taller (itera-social/):
//
//   "dependencies": {
//     "@iteralex/components": "workspace:*"
//   }
//
// Después correr `pnpm install` DESDE LA RAÍZ del taller (itera-social/) para
// que pnpm linkee el paquete workspace. Las campañas nuevas se suman solas al
// workspace por el glob `projects/**/remotion`, pero deben declarar la dep
// `workspace:*` a mano.
//
// Se consume el `dist/` buildeado (Vite library mode), resuelto vía el campo
// `exports` del package.json de la biblioteca — NO el source — porque el
// bundler de Remotion no resuelve CSS Modules cross-project. Ver
// `references/lib-bridge.md` del skill remotion-camera-tour para el flujo
// `build:lib` y el detalle del workspace.
//
// Cuando cambies un componente de la lib y querás verlo acá:
//
//   pnpm --filter @iteralex/components build:lib
//
// El studio de Remotion no detecta cambios en dist/ automáticamente —
// refrescar el browser después del rebuild.
//
// El CSS del dist se importa desde `Root.tsx` con un import side-effect:
//
//   import "@iteralex/components/styles";
//
// (Codex aprendió que dejar el CSS import sólo en este bridge no es
// suficiente para Remotion — debe estar en Root.tsx también.)

// ─── Re-exports principales ──────────────────────────────────────────

export {
  ClickRipple,
  CursorOverlay,
  GalleryCanvasFrame,
  GalleryVariant,
  GALLERY_CANVAS,
} from "@iteralex/components";

export type {
  ClickRippleProps,
  CursorOverlayProps,
  CursorVariant,
  GalleryCanvasFrameProps,
  GalleryCanvasSize,
  GalleryVariantProps,
} from "@iteralex/components";

// Si necesitás más exports (iconos del producto, primitives, widgets
// concretos), agregarlos acá importando del mismo paquete `@iteralex/components`.
