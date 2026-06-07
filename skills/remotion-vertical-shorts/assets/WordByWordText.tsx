// WordByWordText — chunk de captions que aparecen palabra por palabra
// sincronizadas a sus word.start.
//
// Layout normal (default):
//   • Flex-wrap horizontal centrado.
//   • Cada palabra aparece en su `word.start` (instantáneo, sin fade-in
//     que retrase la sincronía con el audio).
//   • Las palabras `emphasis` viven en accent gradient durante todo el chunk.
//   • La palabra "current" o "latestArrived" recibe accent dinámico.
//   • Wrap natural por el ancho disponible. Para forzar un salto de línea
//     en un punto exacto, marcar `breakAfter: true` en la palabra previa
//     al corte deseado.
//
// Modo `oneAtATime` (para enumeraciones donde cada item es importante):
//   • Solo una palabra visible en cualquier momento, centrada absoluta.
//   • Cada palabra entra con slide-up-fade y sale cuando arranca la
//     siguiente. Sin acumulación.
//
// Cross-fade entre chunks lo maneja PhaseWrap envolviéndolo, fade-in/out
// dentro de [from, to].

import { Fragment } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fps, colors, CAPTIONS_ZONE } from "../tokens";

type Zone = { x: number; y: number; width: number; height: number };

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
  /**
   * Si true, fuerza salto de línea visual después de esta palabra dentro
   * del chunk (no afecta el timing, solo el layout). Ignorado en modo
   * oneAtATime.
   */
  breakAfter?: boolean;
}

export interface WordByWordTextProps {
  /** Palabras del chunk en orden cronológico. */
  words: CaptionWord[];
  /** Palabras (match exacto contra word.text) con accent persistente. */
  emphasis?: string[];
  /** Tamaño del font. Default 72. */
  fontSize?: number;
  /** Line height del font. Default 1.10. */
  lineHeight?: number;
  /** Letter spacing. Default 0. */
  letterSpacing?: string;
  /** Padding lateral del bloque (px). Default 64. */
  padX?: number;
  /** Zona alternativa para ubicar captions cerca del mockup. */
  zone?: Zone;
  /** Anclaje vertical dentro de la zona. Default bottom. */
  verticalAlign?: "start" | "center" | "end";
  /** Opacidad del bloque completo. Default 1. */
  opacity?: number;
  /**
   * Si una palabra ya pasó (currentTime > word.end) y NO está en `emphasis`,
   * ¿se mantiene en accent? Default false. Ignorado en modo oneAtATime.
   */
  pastInAccent?: boolean;
  /**
   * Si true, una sola palabra visible a la vez — centrada absoluta. Cada
   * palabra entra con slide-up-fade en su `word.start` y sale cuando arranca
   * la siguiente. Ideal para enumeraciones donde cada item necesita aire.
   * Default false.
   */
  oneAtATime?: boolean;
}

const DEFAULT_FONT_FAMILY = '"Plus Jakarta Sans", system-ui, sans-serif';

const accentStyle = {
  background: colors.accentGradient,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
  filter: `drop-shadow(0 2px 12px ${colors.accentGlow})`,
} as const;

const neutralStyle = {
  background: "none",
  WebkitBackgroundClip: "border-box",
  backgroundClip: "border-box",
  WebkitTextFillColor: "currentColor",
  color: colors.fg,
  filter: "drop-shadow(0 3px 14px rgba(0, 0, 0, 0.7))",
} as const;

export const WordByWordText: React.FC<WordByWordTextProps> = ({
  words,
  emphasis = [],
  fontSize = 72,
  lineHeight = 1.10,
  letterSpacing = "0em",
  padX = 64,
  zone = CAPTIONS_ZONE,
  verticalAlign = "end",
  opacity: blockOpacity = 1,
  pastInAccent = false,
  oneAtATime = false,
}) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const F = (s: number) => Math.round(s * fps);

  const alignItems =
    verticalAlign === "start"
      ? "flex-start"
      : verticalAlign === "center"
        ? "center"
        : "flex-end";

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: zone.x,
    top: zone.y,
    width: zone.width,
    height: zone.height,
    display: "flex",
    alignItems,
    justifyContent: "center",
    padding: `0 ${padX}px`,
    opacity: blockOpacity,
    pointerEvents: "none",
  };

  // ─── Modo oneAtATime: una palabra a la vez, centrada ─────────────────
  if (oneAtATime) {
    // La palabra "current" es la más reciente que ya arrancó. Una vez
    // arranca la siguiente, esta sale.
    let currentIdx = -1;
    for (let i = 0; i < words.length; i++) {
      if (t >= words[i].start) currentIdx = i;
    }
    if (currentIdx === -1) return null;

    const word = words[currentIdx];
    const wStartF = F(word.start);
    const nextStart = words[currentIdx + 1]?.start;
    const wExit = nextStart !== undefined ? F(nextStart) : null;

    const fadeInFrames = Math.max(2, Math.round(fps * 0.14));
    const fadeOutFrames = Math.max(2, Math.round(fps * 0.10));

    const wordOpacity =
      wExit !== null
        ? interpolate(
            frame,
            [wStartF, wStartF + fadeInFrames, wExit - fadeOutFrames, wExit],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        : interpolate(frame, [wStartF, wStartF + fadeInFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

    const slideY = interpolate(
      frame,
      [wStartF, wStartF + fadeInFrames],
      [16, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const isEmphasis = emphasis.includes(word.text);
    const wordStyle = isEmphasis ? accentStyle : accentStyle; // current → accent siempre

    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "100%",
          }}
        >
          <span
            style={{
              fontFamily: DEFAULT_FONT_FAMILY,
              fontWeight: 800,
              fontSize,
              lineHeight,
              letterSpacing,
              textAlign: "center",
              opacity: wordOpacity,
              transform: `translateY(${slideY}px)`,
              ...wordStyle,
            }}
          >
            {word.text}
          </span>
        </div>
      </div>
    );
  }

  // ─── Modo default: flex-wrap, con breakAfter opcional ────────────────
  const latestArrivedIndex = words.reduce(
    (latest, word, index) => (t >= word.start ? index : latest),
    -1
  );

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          columnGap: fontSize * 0.20,
          rowGap: fontSize * 0.08,
          maxWidth: "100%",
        }}
      >
        {words.map((word, i) => {
          const wStartF = F(word.start);
          const isCurrent = t >= word.start && t < word.end;
          const isPast = t >= word.end;
          const hasArrived = t >= word.start;
          const isEmphasis = emphasis.includes(word.text);
          const isLatestArrived = i === latestArrivedIndex;
          const isAccent =
            isEmphasis ||
            isCurrent ||
            isLatestArrived ||
            (pastInAccent && isPast);

          const opacity = interpolate(
            frame,
            [wStartF - 1, wStartF],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const slideY = interpolate(
            frame,
            [wStartF - 1, wStartF],
            [2, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Antes de que llegue: reservamos el espacio con visibility hidden
          // para evitar layout shift cuando entra.
          if (!hasArrived) {
            return (
              <Fragment key={i}>
                <span
                  style={{
                    fontFamily: DEFAULT_FONT_FAMILY,
                    fontWeight: 800,
                    fontSize,
                    lineHeight,
                    letterSpacing,
                    visibility: "hidden",
                  }}
                >
                  {word.text}
                </span>
                {word.breakAfter && (
                  <div style={{ flexBasis: "100%", height: 0 }} />
                )}
              </Fragment>
            );
          }

          const wordStyle: React.CSSProperties = isAccent
            ? accentStyle
            : { ...neutralStyle, color: isPast ? colors.fgMuted : colors.fg };

          return (
            <Fragment key={i}>
              <span
                style={{
                  fontFamily: DEFAULT_FONT_FAMILY,
                  fontWeight: 800,
                  fontSize,
                  lineHeight,
                  letterSpacing,
                  textAlign: "center",
                  opacity,
                  transform: `translateY(${slideY}px)`,
                  ...wordStyle,
                }}
              >
                {word.text}
              </span>
              {word.breakAfter && (
                <div style={{ flexBasis: "100%", height: 0 }} />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
