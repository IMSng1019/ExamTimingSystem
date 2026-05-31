export declare function parseLocalDateTime(value: string): Date | null;
export declare function toLocalDateTimeValue(date: Date, includeSeconds?: boolean): string;
export declare function toDateTimeInputValue(value: string): string;
export declare function fromDateTimeInputValue(value: string): string;
export declare function formatDisplayDateTime(value: string): string;
export declare function formatClock(date: Date): string;
export declare function formatDuration(totalSeconds: number): string;
