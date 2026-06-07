// color-theme-audit / sample-layers.mjs
// Muestrea píxeles de una screenshot y reporta sRGB + oklch.
//
// Permite VALIDAR las capas perceptuales de un audit midiendo el L real
// renderizado, en lugar de inferir desde el CSS declarado. Crítico cuando
// los componentes usan `bg-X/N` (alpha) que hace blending con la capa de
// abajo y produce un L percibido distinto al token absoluto.
//
// Requiere `sharp` O `pngjs` instalado en el cwd. Auto-detección:
//   - Si `sharp` está → usar sharp (más rápido, suele estar en Next.js).
//   - Si no → fallback a `pngjs` (pure-JS lightweight).
//   - Si ninguno → instrucción de instalación.
//
//   pnpm add -D sharp     (recomendado)
//   pnpm add -D pngjs     (alternativa lightweight)
//
// Variables de entorno:
//   PNG          Path al archivo PNG. Obligatorio.
//   SAMPLES      CSV de `label:x,y` o `x,y` (sin label) separados por `;`.
//                Ejemplo:
//                  SAMPLES="sidebar:50,400;bg-main:600,400;card-base:1100,700;card:1300,260"
//   REGION_SIZE  Lado del cuadrado a promediar alrededor del punto. Default: 9.
//                Promediar evita errores de anti-aliasing / bordes / íconos.
//                Para muestrear un solo pixel exacto, REGION_SIZE=1.
//   FORMAT       "table" (default, human readable) | "json" (para diff con
//                CSS declarado en otro script).
//
// Uso típico:
//   PNG=/tmp/audit/dark.png \
//     SAMPLES="sidebar:50,400;bg:700,400;card-base:1100,700;card:1700,260" \
//     node sample-layers.mjs
//
// Output:
//   SAMPLES from /tmp/audit/dark.png (1920×1080)
//
//     sidebar     (50,400)    rgb( 19, 19, 19)   oklch(L=0.078 C=0.000 H=  0)
//     bg          (700,400)   rgb( 27, 27, 27)   oklch(L=0.105 C=0.000 H=  0)
//     card-base   (1100,700)  rgb( 46, 46, 46)   oklch(L=0.180 C=0.000 H=  0)
//     card        (1700,260)  rgb( 60, 60, 60)   oklch(L=0.234 C=0.000 H=  0)
//
//   Deltas L vs first sample:
//     sidebar     0.000  (base)
//     bg         +0.027
//     card-base  +0.102
//     card       +0.156

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const PNG_PATH = process.env.PNG;
const SAMPLES_RAW = process.env.SAMPLES || "";
const REGION_SIZE = Math.max(1, Number(process.env.REGION_SIZE || 9));
const FORMAT = process.env.FORMAT === "json" ? "json" : "table";

if (!PNG_PATH) {
  console.error("Error: PNG path required. Set env var PNG=path/to/file.png");
  process.exit(1);
}

if (!SAMPLES_RAW) {
  console.error(
    'Error: SAMPLES required. Format: "label:x,y;label2:x2,y2" or "x,y;x2,y2"',
  );
  process.exit(1);
}

// Lazy import: sharp → pngjs → buscar en .pnpm store si existe (caso pnpm
// con dep transitiva no hoisted).
async function loadModule(name) {
  try {
    return await import(name);
  } catch {}
  try {
    const pnpmDir = path.join(process.cwd(), "node_modules/.pnpm");
    if (!existsSync(pnpmDir)) return null;
    const entries = await readdir(pnpmDir);
    const match = entries.find((e) => e.startsWith(`${name}@`));
    if (!match) return null;
    const modPath = path.join(pnpmDir, match, "node_modules", name);
    const require = createRequire(import.meta.url);
    return { default: require(modPath), ...require(modPath) };
  } catch {
    return null;
  }
}

let decodePng;
let backend;

const sharpMod = await loadModule("sharp");
if (sharpMod) {
  const sharp = sharpMod.default;
  backend = "sharp";
  decodePng = async (buf) => {
    const img = sharp(buf);
    const meta = await img.metadata();
    const data = await img.raw().toBuffer();
    return { width: meta.width, height: meta.height, channels: meta.channels, data };
  };
} else {
  const pngjsMod = await loadModule("pngjs");
  if (pngjsMod) {
    const PNG = pngjsMod.PNG;
    backend = "pngjs";
    decodePng = async (buf) => {
      const png = PNG.sync.read(buf);
      return { width: png.width, height: png.height, channels: 4, data: png.data };
    };
  } else {
    console.error(
      "Error: neither `sharp` nor `pngjs` resolvable from current directory.\n" +
        "  Install ONE of:\n" +
        "    pnpm add -D sharp   (recommended; faster, often already in Next.js projects)\n" +
        "    pnpm add -D pngjs   (lightweight pure-JS fallback)\n" +
        "  Then re-run from a directory where one of those is resolvable.\n" +
        "  Note: this script also searches in `node_modules/.pnpm/` automatically.",
    );
    process.exit(1);
  }
}

// --- Parse SAMPLES ---

const samples = [];
for (const piece of SAMPLES_RAW.split(";")) {
  const trimmed = piece.trim();
  if (!trimmed) continue;
  const labelMatch = trimmed.match(/^([^:]+):(.+)$/);
  let label, coords;
  if (labelMatch) {
    label = labelMatch[1].trim();
    coords = labelMatch[2].trim();
  } else {
    label = `sample-${samples.length + 1}`;
    coords = trimmed;
  }
  const [x, y] = coords.split(",").map((s) => Number(s.trim()));
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.error(`Skipping invalid sample: "${trimmed}"`);
    continue;
  }
  samples.push({ label, x, y });
}

if (samples.length === 0) {
  console.error("Error: no valid samples parsed.");
  process.exit(1);
}

// --- Load and decode PNG ---

const buffer = await readFile(PNG_PATH);
const { width, height, channels, data: raw } = await decodePng(buffer);
// raw is a Buffer with bytes: [R,G,B(,A), R,G,B(,A), ...]
// channels can be 3 (RGB) or 4 (RGBA).
const ch = channels;

function getPixelAvg(centerX, centerY, size) {
  const half = Math.floor(size / 2);
  const x0 = Math.max(0, centerX - half);
  const y0 = Math.max(0, centerY - half);
  const x1 = Math.min(width - 1, centerX + half);
  const y1 = Math.min(height - 1, centerY + half);
  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const idx = (y * width + x) * ch;
      rSum += raw[idx];
      gSum += raw[idx + 1];
      bSum += raw[idx + 2];
      count++;
    }
  }
  return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
}

// --- sRGB → OKLCH ---

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearRGBToOklab(R, G, B) {
  // Constantes Björn Ottosson (linear sRGB → OkLab)
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToOklch([L, a, b]) {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function rgbToOklch(r, g, b) {
  const Rlin = srgbToLinear(r);
  const Glin = srgbToLinear(g);
  const Blin = srgbToLinear(b);
  return oklabToOklch(linearRGBToOklab(Rlin, Glin, Blin));
}

// --- Sample all points ---

const results = samples.map(({ label, x, y }) => {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return { label, x, y, error: "out of bounds" };
  }
  const [r, g, b] = getPixelAvg(x, y, REGION_SIZE);
  const { L, C, H } = rgbToOklch(r, g, b);
  return { label, x, y, r, g, b, L, C, H };
});

// --- Output ---

if (FORMAT === "json") {
  console.log(
    JSON.stringify(
      { png: PNG_PATH, width, height, region_size: REGION_SIZE, samples: results },
      null,
      2,
    ),
  );
} else {
  console.log(
    `SAMPLES from ${PNG_PATH} (${width}×${height}), region ${REGION_SIZE}×${REGION_SIZE} avg, backend: ${backend}\n`,
  );
  const maxLabel = Math.max(...results.map((r) => r.label.length));
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.label.padEnd(maxLabel)}  (${r.x},${r.y})  ERROR: ${r.error}`);
      continue;
    }
    const rgb = `rgb(${String(r.r).padStart(3)}, ${String(r.g).padStart(3)}, ${String(r.b).padStart(3)})`;
    const oklch = `oklch(L=${r.L.toFixed(3)} C=${r.C.toFixed(3)} H=${r.H.toFixed(0).padStart(3)})`;
    console.log(`  ${r.label.padEnd(maxLabel)}  (${r.x},${r.y})\t${rgb}   ${oklch}`);
  }

  // Deltas L vs first sample
  const first = results.find((r) => !r.error);
  if (first && results.length > 1) {
    console.log("\nDeltas L vs first sample:");
    for (const r of results) {
      if (r.error) continue;
      const delta = r.L - first.L;
      const sign = delta > 0 ? "+" : "";
      const tag = r === first ? "(base)" : `${sign}${delta.toFixed(3)}`;
      console.log(`  ${r.label.padEnd(maxLabel)}  ${tag}`);
    }
  }
}
