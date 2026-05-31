import type { BellRule, ExamConfig, ExamStatus, ExamSubject } from "./types";
export declare function getSelectedSubjects(config: ExamConfig): ExamSubject[];
export declare function getMergedSchedule(config: ExamConfig): ExamSubject | null;
export declare function getExamStatus(config: ExamConfig, now?: Date): ExamStatus;
export declare function getRemainingText(config: ExamConfig, now?: Date): string;
export declare function calculateBellTarget(schedule: Pick<ExamSubject, "startTime" | "endTime">, rule: BellRule): Date | null;
export declare function createBellTriggerKey(schedule: ExamSubject, rule: BellRule): string | null;
