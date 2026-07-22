import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock3, Trophy } from "lucide-react";
import { CompanyBadge } from "@/components/shared/CompanyBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/constants/status-meta";
import { formatDate, formatDateTime } from "@/lib/utils/dates";

type Row = {
  id: string;
  candidateId: string;
  appNo: string;
  companyName: string;
  roleTitle: string;
  jobLocation: string | null;
  applicationSource: string | null;
  dateApplied: string;
  status: string;
  priority: string;
  nextAction: string | null;
  nextActionAt: Date | string | null;
  updatedAt: Date | string;
  candidateName: string;
  recruiterName: string | null;
  recruiterEmail: string | null;
};

export function AdminApplicationsOverview({
  applications,
  metrics,
}: {
  applications: Row[];
  metrics: { total: number; active: number; offers: number; rejected: number; overdue: number };
}) {
  const cards = [
    { label: "Applications", value: metrics.total, icon: BriefcaseBusiness },
    { label: "Active", value: metrics.active, icon: Clock3 },
    { label: "Offers / hired", value: metrics.offers, icon: Trophy },
    { label: "Rejected", value: metrics.rejected, icon: CheckCircle2 },
    { label: "Overdue actions", value: metrics.overdue, icon: AlertTriangle },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} variant="glass" className="p-4 bg-white">
            <div className="flex items-center justify-between"><span className="text-xs text-text-muted">{label}</span><Icon size={16} className="text-brand-500" /></div>
            <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
          </Card>
        ))}
      </div>
      <Card variant="glass" className="overflow-hidden bg-white">
        {applications.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">No applications match this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[960px]">
              <thead><tr className="border-b border-border-subtle bg-surface/60">
                {['Application','Candidate','Status','Recruiter','Next action','Updated'].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-semibold text-text-muted">{label}</th>)}
              </tr></thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b border-border-subtle last:border-0 hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${application.id}`} className="flex items-center gap-3 group">
                        <CompanyBadge name={application.companyName} />
                        <span><span className="block text-sm font-semibold text-text-primary group-hover:text-brand-500">{application.companyName}</span><span className="block text-xs text-text-muted">{application.roleTitle} · {application.appNo}</span></span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-primary"><Link className="hover:text-brand-500" href={`/admin/candidates/${application.candidateId}`}>{application.candidateName}</Link></td>
                    <td className="px-4 py-3"><StatusPill status={application.status as ApplicationStatus} /><div className="text-[10px] text-text-muted mt-1">{application.priority} priority</div></td>
                    <td className="px-4 py-3 text-xs text-text-muted">{application.recruiterName ?? application.recruiterEmail ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{application.nextAction ?? "—"}{application.nextActionAt && <span className="block text-[10px] mt-1">{formatDateTime(application.nextActionAt)}</span>}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatDate(application.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
