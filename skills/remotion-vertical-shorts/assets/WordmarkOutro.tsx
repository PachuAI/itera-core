// WordmarkOutro — placa final con el wordmark centrado, cerrando un short.
//
// Patrón validado para shorts pain→solución de 12-18s:
//
//   • El audio termina (último word.end). Hay un beat de silencio.
//   • La escena principal (laptop + captions) se atenúa.
//   • Aparece el wordmark del brand centrado vertical + horizontal, grande,
//     en fondo negro limpio.
//   • Hold de ~1-1.5s para que la marca quede impresa.
//   • Fade-out final.
//
// Este componente solo se ocupa del wordmark. La atenuación de la escena
// principal se maneja desde la composition envolviendo el contenido en un
// `<AbsoluteFill style={{ opacity: mainSceneOpacity }}>`. Ver el reference
// `outro-pattern.md` para el snippet completo coordinado.
//
// El componente asume un único asset `staticFile(src)`. Para brands con
// variantes (light/dark/monochrome), parametrizar `src` desde el caller.

import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { fps } from "../tokens";

export interface WordmarkOutroProps {
  /** Tiempo (sec) cuando el wordmark empieza a aparecer. */
  startAt: number;
  /** Tiempo (sec) cuando el wordmark empieza a salir. */
  fadeOutAt: number;
  /** Tiempo (sec) cuando el wordmark termina (opacity 0). */
  endAt: number;
  /** Path del wordmark en `public/`. Default "wordmark.png". */
  src?: string;
  /** Altura del logo en px del frame. Default 140. */
  logoHeight?: number;
  /** Duración del fade-in en sec. Default 0.4. */
  fadeInDuration?: number;
  /** Width del frame total. Default 1080. */
  width?: number;
  /** Height del frame total. Default 1920. */
  height?: number;
}

export const WordmarkOutro: React.FC<WordmarkOutroProps> = ({
  startAt,
  fadeOutAt,
  endAt,
  src = "wordmark.png",
  logoHeight = 140,
  fadeInDuration = 0.4,
  width = 1080,
  height = 1920,
}) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  const opacity = interpolate(
    t,
    [startAt, startAt + fadeInDuration, fadeOutAt, endAt],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (opacity === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
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
