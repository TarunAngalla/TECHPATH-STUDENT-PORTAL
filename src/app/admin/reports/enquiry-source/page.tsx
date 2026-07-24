import { requireAdminAuth } from "@/lib/auth/guards";
import { getEnquirySourceReportData } from "@/lib/db/queries/admin/reports";
import { parseReportRange, resolveReportDateRange } from "@/lib/reports/range";
import { EnquirySourceClient } from "./client";

export default async function EnquirySourcePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminAuth();
  const resolvedParams = await searchParams;
  const range = parseReportRange(resolvedParams.range);
  const { start, end, label } = resolveReportDateRange(range);
  const data = await getEnquirySourceReportData(start, end);

  return <EnquirySourceClient data={data} range={range} rangeLabel={label} />;
}
