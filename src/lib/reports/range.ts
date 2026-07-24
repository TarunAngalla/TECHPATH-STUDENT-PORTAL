export const REPORT_RANGES = ["this_week", "last_30_days", "last_90_days", "all_time"] as const;
export type ReportRangeKey = (typeof REPORT_RANGES)[number];

export const DEFAULT_REPORT_RANGE: ReportRangeKey = "last_90_days";

export function parseReportRange(raw?: string | null): ReportRangeKey {
  if (raw && (REPORT_RANGES as readonly string[]).includes(raw)) {
    return raw as ReportRangeKey;
  }
  return DEFAULT_REPORT_RANGE;
}

/** Inclusive start / exclusive end, day-normalized like dashboard week math. */
export function resolveReportDateRange(range: ReportRangeKey, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1); // exclusive tomorrow midnight

  const start = new Date(end);

  if (range === "all_time") {
    return { start: new Date(0), end, label: formatRangeLabel(new Date(0), end, true) };
  }

  if (range === "last_30_days") {
    start.setDate(end.getDate() - 30);
  } else if (range === "last_90_days") {
    start.setDate(end.getDate() - 90);
  } else {
    // Calendar week Sunday→Saturday aligned with dashboard
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return {
      start: weekStart,
      end,
      label: formatRangeLabel(weekStart, end, false),
    };
  }

  start.setHours(0, 0, 0, 0);
  return { start, end, label: formatRangeLabel(start, end, false) };
}

function formatRangeLabel(start: Date, endExclusive: Date, allTime: boolean) {
  if (allTime) return "All time";
  const endInclusive = new Date(endExclusive);
  endInclusive.setDate(endInclusive.getDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `Showing ${fmt(start)} – ${fmt(endInclusive)}`;
}

export const SOURCE_LABELS: Record<string, string> = {
  enquiry_form: "Enquiry Form",
  consultation_booked: "Consultation Booked",
};

export function labelLeadSource(source: string) {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatReportPercent(part: number, whole: number) {
  if (whole <= 0) return "—";
  return `${((part / whole) * 100).toFixed(1)}%`;
}
