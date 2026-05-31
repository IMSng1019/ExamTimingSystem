import type { BellRule, ExamConfig, ExamStatus, ExamSubject } from "./types";
import { formatDuration, parseLocalDateTime } from "./time";

export function getSelectedSubjects(config: ExamConfig): ExamSubject[] {
  const selected = new Set(config.selectedSubjectKeys);
  const matches = config.subjects.filter((subject) => selected.has(subject.key));
  return matches.length > 0 ? matches : config.subjects.slice(0, 1);
}

export function getMergedSchedule(config: ExamConfig): ExamSubject | null {
  const subjects = getSelectedSubjects(config);
  if (subjects.length === 0) {
    return null;
  }

  let earliest = subjects[0];
  let latest = subjects[0];
  let earliestTime = parseLocalDateTime(earliest.startTime)?.getTime() ?? Number.POSITIVE_INFINITY;
  let latestTime = parseLocalDateTime(latest.endTime)?.getTime() ?? Number.NEGATIVE_INFINITY;

  for (const subject of subjects) {
    const start = parseLocalDateTime(subject.startTime)?.getTime();
    const end = parseLocalDateTime(subject.endTime)?.getTime();

    if (start !== undefined && start < earliestTime) {
      earliest = subject;
      earliestTime = start;
    }

    if (end !== undefined && end > latestTime) {
      latest = subject;
      latestTime = end;
    }
  }

  return {
    key: subjects.map((subject) => subject.key).join("+"),
    label: subjects.map((subject) => subject.label).join("、"),
    startTime: earliest.startTime,
    endTime: latest.endTime
  };
}

export function getExamStatus(config: ExamConfig, now = new Date()): ExamStatus {
  const schedule = getMergedSchedule(config);
  const start = schedule ? parseLocalDateTime(schedule.startTime) : null;
  const end = schedule ? parseLocalDateTime(schedule.endTime) : null;

  if (!start || !end) {
    return {
      state: "ended",
      label: config.texts.endedStatus
    };
  }

  const current = now.getTime();
  if (current < start.getTime()) {
    return {
      state: "ready",
      label: config.texts.readyStatus
    };
  }

  if (current < end.getTime()) {
    return {
      state: "running",
      label: config.texts.runningStatus
    };
  }

  return {
    state: "ended",
    label: config.texts.endedStatus
  };
}

export function getRemainingText(config: ExamConfig, now = new Date()): string {
  const schedule = getMergedSchedule(config);
  const start = schedule ? parseLocalDateTime(schedule.startTime) : null;
  const end = schedule ? parseLocalDateTime(schedule.endTime) : null;

  if (!start || !end) {
    return config.texts.afterEndText;
  }

  const current = now.getTime();
  if (current < start.getTime()) {
    const seconds = (start.getTime() - current) / 1000;
    return `${config.texts.beforeStartPrefix}：${formatDuration(seconds)}`;
  }

  if (current < end.getTime()) {
    const seconds = (end.getTime() - current) / 1000;
    return `${config.texts.beforeEndPrefix}：${formatDuration(seconds)}`;
  }

  return config.texts.afterEndText;
}

export function calculateBellTarget(schedule: Pick<ExamSubject, "startTime" | "endTime">, rule: BellRule): Date | null {
  const base = parseLocalDateTime(rule.anchor === "start" ? schedule.startTime : schedule.endTime);
  if (!base) {
    return null;
  }

  const sign = rule.direction === "before" ? -1 : 1;
  return new Date(base.getTime() + sign * rule.offsetSeconds * 1000);
}

export function createBellTriggerKey(schedule: ExamSubject, rule: BellRule): string | null {
  const target = calculateBellTarget(schedule, rule);
  if (!target) {
    return null;
  }

  return `${schedule.key}:${schedule.startTime}:${schedule.endTime}:${rule.id}:${target.getTime()}`;
}
