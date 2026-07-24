import { requireAdminAuth } from "@/lib/auth/guards";
import { getConversionFunnelReportData } from "@/lib/db/queries/admin/reports";
import { parseReportRange, resolveReportDateRange } from "@/lib/reports/range";
import { ConversionFunnelClient } from "./client";

export default async function ConversionFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminAuth();
  const resolvedParams = await searchParams;
  const range = parseReportRange(resolvedParams.range);
  const { start, end, label } = resolveReportDateRange(range);
  const data = await getConversionFunnelReportData(start, end);

  return <ConversionFunnelClient data={data} range={range} rangeLabel={label} />;
}
