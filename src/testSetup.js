// Vitest setup: testing-library cleanup and light DOM shims
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// Mock matchMedia if not present (jsdom)
if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = () => ({
    matches: false,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  })
}
