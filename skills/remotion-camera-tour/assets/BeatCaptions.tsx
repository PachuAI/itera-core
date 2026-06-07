// BeatCaptions — captions word-level sincronizadas al audio.
//
// Patrón "karaoke moderno": cada chunk se ve completo en pantalla; la
// palabra que se está diciendo en el frame current se highlightea con
// gradient brand. Las palabras past/future están atenuadas.
//
// Características clave:
//   • Sin overlap entre chunks consecutivos (fade vive DENTRO del rango).
//   • Sin flash negro entre current → past (sombra unificada como
//     filter:drop-shadow en todos los estados, sin transition de color).
//
// Copia este archivo a `src/compositions/BeatCaptions.tsx` del proyecto.
// Ajustá COMP y STAGE en tokens.ts según composition (16:9 vs 9:16).
// Para 9:16 quizás convenga subir el font-size y reposicionar las captions
// arriba o abajo según el layout del dashboard.

import { interpolate, useCurrentFrame } from "remotion";
import { COMP, STAGE, fps as defaultFps } from "../tokens";

export interface CaptionWord {
  text: string;
  /** Start en segundos absolutos del audio. */
  start: number;
  /** End en segundos absolutos. */
  end: number;
}

export interface CaptionChunk {
  /** Aparición del chunk en segundos (típicamente = start de la 1ra word). */
  from: number;
  /** Salida del chunk en segundos (típicamente = end de la última word). */
  to: number;
  words: CaptionWord[];
}

export interface BeatCaptionsProps {
  chunks: CaptionChunk[];
  /** Frames de fade-in / fade-out del chunk. Default 3 (100ms @ 30fps). */
  fadeFrames?: number;
  /** Brand accent gradient (para current word). Default naranja iteralex. */
  brandGradient?: string;
  /** Brand glow color (para drop-shadow del current). */
  brandGlowColor?: string;
}

const DEFAULT_GRADIENT =
  "linear-gradient(125deg, #FFB061 0%, #F27A1A 50%, #FF8A2E 100%)";
const DEFAULT_GLOW = "rgba(242, 122, 26, 0.45)";

export const BeatCaptions: React.FC<BeatCaptionsProps> = ({
  chunks,
  fadeFrames = 3,
  brandGradient = DEFAULT_GRADIENT,
  brandGlowColor = DEFAULT_GLOW,
}) => {
  const frame = useCurrentFrame();
  const currentTime = frame / defaultFps;
  const F = (s: number) => Math.round(s * defaultFps);

  // Posición default: debajo del stage. Ajustar si el layout lo pide.
  const top = STAGE.y + STAGE.height + 26;
  const height = COMP.height - top - 16;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: COMP.width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 96px",
        pointerEvents: "none",
      }}
    >
      {chunks.map((chunk, i) => {
        const fromF = F(chunk.from);
        const toF = F(chunk.to);

        // CRÍTICO: fade-in/fade-out viven DENTRO del rango [from, to].
        // Si chunk1.to == chunk2.from, ambos llegan a 0 / parten de 0 en
        // el mismo frame. NO hay overlap.
        const opacity = interpolate(
          frame,
          [fromF, fromF + fadeFrames, toF - fadeFrames, toF],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        if (opacity === 0) return null;

        const slideUp = interpolate(
          frame,
          [fromF, fromF + fadeFrames],
          [10, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0 14px",
              maxWidth: 1500,
              opacity,
              transform: `translateY(${slideUp}px)`,
            }}
          >
            {chunk.words.map((word, j) => {
              const isCurrent =
                currentTime >= word.start && currentTime < word.end;
              const isPast = currentTime >= word.end;

              // CRÍTICO: tres ajustes coordinados para evitar flash negro
              // al cambiar de current → past:
              //   1. Sin `transition: color` — cambio instantáneo.
              //   2. Sombra siempre como filter:drop-shadow (NO text-shadow).
              //      Antes el current usaba drop-shadow naranja y el past
              //      text-shadow negro — distintos mecanismos que no se
              //      coordinaban; durante la transición el text-shadow
              //      "huérfano" pintaba el texto en negro.
              //   3. `WebkitTextFillColor: currentColor` + `background: none`
              //      explícitos en past/future para resetear los residuos
              //      del estado current.
              const wordStyle: React.CSSProperties = isCurrent
                ? {
                    background: brandGradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    filter: `drop-shadow(0 2px 12px ${brandGlowColor})`,
                  }
                : {
                    background: "none",
                    WebkitBackgroundClip: "border-box",
                    backgroundClip: "border-box",
                    WebkitTextFillColor: "currentColor",
                    color: isPast
                      ? "rgba(255, 255, 255, 0.62)"
                      : "rgba(255, 255, 255, 0.34)",
                    filter: "drop-shadow(0 2px 10px rgba(0, 0, 0, 0.55))",
                  };

              return (
                <span
                  key={j}
                  style={{
                    fontFamily:
                      '"Plus Jakarta Sans", system-ui, sans-serif',
                    fontWeight: 800,
                    fontSize: 56,
                    letterSpacing: "-0.024em",
                    lineHeight: 1.1,
                    ...wordStyle,
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
