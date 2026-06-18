#!/usr/bin/env node
/**
 * motion-inventory.mjs — inventario del motion de un repo (sin deps).
 *
 * El motion es TEMPORAL: no se screenshot-ea. Este script ES la captura baseline
 * del motion-audit: escanea el código y bucketea cada duración / easing /
 * transition-property / keyframe / delay, marca la escala fragmentada, y reporta
 * presencia de framer-motion y de prefers-reduced-motion.
 *
 * Uso:   node ~/.claude/skills/motion-audit/scripts/motion-inventory.mjs
 * Env:
 *   ROOT    raíz del repo a escanear           (default ".")
 *   GLOBS   CSV de dirs candidatos a escanear  (default "resources,src,app,components,packages")
 *   FORMAT  "table" | "json"                    (default "table")
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.env.ROOT || '.';
const GLOBS = (process.env.GLOBS || 'resources,src,app,components,packages').split(',').map((s) => s.trim());
const FORMAT = process.env.FORMAT || 'table';
const EXTS = new Set(['.css', '.scss', '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'public', 'coverage']);

// --- escala canónica (snap de cada duración al escalón más cercano) ---
const LADDER = [
  { name: 'fast', ms: 120 },
  { name: 'base', ms: 180 },
  { name: 'moderate', ms: 220 },
  { name: 'slow', ms: 300 },
];
function snap(ms) {
  if (ms > 300) return 'OVER (>300ms — revisar)';
  let best = LADDER[0];
  for (const step of LADDER) {
    if (Math.abs(step.ms - ms) < Math.abs(best.ms - ms)) best = step;
  }
  return best.name;
}

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
}

// acumuladores
const durTw = new Map(); // "duration-200" -> count
const durMs = new Map(); // 200 (ms numeric) -> count   (solo dentro de transition/animation/cubic-bezier o consts de timing)
const easeKw = new Map(); // "ease-out" -> count
const cubic = new Map(); // "cubic-bezier(...)" -> count
const transAll = []; // {file,line}
const transLayout = []; // {file,line, prop}
const keyframes = new Map(); // name -> [{file,line}]
const reducedMotion = []; // {file,line}
const timingConsts = []; // {file,line, text}
let framerHits = [];
let twAnimateImport = false;

const RE = {
  durTw: /\bduration-(\d{2,4}|\[[^\]]+\])/g,
  // ms dentro de un contexto de animación o en una const de timing
  msCtx: /(?:transition|animation|cubic-bezier|animationDuration|animationDelay)[^;{}\n]*?(\d{2,4})\s*ms/gi,
  timingConst: /\b(?:[A-Z][A-Z0-9_]*)?(?:ANIM|DURATION|DELAY|TRANSITION|_MS)[A-Z0-9_]*\s*=\s*(\d{2,4})\b/g,
  easeKw: /\bease-(in-out|in|out|linear)\b/g,
  cubic: /cubic-bezier\(\s*[-\d.]+\s*,\s*[-\d.]+\s*,\s*[-\d.]+\s*,\s*[-\d.]+\s*\)/g,
  transAll: /transition-all\b|transition:\s*all\b/,
  transLayout: /transition(?:-\[|:)[^;{}\]]*\b(width|height|top|left|right|bottom|margin)\b/,
  keyframe: /@keyframes\s+([\w-]+)/g,
  reduced: /prefers-reduced-motion|motion-reduce:/,
  framer: /framer-motion|motion\/react|react-spring|@react-spring|gsap|animejs/,
  twAnimate: /tw-animate-css/,
};

function add(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

const files = [];
for (const g of GLOBS) {
  const base = join(ROOT, g);
  if (existsSync(base)) walk(base, files);
}
// fallback: si no encontró ningún dir candidato, escanear ROOT entero
if (files.length === 0) walk(ROOT, files);

for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (RE.twAnimate.test(text)) twAnimateImport = true;

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const ln = i + 1;
    let m;

    RE.durTw.lastIndex = 0;
    while ((m = RE.durTw.exec(line))) add(durTw, `duration-${m[1]}`);

    RE.msCtx.lastIndex = 0;
    while ((m = RE.msCtx.exec(line))) add(durMs, Number(m[1]));

    RE.timingConst.lastIndex = 0;
    while ((m = RE.timingConst.exec(line))) {
      add(durMs, Number(m[1]));
      timingConsts.push({ file, line: ln, text: line.trim().slice(0, 100), ms: Number(m[1]) });
    }

    RE.easeKw.lastIndex = 0;
    while ((m = RE.easeKw.exec(line))) add(easeKw, `ease-${m[1]}`);

    RE.cubic.lastIndex = 0;
    while ((m = RE.cubic.exec(line))) add(cubic, m[0].replace(/\s+/g, ''));

    if (RE.transAll.test(line)) transAll.push({ file, line: ln });
    const lm = line.match(RE.transLayout);
    if (lm) transLayout.push({ file, line: ln, prop: lm[1] });

    RE.keyframe.lastIndex = 0;
    while ((m = RE.keyframe.exec(line))) {
      if (!keyframes.has(m[1])) keyframes.set(m[1], []);
      keyframes.get(m[1]).push({ file, line: ln });
    }

    if (RE.reduced.test(line)) reducedMotion.push({ file, line: ln });
    if (RE.framer.test(line)) framerHits.push({ file, line: ln });
  });
}

const rel = (f) => f.replace(ROOT.replace(/\/$/, '') + '/', '');
const sortByCount = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);
const sortMs = (map) => [...map.entries()].sort((a, b) => a[0] - b[0]);

if (FORMAT === 'json') {
  console.log(
    JSON.stringify(
      {
        files: files.length,
        durationsTailwind: Object.fromEntries(durTw),
        durationsMs: Object.fromEntries(durMs),
        easingsKeyword: Object.fromEntries(easeKw),
        cubicBezier: Object.fromEntries(cubic),
        transitionAll: transAll.map((x) => ({ ...x, file: rel(x.file) })),
        transitionLayoutProps: transLayout.map((x) => ({ ...x, file: rel(x.file) })),
        keyframes: Object.fromEntries([...keyframes].map(([k, v]) => [k, v.map((x) => ({ ...x, file: rel(x.file) }))])),
        reducedMotion: reducedMotion.length,
        timingConsts: timingConsts.map((x) => ({ ...x, file: rel(x.file) })),
        framer: framerHits.map((x) => ({ ...x, file: rel(x.file) })),
        twAnimateCss: twAnimateImport,
      },
      null,
      2
    )
  );
  process.exit(0);
}

// --- TABLE format ---
const H = (s) => `\n\x1b[1m${s}\x1b[0m`;
console.log(`\nMotion inventory — escaneados ${files.length} archivos bajo ${ROOT}\n${'='.repeat(60)}`);

console.log(H('Duraciones — Tailwind utilities (duration-*)'));
if (durTw.size === 0) console.log('  (ninguna)');
for (const [k, c] of sortByCount(durTw)) {
  const n = Number((k.match(/\d+/) || [])[0]);
  console.log(`  ${String(c).padStart(3)}×  ${k.padEnd(18)} ${Number.isFinite(n) ? '→ ' + snap(n) : ''}`);
}

console.log(H('Duraciones — ms en contexto de animación / consts de timing'));
if (durMs.size === 0) console.log('  (ninguna)');
for (const [ms, c] of sortMs(durMs)) {
  console.log(`  ${String(c).padStart(3)}×  ${(ms + 'ms').padEnd(18)} → ${snap(ms)}`);
}
const distinct = new Set([...durMs.keys(), ...[...durTw.keys()].map((k) => Number((k.match(/\d+/) || [])[0])).filter(Boolean)]);
console.log(`  \x1b[2m${distinct.size} valores distintos${distinct.size >= 5 ? ' → escala FRAGMENTADA (snap a 4 escalones)' : ''}\x1b[0m`);

console.log(H('Easings — keyword'));
if (easeKw.size === 0) console.log('  (ninguno)');
for (const [k, c] of sortByCount(easeKw)) console.log(`  ${String(c).padStart(3)}×  ${k}`);

console.log(H('Easings — cubic-bezier distintos'));
if (cubic.size === 0) console.log('  (ninguno)');
for (const [k, c] of sortByCount(cubic)) {
  const ys = [...k.matchAll(/[-\d.]+/g)].map(Number);
  const bounce = ys.length === 4 && (ys[1] > 1 || ys[3] > 1 || ys[1] < 0 || ys[3] < 0);
  console.log(`  ${String(c).padStart(3)}×  ${k}${bounce ? '  \x1b[31m⚠ overshoot/bounce\x1b[0m' : ''}`);
}

console.log(H('transition: all (debería ser 0)'));
console.log(transAll.length === 0 ? '  ninguno ✓' : transAll.map((x) => `  ${rel(x.file)}:${x.line}`).join('\n'));

console.log(H('transition de props de layout (width/height/top/...) — revisar'));
console.log(
  transLayout.length === 0 ? '  ninguno ✓' : transLayout.map((x) => `  ${rel(x.file)}:${x.line}  (${x.prop})`).join('\n')
);

console.log(H('@keyframes propios'));
if (keyframes.size === 0) console.log('  (ninguno)');
for (const [name, locs] of keyframes) console.log(`  ${name.padEnd(22)} ${rel(locs[0].file)}:${locs[0].line}`);

console.log(H('Constantes de timing en JS (candidatas a token, salvo route-transition)'));
console.log(
  timingConsts.length === 0
    ? '  (ninguna)'
    : timingConsts.map((x) => `  ${rel(x.file)}:${x.line}  ${x.text}`).join('\n')
);

console.log(H('reduced-motion'));
console.log(
  reducedMotion.length === 0
    ? '  \x1b[31m0 ocurrencias → HALLAZGO CRÍTICO (sin prefers-reduced-motion)\x1b[0m'
    : `  ${reducedMotion.length} ocurrencias en ${new Set(reducedMotion.map((x) => x.file)).size} archivos`
);

console.log(H('Lib de animación JS'));
console.log(framerHits.length === 0 ? '  ninguna (CSS puro) ✓' : framerHits.map((x) => `  ${rel(x.file)}:${x.line}`).join('\n'));
console.log(`  tw-animate-css importado: ${twAnimateImport ? 'sí ✓' : 'no'}`);

console.log('\n' + '='.repeat(60));
console.log('Siguiente: mapear cada duración a su escalón (§4.5 del reporte) y recorrer el checklist (11 ejes).\n');
