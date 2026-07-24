import { requireAdminAuth } from "@/lib/auth/guards";
import { getOrgEmailDomain } from "@/lib/config/org";
import { getStaffUsers } from "@/lib/db/queries/admin/team";
import { TeamPermissionsPage } from "@/components/admin/TeamPermissionsPage";

export default async function AdminTeamPage() {
  await requireAdminAuth();
  const staff = await getStaffUsers();
  const staffEmailDomain = getOrgEmailDomain();

  return (
    <TeamPermissionsPage
      staff={staff.map((member) => ({
        ...member,
        createdAt: member.createdAt instanceof Date ? member.createdAt : new Date(member.createdAt),
      }))}
      isAdmin
      staffEmailDomain={staffEmailDomain}
    />
  );
}
