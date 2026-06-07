#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// social-motion · portable frame-by-frame renderer
// ───────────────────────────────────────────────────────────────────────
// Lee `motion.config.json` del cwd y renderiza una (o todas) las piezas.
//
// Pipeline determinístico:
//   1. Carga la pieza HTML en chromium headless.
//   2. Espera fonts + settle.
//   3. Pausa TODAS las Web Animations.
//   4. Para cada frame (0..N): setea currentTime y toma screenshot.
//   5. ffmpeg concat a MP4 H.264 / yuv420p (libx264 desde ffmpeg-static).
//   6. Extrae 6 frames @ 1fps para el visor.
//
// Uso:
//   node <skill>/assets/render-motion.mjs <piece-name>
//   node <skill>/assets/render-motion.mjs --all
//
// piece-name puede ser con o sin `.html` y con o sin extensión `-motion`.
// ═══════════════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const CWD = process.cwd()

// El script vive en ~/.claude/skills/social-motion/ pero sus deps viven en el
// node_modules del repo destino. Resolvemos desde el cwd, no desde la ubicación
// del script.
const requireFromCwd = createRequire(path.join(CWD, 'package.json'))

async function importFromCwd(specifier) {
  const resolved = requireFromCwd.resolve(specifier)
  return import(pathToFileURL(resolved).href)
}

async function loadChromium() {
  try {
    const pw = await importFromCwd('@playwright/test')
    return pw.chromium ?? pw.default?.chromium
  } catch (err) {
    console.error(`\n✗ No pude cargar @playwright/test desde ${CWD}/node_modules`)
    console.error(`  Instalá: pnpm add -D @playwright/test`)
    console.error(`  (o npm/yarn equivalente). Después: pnpm exec playwright install chromium`)
    console.error(`  Detalle: ${err.message}\n`)
    process.exit(1)
  }
}

async function loadConfig() {
  const configPath = path.join(CWD, 'motion.config.json')
  try {
    const raw = await readFile(configPath, 'utf8')
    const cfg = JSON.parse(raw)
    // Defaults
    cfg.defaults ??= {}
    cfg.defaults.viewport ??= [1080, 1920]
    cfg.defaults.fps ??= 30
    cfg.defaults.durationSeconds ??= 6
    cfg.paths ??= {}
    cfg.paths.pieces ??= './motion-pieces'
    cfg.paths.out ??= './motion-out'
    return cfg
  } catch (err) {
    console.error(`\n✗ No pude leer motion.config.json en ${CWD}`)
    console.error(`  ${err.message}`)
    console.error(`\nEjecutá el skill social-motion para hacer onboarding del repo.\n`)
    process.exit(1)
  }
}

async function loadFfmpeg() {
  try {
    const mod = await importFromCwd('ffmpeg-static')
    const bin = mod.default
    if (!bin) throw new Error('ffmpeg-static export vacío')
    await stat(bin)
    return bin
  } catch (err) {
    console.error(`\n✗ ffmpeg-static no está disponible en ${CWD}/node_modules`)
    console.error(`  Instalá: pnpm add -D ffmpeg-static`)
    console.error(`  Si ya está instalado pero no hay binario: node node_modules/ffmpeg-static/install.js`)
    console.error(`  Detalle: ${err.message}\n`)
    process.exit(1)
  }
}

async function ensureEmpty(dir) {
  try { await rm(dir, { recursive: true }) } catch {}
  await mkdir(dir, { recursive: true })
}

function runFfmpeg(bin, args) {
  return new Promise((resolve, reject) => {
    const ff = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    ff.stderr.on('data', (d) => { stderr += d.toString() })
    ff.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`)),
    )
  })
}

/**
 * Lee la pieza HTML para detectar overrides de duración/viewport.
 * Convención: `<meta name="motion-duration" content="8">` o atributo data en <html>.
 */
async function readPieceMeta(htmlPath) {
  const html = await readFile(htmlPath, 'utf8')
  const meta = {}
  const dur = html.match(/<meta\s+name=["']motion-duration["']\s+content=["']([\d.]+)["']/i)
  if (dur) meta.durationSeconds = parseFloat(dur[1])
  const vp = html.match(/<meta\s+name=["']motion-viewport["']\s+content=["'](\d+)[x×](\d+)["']/i)
  if (vp) meta.viewport = [parseInt(vp[1]), parseInt(vp[2])]
  const fps = html.match(/<meta\s+name=["']motion-fps["']\s+content=["'](\d+)["']/i)
  if (fps) meta.fps = parseInt(fps[1])
  return meta
}

async function captureFrames(page, framesDir, totalFrames, fps) {
  await page.evaluate(() => {
    document.getAnimations().forEach((a) => a.pause())
  })

  for (let i = 0; i < totalFrames; i++) {
    const timeMs = (i / fps) * 1000
    await page.evaluate(async (ms) => {
      document.getAnimations().forEach((a) => {
        a.currentTime = ms
      })
      await new Promise((r) => requestAnimationFrame(r))
      await new Promise((r) => requestAnimationFrame(r))
    }, timeMs)

    const name = `frame-${String(i).padStart(4, '0')}.png`
    await page.screenshot({
      path: path.join(framesDir, name),
      type: 'png',
      omitBackground: false,
    })

    if ((i + 1) % 30 === 0) {
      const pct = Math.round(((i + 1) / totalFrames) * 100)
      process.stdout.write(`  · frames ${i + 1}/${totalFrames}  (${pct}%)\r`)
    }
  }
  process.stdout.write('\n')
}

async function extractPreviewFrames(ffBin, mp4Path, framesOutDir, durationSeconds) {
  // Extrae 6 frames espaciados uniformemente (incluyendo 0s y último)
  await mkdir(framesOutDir, { recursive: true })
  const step = durationSeconds / 5 // 0, 1.2, 2.4, 3.6, 4.8, 6 para 6s
  for (let i = 0; i < 6; i++) {
    const t = Math.min(i * step, durationSeconds - 0.05)
    const name = `frame-${String(i + 1).padStart(2, '0')}.png`
    await runFfmpeg(ffBin, [
      '-y', '-ss', String(t.toFixed(2)), '-i', mp4Path,
      '-vframes', '1', '-q:v', '2',
      path.join(framesOutDir, name),
    ])
  }
}

async function renderOne(pieceArg, cfg, ffBin, chromium) {
  const piecesDir = path.resolve(CWD, cfg.paths.pieces)
  const outDir = path.resolve(CWD, cfg.paths.out)

  // Resolver nombre de pieza
  let htmlFile = pieceArg.endsWith('.html') ? pieceArg : `${pieceArg}.html`
  let htmlPath = path.join(piecesDir, htmlFile)
  try { await stat(htmlPath) } catch {
    // Intentar con sufijo -motion si no lo tiene
    if (!pieceArg.endsWith('-motion') && !pieceArg.endsWith('-motion.html')) {
      const alt = pieceArg.replace(/\.html$/, '') + '-motion.html'
      const altPath = path.join(piecesDir, alt)
      try {
        await stat(altPath)
        htmlFile = alt
        htmlPath = altPath
      } catch {
        throw new Error(`Pieza no encontrada: ${htmlPath} (ni ${altPath})`)
      }
    } else {
      throw new Error(`Pieza no encontrada: ${htmlPath}`)
    }
  }

  const pieceBase = htmlFile.replace('.html', '')
  const pieceMeta = await readPieceMeta(htmlPath)
  const [viewportW, viewportH] = pieceMeta.viewport ?? cfg.defaults.viewport
  const fps = pieceMeta.fps ?? cfg.defaults.fps
  const durationSeconds = pieceMeta.durationSeconds ?? cfg.defaults.durationSeconds
  const totalFrames = Math.round(durationSeconds * fps)

  await mkdir(outDir, { recursive: true })
  const stagingDir = path.join(outDir, `_staging_${pieceBase}`)
  const framesDir = path.join(stagingDir, 'frames')
  await ensureEmpty(framesDir)

  const mp4Path = path.join(outDir, `${pieceBase}.mp4`)
  const previewFramesDir = path.join(outDir, '_frames', pieceBase)

  console.log(`\n── ${pieceBase} ──`)
  console.log(`  viewport:     ${viewportW}×${viewportH}`)
  console.log(`  fps/duration: ${fps} fps · ${durationSeconds}s (${totalFrames} frames)`)

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: viewportW, height: viewportH },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    const url = pathToFileURL(htmlPath).href

    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }
    })
    await page.waitForTimeout(250)

    const startedAt = Date.now()
    await captureFrames(page, framesDir, totalFrames, fps)
    const capMs = Date.now() - startedAt
    console.log(`  ✓ capture:    ${capMs}ms  (${(capMs / totalFrames).toFixed(0)}ms/frame)`)

    await page.close()
    await context.close()
  } finally {
    await browser.close()
  }

  const encStartedAt = Date.now()
  const ffArgs = [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(framesDir, 'frame-%04d.png'),
    '-frames:v', String(totalFrames),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Path,
  ]
  await runFfmpeg(ffBin, ffArgs)
  console.log(`  ✓ encode:     ${Date.now() - encStartedAt}ms`)

  // Preview frames (6 @ uniform spacing)
  await extractPreviewFrames(ffBin, mp4Path, previewFramesDir, durationSeconds)
  console.log(`  ✓ preview:    6 frames en _frames/${pieceBase}/`)

  // Cleanup staging
  await rm(stagingDir, { recursive: true })

  const st = await stat(mp4Path)
  const sizeMb = (st.size / 1024 / 1024).toFixed(2)
  console.log(`  ✓ mp4:        ${path.relative(CWD, mp4Path)}  (${sizeMb} MB)`)
  return {
    base: pieceBase,
    mp4: path.relative(CWD, mp4Path),
    framesDir: path.relative(CWD, previewFramesDir),
    durationSeconds,
    viewport: [viewportW, viewportH],
  }
}

async function main() {
  const args = process.argv.slice(2)
  const cfg = await loadConfig()
  const ffBin = await loadFfmpeg()
  const chromium = await loadChromium()

  console.log(`\n${cfg.project?.name ?? 'social-motion'} · motion renderer`)

  let pieces = []
  if (args.includes('--all') || args.length === 0) {
    const piecesDir = path.resolve(CWD, cfg.paths.pieces)
    try {
      const all = await readdir(piecesDir)
      pieces = all.filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''))
    } catch {
      console.error(`\n✗ No hay piezas en ${piecesDir}`)
      process.exit(1)
    }
    if (pieces.length === 0) {
      console.error(`\n✗ ${piecesDir} existe pero no tiene .html`)
      process.exit(1)
    }
  } else {
    pieces = args.filter((a) => !a.startsWith('--'))
  }

  const results = []
  for (const p of pieces) {
    results.push(await renderOne(p, cfg, ffBin, chromium))
  }

  console.log(`\n✓ ${results.length} pieza(s) renderizada(s).`)
  console.log(`  Siguiente paso: regenerar el visor y levantar HTTP server en ${cfg.paths.out}\n`)
}

main().catch((err) => {
  console.error('\n✗ render-motion falló:', err.message)
  process.exit(1)
})
