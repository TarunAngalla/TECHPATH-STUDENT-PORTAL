import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope, staffPortalSubtitle } from "@/lib/auth/staff-scope";
import { getDashboardStats } from "@/lib/db/queries/admin/dashboard";
import { AdminPortalShell } from "./AdminPortalShell";

function staffDisplayName(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function staffInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function AdminAuthShell({ children }: { children: React.ReactNode }) {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const stats = await getDashboardStats(scope);
  const name = staffDisplayName(session.email);

  return (
    <AdminPortalShell
      staffName={name}
      staffInitials={staffInitials(name)}
      staffRole={scope.role}
      portalSubtitle={staffPortalSubtitle(scope.role)}
      newLeadsBadge={stats.newLeads}
      unreadMessages={stats.unreadMessages}
    >
      {children}
    </AdminPortalShell>
  );
}
