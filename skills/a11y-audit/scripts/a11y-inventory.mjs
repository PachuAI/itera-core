#!/usr/bin/env node
/**
 * a11y-inventory.mjs — inventario de accesibilidad estructural (sin deps).
 *
 * Escanea el código y cuenta/ubica cada patrón de a11y: foco-visible aplicado
 * vs outline anulado, interactivos no-semánticos (<div onClick>), aria
 * estructural (label/current/expanded), landmarks (main/nav/header/aside),
 * skip-link, tabindex positivo, y los targets chicos (size-6/7). Marca los
 * findings críticos: <div/span onClick> (teclado roto), outline-none, tabindex
 * positivo, y la ausencia de <main> / skip-link.
 *
 * NO infiere veredictos: el foco visible, el tab order y el focus trap de los
 * overlays se confirman CON TECLADO. Esto es solo el material crudo.
 *
 * Uso:   node ~/.claude/skills/a11y-audit/scripts/a11y-inventory.mjs
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

// patrón -> regex (contado por línea)
const GROUPS = {
  'Foco — :focus-visible (aplicado)': /focus-visible:|:focus-visible/,
  'Foco — outline-none/0 (anulado)': /\boutline-none\b|\boutline-0\b|outline:\s*none/,
  'aria-label': /aria-label/,
  'aria-current (nav activo)': /aria-current/,
  'aria-expanded (toggles)': /aria-expanded/,
  'Landmark <main>': /<main[\s/>]|role="main"/,
  'Landmark <nav>': /<nav[\s/>]|role="navigation"/,
  'Landmark <header>': /<header[\s/>]/,
  'Skip-link / sr-only': /skip-link|skip-to|saltar al contenido|sr-only/,
  'Targets chicos (size-6/7)': /\b(?:h-6 w-6|w-6 h-6|size-6|h-7 w-7|w-7 h-7|size-7)\b/,
  'Token de foco (--focus/--ring)': /--[\w-]*(?:focus|ring)[\w-]*/,
};
// hallazgos críticos (file:line)
const DIV_ONCLICK = /<(?:div|span)\b[^>]*\bonClick/;
const POS_TABINDEX = /tabindex="[1-9]|tabIndex=\{?\s*["']?[1-9]/;

const files = [];
for (const g of GLOBS) {
  const base = join(ROOT, g);
  if (existsSync(base)) walk(base, files);
}
if (files.length === 0) walk(ROOT, files);

const counts = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, 0]));
const fileSets = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, new Set()]));
const divOnClick = []; // {file,line}
const posTabindex = []; // {file,line}
let mainCount = 0;
let skipLink = false;
let focusTokenDeclared = false;
let overlayLib = null;

for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (!overlayLib) {
    if (/@radix-ui\/react-dialog|DialogContent|data-slot="dialog/.test(text)) overlayLib = 'radix/shadcn Dialog';
    else if (/@headlessui|Headless ?UI/.test(text)) overlayLib = 'Headless UI';
  }
  if (/--[\w-]*(?:focus|ring)[\w-]*\s*:/.test(text)) focusTokenDeclared = true;

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [name, re] of Object.entries(GROUPS)) {
      if (re.test(line)) {
        counts[name]++;
        fileSets[name].add(file);
      }
    }
    if (/<main[\s/>]/.test(line)) mainCount++;
    if (/skip-link|skip-to|saltar al contenido/.test(line)) skipLink = true;
    if (DIV_ONCLICK.test(line)) divOnClick.push({ file, line: i + 1 });
    if (POS_TABINDEX.test(line)) posTabindex.push({ file, line: i + 1 });
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
        divOnClick: divOnClick.map((x) => ({ ...x, file: rel(x.file) })),
        positiveTabindex: posTabindex.map((x) => ({ ...x, file: rel(x.file) })),
        mainCount,
        skipLink,
        focusTokenDeclared,
        overlayLib,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const H = (s) => `\n\x1b[1m${s}\x1b[0m`;
console.log(`\nA11y inventory — escaneados ${files.length} archivos bajo ${ROOT}\n${'='.repeat(60)}`);

console.log(H('Patrones de a11y (ocurrencias · archivos)'));
for (const name of Object.keys(GROUPS)) {
  const c = counts[name];
  const f = fileSets[name].size;
  const flag = c === 0 ? ' \x1b[31m← 0 (revisar)\x1b[0m' : '';
  console.log(`  ${String(c).padStart(3)}×  ${name.padEnd(34)} ${f} archivos${flag}`);
}

console.log(H('Interactivos NO semánticos — <div/span onClick> (teclado roto) — findings'));
if (divOnClick.length === 0) {
  console.log('  ninguno ✓');
} else {
  for (const x of divOnClick.slice(0, 40)) console.log(`  ${rel(x.file)}:${x.line}  \x1b[33m<div/span onClick>\x1b[0m → ¿debería ser <button>?`);
  if (divOnClick.length > 40) console.log(`  … +${divOnClick.length - 40} más`);
}

console.log(H('tabindex POSITIVO (anti-pattern) — findings'));
if (posTabindex.length === 0) {
  console.log('  ninguno ✓');
} else {
  for (const x of posTabindex.slice(0, 20)) console.log(`  ${rel(x.file)}:${x.line}  \x1b[33mtabindex > 0\x1b[0m`);
}

console.log(H('Landmarks + skip-link'));
console.log(`  <main>: ${mainCount} ${mainCount === 0 ? '\x1b[31m← 0 main (falta landmark)\x1b[0m' : ''}`);
console.log(`  skip-to-content: ${skipLink ? 'presente ✓ (verificar que sea el primer tabulable)' : '\x1b[31mAUSENTE → hallazgo (§6)\x1b[0m'}`);

console.log(H('Foco'));
console.log(`  token de foco declarado: ${focusTokenDeclared ? 'sí (verificar que esté APLICADO en :focus-visible)' : '\x1b[31mno encontrado\x1b[0m'}`);
console.log(
  `  :focus-visible aplicado: ${counts['Foco — :focus-visible (aplicado)']}×  ·  outline-none: ${counts['Foco — outline-none/0 (anulado)']}× ` +
    '(cada outline-none sin :focus-visible cercano = finding §1.3)'
);

console.log(H('Librería de overlays (fuente del focus trap)'));
console.log(`  ${overlayLib || 'ninguna detectada (¿overlays a mano? → verificar trap/Escape §3)'}`);

console.log('\n' + '='.repeat(60));
console.log('Siguiente: mapear el foco/teclado de cada superficie (§1.1) y recorrer el checklist (9 ejes). Validar CON TECLADO.\n');
