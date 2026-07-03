#!/usr/bin/env node
/**
 * testability-inventory.mjs — inventario de testabilidad E2E (sin deps).
 *
 * Dos escaneos:
 *  1) UI (GLOBS): mide los HUECOS de etiquetado que hacen un elemento no apuntable
 *     por nombre accesible — icon-only sin aria-label, inputs sin <label>,
 *     <div/span onClick> no semánticos — y los positivos (aria-label, htmlFor,
 *     aria-hidden, role=dialog).
 *  2) E2E (E2E_DIR): mide la SALUD de los locators — ratio getByRole/getByLabel vs
 *     getByTestId, y los anti-patrones (.locator con CSS/clase, waitForTimeout, .nth).
 *
 * Es material crudo, NO un veredicto: la unicidad de un locator y la fidelidad de
 * un journey se confirman corriendo Playwright. Las heurísticas por línea pueden
 * tener falsos positivos/negativos (markup multilínea) — usar como mapa, no como ley.
 *
 * Uso:  node ~/.claude/skills/e2e-testability/scripts/testability-inventory.mjs
 * Env:  ROOT (default "."), GLOBS (CSV, default "src,app,resources,components"),
 *       E2E_DIR (CSV, default "e2e,tests/e2e,playwright"),
 *       FORMAT ("table" | "json", default "table")
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.env.ROOT || '.';
const GLOBS = (process.env.GLOBS || 'src,app,resources,components').split(',').map((s) => s.trim());
const E2E_DIRS = (process.env.E2E_DIR || 'e2e,tests/e2e,playwright').split(',').map((s) => s.trim());
const FORMAT = process.env.FORMAT || 'table';
const EXTS = new Set(['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte', '.php']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'public', 'coverage']);

function walk(dir, out) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
}

const collect = (globs) => {
  const files = [];
  for (const g of globs) {
    const base = join(ROOT, g);
    if (existsSync(base)) walk(base, files);
  }
  return files;
};

let uiFiles = collect(GLOBS);
const e2eFiles = collect(E2E_DIRS);
// si no se encontró nada por globs, escanear todo (excluyendo el e2e ya recogido)
if (uiFiles.length === 0) walk(ROOT, uiFiles);
const e2eSet = new Set(e2eFiles);
uiFiles = uiFiles.filter((f) => !e2eSet.has(f));

const rel = (f) => f.replace(ROOT.replace(/\/$/, '') + '/', '');

// ---------- UI: positivos (ocurrencias) ----------
const UI_POS = {
  'aria-label': /aria-label/,
  'aria-hidden (iconos/contadores)': /aria-hidden/,
  'label htmlFor / for=': /htmlFor=|<label[^>]*\bfor=/,
  'aria-current (nav activo)': /aria-current/,
  'aria-expanded (toggles)': /aria-expanded/,
  'role="dialog" / DialogContent': /role="dialog"|DialogContent|<Dialog\b|<Sheet\b/,
  'data-testid (escape hatch)': /data-testid|data-test=|data-cy=/,
};
// UI: huecos (file:line) — heurísticas
const ICON_BTN_NO_LABEL = /<(?:button|Button)\b(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*(?:size="icon"|size-8|size-9|h-8 w-8|h-9 w-9|w-8 h-8|w-9 h-9)/;
// candidato real = input sin aria-label NI aria-labelledby NI id (con id suele estar
// asociado a un <label htmlFor> hermano → no apuntable solo si no tiene ninguno)
const INPUT_NO_LABEL = /<(?:input|Input)\b(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*\bid=)(?![^>]*type="(?:hidden|submit|button|checkbox|radio)")/;
const DIV_ONCLICK = /<(?:div|span)\b[^>]*\bonClick/;

// ---------- E2E: locators y anti-patrones ----------
const E2E_LOC = {
  getByRole: /getByRole/g,
  getByLabel: /getByLabel/g,
  getByText: /getByText/g,
  getByPlaceholder: /getByPlaceholder/g,
  getByTestId: /getByTestId/g,
};
const CSS_LOCATOR = /\.locator\(\s*['"`][.#\[]/; // .locator('.foo'/'#id'/'[attr]')
const WAIT_TIMEOUT = /waitForTimeout/;
const NTH = /\.nth\(/;

function scan(files, perLine) {
  for (const file of files) {
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    const lines = text.split('\n');
    lines.forEach((line, i) => perLine(file, line, i + 1, text));
  }
}

// UI scan
const uiCounts = Object.fromEntries(Object.keys(UI_POS).map((k) => [k, 0]));
const uiFileSets = Object.fromEntries(Object.keys(UI_POS).map((k) => [k, new Set()]));
const iconNoLabel = [], inputNoLabel = [], divOnClick = [];
scan(uiFiles, (file, line, n) => {
  for (const [name, re] of Object.entries(UI_POS)) {
    if (re.test(line)) { uiCounts[name]++; uiFileSets[name].add(file); }
  }
  if (ICON_BTN_NO_LABEL.test(line)) iconNoLabel.push({ file, line: n });
  if (INPUT_NO_LABEL.test(line)) inputNoLabel.push({ file, line: n });
  if (DIV_ONCLICK.test(line)) divOnClick.push({ file, line: n });
});

// E2E scan
const locCounts = Object.fromEntries(Object.keys(E2E_LOC).map((k) => [k, 0]));
const cssLocator = [], waitTimeout = [], nthUse = [];
scan(e2eFiles, (file, line, n) => {
  for (const [name, re] of Object.entries(E2E_LOC)) {
    const m = line.match(re);
    if (m) locCounts[name] += m.length;
  }
  if (CSS_LOCATOR.test(line)) cssLocator.push({ file, line: n });
  if (WAIT_TIMEOUT.test(line)) waitTimeout.push({ file, line: n });
  if (NTH.test(line)) nthUse.push({ file, line: n });
});

const semantic = locCounts.getByRole + locCounts.getByLabel;
const ratio = locCounts.getByTestId === 0
  ? (semantic > 0 ? '∞ (sano)' : 'n/a')
  : (semantic / locCounts.getByTestId).toFixed(1) + '×';

if (FORMAT === 'json') {
  console.log(JSON.stringify({
    uiFiles: uiFiles.length, e2eFiles: e2eFiles.length,
    uiPositives: uiCounts,
    iconButtonsNoLabel: iconNoLabel.map((x) => ({ ...x, file: rel(x.file) })),
    inputsNoLabel: inputNoLabel.map((x) => ({ ...x, file: rel(x.file) })),
    divOnClick: divOnClick.map((x) => ({ ...x, file: rel(x.file) })),
    e2eLocators: locCounts, semanticVsTestId: ratio,
    cssLocators: cssLocator.map((x) => ({ ...x, file: rel(x.file) })),
    waitForTimeout: waitTimeout.map((x) => ({ ...x, file: rel(x.file) })),
    nth: nthUse.map((x) => ({ ...x, file: rel(x.file) })),
  }, null, 2));
  process.exit(0);
}

const H = (s) => `\n\x1b[1m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YEL = (s) => `\x1b[33m${s}\x1b[0m`;
const list = (arr, label, max = 30) => {
  if (arr.length === 0) { console.log('  ninguno ✓'); return; }
  for (const x of arr.slice(0, max)) console.log(`  ${rel(x.file)}:${x.line}  ${YEL(label)}`);
  if (arr.length > max) console.log(`  … +${arr.length - max} más`);
};

console.log(`\nTestability inventory — UI: ${uiFiles.length} archivos · E2E: ${e2eFiles.length} archivos · bajo ${ROOT}\n${'='.repeat(64)}`);

console.log(H('E2E — salud de locators'));
if (e2eFiles.length === 0) {
  console.log('  ' + RED('no se encontró carpeta E2E (e2e/ tests/e2e/). ¿Suite por crear?'));
} else {
  for (const k of Object.keys(E2E_LOC)) console.log(`  ${String(locCounts[k]).padStart(4)}×  ${k}`);
  console.log(`  ${'-'.repeat(40)}`);
  console.log(`  semántico (Role+Label) vs testId:  ${semantic} vs ${locCounts.getByTestId}  →  ${ratio}`);
  console.log('  (sano: Role+Label >> testId. Si testId domina, falta etiquetar la UI — Track 1)');
}

console.log(H('E2E — anti-patrones de locator (frágiles) — findings'));
console.log('  .locator() con CSS/clase/id:');
list(cssLocator, 'CSS locator → preferir getByRole/getByLabel');
console.log('  waitForTimeout (sleep fijo = flake):');
list(waitTimeout, 'waitForTimeout → usar auto-waiting / expect.poll');
console.log('  .nth( ) (índice mágico):');
list(nthUse, '.nth() → scopear por nombre/entidad', 15);

console.log(H('UI — positivos de etiquetado (ocurrencias · archivos)'));
for (const name of Object.keys(UI_POS)) {
  const c = uiCounts[name], f = uiFileSets[name].size;
  console.log(`  ${String(c).padStart(4)}×  ${name.padEnd(34)} ${f} archivos`);
}

console.log(H('UI — huecos de etiquetado (candidatos no apuntables) — findings'));
console.log('  Botones icon-only SIN aria-label (heurística):');
list(iconNoLabel, 'icon-only sin aria-label → agregar (scoped por entidad)');
console.log('  Inputs SIN label/aria-label (heurística):');
list(inputNoLabel, 'input sin label → <label htmlFor>+id o aria-label');
console.log('  <div/span onClick> (no apuntable por rol, sin teclado):');
list(divOnClick, '<div/span onClick> → <button>/<a>/<Link> real');

console.log('\n' + '='.repeat(64));
console.log('Siguiente: elegir un journey, etiquetar SOLO lo que toca (Track 1), escribir el test (Track 2),');
console.log('correr Playwright y, si un locator falla, arreglar el nombre accesible antes que meter data-testid.\n');
