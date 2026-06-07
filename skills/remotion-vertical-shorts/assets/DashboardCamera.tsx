// DashboardCamera — posiciona el variant del gallery dentro del viewport
// de la screen del laptop. Vive como children de <LaptopFrame>.
//
// El viewport del laptop ya tiene overflow:hidden — esta cámara solo aplica
// transform: scale + translate al variant para mover focus y zoom.
//
// Zoom 1 = base-fit (variant entra justo a ancho del viewport).
// Zoom > 1 = lupa hacia un punto específico del variant.
//
// `overlay`: ReactNode opcional que se renderea DENTRO del mismo transform
// space del variant, en coords nativas del canvas del gallery
// (eg. 1504×940 si la lib usa el contrato canónico). Pensado para cursor,
// click ripples u otros motion graphics que deben anclarse a un punto
// específico del variant y seguir el zoom/pan macro del laptop.
//
// Asume tokens.ts del consumer expone: VARIANT_NATIVE, VARIANT_BASE_SCALE,
// LAPTOP_VIEWPORT. Y bridge.ts expone GalleryVariant.

import type { ReactNode } from "react";
import {
  VARIANT_NATIVE,
  VARIANT_BASE_SCALE,
  LAPTOP_VIEWPORT,
} from "../tokens";
import { GalleryVariant } from "../bridge";

export interface DashboardCameraProps {
  /** Story id del gallery (eg. "screen/causas-framed"). */
  storyId: string;
  /** Variant name dentro de la story. */
  variantName: string;
  /**
   * Punto del variant que cae centrado en el viewport del laptop.
   * Coords en el sistema nativo del canvas (eg. 0..1504 × 0..940).
   * Default = centro del canvas.
   */
  focus?: { x: number; y: number };
  /** Multiplicador relativo al base-fit. 1 = caben todos los anchos. > 1 = lupa. */
  zoom?: number;
  /**
   * Motion graphics opcionales en coords del canvas nativo. Se renderean
   * encima del variant dentro del mismo transform space, así cursor /
   * ripples / markers siguen automáticamente cualquier zoom o pan macro.
   */
  overlay?: ReactNode;
}

const VIEWPORT_CX = LAPTOP_VIEWPORT.width / 2;
const VIEWPORT_CY = LAPTOP_VIEWPORT.height / 2;

export const DashboardCamera: React.FC<DashboardCameraProps> = ({
  storyId,
  variantName,
  focus = { x: VARIANT_NATIVE.width / 2, y: VARIANT_NATIVE.height / 2 },
  zoom = 1,
  overlay,
}) => {
  const scale = VARIANT_BASE_SCALE * zoom;

  // translate: (focus.x, focus.y) del variant cae en el centro del viewport.
  const tx = VIEWPORT_CX - focus.x * scale;
  const ty = VIEWPORT_CY - focus.y * scale;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VARIANT_NATIVE.width,
          height: VARIANT_NATIVE.height,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <GalleryVariant storyId={storyId} variantName={variantName} />
        {overlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {overlay}
          </div>
        )}
      </div>
    </div>
  );
};
