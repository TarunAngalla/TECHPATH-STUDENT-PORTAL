import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { PipelineFunnel } from "@/components/shared/PipelineFunnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Inbox, MessageCircle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
    label: "New leads",
    icon: Inbox,
    iconBg: "bg-brand-100",
    iconColor: "text-brand-600",
  },
  {
    key: "activeCandidates",
    label: "Active candidates",
    icon: Users,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
  },
  {
    key: "interviewsThisWeek",
    label: "Interviews this week",
    icon: Clock,
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
  },
  {
    key: "unreadMessages",
    label: "Unread messages",
    icon: MessageCircle,
    iconBg: "bg-success-soft",
    iconColor: "text-success",
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
    <Card variant="glass" hover="lift" className="p-5 flex-1 min-w-[160px]">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", iconBg)}>
        <Icon size={17} className={iconColor} aria-hidden="true" />
      </div>
      <div className="text-2xl font-semibold text-text-primary">{value}</div>
      <div className="text-xs mt-1 text-text-muted">{label}</div>
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

      <PipelineFunnel stages={funnelStages} title="Recruiting pipeline" />

      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Recruiter workload</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {workload.map((r) => (
                <div key={r.email} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{r.email}</span>
                  <Badge variant="default">{r.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Candidate summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="pb-2 font-medium text-text-muted">Name</th>
                    <th className="pb-2 font-medium text-text-muted">Stage</th>
                    <th className="pb-2 font-medium text-text-muted">Apps</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} className="border-t border-border-subtle">
                      <td className="py-2 text-text-primary">{c.fullName}</td>
                      <td className="py-2 text-text-muted">
                        {JOURNEY_STEPS[c.journeyStage] ?? `Stage ${c.journeyStage}`}
                      </td>
                      <td className="py-2 text-text-primary">{c.applicationCount}</td>
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
