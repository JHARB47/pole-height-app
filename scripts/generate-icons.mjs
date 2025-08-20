/*
  Simple PNG icon generator using pngjs (no native deps).
  Generates:
  - public/icons/icon-192.png
  - public/icons/icon-512.png
  - public/icons/apple-touch-icon-180.png
*/
import { createWriteStream } from 'node:fs'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(process.cwd(), 'public', 'icons')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

// Colors (Tailwind slate-900 background with slate-100 glyph box)
const BG = { r: 15, g: 23, b: 42, a: 255 } // #0f172a
const FG = { r: 241, g: 245, b: 249, a: 255 } // #f1f5f9
const ACCENT = { r: 59, g: 130, b: 246, a: 255 } // #3b82f6 (blue-500)

let PNG
try {
  ({ PNG } = await import('pngjs'))
} catch (e) {
  console.error('[icons] Error loading pngjs module:', e.message)
  console.log('[icons] Skipping icon generation. Run `npm install pngjs` if you need icons.')
  process.exit(0)
}

function drawIcon(size) {
  const png = new PNG({ width: size, height: size })
  const data = png.data
  const center = Math.floor(size / 2)
  const box = Math.floor(size * 0.5)
  const half = Math.floor(box / 2)
  const start = center - half
  const end = center + half

  // Background fill
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2
      data[idx] = BG.r
      data[idx + 1] = BG.g
      data[idx + 2] = BG.b
      data[idx + 3] = BG.a
    }
  }

  // Simple glyph: a pole icon rectangle with an accent line
  for (let y = start; y < end; y++) {
    for (let x = center - Math.floor(size * 0.07); x < center + Math.floor(size * 0.07); x++) {
      const idx = (size * y + x) << 2
      data[idx] = FG.r
      data[idx + 1] = FG.g
      data[idx + 2] = FG.b
      data[idx + 3] = FG.a
    }
  }
  // Cross-arm
  for (let y = center - Math.floor(size * 0.02); y < center + Math.floor(size * 0.02); y++) {
    for (let x = center - Math.floor(size * 0.18); x < center + Math.floor(size * 0.18); x++) {
      const idx = (size * y + x) << 2
      data[idx] = FG.r
      data[idx + 1] = FG.g
      data[idx + 2] = FG.b
      data[idx + 3] = FG.a
    }
  }
  // Accent wire
  for (let x = center - Math.floor(size * 0.18); x < center + Math.floor(size * 0.18); x++) {
    const y = center + Math.floor(Math.sin((x - (center - Math.floor(size * 0.18))) / (size * 0.36) * Math.PI) * size * 0.03)
    const idx = (size * y + x) << 2
    data[idx] = ACCENT.r
    data[idx + 1] = ACCENT.g
    data[idx + 2] = ACCENT.b
    data[idx + 3] = ACCENT.a
  }

  return png
}

const targets = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon-180.png' },
]

await Promise.all(
  targets.map(({ size, file }) => new Promise((resolve, reject) => {
    const png = drawIcon(size)
    const out = createWriteStream(join(outDir, file))
  out.on('finish', () => resolve(true))
  out.on('error', (err) => reject(err))
    png.pack().pipe(out)
  }))
)

console.log('Generated icons in public/icons/')
