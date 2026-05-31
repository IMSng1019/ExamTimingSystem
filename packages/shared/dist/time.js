"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocalDateTime = parseLocalDateTime;
exports.toLocalDateTimeValue = toLocalDateTimeValue;
exports.toDateTimeInputValue = toDateTimeInputValue;
exports.fromDateTimeInputValue = fromDateTimeInputValue;
exports.formatDisplayDateTime = formatDisplayDateTime;
exports.formatClock = formatClock;
exports.formatDuration = formatDuration;
const pad = (value) => value.toString().padStart(2, "0");
function parseLocalDateTime(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) {
        return null;
    }
    const [, year, month, day, hour, minute, second = "0"] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), 0);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}
function toLocalDateTimeValue(date, includeSeconds = true) {
    const base = [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-");
    const time = [pad(date.getHours()), pad(date.getMinutes())];
    if (includeSeconds) {
        time.push(pad(date.getSeconds()));
    }
    return `${base}T${time.join(":")}`;
}
function toDateTimeInputValue(value) {
    const date = parseLocalDateTime(value);
    if (!date) {
        return "";
    }
    return toLocalDateTimeValue(date, false);
}
function fromDateTimeInputValue(value) {
    if (!value) {
        return "";
    }
    return value.length === 16 ? `${value}:00` : value;
}
function formatDisplayDateTime(value) {
    const date = parseLocalDateTime(value);
    if (!date) {
        return value;
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function formatClock(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function formatDuration(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const totalMinutes = Math.floor(safeSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
}
