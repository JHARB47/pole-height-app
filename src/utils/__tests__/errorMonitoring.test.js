// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  errorMonitor,
  withErrorHandling,
  withRetry,
  withFallback,
  CircuitBreaker,
  setupGlobalErrorHandlers,
  checkHealth,
} from "../errorMonitoring.js";

describe("Error Monitoring System", () => {
  beforeEach(() => {
    errorMonitor.clearErrors();
  });

  describe("ErrorMonitor", () => {
    it("should log errors with context", () => {
      const error = new Error("Test error");
      errorMonitor.logError(error, { operation: "test" });

      expect(errorMonitor.errors.length).toBe(1);
      expect(errorMonitor.errors[0].message).toBe("Test error");
      expect(errorMonitor.errors[0].context.operation).toBe("test");
    });

    it("should limit error storage to maxErrors", () => {
      for (let i = 0; i < 150; i++) {
        errorMonitor.logError(new Error(`Error ${i}`));
      }

      expect(errorMonitor.errors.length).toBe(100); // maxErrors is 100
    });

    it("should provide error statistics", () => {
      errorMonitor.logError(new Error("Recent error"));
      const stats = errorMonitor.getErrorStats();

      expect(stats.last5Minutes).toBe(1);
      expect(stats.lastHour).toBe(1);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });

    it("should notify listeners on error", () => {
      const listener = vi.fn();
      errorMonitor.subscribe(listener);

      errorMonitor.logError(new Error("Test"));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Test",
        }),
      );

      errorMonitor.unsubscribe(listener);
    });

    it("should clear errors", () => {
      errorMonitor.logError(new Error("Test"));
      expect(errorMonitor.errors.length).toBe(1);

      errorMonitor.clearErrors();
      expect(errorMonitor.errors.length).toBe(0);
    });
  });

  describe("withErrorHandling", () => {
    it("should execute function and log errors on failure", async () => {
      const failingFn = async () => {
        throw new Error("Function failed");
      };

      const wrapped = withErrorHandling(failingFn, {
        context: { operation: "test" },
      });

      await expect(wrapped()).rejects.toThrow("Function failed");

      expect(errorMonitor.errors.length).toBe(1);
      expect(errorMonitor.errors[0].context.operation).toBe("test");
    });

    it("should succeed when function works", async () => {
      const successFn = async () => "success";

      const wrapped = withErrorHandling(successFn);
      const result = await wrapped();

      expect(result).toBe("success");
      expect(errorMonitor.errors.length).toBe(0);
    });
  });

  describe("withRetry", () => {
    it("should retry on failure", async () => {
      let attempts = 0;
      const flakyFn = async () => {
        attempts++;
        if (attempts < 3) throw new Error("Temporary failure");
        return "success";
      };

      const result = await withRetry(flakyFn, { maxAttempts: 3, delay: 10 });

      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should fail after max attempts", async () => {
      const alwaysFailFn = async () => {
        throw new Error("Permanent failure");
      };

      await expect(
        withRetry(alwaysFailFn, { maxAttempts: 2, delay: 10 }),
      ).rejects.toThrow("Permanent failure");
    });

    it("should succeed on first attempt", async () => {
      const successFn = async () => "success";

      const result = await withRetry(successFn);
      expect(result).toBe("success");
    });
  });

  describe("withFallback", () => {
    it("should use fallback on primary failure", async () => {
      const primaryFn = async () => {
        throw new Error("Primary failed");
      };
      const fallbackFn = async () => "fallback success";

      const result = await withFallback(primaryFn, fallbackFn);

      expect(result).toBe("fallback success");
    });

    it("should use primary when it succeeds", async () => {
      const primaryFn = async () => "primary success";
      const fallbackFn = async () => "fallback success";

      const result = await withFallback(primaryFn, fallbackFn);

      expect(result).toBe("primary success");
    });

    it("should timeout slow primary function", async () => {
      const slowPrimaryFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return "primary success";
      };
      const fallbackFn = async () => "fallback success";

      const result = await withFallback(slowPrimaryFn, fallbackFn, 100);

      expect(result).toBe("fallback success");
    });
  });

  describe("CircuitBreaker", () => {
    it("should open circuit after failures", async () => {
      const breaker = new CircuitBreaker("test", {
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      const failingFn = async () => {
        throw new Error("Service unavailable");
      };

      // First 3 attempts should execute and fail
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow(
          "Service unavailable",
        );
      }

      // Circuit should now be open
      await expect(breaker.execute(failingFn)).rejects.toThrow(
        "Circuit breaker is open for test",
      );
    });

    it("should allow execution when closed", async () => {
      const breaker = new CircuitBreaker("test");
      const successFn = async () => "success";

      const result = await breaker.execute(successFn);
      expect(result).toBe("success");
    });

    it("should reset after timeout", async () => {
      const breaker = new CircuitBreaker("test", {
        failureThreshold: 2,
        resetTimeout: 100,
      });

      const failingFn = async () => {
        throw new Error("Fail");
      };

      // Open the circuit
      await expect(breaker.execute(failingFn)).rejects.toThrow("Fail");
      await expect(breaker.execute(failingFn)).rejects.toThrow("Fail");
      await expect(breaker.execute(failingFn)).rejects.toThrow(
        "Circuit breaker is open",
      );

      // Wait for reset
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should allow execution again
      const successFn = async () => "recovered";
      const result = await breaker.execute(successFn);
      expect(result).toBe("recovered");
    });
  });

  describe("checkHealth", () => {
    it("should return healthy when no recent errors", () => {
      const health = checkHealth();

      expect(health.status).toBe("healthy");
      expect(health.errorRate).toBe(0);
    });

    it("should return degraded with high error rate", () => {
      // Add multiple errors quickly
      for (let i = 0; i < 10; i++) {
        errorMonitor.logError(new Error(`Error ${i}`));
      }

      const health = checkHealth();

      expect(health.status).toBe("degraded");
      expect(health.errorRate).toBeGreaterThan(0);
    });
  });

  describe("Global Error Handlers", () => {
    it("should setup global handlers without errors", () => {
      expect(() => setupGlobalErrorHandlers()).not.toThrow();
    });
  });
});
