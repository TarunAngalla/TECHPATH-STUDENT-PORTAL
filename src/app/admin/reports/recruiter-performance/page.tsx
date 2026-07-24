import { requireAdminAuth } from "@/lib/auth/guards";
import { getRecruiterPerformanceReportData } from "@/lib/db/queries/admin/reports";
import { parseReportRange, resolveReportDateRange } from "@/lib/reports/range";
import { RecruiterPerformanceClient } from "./client";

export default async function RecruiterPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminAuth();
  const resolvedParams = await searchParams;
  const range = parseReportRange(resolvedParams.range);
  const { start, end, label } = resolveReportDateRange(range);
  const data = await getRecruiterPerformanceReportData(start, end);

  return <RecruiterPerformanceClient data={data} range={range} rangeLabel={label} />;
}
