import Link from "next/link";
import { AlertCircle, BriefcaseBusiness, CalendarCheck, ClipboardCheck, TrendingUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { MARKETING_STATUS_LABELS } from "@/lib/constants/marketing";
import type { MarketingStatus } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils/dates";

export type MarketingProgressRow = {
  candidateId: string;
  candidateName: string;
  journeyStage: number;
  marketingStatus: MarketingStatus;
  marketingReadyAt: Date | string | null;
  marketingLiveAt: Date | string | null;
  marketingPausedAt: Date | string | null;
  marketingCompletedAt: Date | string | null;
  marketingNotes: string | null;
  recruiterId: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  applications: number;
  interviews: number;
  assessments: number;
  pendingFeedback: number;
};

function statusVariant(status: MarketingStatus): "success" | "warning" | "accent" | "muted" {
  if (status === "live" || status === "completed") return "success";
  if (status === "paused") return "warning";
  if (status === "ready") return "accent";
  return "muted";
}

function latestStatusDate(row: MarketingProgressRow) {
  return row.marketingCompletedAt ?? row.marketingPausedAt ?? row.marketingLiveAt ?? row.marketingReadyAt;
}

export function MarketingProgressOverview({ rows, scopedToRecruiter }: { rows: MarketingProgressRow[]; scopedToRecruiter: boolean }) {
  const live = rows.filter((row) => row.marketingStatus === "live").length;
  const ready = rows.filter((row) => row.marketingStatus === "ready").length;
  const paused = rows.filter((row) => row.marketingStatus === "paused").length;
  const attention = rows.filter((row) => row.pendingFeedback > 0 || (row.marketingStatus === "live" && row.applications === 0)).length;

  return (
    <section className="grid gap-5" aria-labelledby="marketing-heading">
      <div>
        <h2 id="marketing-heading" className="text-xl font-bold text-text-primary">Marketing Progress</h2>
        <p className="mt-1 text-sm text-text-muted">
          {scopedToRecruiter ? "Your assigned candidates and verified placement activity." : "Candidate marketing readiness, live activity, and follow-up signals."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Marketing live", value: live, icon: TrendingUp },
          { label: "Ready to launch", value: ready, icon: BriefcaseBusiness },
          { label: "Paused", value: paused, icon: AlertCircle },
          { label: "Needs attention", value: attention, icon: AlertCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} variant="glass" className="bg-white p-4 border border-border-strong/50 shadow-xs">
            <div className="flex items-center justify-between"><span className="text-xs text-text-muted">{label}</span><Icon size={16} className="text-brand-500" /></div>
            <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          </Card>
        ))}
      </div>

      <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-text-muted">No candidates are available in this marketing view.</p>
        ) : (
          <div className="overflow-x-auto max-h-[min(36rem,65vh)] overflow-y-auto">
            <table className="w-full min-w-[980px] text-left" aria-label="Candidate marketing progress">
              <thead className="sticky top-0 z-[1]"><tr className="border-b border-border-subtle bg-surface/95 backdrop-blur-sm">
                {[
                  "Candidate",
                  "Marketing status",
                  "Journey",
                  "Recruiter",
                  "Verified activity",
                  "Attention",
                ].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.candidateId} className="border-b border-border-subtle last:border-0 hover:bg-surface/40 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/candidates/${row.candidateId}`} className="text-sm font-semibold text-text-primary hover:text-brand-500">{row.candidateName}</Link>
                      {row.marketingNotes && <p className="mt-1 max-w-xs text-[11px] text-text-muted line-clamp-2">{row.marketingNotes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.marketingStatus)}>{MARKETING_STATUS_LABELS[row.marketingStatus]}</Badge>
                      {latestStatusDate(row) && <p className="mt-1 text-[10px] text-text-muted">Updated {formatDate(latestStatusDate(row)!)}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{JOURNEY_STEPS[row.journeyStage] ?? `Stage ${row.journeyStage}`}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{row.recruiterName ?? row.recruiterEmail ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={12} /> {row.applications} apps</span>
                        <span className="inline-flex items-center gap-1"><CalendarCheck size={12} /> {row.interviews} interviews</span>
                        <span className="inline-flex items-center gap-1"><ClipboardCheck size={12} /> {row.assessments} assessments</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.pendingFeedback > 0 ? <Badge variant="warning">{row.pendingFeedback} feedback pending</Badge> : row.marketingStatus === "live" && row.applications === 0 ? <Badge variant="warning">No applications yet</Badge> : <span className="text-success font-semibold">On track</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
