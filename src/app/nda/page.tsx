import { redirect } from "next/navigation";
import { getCandidateAccessState } from "@/lib/auth/candidate-access";
import { requireCandidateAuth } from "@/lib/auth/guards";

export default async function NdaGatePage() {
  const session = await requireCandidateAuth();
  const access = await getCandidateAccessState(session.userId);
  if (!access) redirect("/api/auth/logout?next=/login");
  if (access.state === "ACCOUNT_SETUP_REQUIRED") redirect("/reset-password");
  if (access.state === "PORTAL_ACTIVE") redirect("/dashboard");
  if (access.state === "SUSPENDED") redirect("/account-suspended");
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-border-strong/50 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Secure access</p>
        <h1 className="mt-2 text-2xl font-bold text-text-primary">NDA signature required</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Your account setup is complete. Full portal access remains blocked until the active NDA is signed.
        </p>
      </section>
    </main>
  );
}
