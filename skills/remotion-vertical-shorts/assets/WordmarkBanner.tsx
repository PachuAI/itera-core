// WordmarkBanner — wordmark del brand en una zona del frame.
//
// Default: arriba del mockup, alineado al top, con animación de entrada
// (slide-down + fade-in en los primeros 0.4s). Usado para el plate inicial
// del short.
//
// Para placa de cierre centrada (post-audio), usar `WordmarkOutro` que es
// un componente separado y opinionado para ese caso. Este componente es
// para banners contextuales (arriba/abajo/cerca del mockup) durante el body.
//
// Asume `staticFile("wordmark.png")` existe en `public/` del proyecto.
// Para multi-brand, el consumer extiende con prop `src`.

import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { fps, WORDMARK_ZONE } from "../tokens";

type Zone = { x: number; y: number; width: number; height: number };

export interface WordmarkBannerProps {
  /** Opacidad del wordmark. Default 1. */
  opacity?: number;
  /** Y offset adicional desde el ancla. Default 0. */
  offsetY?: number;
  /** Zona alternativa para acercar el wordmark al mockup. */
  zone?: Zone;
  /** Altura visual del logo. Default 96. */
  logoHeight?: number;
  /** Alineación vertical dentro de la zona. Default "start" (top). */
  verticalAlign?: "start" | "center" | "end";
  /** Si false, salta el slide-down + fade-in inicial. Default true. */
  enableEnterAnimation?: boolean;
  /** Path del wordmark en `public/`. Default "wordmark.png". */
  src?: string;
}

export const WordmarkBanner: React.FC<WordmarkBannerProps> = ({
  opacity = 1,
  offsetY = 0,
  zone = WORDMARK_ZONE,
  logoHeight = 96,
  verticalAlign = "start",
  enableEnterAnimation = true,
  src = "wordmark.png",
}) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  const enterOpacity = enableEnterAnimation
    ? interpolate(t, [0.04, 0.38], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const enterY = enableEnterAnimation
    ? interpolate(t, [0.04, 0.38], [-18, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const alignItems =
    verticalAlign === "center"
      ? "center"
      : verticalAlign === "end"
        ? "flex-end"
        : "flex-start";

  return (
    <div
      style={{
        position: "absolute",
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        display: "flex",
        alignItems,
        justifyContent: "center",
        opacity: opacity * enterOpacity,
        transform: `translateY(${offsetY + enterY}px)`,
      }}
    >
      <img
        src={staticFile(src)}
        alt="Brand wordmark"
        style={{
          height: logoHeight,
          width: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.55))",
        }}
      />
    </div>
  );
};
