import { NdaManagementPage } from "@/components/admin/NdaManagementPage";
import { requireAdminAuth } from "@/lib/auth/guards";
import { getNdaAdminData } from "@/lib/db/queries/admin/nda";

export default async function AdminNdaPage() {
  await requireAdminAuth();
  const data = await getNdaAdminData();
  return <NdaManagementPage {...data} />;
}
