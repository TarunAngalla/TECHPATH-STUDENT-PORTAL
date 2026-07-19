import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CandidateLoginForm } from "@/components/candidate/CandidateLoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "candidate") {
      redirect("/dashboard");
    } else if (user.role === "recruiter" || user.role === "admin") {
      redirect("/admin/dashboard");
    }
  }

  return <CandidateLoginForm />;
}
