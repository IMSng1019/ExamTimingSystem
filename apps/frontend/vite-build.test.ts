import { describe, expect, test } from "vitest";
import config from "./vite.config";

describe("frontend Vite config", () => {
  test("builds relative asset URLs for Electron file loading", () => {
    expect(config.base).toBe("./");
  });
});
