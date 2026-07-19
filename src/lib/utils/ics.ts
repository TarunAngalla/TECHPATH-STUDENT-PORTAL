export function downloadInterviewICS(app: {
  companyName: string;
  upcomingLabel: string | null;
  upcomingWhen: Date | string | null;
  upcomingPrep: string | null;
}) {
  if (!app.upcomingWhen || !app.upcomingLabel) return;
  const start = new Date(app.upcomingWhen);
  if (isNaN(start.getTime())) return;

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
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
