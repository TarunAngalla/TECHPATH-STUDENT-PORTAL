import { redirect } from "next/navigation";
import { getCandidateAccessState } from "@/lib/auth/candidate-access";
import { requireCandidateAuth } from "@/lib/auth/guards";
export default async function AccountSuspendedPage() {
  const session = await requireCandidateAuth();
  const access = await getCandidateAccessState(session.userId);
  if (!access) redirect("/api/auth/logout?next=/login");
  if (access.state !== "SUSPENDED") redirect("/dashboard");
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-border-strong/50 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary">Account access is suspended</h1>
        <p className="mt-3 text-sm text-text-muted">Contact TechPath support to review or restore access.</p>
      </section>
    </main>
  );
}
