import type { ExamConfig } from "@exam-countdown/shared";

export type PreloadableAudio = {
  load: () => void;
  preload: string;
};

export function collectBellAudioUrls(
  config: Pick<ExamConfig, "audioDirectory" | "bellRules">,
  createUrl: (directory: string, name: string) => string
): string[] {
  if (!config.audioDirectory) {
    return [];
  }

  const urls = new Set<string>();
  for (const rule of config.bellRules) {
    if (rule.enabled && rule.audioFile) {
      urls.add(createUrl(config.audioDirectory, rule.audioFile));
    }
  }

  return Array.from(urls);
}

export function syncPreloadedAudio<T extends PreloadableAudio>(
  cache: Map<string, T>,
  urls: string[],
  createAudio: (url: string) => T
) {
  const expectedUrls = new Set(urls);

  for (const url of cache.keys()) {
    if (!expectedUrls.has(url)) {
      cache.delete(url);
    }
  }

  for (const url of expectedUrls) {
    if (cache.has(url)) {
      continue;
    }

    const audio = createAudio(url);
    audio.preload = "auto";
    audio.load();
    cache.set(url, audio);
  }
}
