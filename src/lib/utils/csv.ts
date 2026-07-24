export type CsvPrimitive = string | number | boolean | Date | null | undefined;

function protectSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function csvCell(value: CsvPrimitive) {
  if (value === null || value === undefined) return "";
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const safe = protectSpreadsheetFormula(raw.replaceAll("\u0000", ""));
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toCsv(rows: Record<string, CsvPrimitive>[]) {
  if (rows.length === 0) return "No data\r\n";
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvCell(row[header])).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
