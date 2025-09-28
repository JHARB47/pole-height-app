// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import App from './App.jsx';

let prevIO;

beforeAll(() => {
  prevIO = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class {
    observe() { /* no-op */ }
    unobserve() { /* no-op */ }
    disconnect() { /* no-op */ }
    root = null;
    rootMargin = '';
    thresholds = [];
    takeRecords() { return []; }
  };
});

afterAll(() => {
  globalThis.IntersectionObserver = prevIO;
});

describe('App', () => {
  it('renders app chrome and loads the calculator lazily', async () => {
    render(<App />);
    // Title block from App
    expect(
      screen.getByText(/OSP Engineering & Permit Management/i)
    ).toBeTruthy();

    // The lazy calculator will load; assert on a heading inside it
    const wizard = await screen.findByText('PolePlan Pro');
    expect(wizard).toBeTruthy();
  });
});
