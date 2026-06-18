#!/usr/bin/env node
/**
 * states-inventory.mjs — inventario del manejo de estados de UI (sin deps).
 *
 * Escanea el código y cuenta/ubica cada patrón de estado: empty, loading
 * (skeleton/spinner), error (aria-invalid, ErrorBoundary, colores hardcodeados),
 * success (toast/badge), disabled, y el aria de estado. Marca los colores
 * semánticos hardcodeados (border-red-500, text-green-600…) que deberían ser tokens.
 *
 * Uso:   node ~/.claude/skills/states-audit/scripts/states-inventory.mjs
 * Env:   ROOT (default "."), GLOBS (CSV, default "resources,src,app,components,packages"),
 *        FORMAT ("table" | "json", default "table")
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.env.ROOT || '.';
const GLOBS = (process.env.GLOBS || 'resources,src,app,components,packages').split(',').map((s) => s.trim());
const FORMAT = process.env.FORMAT || 'table';
const EXTS = new Set(['.css', '.scss', '.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'public', 'coverage']);

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

// patrón -> { re, hits:[{file,line}] }
const GROUPS = {
  'Empty (EmptyState)': /\bEmptyState\b|empty-state/,
  'Loading — Skeleton': /\bSkeleton\b|animate-pulse|data-slot="skeleton"/,
  'Loading — spinner': /animate-spin|\bLoader2\b|<svg[^>]*spin/,
  'Error — aria-invalid': /aria-invalid/,
  'Error — ErrorBoundary': /ErrorBoundary|error-boundary/,
  'Error — toast.error': /toast\.error/,
  'Success — toast.success': /toast\.success/,
  'Success — badge/check': /variant="success"|StatusBadge|CheckCircle|<Check\b/,
  'Disabled': /\bdisabled\b|aria-disabled/,
  'Aria de estado': /aria-busy|role="status"|role="alert"|aria-live/,
  'Tokens de estado': /--[\w-]*(?:skeleton|disabled)[\w-]*/,
};
// hallazgo crítico: colores semánticos hardcodeados
const HARDCODED = /\b(?:border|text|bg)-(?:red|green|amber|emerald|rose)-\d{2,3}\b/;

const files = [];
for (const g of GLOBS) {
  const base = join(ROOT, g);
  if (existsSync(base)) walk(base, files);
}
if (files.length === 0) walk(ROOT, files);

const counts = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, 0]));
const fileSets = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, new Set()]));
const hardcoded = []; // {file,line,text}
let skeletonReducedMotion = false;
let toastLib = null;

for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (!toastLib) {
    if (/sonner/.test(text)) toastLib = 'sonner';
    else if (/react-hot-toast/.test(text)) toastLib = 'react-hot-toast';
    else if (/react-toastify/.test(text)) toastLib = 'react-toastify';
  }
  if (/data-slot="skeleton"|\.skeleton\b|animate-pulse/.test(text) && /prefers-reduced-motion|motion-reduce/.test(text)) {
    skeletonReducedMotion = true;
  }

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [name, re] of Object.entries(GROUPS)) {
      if (re.test(line)) {
        counts[name]++;
        fileSets[name].add(file);
      }
    }
    if (HARDCODED.test(line)) {
      const m = line.match(HARDCODED);
      hardcoded.push({ file, line: i + 1, text: m[0] });
    }
  });
}

const rel = (f) => f.replace(ROOT.replace(/\/$/, '') + '/', '');

if (FORMAT === 'json') {
  console.log(
    JSON.stringify(
      {
        files: files.length,
        counts,
        filesPerGroup: Object.fromEntries(Object.entries(fileSets).map(([k, v]) => [k, v.size])),
        hardcodedSemanticColors: hardcoded.map((x) => ({ ...x, file: rel(x.file) })),
        skeletonRespectsReducedMotion: skeletonReducedMotion,
        toastLib,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const H = (s) => `\n\x1b[1m${s}\x1b[0m`;
console.log(`\nStates inventory — escaneados ${files.length} archivos bajo ${ROOT}\n${'='.repeat(60)}`);

console.log(H('Patrones de estado (ocurrencias · archivos)'));
for (const name of Object.keys(GROUPS)) {
  const c = counts[name];
  const f = fileSets[name].size;
  const flag = c === 0 ? ' \x1b[31m← 0 (revisar)\x1b[0m' : '';
  console.log(`  ${String(c).padStart(3)}×  ${name.padEnd(26)} ${f} archivos${flag}`);
}

console.log(H('Colores semánticos HARDCODEADOS (deberían ser tokens) — findings'));
if (hardcoded.length === 0) {
  console.log('  ninguno ✓');
} else {
  for (const x of hardcoded.slice(0, 40)) console.log(`  ${rel(x.file)}:${x.line}  \x1b[33m${x.text}\x1b[0m`);
  if (hardcoded.length > 40) console.log(`  … +${hardcoded.length - 40} más`);
}

console.log(H('Loading — reduced-motion'));
console.log(
  skeletonReducedMotion
    ? '  el skeleton/pulse respeta prefers-reduced-motion en algún lado ✓ (verificar cobertura)'
    : '  \x1b[31mel skeleton NO respeta prefers-reduced-motion → hallazgo (§9)\x1b[0m'
);

console.log(H('Librería de toasts'));
console.log(`  ${toastLib || 'ninguna detectada'}`);

console.log('\n' + '='.repeat(60));
console.log('Siguiente: mapear la máquina de estado de cada vista (§1.1) y recorrer el checklist (9 ejes).\n');
