export function chartHeight(categoryCount: number) {
  return categoryCount <= 3 ? 224 : 288; // h-56 vs h-72
}

export const REPORT_MAX_BAR_SIZE = 48;

export function downloadCsv(data: Record<string, string | number | null | undefined>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]!);
  const rows = data.map((row) =>
    headers.map((fieldName) => JSON.stringify(row[fieldName] ?? "")).join(","),
  );
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
