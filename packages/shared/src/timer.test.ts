import { describe, expect, test } from "vitest";
import {
  calculateBellTarget,
  getExamStatus,
  getMergedSchedule,
  getRemainingText
} from "./timer";
import type { BellRule, ExamConfig, ExamSubject } from "./types";

const subjects: ExamSubject[] = [
  {
    key: "biology",
    label: "生物",
    startTime: "2026-04-11T17:00:00",
    endTime: "2026-04-11T18:15:00"
  },
  {
    key: "chemistry",
    label: "化学",
    startTime: "2026-04-11T16:30:00",
    endTime: "2026-04-11T18:00:00"
  }
];

const config: ExamConfig = {
  texts: {
    title: "西大附中高三二诊定时检测指令",
    subjectLabel: "考试科目",
    startLabel: "开考时间",
    endLabel: "结束时间",
    readyStatus: "准备",
    runningStatus: "进行中...",
    endedStatus: "结束",
    beforeStartPrefix: "离开始还有",
    beforeEndPrefix: "离结束还有",
    afterEndText: "考试已结束",
    footerLeft: "重庆市教育考试院监制",
    footerRight: "北碚区教育考试中心制作"
  },
  subjects,
  selectedSubjectKeys: ["biology"],
  audioDirectory: "",
  bellRules: []
};

describe("exam timer", () => {
  test("shows ready before the selected exam starts", () => {
    const status = getExamStatus(config, new Date("2026-04-11T15:54:10"));

    expect(status.state).toBe("ready");
    expect(status.label).toBe("准备");
  });

  test("shows running during the selected exam", () => {
    const status = getExamStatus(config, new Date("2026-04-11T17:20:00"));

    expect(status.state).toBe("running");
    expect(status.label).toBe("进行中...");
  });

  test("shows ended after the selected exam ends", () => {
    const status = getExamStatus(config, new Date("2026-04-11T18:20:00"));

    expect(status.state).toBe("ended");
    expect(status.label).toBe("结束");
  });

  test("formats remaining text before start and before end", () => {
    expect(getRemainingText(config, new Date("2026-04-11T15:54:10"))).toBe("离开始还有：1小时5分钟");
    expect(getRemainingText(config, new Date("2026-04-11T17:50:00"))).toBe("离结束还有：25分钟");
    expect(getRemainingText(config, new Date("2026-04-11T18:20:00"))).toBe("考试已结束");
  });

  test("uses earliest start and latest end when multiple subjects are selected", () => {
    const merged = getMergedSchedule({
      ...config,
      selectedSubjectKeys: ["biology", "chemistry"]
    });

    expect(merged?.startTime).toBe("2026-04-11T16:30:00");
    expect(merged?.endTime).toBe("2026-04-11T18:15:00");
  });

  test("calculates bell targets from start and end offsets", () => {
    const startBefore: BellRule = {
      id: "start-before-15",
      name: "考前15分钟",
      enabled: true,
      anchor: "start",
      direction: "before",
      offsetSeconds: 900,
      audioFile: ""
    };
    const endAfter: BellRule = {
      id: "end-after-60",
      name: "结束后1分钟",
      enabled: true,
      anchor: "end",
      direction: "after",
      offsetSeconds: 60,
      audioFile: ""
    };

    expect(calculateBellTarget(subjects[0], startBefore)?.toISOString()).toBe("2026-04-11T08:45:00.000Z");
    expect(calculateBellTarget(subjects[0], endAfter)?.toISOString()).toBe("2026-04-11T10:16:00.000Z");
  });
});
