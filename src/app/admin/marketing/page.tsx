import { MarketingProgressOverview } from "@/components/admin/MarketingProgressOverview";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { getMarketingProgressRows } from "@/lib/db/queries/admin/marketing";

export default async function AdminMarketingPage() {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const rows = await getMarketingProgressRows(scope);
  return <MarketingProgressOverview rows={rows} scopedToRecruiter={!scope.seesAllCandidates} />;
}
