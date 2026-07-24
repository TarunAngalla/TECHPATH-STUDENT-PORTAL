import { NextResponse } from "next/server";
import { getApiPrincipal } from "@/lib/auth/api-guards";
import { logAudit } from "@/lib/auth/password";
import { getReportRows, reportTypes, type ReportType } from "@/lib/reports/export";
import { logger } from "@/lib/observability/logger";
import { getOrCreateRequestId } from "@/lib/observability/request-id";
import { toCsv } from "@/lib/utils/csv";

export const dynamic = "force-dynamic";

function parseDate(value: string | null, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request.headers);
  const principal = await getApiPrincipal(["admin"]);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const url = new URL(request.url);
  const requestedType = url.searchParams.get("type") ?? "candidates";
  if (!reportTypes.includes(requestedType as ReportType)) {
    return NextResponse.json({ error: "Unsupported report type", requestId }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"), true);
  if (from && to && from > to) {
    return NextResponse.json({ error: "Invalid date range", requestId }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    const type = requestedType as ReportType;
    const rows = await getReportRows(type, { from, to });
    const csv = toCsv(rows);
    const date = new Date().toISOString().slice(0, 10);
    await logAudit({ actorUserId: principal.userId, action: `export_report_${type}`, targetTable: "reports" });
    logger.info("reports.exported", { requestId, actorUserId: principal.userId, reportType: type, rowCount: rows.length, from, to });
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="techpath-${type}-${date}.csv"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    logger.error("reports.export_failed", error, { requestId, actorUserId: principal.userId, reportType: requestedType });
    return NextResponse.json({ error: "Report export failed", requestId }, { status: 500, headers: { "x-request-id": requestId } });
  }
}
