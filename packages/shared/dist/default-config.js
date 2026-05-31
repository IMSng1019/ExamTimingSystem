"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BELL_RULES = exports.DEFAULT_TEXTS = exports.SUBJECT_OPTIONS = void 0;
exports.createDefaultSubjects = createDefaultSubjects;
exports.createDefaultExamConfig = createDefaultExamConfig;
const time_1 = require("./time");
exports.SUBJECT_OPTIONS = [
    ["chinese", "语文"],
    ["math", "数学"],
    ["english", "英语"],
    ["physics", "物理"],
    ["chemistry", "化学"],
    ["biology", "生物"],
    ["politics", "政治"],
    ["history", "历史"],
    ["geography", "地理"]
];
exports.DEFAULT_TEXTS = {
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
};
exports.DEFAULT_BELL_RULES = [
    {
        id: "start-before-15",
        name: "考前15分钟",
        enabled: true,
        anchor: "start",
        direction: "before",
        offsetSeconds: 15 * 60,
        audioFile: ""
    },
    {
        id: "start-before-5",
        name: "考前5分钟",
        enabled: true,
        anchor: "start",
        direction: "before",
        offsetSeconds: 5 * 60,
        audioFile: ""
    },
    {
        id: "exam-start",
        name: "考试开始",
        enabled: true,
        anchor: "start",
        direction: "after",
        offsetSeconds: 0,
        audioFile: ""
    },
    {
        id: "exam-end",
        name: "考试结束",
        enabled: true,
        anchor: "end",
        direction: "after",
        offsetSeconds: 0,
        audioFile: ""
    }
];
function createDefaultSubjects(now = new Date()) {
    const start = new Date(now.getTime() + 65 * 60 * 1000);
    const end = new Date(start.getTime() + 75 * 60 * 1000);
    start.setSeconds(0, 0);
    end.setSeconds(0, 0);
    return exports.SUBJECT_OPTIONS.map(([key, label]) => ({
        key,
        label,
        startTime: (0, time_1.toLocalDateTimeValue)(start),
        endTime: (0, time_1.toLocalDateTimeValue)(end)
    }));
}
function createDefaultExamConfig(now = new Date()) {
    return {
        texts: { ...exports.DEFAULT_TEXTS },
        subjects: createDefaultSubjects(now),
        selectedSubjectKeys: ["biology"],
        audioDirectory: "",
        bellRules: exports.DEFAULT_BELL_RULES.map((rule) => ({ ...rule }))
    };
}
