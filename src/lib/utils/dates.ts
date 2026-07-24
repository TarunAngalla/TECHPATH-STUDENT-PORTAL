const ISO_TIMESTAMP_IN_TEXT =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?/g;

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntil(date: Date | string | null): number | null {
  const target = toValidDate(date);
  if (!target) return null;
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(date: Date | string | null, options?: Intl.DateTimeFormatOptions) {
  const d = toValidDate(date);
  if (!d) return "";
  return d.toLocaleDateString("en-US", options ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: Date | string | null, timeZone?: string) {
  const d = toValidDate(date);
  if (!d) return "";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  };
  try {
    return d.toLocaleString("en-US", options);
  } catch {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
}

/** Compact date+time for embedded copy (announcements, notes, emails). */
export function formatDisplayTimestamp(date: Date | string | null, timeZone?: string) {
  const d = toValidDate(date);
  if (!d) return "";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone, timeZoneName: "short" } : {}),
  };
  try {
    return d.toLocaleString("en-US", options);
  } catch {
    return formatDateTime(d);
  }
}

/**
 * Replace raw ISO-8601 timestamps embedded in free text with readable dates.
 * Fixes stored announcement bodies that were built with `toISOString()`.
 */
export function formatIsoTimestampsInText(text: string, timeZone?: string) {
  if (!text) return text;
  return text.replace(ISO_TIMESTAMP_IN_TEXT, (match) => {
    const formatted = formatDisplayTimestamp(match, timeZone);
    return formatted || match;
  });
}

/** Value for `<input type="datetime-local">` from a UTC/DB instant. */
export function toDateTimeLocalValue(date: Date | string | null | undefined) {
  const d = toValidDate(date);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse a datetime-local wall time into an ISO UTC string for server actions. */
export function fromDateTimeLocalValue(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Calendar date (YYYY-MM-DD) for `<input type="date">`. */
export function toDateInputValue(date: Date | string | null | undefined) {
  const d = toValidDate(date);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayLabel(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
