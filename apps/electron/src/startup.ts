export const BACKEND_STARTUP_TIMEOUT_MS = 90_000;
export const FRONTEND_STARTUP_TIMEOUT_MS = 30_000;

type FetchLike = (url: string) => Promise<{ ok: boolean }>;
type SleepLike = (durationMs: number) => Promise<void>;

type WaitForUrlOptions = {
  fetcher?: FetchLike;
  intervalMs?: number;
  sleep?: SleepLike;
  timeoutMs?: number;
};

function sleep(durationMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, durationMs));
}

export async function isUrlReady(url: string, fetcher: FetchLike = fetch): Promise<boolean> {
  try {
    const response = await fetcher(url);
    return response.ok;
  } catch {
    return false;
  }
}

export async function waitForUrl(url: string, options: WaitForUrlOptions = {}) {
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
