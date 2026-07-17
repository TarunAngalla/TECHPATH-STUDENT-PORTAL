"use client";

import Link from "next/link";
import {
  Clock,
  Inbox,
  Lock,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PipelineFunnel } from "@/components/shared/PipelineFunnel";
import { StaggerChildren, StaggerItem } from "@/components/motion/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type DashboardProps = {
  staffName: string;
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
  recentAudit: {
    id: string;
    action: string;
    createdAt: Date;
  }[];
  recentMessages: {
    id: string;
    body: string;
    sentAt: Date;
    candidateId: string;
    senderRole: string;
  }[];
  candidateNames: Record<string, string>;
};

const AUDIT_ICONS: Record<string, LucideIcon> = {
  admin_sign_in: Lock,
  create_candidate_from_lead: UserPlus,
  admin_reset_candidate_password: Lock,
};

const STAT_CARDS = [
  {
    key: "newLeads",
    label: "New leads",
    icon: Inbox,
    iconBg: "bg-brand-100",
    iconColor: "text-brand-600",
    href: "/admin/leads",
  },
  {
    key: "activeCandidates",
    label: "Active candidates",
    icon: Users,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    href: "/admin/candidates",
  },
  {
    key: "interviewsThisWeek",
    label: "Interviews this week",
    icon: Clock,
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
    href: "/admin/candidates",
  },
  {
    key: "unreadMessages",
    label: "Unread candidate messages",
    icon: MessageCircle,
    iconBg: "bg-success-soft",
    iconColor: "text-success",
    href: "/admin/candidates",
  },
] as const;

function formatAuditText(
  action: string,
  candidateNames: Record<string, string>,
  targetId: string | null,
) {
  switch (action) {
    case "admin_sign_in":
      return "Staff member signed in";
    case "create_candidate_from_lead":
      return targetId
        ? `New candidate created from lead (${candidateNames[targetId] ?? "candidate"})`
        : "New candidate created from lead";
    case "admin_reset_candidate_password":
      return "Candidate password reset by admin";
    case "create_staff_recruiter":
      return "New recruiter account created";
    case "create_staff_admin":
      return "New admin account created";
    default:
      return action.replace(/_/g, " ");
  }
}

function DashboardStatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
}) {
  return (
    <Link href={href} className="flex-1 min-w-[160px] block">
      <Card variant="glass" hover="lift" className="p-5 h-full">
        <div
          className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", iconBg)}
        >
          <Icon size={17} className={iconColor} aria-hidden="true" />
        </div>
        <div className="text-2xl font-semibold text-text-primary">{value}</div>
        <div className="text-xs mt-1 text-text-muted">{label}</div>
      </Card>
    </Link>
  );
}

export function AdminDashboard({
  staffName,
  newLeads,
  activeCandidates,
  interviewsThisWeek,
  unreadMessages,
  funnel,
  workload,
  recentAudit,
  recentMessages,
  candidateNames,
}: DashboardProps) {
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

  const activityItems = [
    ...recentMessages
      .filter((m) => m.senderRole === "candidate")
      .map((m) => ({
        id: `msg-${m.id}`,
        text: `${candidateNames[m.candidateId] ?? "A candidate"} sent a message`,
        when: m.sentAt,
        icon: MessageCircle,
      })),
    ...recentAudit.map((a) => ({
      id: `audit-${a.id}`,
      text: formatAuditText(a.action, candidateNames, null),
      when: a.createdAt,
      icon: AUDIT_ICONS[a.action] ?? TrendingUp,
    })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 6);

  return (
    <StaggerChildren className="space-y-6">
      <StaggerItem>
        <Card variant="gradient" className="relative p-6 overflow-hidden">
          <div className="absolute w-40 h-40 rounded-full -right-10 -top-12 bg-white/6" />
          <div className="relative">
            <div className="text-xs font-medium mb-1.5 text-white/70">Welcome back</div>
            <h2 className="text-xl font-semibold text-white mb-1.5">{staffName}</h2>
            <p className="text-sm max-w-md text-white/80">
              {newLeads > 0
                ? `${newLeads} new lead${newLeads === 1 ? "" : "s"}`
                : "No new leads"}
              {unreadMessages > 0
                ? ` and ${unreadMessages} candidate message${unreadMessages === 1 ? "" : "s"} are waiting on a response today.`
                : " — inbox is up to date."}
            </p>
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <div className="flex flex-wrap gap-4">
          {STAT_CARDS.map((stat) => (
            <DashboardStatCard
              key={stat.key}
              label={stat.label}
              value={values[stat.key]}
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              href={stat.href}
            />
          ))}
        </div>
      </StaggerItem>

      <StaggerItem>
        <PipelineFunnel stages={funnelStages} reportHref="/admin/reports" />
      </StaggerItem>

      <StaggerItem>
        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Recruiter workload</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {workload.length === 0 ? (
                <p className="text-xs text-text-muted">No candidates assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {workload.map((r) => (
                    <div key={r.email} className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">{r.email}</span>
                      <Badge variant="default">
                        {r.count} candidate{r.count === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activityItems.length === 0 ? (
                <p className="text-xs text-text-muted">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activityItems.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div key={a.id} className="flex items-start gap-2.5">
                        <Icon
                          size={13}
                          className="text-text-muted mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <div className="text-xs text-text-primary">{a.text}</div>
                          <div className="text-[11px] text-text-muted">
                            {formatDateTime(a.when)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link
                href="/admin/reports"
                className="inline-block mt-4 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                View full reports
              </Link>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>
    </StaggerChildren>
  );
}
