// ═══════════════════════════════════════════════════════════════════════
// social pack · renderer
// ───────────────────────────────────────────────────────────────────────
// Abre cada HTML de pieces/ en chromium headless, espera a que carguen
// las fonts y el layout, y rasteriza a PNG 1080×1920.
//
// Uso:
//   node <path>/render-social.mjs           (todas las piezas)
//   node <path>/render-social.mjs 01 03 07  (subset por prefijo numerico)
//
// Requisitos:
//   pnpm add -D @playwright/test
//   pnpm exec playwright install chromium
// ═══════════════════════════════════════════════════════════════════════

import { chromium } from '@playwright/test'
import { readdir, mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PIECES_DIR = path.join(__dirname, 'pieces')
const OUT_DIR = path.join(__dirname, 'out')
const VIEWPORT = { width: 1080, height: 1920 }

async function listPieces() {
  const files = await readdir(PIECES_DIR)
  return files.filter((f) => f.endsWith('.html') && !f.startsWith('_')).sort()
}

function filterPieces(all, filters) {
  if (filters.length === 0) return all
  return all.filter((name) => {
    const prefix = name.split('-')[0] // "01" de "01-hero-punchline.html"
    return filters.includes(prefix)
  })
}

async function renderPiece(browser, file) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })
  const url = pathToFileURL(path.join(PIECES_DIR, file)).href
  const outName = file.replace('.html', '.png')
  const outPath = path.join(OUT_DIR, outName)

  const started = Date.now()

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

  // Esperar fonts de Google (critico: sin esto FOUT visible en el PNG)
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
  })

  // Extra settle por layout asincrono
  await page.waitForTimeout(600)

  await page.screenshot({
    path: outPath,
    fullPage: false,
    clip: { x: 0, y: 0, ...VIEWPORT },
    type: 'png',
    omitBackground: false,
  })

  await page.close()

  const ms = Date.now() - started
  console.log(`  ok ${file.padEnd(36)} -> ${outName}  (${ms}ms)`)
  return outName
}

async function main() {
  const filters = process.argv.slice(2)
  const all = await listPieces()
  const selected = filterPieces(all, filters)

  if (selected.length === 0) {
    console.error('no matched pieces.')
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })

  console.log(`\nsocial pack · rendering ${selected.length} piece(s)`)
  console.log(`viewport: ${VIEWPORT.width}x${VIEWPORT.height}`)
  console.log(`out:      ${path.relative(process.cwd(), OUT_DIR)}/\n`)

  const browser = await chromium.launch({ headless: true })

  try {
    for (const file of selected) {
      await renderPiece(browser, file)
    }
  } finally {
    await browser.close()
  }

  console.log(`\ndone: ${selected.length} png(s) listos en ${path.relative(process.cwd(), OUT_DIR)}/`)
}

main().catch((err) => {
  console.error('render falló:', err)
  process.exit(1)
})
