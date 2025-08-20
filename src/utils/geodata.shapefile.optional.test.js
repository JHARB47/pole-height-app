import { describe, it, expect, vi, afterEach } from 'vitest'
import * as geodata from './geodata'

describe('exportShapefile optional dependency behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to GeoJSON and does not throw when @mapbox/shp-write is missing', async () => {
    const fc = { type: 'FeatureCollection', features: [] }

    // Spy on console to confirm fallback path executed
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(geodata.exportShapefile(fc, 'sample.zip')).resolves.toBeUndefined()

    // Should warn about optional dependency and fallback
    expect(warnSpy).toHaveBeenCalled()
    const msg = warnSpy.mock.calls.map(c => String(c[0] ?? '')).join(' ')
    expect(msg).toMatch(/@mapbox\/shp-write/)
  })
})
