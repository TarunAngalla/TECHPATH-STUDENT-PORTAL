import Link from "next/link";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Search,
} from "lucide-react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import type { StaffActivityKind } from "@/lib/db/queries/admin/activities";
import { formatDateTime } from "@/lib/utils/dates";

export type StaffActivityRow = {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  companyName: string;
  roleTitle: string;
  appNo: string;
  title: string;
  activityType: string | null;
  status: string;
  scheduledAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  timezone: string;
  completedAt: Date | string | null;
  roundNumber: number | null;
  roundName: string | null;
  result: string | null;
  score: string | null;
  nextAction: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  updatedAt: Date | string;
};

const STATUS_OPTIONS = [
  "pending",
  "assigned",
  "scheduled",
  "confirmed",
  "in_progress",
  "submitted",
  "completed",
  "feedback_pending",
  "result_pending",
  "passed",
  "failed",
  "rescheduled",
  "cancelled",
  "no_show",
  "expired",
];

function statusVariant(status: string): "success" | "danger" | "warning" | "accent" | "muted" {
  if (["passed", "completed"].includes(status)) return "success";
  if (["failed", "cancelled", "expired", "no_show"].includes(status)) return "danger";
  if (["feedback_pending", "result_pending", "rescheduled"].includes(status)) return "warning";
  if (["scheduled", "confirmed", "in_progress", "assigned"].includes(status)) return "accent";
  return "muted";
}

export function StaffActivityOverview({
  kind,
  rows,
  metrics,
  query,
  status,
  scopedToRecruiter,
}: {
  kind: StaffActivityKind;
  rows: StaffActivityRow[];
  metrics: { total: number; upcoming: number; completed: number; pending: number; attention: number };
  query?: string;
  status?: string;
  scopedToRecruiter: boolean;
}) {
  const singular = kind === "interview" ? "Interview" : "Assessment";
  const plural = kind === "interview" ? "Interviews" : "Assessments";
  const Icon = kind === "interview" ? CalendarCheck : ClipboardCheck;
  const cards = [
    { label: `Total ${plural.toLowerCase()}`, value: metrics.total, icon: Icon },
    { label: "Upcoming", value: metrics.upcoming, icon: Clock3 },
    { label: "Completed", value: metrics.completed, icon: CheckCircle2 },
    { label: "Open / pending", value: metrics.pending, icon: Clock3 },
    { label: "Needs attention", value: metrics.attention, icon: AlertCircle },
  ];

  return (
    <section className="grid gap-5" aria-labelledby="activity-heading">
      <div>
        <h2 id="activity-heading" className="text-xl font-bold text-text-primary">{plural}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {scopedToRecruiter
            ? `Verified ${plural.toLowerCase()} for candidates assigned to you.`
            : `Organization-wide ${plural.toLowerCase()} and current follow-up status.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: MetricIcon }) => (
          <Card key={label} variant="glass" className="bg-white p-4 border border-border-strong/50 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">{label}</span>
              <MetricIcon size={16} className="text-brand-500" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          </Card>
        ))}
      </div>

      <Card variant="glass" className="bg-white p-4 border border-border-strong/50 shadow-xs">
        <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" method="get">
          <label className="relative">
            <span className="sr-only">Search {plural.toLowerCase()}</span>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input name="q" defaultValue={query} placeholder={`Search candidate, company, role, or ${singular.toLowerCase()}`} className="pl-9" />
          </label>
          <Select name="status" defaultValue={status ?? ""} aria-label={`Filter ${plural.toLowerCase()} by status`}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
          </Select>
          <Button type="submit" variant="outline">Apply filters</Button>
        </form>
      </Card>

      <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <Icon size={28} className="mx-auto text-text-muted/50" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-text-primary">No {plural.toLowerCase()} match this view.</p>
            <p className="mt-1 text-xs text-text-muted">Activity created from an application will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[min(36rem,65vh)] overflow-y-auto">
            <table className="w-full min-w-[1040px] text-left" aria-label={`${plural} work queue`}>
              <thead className="sticky top-0 z-[1]">
                <tr className="border-b border-border-subtle bg-surface/95 backdrop-blur-sm">
                  {[
                    singular,
                    "Candidate",
                    "Schedule",
                    "Status",
                    "Recruiter",
                    "Result / next action",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border-subtle last:border-0 align-top hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${row.applicationId}`} className="text-sm font-semibold text-text-primary hover:text-brand-500">
                        {row.title}
                      </Link>
                      <p className="mt-1 text-xs text-text-muted">{row.companyName} · {row.roleTitle}</p>
                      {(row.roundName || row.roundNumber) && (
                        <p className="mt-1 text-[11px] text-text-muted">{row.roundName ?? `Round ${row.roundNumber}`}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/candidates/${row.candidateId}`} className="text-xs font-semibold text-text-primary hover:text-brand-500">{row.candidateName}</Link>
                      <p className="mt-1 text-[11px] text-text-muted">{row.appNo}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {row.scheduledAt ? formatDateTime(row.scheduledAt, row.timezone) : "Not scheduled"}
                      <p className="mt-1 text-[10px]">{row.timezone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.status)}>{row.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{row.recruiterName ?? row.recruiterEmail ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {row.result || row.score ? (
                        <>
                          {row.result && <p><span className="font-semibold text-text-primary">Result:</span> {row.result}</p>}
                          {row.score && <p className="mt-1"><span className="font-semibold text-text-primary">Score:</span> {row.score}</p>}
                        </>
                      ) : row.nextAction ? row.nextAction : "—"}
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
