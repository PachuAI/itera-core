// PainTabsStack — representación abstracta del dolor "muchas pestañas/ventanas".
//
// Renderea N "browser-like tabs" apiladas en diagonal (arriba-izquierda hacia
// abajo-derecha) dentro de MOCKUP_ZONE. La última en abrir queda visualmente
// arriba del stack y abajo-derecha (mayor z-index, borde brand).
//
// Patrón validado en el short `causas-pestañas` para el beat de PAIN cuando
// el SaaS aún no aparece (la screen del laptop emerge después). Las tabs
// representan la misma entidad abierta múltiples veces (eg. una causa
// abierta en 4 pestañas distintas).
//
// Las tabs aparecen secuencialmente con `enterAt` y salen con `exitAt`,
// dejando paso al laptop. El consumer parametriza los timings y el contenido.

import { interpolate, useCurrentFrame } from "remotion";
import { fps, colors, MOCKUP_ZONE } from "../tokens";

export interface PainTabSpec {
  /** Título principal de la tab (eg. nombre de la causa). */
  title: string;
  /** Subtítulo / pestaña interna (eg. "Información", "Movimientos"). */
  subtitle: string;
  /** Segundos cuando esta tab empieza a aparecer (slide-up-fade). */
  enterAt: number;
  /** Segundos cuando esta tab empieza a salir (fade-out). */
  exitAt: number;
  /**
   * Si true, esta es la "tab activa" — z-index alto, borde brand visible.
   * Típicamente la última del stack.
   */
  isTop?: boolean;
}

export interface PainTabsStackProps {
  /** Tabs en orden de apilamiento (índice 0 = más vieja, abajo-izquierda). */
  tabs: PainTabSpec[];
  /** URL placeholder dentro del chrome de cada tab. */
  url?: string;
  /** Ancho de cada tab (px). Default 540. */
  tabWidth?: number;
  /** Alto de cada tab (px). Default 380. */
  tabHeight?: number;
  /** Desplazamiento X entre tabs consecutivas (px). Default 64. */
  diagonalOffsetX?: number;
  /** Desplazamiento Y entre tabs consecutivas (px). Default 56. */
  diagonalOffsetY?: number;
}

interface InternalTabProps extends PainTabSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  url: string;
}

const PainTab: React.FC<InternalTabProps> = ({
  enterAt,
  exitAt,
  x,
  y,
  width,
  height,
  zIndex,
  title,
  subtitle,
  isTop = false,
  url,
}) => {
  const frame = useCurrentFrame();
  const F = (s: number) => Math.round(s * fps);

  const opacity = interpolate(
    frame,
    [F(enterAt), F(enterAt + 0.35), F(exitAt), F(exitAt + 0.30)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const slideY = interpolate(
    frame,
    [F(enterAt), F(enterAt + 0.35)],
    [22, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (opacity === 0) return null;

  const accentBorder = "rgba(242, 122, 26, 0.28)";
  const neutralBorder = "rgba(255, 255, 255, 0.07)";

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity,
        transform: `translateY(${slideY}px)`,
        zIndex,
        background: "linear-gradient(180deg, #1a1a1a 0%, #0e0e0e 100%)",
        border: `1px solid ${isTop ? accentBorder : neutralBorder}`,
        borderRadius: 22,
        boxShadow: isTop
          ? "0 0 48px 6px rgba(242, 122, 26, 0.18), 0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 0 28px 2px rgba(242, 122, 26, 0.08), 0 14px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Chrome arriba */}
      <div
        style={{
          height: 36,
          background: "#0c0c0c",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: isTop ? colors.accent : "rgba(255, 255, 255, 0.16)",
            opacity: isTop ? 0.6 : 1,
            boxShadow: isTop
              ? `0 0 8px ${colors.accentGlow ?? "rgba(255, 115, 30, 0.42)"}`
              : undefined,
          }}
        />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.16)" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.16)" }} />
        <span
          style={{
            marginLeft: 14,
            fontFamily: "system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.02em",
            color: "rgba(255, 255, 255, 0.42)",
            background: "rgba(255, 255, 255, 0.04)",
            padding: "5px 12px",
            borderRadius: 7,
          }}
        >
          {url}
        </span>
      </div>

      {/* Contenido — título + pestaña activa + mock rows */}
      <div
        style={{
          flex: 1,
          padding: "26px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.fgMuted ?? "rgba(255, 255, 255, 0.62)",
          }}
        >
          Causa
        </div>
        <div
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 26,
            lineHeight: 1.16,
            letterSpacing: "-0.018em",
            color: colors.fg,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 17,
            color: colors.accent,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: colors.accent,
              boxShadow: `0 0 6px ${colors.accentGlow ?? "rgba(255, 115, 30, 0.42)"}`,
            }}
          />
          {subtitle}
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {[0.92, 0.78, 0.66, 0.84, 0.54].map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w * 100}%`,
                height: 10,
                background: "rgba(255, 255, 255, 0.07)",
                borderRadius: 5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const PainTabsStack: React.FC<PainTabsStackProps> = ({
  tabs,
  url = "app.example.com",
  tabWidth = 540,
  tabHeight = 380,
  diagonalOffsetX = 64,
  diagonalOffsetY = 56,
}) => {
  if (tabs.length === 0) return null;

  // Stack diagonal centrado dentro de MOCKUP_ZONE.
  const stackSpanW = tabWidth + diagonalOffsetX * (tabs.length - 1);
  const stackSpanH = tabHeight + diagonalOffsetY * (tabs.length - 1);
  const baseX = MOCKUP_ZONE.x + (MOCKUP_ZONE.width - stackSpanW) / 2;
  const baseY = MOCKUP_ZONE.y + (MOCKUP_ZONE.height - stackSpanH) / 2;

  return (
    <>
      {tabs.map((tab, i) => (
        <PainTab
          key={i}
          {...tab}
          x={baseX + diagonalOffsetX * i}
          y={baseY + diagonalOffsetY * i}
          width={tabWidth}
          height={tabHeight}
          zIndex={i + 1}
          url={url}
        />
      ))}
    </>
  );
};
