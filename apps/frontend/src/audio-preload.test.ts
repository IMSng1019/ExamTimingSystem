import { describe, expect, test, vi } from "vitest";
import type { BellRule, ExamConfig } from "@exam-countdown/shared";
import { collectBellAudioUrls, syncPreloadedAudio } from "./audio-preload";

const makeRule = (patch: Partial<BellRule>): BellRule => ({
  id: patch.id ?? "rule",
  name: patch.name ?? "rule",
  enabled: patch.enabled ?? true,
  anchor: patch.anchor ?? "start",
  direction: patch.direction ?? "before",
  offsetSeconds: patch.offsetSeconds ?? 0,
  audioFile: patch.audioFile ?? ""
});

const makeConfig = (patch: Partial<ExamConfig>): Pick<ExamConfig, "audioDirectory" | "bellRules"> => ({
  audioDirectory: patch.audioDirectory ?? "D:\\audio",
  bellRules: patch.bellRules ?? []
});

describe("audio preloading", () => {
  test("collects unique enabled bell audio URLs", () => {
    const config = makeConfig({
      bellRules: [
        makeRule({ id: "start", audioFile: "start.mp3" }),
        makeRule({ id: "duplicate", audioFile: "start.mp3" }),
        makeRule({ id: "default", audioFile: "" }),
        makeRule({ id: "disabled", enabled: false, audioFile: "disabled.mp3" })
      ]
    });

    expect(collectBellAudioUrls(config, (directory, name) => `${directory}/${name}`)).toEqual(["D:\\audio/start.mp3"]);
  });

  test("does not preload files without an audio directory", () => {
    const config = makeConfig({
      audioDirectory: "",
      bellRules: [makeRule({ audioFile: "start.mp3" })]
    });

    expect(collectBellAudioUrls(config, (directory, name) => `${directory}/${name}`)).toEqual([]);
  });

  test("loads new audio entries, keeps existing ones, and removes stale entries", () => {
    const staleAudio = {
      load: vi.fn(),
      preload: ""
    };
    const existingAudio = {
      load: vi.fn(),
      preload: "auto"
    };
    const createdAudio = {
      load: vi.fn(),
      preload: ""
    };
    const cache = new Map([
      ["old.mp3", staleAudio],
      ["keep.mp3", existingAudio]
    ]);
    const createAudio = vi.fn((url: string) => {
      expect(url).toBe("new.mp3");
      return createdAudio;
    });

    syncPreloadedAudio(cache, ["keep.mp3", "new.mp3"], createAudio);

    expect(cache.has("old.mp3")).toBe(false);
    expect(cache.get("keep.mp3")).toBe(existingAudio);
    expect(cache.get("new.mp3")).toBe(createdAudio);
    expect(existingAudio.load).not.toHaveBeenCalled();
    expect(createdAudio.preload).toBe("auto");
    expect(createdAudio.load).toHaveBeenCalledTimes(1);
  });
});
