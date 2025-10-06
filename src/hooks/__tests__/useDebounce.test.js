/**
 * Tests for useDebounce hook
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce, useDebouncedCallback } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("test", 500));
    expect(result.current).toBe("test");
  });

  it("should debounce value updates", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Wait for debounce delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Value should now be updated
    expect(result.current).toBe("updated");
  });

  it("should cancel previous timeout on rapid changes", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } },
    );

    // Rapid updates
    rerender({ value: "update1" });
    await new Promise((resolve) => setTimeout(resolve, 200));

    rerender({ value: "update2" });
    await new Promise((resolve) => setTimeout(resolve, 200));

    rerender({ value: "final" });

    // Should still be initial (not enough time passed)
    expect(result.current).toBe("initial");

    // Wait for debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Should skip intermediate values and go to final
    expect(result.current).toBe("final");
  });

  it("should use custom delay", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    // Wait for custom delay of 1000ms
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(result.current).toBe("updated");
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should debounce callback execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    // Call multiple times rapidly
    act(() => {
      result.current("call1");
      result.current("call2");
      result.current("call3");
    });

    // Callback should not be called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should be called once with last arguments
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("call3");
  });

  it("should cleanup timeout on unmount", () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 500),
    );

    act(() => {
      result.current("test");
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });
});
