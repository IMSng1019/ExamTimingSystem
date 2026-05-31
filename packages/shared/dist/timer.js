"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectedSubjects = getSelectedSubjects;
exports.getMergedSchedule = getMergedSchedule;
exports.getExamStatus = getExamStatus;
exports.getRemainingText = getRemainingText;
exports.calculateBellTarget = calculateBellTarget;
exports.createBellTriggerKey = createBellTriggerKey;
const time_1 = require("./time");
function getSelectedSubjects(config) {
    const selected = new Set(config.selectedSubjectKeys);
    const matches = config.subjects.filter((subject) => selected.has(subject.key));
    return matches.length > 0 ? matches : config.subjects.slice(0, 1);
}
function getMergedSchedule(config) {
    const subjects = getSelectedSubjects(config);
    if (subjects.length === 0) {
        return null;
    }
    let earliest = subjects[0];
    let latest = subjects[0];
    let earliestTime = (0, time_1.parseLocalDateTime)(earliest.startTime)?.getTime() ?? Number.POSITIVE_INFINITY;
    let latestTime = (0, time_1.parseLocalDateTime)(latest.endTime)?.getTime() ?? Number.NEGATIVE_INFINITY;
    for (const subject of subjects) {
        const start = (0, time_1.parseLocalDateTime)(subject.startTime)?.getTime();
        const end = (0, time_1.parseLocalDateTime)(subject.endTime)?.getTime();
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
function getExamStatus(config, now = new Date()) {
    const schedule = getMergedSchedule(config);
    const start = schedule ? (0, time_1.parseLocalDateTime)(schedule.startTime) : null;
    const end = schedule ? (0, time_1.parseLocalDateTime)(schedule.endTime) : null;
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
function getRemainingText(config, now = new Date()) {
    const schedule = getMergedSchedule(config);
    const start = schedule ? (0, time_1.parseLocalDateTime)(schedule.startTime) : null;
    const end = schedule ? (0, time_1.parseLocalDateTime)(schedule.endTime) : null;
    if (!start || !end) {
        return config.texts.afterEndText;
    }
    const current = now.getTime();
    if (current < start.getTime()) {
        const seconds = (start.getTime() - current) / 1000;
        return `${config.texts.beforeStartPrefix}：${(0, time_1.formatDuration)(seconds)}`;
    }
    if (current < end.getTime()) {
        const seconds = (end.getTime() - current) / 1000;
        return `${config.texts.beforeEndPrefix}：${(0, time_1.formatDuration)(seconds)}`;
    }
    return config.texts.afterEndText;
}
function calculateBellTarget(schedule, rule) {
    const base = (0, time_1.parseLocalDateTime)(rule.anchor === "start" ? schedule.startTime : schedule.endTime);
    if (!base) {
        return null;
    }
    const sign = rule.direction === "before" ? -1 : 1;
    return new Date(base.getTime() + sign * rule.offsetSeconds * 1000);
}
function createBellTriggerKey(schedule, rule) {
    const target = calculateBellTarget(schedule, rule);
    if (!target) {
        return null;
    }
    return `${schedule.key}:${schedule.startTime}:${schedule.endTime}:${rule.id}:${target.getTime()}`;
}
