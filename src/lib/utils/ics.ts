export function downloadInterviewICS(app: {
  companyName: string;
  upcomingLabel: string | null;
  upcomingWhen: Date | string | null;
  upcomingPrep: string | null;
}) {
  if (!app.upcomingWhen || !app.upcomingLabel) return;
  const start = new Date(app.upcomingWhen);
  if (isNaN(start.getTime())) return;

  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${formatUtcCalendarDate(start)}`,
    `DTEND:${formatUtcCalendarDate(end)}`,
    `SUMMARY:${app.companyName} — ${app.upcomingLabel}`,
    `DESCRIPTION:${app.upcomingPrep ?? ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${app.companyName.replace(/\s+/g, "-")}-interview.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarLink(app: {
  companyName: string;
  upcomingLabel: string | null;
  upcomingWhen: Date | string | null;
  upcomingPrep: string | null;
}) {
  if (!app.upcomingWhen || !app.upcomingLabel) return "";
  const start = new Date(app.upcomingWhen);
  if (isNaN(start.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const end = new Date(start.getTime() + 60 * 60 * 1000);
  
  const title = encodeURIComponent(`${app.companyName} — ${app.upcomingLabel}`);
  const dates = `${fmt(start)}/${fmt(end)}`;
  const details = encodeURIComponent(app.upcomingPrep ?? "");
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
}

export type CalendarActivity = {
  companyName: string;
  title: string;
  scheduledAt: Date | string | null;
  scheduledEndAt?: Date | string | null;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
};

function activityDates(activity: CalendarActivity) {
  if (!activity.scheduledAt) return null;
  const start = new Date(activity.scheduledAt);
  if (Number.isNaN(start.getTime())) return null;
  const suppliedEnd = activity.scheduledEndAt ? new Date(activity.scheduledEndAt) : null;
  const end = suppliedEnd && !Number.isNaN(suppliedEnd.getTime()) && suppliedEnd > start
    ? suppliedEnd
    : new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

function formatUtcCalendarDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
}

export function downloadActivityICS(activity: CalendarActivity) {
  const dates = activityDates(activity);
  if (!dates) return;
  const summary = `${activity.companyName} — ${activity.title}`;
  const description = [activity.description, activity.meetingLink].filter(Boolean).join("\\n");
  const escape = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TechPath//Candidate Activity//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatUtcCalendarDate(dates.start)}`,
    `DTEND:${formatUtcCalendarDate(dates.end)}`,
    `SUMMARY:${escape(summary)}`,
    `DESCRIPTION:${escape(description)}`,
    activity.location ? `LOCATION:${escape(activity.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${activity.companyName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${activity.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getActivityGoogleCalendarLink(activity: CalendarActivity) {
  const dates = activityDates(activity);
  if (!dates) return "";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${activity.companyName} — ${activity.title}`,
    dates: `${formatUtcCalendarDate(dates.start)}/${formatUtcCalendarDate(dates.end)}`,
    details: [activity.description, activity.meetingLink].filter(Boolean).join("\n"),
    location: activity.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
