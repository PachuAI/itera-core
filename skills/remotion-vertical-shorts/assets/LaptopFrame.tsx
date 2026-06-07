// LaptopFrame — mock visual de un laptop/notebook a tamaño fijo del frame.
//
// Replica el patrón validado del skill `iteralex-device-mockup` (piezas
// estáticas del feed-launch). Compuesto por:
//
//   • screen — bisel + topbar chrome con 3 dots + URL placeholder
//   • base — bisagra simulada abajo
//
// El children del componente se renderiza ADENTRO del viewport de la
// screen (zona debajo del topbar). Típicamente <DashboardCamera /> que
// posiciona el variant del gallery con zoom + pan.
//
// Macro-zoom: `scale` + `offsetX` + `offsetY` transforman el laptop entero
// (frame + screen + base). transformOrigin = centro de MOCKUP_ZONE para
// que la lupa quede contenida sin pisar wordmark ni captions.
//
// Asume tokens.ts del consumer expone: LAPTOP, LAPTOP_BORDER,
// LAPTOP_TOPBAR_H, LAPTOP_SCREEN_HEIGHT, LAPTOP_BASE_H, MOCKUP_ZONE, colors.

import {
  LAPTOP,
  LAPTOP_BORDER,
  LAPTOP_TOPBAR_H,
  LAPTOP_SCREEN_HEIGHT,
  LAPTOP_BASE_H,
  MOCKUP_ZONE,
  colors,
} from "../tokens";

export interface LaptopFrameProps {
  /** URL placeholder dentro del topbar chrome. */
  url?: string;
  /** Color del "live indicator" del topbar (default = accent del brand). */
  brandDotColor?: string;
  /**
   * Macro-zoom del laptop entero. 1 = tamaño natural. > 1 crece (lupa).
   * < 1 lejos. transformOrigin queda anclado al centro de MOCKUP_ZONE.
   */
  scale?: number;
  /** Translate X del laptop (después del scale). Default 0. */
  offsetX?: number;
  /** Translate Y del laptop (después del scale). Default 0. */
  offsetY?: number;
  /** Opacity del laptop entero (fade-in/out). Default 1. */
  opacity?: number;
  children: React.ReactNode;
}

export const LaptopFrame: React.FC<LaptopFrameProps> = ({
  url = "app.example.com",
  brandDotColor,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  opacity = 1,
  children,
}) => {
  const dotColor = brandDotColor ?? colors.accent;

  return (
    <div
      style={{
        position: "absolute",
        left: LAPTOP.x,
        top: LAPTOP.y,
        width: LAPTOP.width,
        height: LAPTOP.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        transformOrigin: `${MOCKUP_ZONE.x + MOCKUP_ZONE.width / 2 - LAPTOP.x}px ${
          MOCKUP_ZONE.y + MOCKUP_ZONE.height / 2 - LAPTOP.y
        }px`,
        opacity,
      }}
    >
      {/* Screen del laptop: bisel + topbar + viewport */}
      <div
        style={{
          width: LAPTOP.width,
          height: LAPTOP_SCREEN_HEIGHT + LAPTOP_BORDER * 2,
          background: "#0e0e0e",
          border: `${LAPTOP_BORDER}px solid #1a1a1a`,
          borderRadius: 14,
          boxSizing: "border-box",
          boxShadow:
            "0 0 38px 2px rgba(255, 115, 30, 0.10),\
             0 18px 50px rgba(0, 0, 0, 0.6),\
             0 0 0 1px rgba(255, 255, 255, 0.05),\
             inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Topbar chrome */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: LAPTOP_TOPBAR_H,
            background: "#161616",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 8,
            zIndex: 2,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: dotColor, opacity: 0.55 }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255, 255, 255, 0.16)" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255, 255, 255, 0.16)" }} />
          <span
            style={{
              marginLeft: 12,
              fontFamily: "system-ui, sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: "rgba(255, 255, 255, 0.4)",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "4px 10px",
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: colors.accent,
                boxShadow: `0 0 6px ${colors.accentGlow ?? "rgba(255, 115, 30, 0.42)"}`,
              }}
            />
            {url}
          </span>
        </div>

        {/* Viewport: donde vive el variant (children) */}
        <div
          style={{
            position: "absolute",
            top: LAPTOP_TOPBAR_H,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>

      {/* Base (bisagra simulada abajo de la screen) */}
      <div
        style={{
          width: "110%",
          height: LAPTOP_BASE_H,
          marginTop: -1,
          background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderRadius: "0 0 18px 18px",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 90,
            height: 5,
            background: "#050505",
            borderRadius: "0 0 8px 8px",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
