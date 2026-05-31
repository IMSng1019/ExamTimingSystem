import { describe, expect, test, vi } from "vitest";
import { BACKEND_STARTUP_TIMEOUT_MS, isUrlReady, waitForUrl } from "./startup";

describe("electron startup helpers", () => {
  test("allows slow backend cold starts", () => {
    expect(BACKEND_STARTUP_TIMEOUT_MS).toBeGreaterThanOrEqual(90_000);
  });

  test("polls until a URL returns ok", async () => {
    let attempts = 0;
    const fetcher = vi.fn(async () => ({ ok: ++attempts === 3 }));
    const sleeps: number[] = [];

    await waitForUrl("http://127.0.0.1:3099/api/config", {
      fetcher,
      intervalMs: 25,
      sleep: async (durationMs) => {
        sleeps.push(durationMs);
      },
      timeoutMs: 1_000
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([25, 25]);
  });

  test("detects unavailable URLs without throwing", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("connection refused");
    });

    await expect(isUrlReady("http://127.0.0.1:3099/api/config", fetcher)).resolves.toBe(false);
  });
});
