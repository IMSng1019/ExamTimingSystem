"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_STARTUP_TIMEOUT_MS = exports.BACKEND_STARTUP_TIMEOUT_MS = void 0;
exports.isUrlReady = isUrlReady;
exports.waitForUrl = waitForUrl;
exports.BACKEND_STARTUP_TIMEOUT_MS = 90_000;
exports.FRONTEND_STARTUP_TIMEOUT_MS = 30_000;
function sleep(durationMs) {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
}
async function isUrlReady(url, fetcher = fetch) {
    try {
        const response = await fetcher(url);
        return response.ok;
    }
    catch {
        return false;
    }
}
async function waitForUrl(url, options = {}) {
    const fetcher = options.fetcher ?? fetch;
    const intervalMs = options.intervalMs ?? 300;
    const sleepFn = options.sleep ?? sleep;
    const timeoutMs = options.timeoutMs ?? 30_000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        if (await isUrlReady(url, fetcher)) {
            return;
        }
        await sleepFn(intervalMs);
    }
    throw new Error(`Timed out waiting ${timeoutMs}ms for ${url}`);
}
