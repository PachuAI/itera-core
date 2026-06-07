// color-theme-audit / wcag-check.mjs
// Parsea globals.css del proyecto target, extrae los pares foreground+background
// canónicos en :root (light) y .dark, y calcula contraste WCAG.
//
// Reporta ratios + pass/fail para AA body (4.5:1), AA large/UI (3:1), AAA (7:1).
//
// Sin dependencies — todo nativo Node. Soporta oklch() y lab() (formato L a b);
// hsl()/rgb()/hex pasan a warning sin medir (asumir que el proyecto migrará).
//
// Variables de entorno:
//   CSS_PATH      Path al globals.css. Default: src/app/globals.css
//   THRESHOLD_AA  Mínimo AA body. Default: 4.5
//   THRESHOLD_UI  Mínimo AA UI/large. Default: 3.0
//   SHOW_PASS     "true" para mostrar también los que pasan. Default: false
//                 (sólo se imprimen los fail por default; pass va al resumen).
//
// Uso:
//   node wcag-check.mjs
//   CSS_PATH=src/styles/globals.css node wcag-check.mjs
//   SHOW_PASS=true node wcag-check.mjs

import { readFile } from "node:fs/promises";

const CSS_PATH = process.env.CSS_PATH || "src/app/globals.css";
const THRESHOLD_AA = Number(process.env.THRESHOLD_AA || 4.5);
const THRESHOLD_UI = Number(process.env.THRESHOLD_UI || 3.0);
const SHOW_PASS = process.env.SHOW_PASS === "true";

// Pares canónicos a auditar. Cada par tiene un threshold:
//   "body" → 4.5:1 (texto de párrafo, mínimo AA estricto)
//   "ui"   → 3.0:1 (text-large, UI components, AA UI)
// Si el proyecto declara tokens custom (ej: --itera, --itera-foreground), se
// detectan automáticamente con el patrón --X / --X-foreground.
const CANONICAL_PAIRS = [
  // Background layer
  { bg: "background", fg: "foreground", kind: "body" },
  { bg: "background", fg: "muted-foreground", kind: "body" },

  // Card / popover / dialog layers
  { bg: "card", fg: "card-foreground", kind: "body" },
  { bg: "card-base", fg: "foreground", kind: "body" },
  { bg: "popover", fg: "popover-foreground", kind: "body" },
  { bg: "dialog", fg: "foreground", kind: "body" },

  // Secondary / muted / accent
  { bg: "secondary", fg: "secondary-foreground", kind: "body" },
  { bg: "muted", fg: "muted-foreground", kind: "body" },
  { bg: "accent", fg: "accent-foreground", kind: "body" },

  // Sidebar layers
  { bg: "sidebar", fg: "sidebar-foreground", kind: "body" },
  { bg: "sidebar-accent", fg: "sidebar-accent-foreground", kind: "body" },

  // Brand primary (CTA)
  { bg: "primary", fg: "primary-foreground", kind: "ui" },

  // Semantic states
  { bg: "destructive", fg: "destructive-foreground", kind: "body" },
  { bg: "success", fg: "success-foreground", kind: "body" },
  { bg: "warning", fg: "warning-foreground", kind: "body" },
  { bg: "info", fg: "info-foreground", kind: "body" },
];

// --- Parser CSS ---

function stripComments(css) {
  // Remueve comentarios CSS `/* ... */` (incluye multi-línea). Crítico porque
  // los proyectos suelen declarar tokens junto a comentarios documentales que
  // sin remover confunden el parser de tokens (queda un comentario seguido
  // de `--token: value` en la misma "línea" después del split por `;`).
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function extractAllBlocks(css, selector) {
  // Match TODAS las ocurrencias de `selector { ... }`. CSS variables son flat,
  // pero un proyecto puede declarar múltiples `:root` o `.dark` (típico: tokens
  // base en un bloque y semantic colors en otro al final del archivo). Merge.
  const cleaned = stripComments(css);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, "gm");
  const blocks = [];
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

function parseTokens(blockContent) {
  // Extrae `--name: value;` (incluye valores multi-línea como sombras compuestas).
  // El block viene ya sin comentarios (extractAllBlocks los removió).
  const tokens = {};
  const lines = blockContent.split(/;\s*(?=--|\}|$)/);
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^--([a-zA-Z0-9_-]+)\s*:\s*([\s\S]+)$/);
    if (m) {
      tokens[m[1]] = m[2].trim();
    }
  }
  return tokens;
}

function mergeTokensFromBlocks(blocks) {
  const tokens = {};
  for (const block of blocks) {
    Object.assign(tokens, parseTokens(block));
  }
  return tokens;
}

function resolveVarChain(tokens, name, visited = new Set()) {
  if (visited.has(name)) return null; // cycle
  visited.add(name);
  const val = tokens[name];
  if (!val) return null;
  const varMatch = val.match(/^var\(--([a-zA-Z0-9_-]+)\)$/);
  if (varMatch) return resolveVarChain(tokens, varMatch[1], visited);
  return val;
}

// --- Color parsing ---

function parseOklch(val) {
  // oklch(L C H) | oklch(L C H / A) | oklch(L C H / N%)
  const m = val.match(
    /oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/,
  );
  if (!m) return null;
  const parsePct = (s, max) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s));
  return {
    L: parsePct(m[1]),
    C: parsePct(m[2]),
    H: parseFloat(m[3]),
    A: m[4] ? (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1,
  };
}

function parseLab(val) {
  // lab(L a b) — usado en algunos casos legacy (ej: itera-lex-tools --ring)
  // Aquí L viene en 0-100 escala. Convertir a 0-1 para mantener consistencia.
  const m = val.match(/lab\(\s*([0-9.]+%?)\s+(-?[0-9.]+)\s+(-?[0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/);
  if (!m) return null;
  const Lraw = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]) / 100;
  return {
    type: "lab",
    L: Lraw,
    a: parseFloat(m[2]),
    b: parseFloat(m[3]),
    A: m[4] ? (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1,
  };
}

function oklchToLinearRGB({ L, C, H }) {
  // OKLCH → OkLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  // OkLab → linear sRGB (constantes oficiales de Björn Ottosson)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function relativeLuminance([R, G, B]) {
  // R, G, B en linear sRGB, 0-1
  const clip = (c) => Math.max(0, Math.min(1, c));
  return 0.2126 * clip(R) + 0.7152 * clip(G) + 0.0722 * clip(B);
}

function colorToLinearRGB(val) {
  const oklch = parseOklch(val);
  if (oklch) {
    if (oklch.A < 1) return { rgb: null, warn: `alpha < 1 (${oklch.A})` };
    return { rgb: oklchToLinearRGB(oklch), warn: null };
  }
  const lab = parseLab(val);
  if (lab) {
    // Aproximación: Lab L → luminance directo (no es 100% preciso pero suficiente
    // para chequeo de contraste de tokens. Lab.L está en 0-1 tras parsing).
    if (lab.A < 1) return { rgb: null, warn: `alpha < 1 (${lab.A})` };
    // Para Lab usamos solo L como aproximación (chroma low → cerca de gris).
    const linearL = lab.L <= 0.08 ? lab.L / 9.033 : Math.pow((lab.L + 0.16) / 1.16, 3);
    return { rgb: [linearL, linearL, linearL], warn: "Lab approximated as achromatic luminance" };
  }
  // hex / rgb / hsl → skip con warn
  if (/^(#|rgb|hsl)/i.test(val.trim())) {
    return { rgb: null, warn: `legacy format (${val.split(/\s+/)[0]}) — not measured` };
  }
  return { rgb: null, warn: "unrecognized color format" };
}

function contrastRatio(rgb1, rgb2) {
  const L1 = relativeLuminance(rgb1);
  const L2 = relativeLuminance(rgb2);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// --- Pair detection ---

function findCustomPairs(tokens) {
  // Detecta cualquier --X que tenga --X-foreground en el mismo bloque.
  const found = [];
  const known = new Set(CANONICAL_PAIRS.map((p) => `${p.bg}::${p.fg}`));
  for (const name of Object.keys(tokens)) {
    if (name.endsWith("-foreground")) continue;
    const fgName = `${name}-foreground`;
    if (tokens[fgName] && !known.has(`${name}::${fgName}`)) {
      found.push({ bg: name, fg: fgName, kind: "body", custom: true });
    }
  }
  return found;
}

// --- Audit ---

function classify(ratio, kind) {
  if (kind === "ui") {
    if (ratio >= 4.5) return { level: "AA+", pass: true };
    if (ratio >= THRESHOLD_UI) return { level: "AA UI", pass: true };
    return { level: "FAIL", pass: false };
  }
  if (ratio >= 7) return { level: "AAA", pass: true };
  if (ratio >= THRESHOLD_AA) return { level: "AA", pass: true };
  if (ratio >= 3) return { level: "AA large only", pass: false };
  return { level: "FAIL", pass: false };
}

function auditPair(tokens, pair, modeLabel) {
  const bgRaw = resolveVarChain(tokens, pair.bg);
  const fgRaw = resolveVarChain(tokens, pair.fg);

  if (!bgRaw)
    return { skipped: true, reason: `--${pair.bg} not declared in ${modeLabel}` };
  if (!fgRaw)
    return { skipped: true, reason: `--${pair.fg} not declared in ${modeLabel}` };

  const bg = colorToLinearRGB(bgRaw);
  const fg = colorToLinearRGB(fgRaw);

  if (bg.warn && !bg.rgb)
    return { skipped: true, reason: `--${pair.bg}: ${bg.warn}` };
  if (fg.warn && !fg.rgb)
    return { skipped: true, reason: `--${pair.fg}: ${fg.warn}` };

  const ratio = contrastRatio(bg.rgb, fg.rgb);
  const verdict = classify(ratio, pair.kind);
  return { ratio, verdict, custom: pair.custom };
}

// --- Main ---

async function main() {
  let css;
  try {
    css = await readFile(CSS_PATH, "utf8");
  } catch (err) {
    console.error(`Error: cannot read ${CSS_PATH}\n  ${err.message}`);
    process.exit(1);
  }

  const lightBlocks = extractAllBlocks(css, ":root");
  const darkBlocks = extractAllBlocks(css, ".dark");

  if (lightBlocks.length === 0) {
    console.error(`Error: no :root block found in ${CSS_PATH}`);
    process.exit(1);
  }

  const lightTokens = mergeTokensFromBlocks(lightBlocks);
  // Dark hereda de root para tokens no overridden.
  const darkTokens =
    darkBlocks.length > 0
      ? { ...lightTokens, ...mergeTokensFromBlocks(darkBlocks) }
      : lightTokens;

  if (process.env.VERBOSE === "true") {
    console.log(
      `Parsed ${lightBlocks.length} :root block(s) and ${darkBlocks.length} .dark block(s).`,
    );
    console.log(`Light tokens: ${Object.keys(lightTokens).length}`);
    console.log(`Dark tokens:  ${Object.keys(darkTokens).length}\n`);
  }

  const customPairs = findCustomPairs(lightTokens);
  const allPairs = [...CANONICAL_PAIRS, ...customPairs];

  console.log("=== WCAG Contrast Audit ===");
  console.log(`CSS: ${CSS_PATH}`);
  console.log(
    `Thresholds: body ${THRESHOLD_AA}:1, UI ${THRESHOLD_UI}:1, AAA 7:1\n`,
  );

  const fails = [];
  const passes = [];
  const skips = [];

  for (const pair of allPairs) {
    const tag = pair.custom ? " [custom]" : "";
    const header = `--${pair.bg} / --${pair.fg}${tag} (${pair.kind})`;

    for (const [modeLabel, tokens] of [
      ["LIGHT", lightTokens],
      ["DARK", darkTokens],
    ]) {
      const res = auditPair(tokens, pair, modeLabel);
      const entry = { modeLabel, header, pair, res };
      if (res.skipped) {
        skips.push(entry);
        continue;
      }
      if (res.verdict.pass) {
        passes.push(entry);
        if (SHOW_PASS) {
          console.log(
            `  ✓ ${modeLabel.padEnd(5)} ${header.padEnd(56)} ${res.ratio.toFixed(2)}:1 ${res.verdict.level}`,
          );
        }
      } else {
        fails.push(entry);
        console.log(
          `  ✗ ${modeLabel.padEnd(5)} ${header.padEnd(56)} ${res.ratio.toFixed(2)}:1 ${res.verdict.level}`,
        );
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(
    `Pairs checked: ${allPairs.length} (${customPairs.length} custom).`,
  );
  console.log(`Pass: ${passes.length} | Fail: ${fails.length} | Skipped: ${skips.length}`);

  if (fails.length > 0) {
    console.log("\nFAILS:");
    for (const f of fails) {
      console.log(
        `  ${f.modeLabel.padEnd(5)} ${f.header} → ${f.res.ratio.toFixed(2)}:1 (need ${f.pair.kind === "ui" ? THRESHOLD_UI : THRESHOLD_AA}:1)`,
      );
    }
  }

  if (skips.length > 0) {
    console.log("\nSKIPPED (not measured):");
    for (const s of skips) {
      console.log(`  ${s.modeLabel.padEnd(5)} ${s.header} → ${s.res.reason}`);
    }
  }

  if (fails.length > 0) process.exitCode = 1;
}

await main();
