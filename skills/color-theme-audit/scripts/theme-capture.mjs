// color-theme-audit / theme-capture.mjs
// Captura cada ruta dos veces (light + dark) en una sola resolución de referencia.
// Para auditoría de color basta 1 resolución; el responsive-audit cubre el rango.
//
// Correr desde un directorio con `playwright` instalado (ej: <repo>/web/).
//
// Variables de entorno:
//   APP_URL      URL base. Default: http://localhost:3020
//   ROUTES       CSV de paths. Default: "/"
//   OUT_DIR      Salida. Default: /tmp/color-theme-audit/shots
//   WIDTH        Ancho viewport. Default: 1920
//   HEIGHT       Alto viewport. Default: 1080
//   WAIT_MS      Pausa post-load (ms). Default: 400 — un poco más que responsive
//                porque algunos repos hacen theme transition con delay.
//   THEME_MODE   "emulate" (default) o "class".
//                emulate: cambia prefers-color-scheme via context.
//                class:  setea localStorage `theme: dark` antes de cargar
//                        (patrón next-themes). Si el repo usa otro, override
//                        con `INIT_SCRIPT` (path a JS a inyectar).
//   INIT_SCRIPT  Path opcional a un JS que setea el theme antes del primer render
//                (ej: "localStorage.setItem('theme', 'dark')").
//
// Salida: <OUT_DIR>/<slug>__light.png y <slug>__dark.png por ruta.
// Imprime resumen final con OK/FAIL count y diff de tamaño entre pares.

import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const APP_URL = process.env.APP_URL || "http://localhost:3020";
const ROUTES = (process.env.ROUTES || "/")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const OUT_DIR = process.env.OUT_DIR || "/tmp/color-theme-audit/shots";
const WIDTH = Number(process.env.WIDTH || 1920);
const HEIGHT = Number(process.env.HEIGHT || 1080);
const WAIT_MS = Number(process.env.WAIT_MS || 400);
const THEME_MODE = process.env.THEME_MODE === "class" ? "class" : "emulate";
const INIT_SCRIPT_PATH = process.env.INIT_SCRIPT;

await mkdir(OUT_DIR, { recursive: true });

function slugify(route) {
  const cleaned = route
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/\?/g, "__q__")
    .replace(/&/g, "__amp__")
    .replace(/=/g, "_eq_")
    .replace(/[^a-zA-Z0-9_]+/g, "-");
  return cleaned || "home";
}

let initScript = null;
if (INIT_SCRIPT_PATH) {
  initScript = await readFile(INIT_SCRIPT_PATH, "utf8");
}

const browser = await chromium.launch({ headless: true });
const summary = [];
const startedAt = Date.now();

async function captureRoute(theme) {
  const colorScheme = theme === "dark" ? "dark" : "light";
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme,
  });

  // Para THEME_MODE=class, inyectamos un init script que setea localStorage
  // antes del primer render — patrón canónico de next-themes y similar.
  if (THEME_MODE === "class") {
    const defaultInit = `try { localStorage.setItem('theme', '${theme}'); } catch (e) {}`;
    await ctx.addInitScript(initScript || defaultInit);
  }

  const page = await ctx.newPage();

  for (const route of ROUTES) {
    const url = new URL(route, APP_URL).toString();
    const file = path.join(OUT_DIR, `${slugify(route)}__${theme}.png`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
      if (WAIT_MS > 0) await page.waitForTimeout(WAIT_MS);
      await page.screenshot({ path: file, fullPage: false, type: "png" });
      summary.push(`OK   ${theme.padEnd(5)} ${route.padEnd(40)} -> ${file}`);
    } catch (err) {
      summary.push(`FAIL ${theme.padEnd(5)} ${route.padEnd(40)} ${err.message}`);
    }
  }

  await ctx.close();
}

await captureRoute("light");
await captureRoute("dark");
await browser.close();

const total = ROUTES.length * 2;
const ok = summary.filter((s) => s.startsWith("OK")).length;
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(summary.join("\n"));
console.log(
  `\nDONE. ${ok}/${total} ok in ${elapsed}s. Output: ${OUT_DIR}\n` +
    `Resolution: ${WIDTH}x${HEIGHT}, Routes: ${ROUTES.length}, ` +
    `Theme mode: ${THEME_MODE}\n` +
    `Next step: comparar pares <slug>__light.png vs <slug>__dark.png por ruta.`,
);

if (ok < total) {
  process.exitCode = 1;
}
