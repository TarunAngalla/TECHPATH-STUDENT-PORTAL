import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { PipelineFunnel } from "@/components/shared/PipelineFunnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Inbox, MessageCircle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ReportExportPanel } from "@/components/admin/ReportExportPanel";

type ReportsProps = {
  newLeads: number;
  activeCandidates: number;
  interviewsThisWeek: number;
  unreadMessages: number;
  funnel: {
    enquiries: number;
    consultations: number;
    active: number;
    placed: number;
  };
  workload: { email: string; count: number }[];
  candidates: {
    id: string;
    fullName: string;
    journeyStage: number;
    applicationCount: number;
    recruiterEmail: string | null;
  }[];
};

const STAT_CARDS = [
  {
    key: "newLeads",
    label: "New Leads",
    icon: Inbox,
    iconBg: "bg-blue-50 border-blue-100/50",
    iconColor: "text-blue-600",
  },
  {
    key: "activeCandidates",
    label: "Active Candidates",
    icon: Users,
    iconBg: "bg-green-50 border-green-100/50",
    iconColor: "text-green-600",
  },
  {
    key: "interviewsThisWeek",
    label: "Interviews Scheduled",
    icon: Clock,
    iconBg: "bg-orange-50 border-orange-100/50",
    iconColor: "text-orange-600",
  },
  {
    key: "unreadMessages",
    label: "Unread Messages",
    icon: MessageCircle,
    iconBg: "bg-purple-50 border-purple-100/50",
    iconColor: "text-purple-600",
  },
] as const;

function ReportStatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card variant="glass" className="p-5 flex-1 min-w-[200px] bg-white border border-border-strong/50 shadow-xs rounded-2xl transition-all duration-200 hover:border-border-strong">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 border shadow-xs", iconBg)}>
        <Icon size={18} className={iconColor} aria-hidden="true" />
      </div>
      <div className="text-2xl font-bold text-text-primary leading-none">{value}</div>
      <div className="text-xs mt-2 text-text-muted font-bold">{label}</div>
    </Card>
  );
}

export function ReportsPage({
  newLeads,
  activeCandidates,
  interviewsThisWeek,
  unreadMessages,
  funnel,
  workload,
  candidates,
}: ReportsProps) {
  const values = { newLeads, activeCandidates, interviewsThisWeek, unreadMessages };

  const funnelStages = [
    {
      label: "Enquiries",
      value: funnel.enquiries,
      barClass: "bg-text-muted",
      trackClass: "bg-surface",
    },
    {
      label: "Consultations booked",
      value: funnel.consultations,
      barClass: "bg-brand-500",
      trackClass: "bg-brand-50",
    },
    {
      label: "Active candidates",
      value: funnel.active,
      barClass: "bg-brand-600",
      trackClass: "bg-brand-100",
    },
    {
      label: "Placed",
      value: funnel.placed,
      barClass: "bg-success",
      trackClass: "bg-success-soft",
    },
  ];

  return (
    <div className="space-y-6">
      <ReportExportPanel />

      <div className="flex flex-wrap gap-4">
        {STAT_CARDS.map((stat) => (
          <ReportStatCard
            key={stat.key}
            label={stat.label}
            value={values[stat.key]}
            icon={stat.icon}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      <PipelineFunnel stages={funnelStages} title="Recruiting Pipeline" />

      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Recruiter Workload</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {workload.map((r) => (
                <div key={r.email} className="flex items-center justify-between p-3 rounded-xl bg-surface/30 border border-border-subtle hover:border-border-strong transition-all duration-200">
                  <span className="text-xs font-bold text-text-primary">{r.email}</span>
                  <Badge variant="muted" className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-border-strong/30 bg-white">
                    {r.count} candidates
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Candidate Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto max-h-[min(28rem,50vh)] overflow-y-auto">
              <table className="w-full text-left text-xs" aria-label="Candidate summaries">
                <thead className="sticky top-0 bg-white z-[1]">
                  <tr className="border-b border-border-strong/45">
                    <th scope="col" className="pb-2.5 font-bold text-text-muted">Name</th>
                    <th scope="col" className="pb-2.5 font-bold text-text-muted">Journey Stage</th>
                    <th scope="col" className="pb-2.5 font-bold text-text-muted text-right">Apps</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} className="border-t border-border-subtle align-middle bg-white hover:bg-surface/30 transition-colors">
                      <td className="py-2.5 font-bold text-text-primary">{c.fullName}</td>
                      <td className="py-2.5 font-semibold text-text-muted">
                        {JOURNEY_STEPS[c.journeyStage] ?? `Stage ${c.journeyStage}`}
                      </td>
                      <td className="py-2.5 font-bold text-text-primary text-right">{c.applicationCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
