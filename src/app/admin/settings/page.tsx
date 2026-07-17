import { requireStaffAuth } from "@/lib/auth/guards";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";

export default async function AdminSettingsRoute() {
  const session = await requireStaffAuth();

  return <AdminSettingsPage email={session.email} />;
}
