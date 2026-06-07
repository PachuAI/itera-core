// CalibrationGrid — overlay reusable para identificar coords dentro de un
// variant cuando se está armando cursor / ClickRipple / focus targets.
//
// Diseñado para insertarse como prop `overlay` de DashboardCamera, ya que
// vive en el transform-space del variant nativo (1504×940 por contrato del
// component library de ÍTERA Lex). La grilla se mueve junto con cualquier
// macro-zoom / pan del LaptopFrame, así que las coords leídas se pueden
// pegar directamente a constantes TAB_X / FOCUS_* del composition.
//
// Uso típico:
//
//   <DashboardCamera
//     storyId="screen/causas-framed"
//     variantName="Ficha: información"
//     focus={{ x: focusX, y: focusY }}
//     zoom={microZoom}
//     overlay={<CalibrationGrid />}
//   />
//
//   1. Render un still en el frame del variant que querés calibrar.
//   2. Identificá visualmente dónde caen los elementos de interés.
//   3. Anotá las coords (x, y) y pegalas en `const TAB_X = { ... }` etc.
//   4. Quitá el overlay antes de cerrar la composition.
//
// Tip: cuando ya tengas las coords calibradas, sumá al catálogo en
// `references/variant-anchors.md` del skill para reuso cross-video.

const X_TICKS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
];
const Y_TICKS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export interface CalibrationGridProps {
  /** Ancho del variant nativo (default 1504, GALLERY_CANVAS.width). */
  width?: number;
  /** Alto del variant nativo (default 940, GALLERY_CANVAS.height). */
  height?: number;
  /** Y inicial donde caen los labels de las X-ticks. Default 240. */
  xLabelY?: number;
  /** X inicial donde caen los labels de las Y-ticks. Default 260. */
  yLabelX?: number;
}

export const CalibrationGrid: React.FC<CalibrationGridProps> = ({
  width = 1504,
  height = 940,
  xLabelY = 240,
  yLabelX = 260,
}) => {
  return (
    <>
      {X_TICKS.filter((vx) => vx <= width).map((vx) => (
        <div
          key={`x-${vx}`}
          style={{
            position: "absolute",
            left: vx - 2,
            top: 0,
            width: 4,
            height,
            background: "rgba(255, 0, 255, 0.45)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: xLabelY,
              left: 6,
              color: "#ff00ff",
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              background: "rgba(0, 0, 0, 0.7)",
              padding: "2px 5px",
              whiteSpace: "nowrap",
            }}
          >
            x{vx}
          </div>
        </div>
      ))}
      {Y_TICKS.filter((vy) => vy <= height).map((vy) => (
        <div
          key={`y-${vy}`}
          style={{
            position: "absolute",
            left: 0,
            top: vy - 2,
            width,
            height: 4,
            background: "rgba(0, 255, 255, 0.35)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: yLabelX,
              top: 6,
              color: "#00ffff",
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              background: "rgba(0, 0, 0, 0.7)",
              padding: "2px 5px",
              whiteSpace: "nowrap",
            }}
          >
            y{vy}
          </div>
        </div>
      ))}
    </>
  );
};
