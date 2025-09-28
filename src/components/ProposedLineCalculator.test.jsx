// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProposedLineCalculator from './ProposedLineCalculator';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
let prevIO;

// Whole-scope test: mount, useEffect, and UI behavior
// Mock IntersectionObserver for jsdom
beforeAll(() => {
  prevIO = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class {
    observe() { /* no-op stub */ }
    unobserve() { /* no-op stub */ }
    disconnect() { /* no-op stub */ }
    root = null;
    rootMargin = '';
    thresholds = [];
    takeRecords() { return []; }
  };
});

afterAll(() => {
  // Restore the previous global value to avoid side-effects across test files
  globalThis.IntersectionObserver = prevIO;
});

describe('ProposedLineCalculator', () => {
  it('should mount and run useEffect without errors', () => {
    // Spy on console.error to catch React errors
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    render(<ProposedLineCalculator />);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should render expected UI elements', () => {
    render(<ProposedLineCalculator />);
    // Key heading/title
    expect(screen.getByText('PolePlan Pro')).toBeTruthy();
    // Workflow nav links
    expect(screen.getByRole('link', { name: 'Job' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Import/Map' })).toBeTruthy();
    // Disambiguate against section title by scoping to role=link
    expect(screen.getByRole('link', { name: 'Spans' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Existing Lines' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Field' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Results' })).toBeTruthy();
    // A couple of core controls exist
    expect(screen.getByText('Use GPS')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Export CSV' }).length).toBeGreaterThan(0);
  });

  it('toggles Job section collapse/expand', () => {
    render(<ProposedLineCalculator />);
    // The first section has a Collapse button when open
    const toggle = screen.getAllByRole('button', { name: /Collapse|Expand/ })[0];
    expect(toggle).toBeTruthy();
    const initialLabel = toggle.textContent;
    fireEvent.click(toggle);
    // After click, label should flip
    const flippedLabel = toggle.textContent;
    expect(flippedLabel && initialLabel && flippedLabel !== initialLabel).toBe(true);
  });

  it('shows View Report button (no toggle without results)', () => {
    render(<ProposedLineCalculator />);
    const btn = screen.getByRole('button', { name: /View Report/i });
    expect(btn).toBeTruthy();
    // Don't click here since PrintableReport expects results in store
    expect(btn.textContent?.includes('View Report')).toBe(true);
  });

  it('disables View Report when no results are available', () => {
    render(<ProposedLineCalculator />);
    const btn = screen.getByRole('button', { name: /View Report/i });
    expect(btn).toBeTruthy();
    expect(btn).toHaveProperty('disabled', true);
  });

  it('should unmount cleanly without errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const { unmount } = render(<ProposedLineCalculator />);
    expect(() => unmount()).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should not warn during mount/unmount', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const { unmount } = render(<ProposedLineCalculator />);
    unmount();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('can mount/unmount repeatedly without errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    for (let i = 0; i < 5; i++) {
      const { unmount } = render(<ProposedLineCalculator />);
      expect(() => unmount()).not.toThrow();
    }
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  // Add more tests here to check useEffect side effects, state changes, and integration with app store
});
