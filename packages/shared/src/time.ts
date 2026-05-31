const pad = (value: number) => value.toString().padStart(2, "0");

export function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "0"] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    0
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function toLocalDateTimeValue(date: Date, includeSeconds = true): string {
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

export function toDateTimeInputValue(value: string): string {
  const date = parseLocalDateTime(value);
  if (!date) {
    return "";
  }

  return toLocalDateTimeValue(date, false);
}

export function fromDateTimeInputValue(value: string): string {
  if (!value) {
    return "";
  }

  return value.length === 16 ? `${value}:00` : value;
}

export function formatDisplayDateTime(value: string): string {
  const date = parseLocalDateTime(value);
  if (!date) {
    return value;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }

  return `${minutes}分钟`;
}
