import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLayoutGate } from "@/components/admin/AdminLayoutGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutGate shell={<AdminAuthShell>{children}</AdminAuthShell>}>
      {children}
    </AdminLayoutGate>
  );
}
