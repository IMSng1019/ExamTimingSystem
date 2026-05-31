import { describe, expect, test } from "vitest";
import { createDefaultExamConfig } from "@exam-countdown/shared";
import { validateExamConfigPayload } from "./config.validation";

describe("config validation", () => {
  test("accepts a valid default config", () => {
    const result = validateExamConfigPayload(createDefaultExamConfig(new Date("2026-04-11T15:00:00")));

    expect(result.ok).toBe(true);
  });

  test("rejects a subject whose end time is before start time", () => {
    const config = createDefaultExamConfig(new Date("2026-04-11T15:00:00"));
    config.subjects[0].startTime = "2026-04-11T18:00:00";
    config.subjects[0].endTime = "2026-04-11T17:00:00";

    const result = validateExamConfigPayload(config);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("语文的结束时间必须晚于开考时间");
  });

  test("rejects selected subject keys that do not exist", () => {
    const config = createDefaultExamConfig(new Date("2026-04-11T15:00:00"));
    config.selectedSubjectKeys = ["unknown"];

    const result = validateExamConfigPayload(config);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("已选科目 unknown 不存在");
  });
});
