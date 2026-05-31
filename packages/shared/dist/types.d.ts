export type ExamState = "ready" | "running" | "ended";
export type BellAnchor = "start" | "end";
export type BellDirection = "before" | "after";
export interface DisplayTexts {
    title: string;
    subjectLabel: string;
    startLabel: string;
    endLabel: string;
    readyStatus: string;
    runningStatus: string;
    endedStatus: string;
    beforeStartPrefix: string;
    beforeEndPrefix: string;
    afterEndText: string;
    footerLeft: string;
    footerRight: string;
}
export interface ExamSubject {
    key: string;
    label: string;
    startTime: string;
    endTime: string;
}
export interface BellRule {
    id: string;
    name: string;
    enabled: boolean;
    anchor: BellAnchor;
    direction: BellDirection;
    offsetSeconds: number;
    audioFile: string;
}
export interface ExamConfig {
    texts: DisplayTexts;
    subjects: ExamSubject[];
    selectedSubjectKeys: string[];
    audioDirectory: string;
    bellRules: BellRule[];
}
export interface ExamStatus {
    state: ExamState;
    label: string;
}
export interface AudioFileInfo {
    name: string;
    size: number;
}
