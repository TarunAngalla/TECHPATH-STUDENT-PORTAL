import { requireAdminAuth } from "@/lib/auth/guards";
import { getMarketingActivityReportData } from "@/lib/db/queries/admin/reports";
import { parseReportRange, resolveReportDateRange } from "@/lib/reports/range";
import { MarketingActivityClient } from "./client";

export default async function MarketingActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminAuth();
  const resolvedParams = await searchParams;
  const range = parseReportRange(resolvedParams.range);
  const { start, end, label } = resolveReportDateRange(range);
  const data = await getMarketingActivityReportData(start, end);

  return <MarketingActivityClient data={data} range={range} rangeLabel={label} />;
}
