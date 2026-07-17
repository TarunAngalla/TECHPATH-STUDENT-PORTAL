import { redirectIfAuthenticated } from "@/lib/auth/guards";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  await redirectIfAuthenticated("admin");
  return <AdminLoginForm />;
}
