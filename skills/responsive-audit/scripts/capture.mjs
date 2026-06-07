// responsive-audit / capture.mjs
// Captura screenshots en 5 resoluciones canónicas para auditoría responsive.
//
// Correr desde un directorio que tenga `playwright` como dep (ej: el web/ del
// repo target). NO desde /tmp/ — ESM no resuelve modules fuera del cwd.
//
// Variables de entorno:
//   APP_URL      URL base. Default: http://localhost:3020
//   ROUTES       CSV de paths a capturar. Default: "/"
//                Ejemplo: ROUTES="/,/jurisprudencia,/valores"
//   OUT_DIR      Directorio de salida. Default: /tmp/responsive-audit/shots
//   WAIT_MS      Pausa después de networkidle (ms). Default: 300
//   FULL_PAGE    "true"/"false". Default: false (sólo first-fold).
//   THEME        "light" | "dark" | "both". Default: light.
//                "both" genera ambos themes en una pasada (10N PNGs).
//   THEME_MODE   "emulate" (default) | "class".
//                emulate: cambia prefers-color-scheme via context.
//                class:   setea localStorage `theme: dark` antes del primer
//                         render (patrón next-themes). Si el repo usa otro
//                         setter, override con INIT_SCRIPT.
//   INIT_SCRIPT  Path opcional a un .js que setea el theme antes del primer
//                render (ej: contiene "localStorage.setItem('theme','dark')").
//
// Salida:
//   THEME=light|dark → <OUT_DIR>/<res>__<slug>.png (compat con audits previos)
//   THEME=both       → <OUT_DIR>/<res>__<slug>__<theme>.png
// Imprime resumen final con OK/FAIL count y tiempo total.

import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const APP_URL = process.env.APP_URL || "http://localhost:3020";
const ROUTES = (process.env.ROUTES || "/")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const OUT_DIR = process.env.OUT_DIR || "/tmp/responsive-audit/shots";
const WAIT_MS = Number(process.env.WAIT_MS || 300);
const FULL_PAGE = process.env.FULL_PAGE === "true";
const THEME_INPUT = (process.env.THEME || "light").toLowerCase();
const THEMES =
  THEME_INPUT === "both"
    ? ["light", "dark"]
    : [THEME_INPUT === "dark" ? "dark" : "light"];
const THEME_MODE = process.env.THEME_MODE === "class" ? "class" : "emulate";
const INIT_SCRIPT_PATH = process.env.INIT_SCRIPT;

await mkdir(OUT_DIR, { recursive: true });

let customInitScript = null;
if (INIT_SCRIPT_PATH) {
  customInitScript = await readFile(INIT_SCRIPT_PATH, "utf8");
}

const RESOLUTIONS = [
  { w: 1366, h: 768, tag: "1366x768" },
  { w: 1440, h: 900, tag: "1440x900" },
  { w: 1920, h: 1080, tag: "1920x1080" },
  { w: 2560, h: 1440, tag: "2560x1440" },
  { w: 3840, h: 2160, tag: "3840x2160" },
];

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

const browser = await chromium.launch({ headless: true });
const summary = [];
const startedAt = Date.now();
const multipleThemes = THEMES.length > 1;

for (const theme of THEMES) {
  for (const res of RESOLUTIONS) {
    const ctx = await browser.newContext({
      viewport: { width: res.w, height: res.h },
      deviceScaleFactor: 1,
      colorScheme: theme,
    });

    // Para THEME_MODE=class, inyectamos un init script que setea el theme
    // antes del primer render — patrón canónico de next-themes y similar.
    if (THEME_MODE === "class") {
      const defaultInit = `try { localStorage.setItem('theme', '${theme}'); } catch (e) {}`;
      await ctx.addInitScript(customInitScript || defaultInit);
    }

    const page = await ctx.newPage();

    for (const route of ROUTES) {
      const url = new URL(route, APP_URL).toString();
      const themeSuffix = multipleThemes ? `__${theme}` : "";
      const file = path.join(
        OUT_DIR,
        `${res.tag}__${slugify(route)}${themeSuffix}.png`,
      );
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
        if (WAIT_MS > 0) await page.waitForTimeout(WAIT_MS);
        await page.screenshot({ path: file, fullPage: FULL_PAGE, type: "png" });
        summary.push(
          `OK   ${theme.padEnd(5)} ${res.tag.padEnd(10)} ${route.padEnd(40)} -> ${file}`,
        );
      } catch (err) {
        summary.push(
          `FAIL ${theme.padEnd(5)} ${res.tag.padEnd(10)} ${route.padEnd(40)} ${err.message}`,
        );
      }
    }

    await ctx.close();
  }
}

await browser.close();

const total = THEMES.length * RESOLUTIONS.length * ROUTES.length;
const ok = summary.filter((s) => s.startsWith("OK")).length;
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(summary.join("\n"));
console.log(
  `\nDONE. ${ok}/${total} ok in ${elapsed}s. Output: ${OUT_DIR}\n` +
    `Themes: ${THEMES.join(", ")} (mode: ${THEME_MODE})\n` +
    `Resolutions: ${RESOLUTIONS.map((r) => r.tag).join(", ")}\n` +
    `Routes: ${ROUTES.length}, FullPage: ${FULL_PAGE}`,
);

if (ok < total) {
  process.exitCode = 1;
}
