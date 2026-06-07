// Camera — wrapper que aplica scale + translate animados sobre children.
// Los targets se interpolan suavemente entre keyframes con ease-out-cubic.
//
// Copia este archivo a `src/compositions/Camera.tsx` del proyecto Remotion.
// Ajustá las constantes STAGE.* en tokens.ts según el formato:
//   16:9 horizontal: STAGE { width: 1504, height: 940 } sobre composition 1920x1080
//   9:16 vertical:   STAGE { width: 900,  height: 1500 } sobre composition 1080x1920
//                    (o las dimensiones que mejor acomoden el dashboard mockeado)

import { type ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { STAGE, F } from "../tokens";

export interface CameraTarget {
  /**
   * Coordenadas del punto donde la cámara enfoca, expresadas en el sistema
   * del stage (0,0 = top-left del dashboard).
   */
  x: number;
  y: number;
  /** Zoom. 1 = ver todo, 2 = ver mitad, 3 = ver tercio. Default 1. */
  scale?: number;
}

export interface CameraKeyframe {
  /** Frame en el que la cámara llega a este target. */
  at: number;
  target: CameraTarget;
}

export interface CameraProps {
  /**
   * Keyframes ordenados por frame ascendente. La cámara interpola entre
   * ellos con ease-out-cubic. El primer keyframe define el estado inicial
   * (frame 0 si no se especifica).
   */
  keyframes: CameraKeyframe[];
  children: ReactNode;
}

// ease-out-cubic — sensación de "movimiento natural" (cámara desacelera al
// acercarse al target, como un humano que apunta y asienta).
const ease = (t: number): number => 1 - Math.pow(1 - t, 3);

const interpTarget = (
  frame: number,
  keyframes: CameraKeyframe[]
): CameraTarget => {
  if (keyframes.length === 0) return { x: STAGE.width / 2, y: STAGE.height / 2, scale: 1 };
  if (frame <= keyframes[0].at) return keyframes[0].target;
  if (frame >= keyframes[keyframes.length - 1].at)
    return keyframes[keyframes.length - 1].target;

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (frame >= a.at && frame <= b.at) {
      const t = (frame - a.at) / (b.at - a.at);
      const e = ease(t);
      return {
        x: a.target.x + (b.target.x - a.target.x) * e,
        y: a.target.y + (b.target.y - a.target.y) * e,
        scale:
          (a.target.scale ?? 1) +
          ((b.target.scale ?? 1) - (a.target.scale ?? 1)) * e,
      };
    }
  }
  return keyframes[keyframes.length - 1].target;
};

export const Camera: React.FC<CameraProps> = ({ keyframes, children }) => {
  const frame = useCurrentFrame();
  const target = interpTarget(frame, keyframes);
  const scale = target.scale ?? 1;

  // Translate stage so that target (x,y) ends up centered in the stage viewport.
  const cx = STAGE.width / 2;
  const cy = STAGE.height / 2;
  const tx = (cx - target.x) * scale;
  const ty = (cy - target.y) * scale;

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.x,
        top: STAGE.y,
        width: STAGE.width,
        height: STAGE.height,
        overflow: "hidden",
        borderRadius: 18,
        background: "#0a0a0a",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "center center",
          // Sin `transition` — Remotion controla cada frame individualmente.
        }}
      >
        {children}
      </div>
    </div>
  );
};

export { F };
