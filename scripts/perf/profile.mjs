// Simple performance harness for compute and export paths
// Run: npm run perf (or perf:quick)
import { performance } from 'node:perf_hooks'
import { computeAnalysis } from '../../src/utils/calculations.js'
import {
  buildPolesCSV,
  buildSpansCSV,
  buildExistingLinesCSV,
  buildGeoJSON,
  buildKML,
} from '../../src/utils/exporters.js'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function genExistingLines(count) {
  const owners = ['FE', 'AEP', 'DUKE', 'LUMOS', 'COMCAST']
  const types = ['comm', 'power']
  const lines = []
  for (let i = 0; i < count; i++) {
    lines.push({
      id: `L${i}`,
      type: pick(types),
      companyName: pick(owners),
      height: `${(10 + rand(0, 30)).toFixed(2)}`,
      owner: pick(owners),
      makeReady: Math.random() < 0.2,
      makeReadyHeight: `${(10 + rand(0, 30)).toFixed(2)}`,
    })
  }
  return lines
}

function genSpans(count) {
  const spans = []
  for (let i = 0; i < count; i++) {
    spans.push({
      fromPoleId: `P${i}`,
      toPoleId: `P${i + 1}`,
      distanceFt: Math.round(rand(50, 250)),
      road: Math.random() < 0.5,
      driveway: Math.random() < 0.2,
      interstate: Math.random() < 0.05,
    })
  }
  return spans
}

function genPoles(count) {
  const poles = []
  for (let i = 0; i < count; i++) {
    poles.push({ id: `P${i}`, latitude: 39 + rand(0, 1), longitude: -80 + rand(0, 1) })
  }
  return poles
}

function fmtMs(ms) {
  return `${ms.toFixed(2)} ms`
}

function stats(name, times) {
  const total = times.reduce((a, b) => a + b, 0)
  const avg = total / times.length
  const sorted = [...times].sort((a, b) => a - b)
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const max = sorted[sorted.length - 1]
  console.log(`${name}: N=${times.length} avg=${fmtMs(avg)} p95=${fmtMs(p95)} max=${fmtMs(max)} total=${fmtMs(total)}`)
}

async function profileCompute({ iterations = 200, existingCount = 2000 } = {}) {
  console.log(`\n=== computeAnalysis: iterations=${iterations}, existingLines=${existingCount} ===`)
  const existingLines = genExistingLines(existingCount)
  const times = []
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    const { results, errors } = computeAnalysis({
      poleHeight: 40,
      poleClass: '4',
      poleLatitude: 39.2,
      poleLongitude: -80.1,
      existingPowerHeight: '34.0',
      existingPowerVoltage: '12kV',
      spanDistance: 200,
      isNewConstruction: false,
      adjacentPoleHeight: 35,
      attachmentType: 'messenger',
      cableDiameter: 0.625,
      windSpeed: 30,
      spanEnvironment: 'residential',
      streetLightHeight: '28.0',
      dripLoopHeight: '20.0',
      proposedLineHeight: '18.5',
      existingLines,
      iceThicknessIn: 0.25,
      hasTransformer: Math.random() < 0.3,
      presetProfile: 'default',
      customMinTopSpace: null,
      customRoadClearance: null,
      customCommToPower: null,
      powerReference: 'toNeutral',
      jobOwner: pick(['FE', 'AEP', 'DUKE']),
      submissionProfile: undefined,
    })
    const t1 = performance.now()
    if (errors) throw new Error('computeAnalysis returned errors unexpectedly')
    if (!results) throw new Error('computeAnalysis returned empty results')
    times.push(t1 - t0)
  }
  stats('computeAnalysis', times)
}

async function profileExports({ count = 5000 } = {}) {
  console.log(`\n=== exporters: items=${count} ===`)
  const poles = genPoles(count)
  const spans = genSpans(count)
  const existing = genExistingLines(count)
  /** @type {Array<[string, () => unknown]>} */
  const blocks = [
    ['buildPolesCSV', () => buildPolesCSV(poles)],
    ['buildSpansCSV', () => buildSpansCSV(spans)],
    ['buildExistingLinesCSV', () => buildExistingLinesCSV(existing)],
    ['buildGeoJSON', () => buildGeoJSON({ poles, spans })],
    ['buildKML', () => buildKML({ poles, spans })],
  ]
  for (const [name, fn] of blocks) {
    const t0 = performance.now()
  const out = fn()
    if (!out) throw new Error(`${name} produced falsy output`)
    const t1 = performance.now()
    console.log(`${name}: ${fmtMs(t1 - t0)}`)
  }
}

async function main() {
  const mode = process.env.PERF_MODE || 'quick'
  if (mode === 'quick') {
    await profileCompute({ iterations: 50, existingCount: 1000 })
    await profileExports({ count: 1000 })
  } else {
    await profileCompute({ iterations: 200, existingCount: 2000 })
    await profileExports({ count: 5000 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
