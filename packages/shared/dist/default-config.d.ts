import type { BellRule, DisplayTexts, ExamConfig, ExamSubject } from "./types";
export declare const SUBJECT_OPTIONS: readonly [readonly ["chinese", "语文"], readonly ["math", "数学"], readonly ["english", "英语"], readonly ["physics", "物理"], readonly ["chemistry", "化学"], readonly ["biology", "生物"], readonly ["politics", "政治"], readonly ["history", "历史"], readonly ["geography", "地理"]];
export declare const DEFAULT_TEXTS: DisplayTexts;
export declare const DEFAULT_BELL_RULES: BellRule[];
export declare function createDefaultSubjects(now?: Date): ExamSubject[];
export declare function createDefaultExamConfig(now?: Date): ExamConfig;
