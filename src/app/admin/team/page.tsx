import { requireAdminAuth } from "@/lib/auth/guards";
import { getStaffUsers } from "@/lib/db/queries/admin/team";
import { TeamPermissionsPage } from "@/components/admin/TeamPermissionsPage";

export default async function AdminTeamPage() {
  await requireAdminAuth();
  const staff = await getStaffUsers();

  return <TeamPermissionsPage staff={staff} isAdmin />;
}
