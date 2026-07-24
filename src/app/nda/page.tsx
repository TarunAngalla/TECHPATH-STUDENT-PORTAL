import Link from "next/link";
import { redirect } from "next/navigation";
import { FileCheck2, History, ShieldCheck } from "lucide-react";
import { NdaSigningForm } from "@/components/candidate/NdaSigningForm";
import { Badge, Button, Card } from "@/components/ui";
import { getCandidateAccessState } from "@/lib/auth/candidate-access";
import { requireCandidateAuth } from "@/lib/auth/guards";
import { candidateLogoutAction } from "@/lib/actions/auth";
import { getCandidateNdaView } from "@/lib/services/nda";

function formatSignedDate(value: Date | null) {
  if (!value) return "Date unavailable";
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function NdaGatePage() {
  const session = await requireCandidateAuth();
  const access = await getCandidateAccessState(session.userId);
  if (!access) redirect("/api/auth/logout?next=/login");
  if (access.state === "ACCOUNT_SETUP_REQUIRED") redirect("/reset-password");
  if (access.state === "PORTAL_ACTIVE") redirect("/dashboard");
  if (access.state === "SUSPENDED") redirect("/account-suspended");

  const view = await getCandidateNdaView(session.userId);
  if (!view) redirect("/api/auth/logout?next=/login");

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
              <ShieldCheck size={16} aria-hidden="true" /> Secure candidate access
            </div>
            <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">Review and sign your NDA</h1>
            <p className="mt-1 text-sm text-text-muted">
              Full TechPath portal access begins after the active agreement is signed.
            </p>
          </div>
          <form action={candidateLogoutAction}>
            <Button type="submit" variant="outline" size="sm">Sign out</Button>
          </form>
        </header>

        {!view.template ? (
          <Card variant="solid" className="p-8 text-center">
            <FileCheck2 className="mx-auto h-10 w-10 text-warning" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-text-primary">NDA is being prepared</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Your account setup is complete, but TechPath has not activated an NDA template yet. Contact support if this page remains unchanged.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <a href="mailto:support@thetechpath.com">Contact support</a>
            </Button>
          </Card>
        ) : (
          <>
            <Card variant="solid" className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-border-subtle bg-white px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{view.template.title}</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Effective {view.template.effectiveFrom.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Badge variant="accent">Version {view.template.version}</Badge>
              </div>
              <div className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap px-6 py-6 text-sm leading-7 text-text-primary sm:px-8">
                {view.template.content}
              </div>
              <div className="border-t border-border-subtle bg-white px-6 py-6 sm:px-8">
                <NdaSigningForm candidateName={view.candidateName} />
              </div>
            </Card>

            {view.signedHistory.length > 0 && (
              <Card variant="glass" className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <History size={16} className="text-text-muted" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-text-primary">Previously signed agreements</h2>
                </div>
                <div className="space-y-2">
                  {view.signedHistory.map((agreement) => (
                    <div key={agreement.id} className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {agreement.templateTitle} · Version {agreement.templateVersion}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">Signed {formatSignedDate(agreement.acceptedAt)}</p>
                      </div>
                      {agreement.signedDocumentPath && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/api/nda-agreements/${agreement.id}/download`}>Download signed PDF</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
