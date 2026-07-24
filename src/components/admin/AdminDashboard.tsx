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
  Calendar,
  Download,
  FileText,
  CheckCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils/dates";
import { formatExperienceYears } from "@/lib/utils/experience";
import { cn } from "@/lib/utils/cn";

type Trend = { text: string; tone: "up" | "down" | "flat" };

type DashboardProps = {
  staffName: string;
  staffRole: "admin" | "recruiter";
  portalLabel: string;
  newLeads: number;
  newLeadsTrend: Trend;
  consultations: number;
  consultationsTrend: Trend;
  activeCandidates: number;
  activeCandidatesTrend: Trend;
  ndasPending: number;
  ndasPendingTrend: Trend;
  interviewsThisWeek: number;
  interviewsThisWeekTrend: Trend;
  recruitersAssigned: number;
  recruitersAssignedTrend: Trend;
  marketingLiveTrend: Trend;
  unreadMessages: number;
  marketingLiveZeroApps: number;
  periodLabel: string;
  funnel: {
    enquiries: number;
    consultations: number;
    portalAccess: number;
    ndaSigned: number;
    marketingLive: number;
    interviewsInProgress: number;
    conversions: {
      consultations: string;
      portal: string;
      ndaSigned: string;
      marketing: string;
      interviews: string;
    };
  };
  recentAudit: { id: string; action: string; createdAt: Date }[];
  recentMessages: {
    id: string;
    body: string;
    sentAt: Date;
    candidateId: string;
    senderRole: string;
  }[];
  recentLeads: {
    id: string;
    name: string;
    notes: string;
    status: string;
    source: string;
    roleInterest: string | null;
    experienceSummary: string | null;
  }[];
  assignments: {
    candidateId: string;
    candidateName: string;
    recruiterEmail: string;
    journeyStage: number;
    assignedAt: Date | null;
  }[];
  marketingProgress: {
    candidateId: string;
    candidateName: string;
    appCount: number;
    interviews: number;
    assessments: number;
    appliedPct: number;
    interviewPct: number;
  }[];
  weeklyTrend: {
    name: string;
    Enquiries: number;
    Consultations: number;
    Portal: number;
    Marketing: number;
    Interviews: number;
  }[];
  candidateNames: Record<string, string>;
  exportRows: {
    name: string;
    email: string;
    recruiter: string;
    journeyStage: number;
    applications: number;
  }[];
};

function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  return parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function formatAuditAction(action: string) {
  if (action.includes("assessment")) return "Assessment updated";
  if (action.includes("interview")) return "Interview scheduled";
  if (action.includes("application.status")) return "Application status changed";
  if (action.includes("application.created")) return "New application submitted";
  if (action.includes("nda")) return "NDA activity";
  return action.replace(/_/g, " ").replace(/\./g, " ");
}

const FLAT_TREND: Trend = { text: "No change", tone: "flat" };

function leadStatusVariant(status: string): "accent" | "warning" | "success" | "default" {
  if (status === "new") return "accent";
  if (status === "contacted") return "warning";
  if (status === "qualified" || status === "converted") return "success";
  return "default";
}

function roleInterestFromNotes(notes: string, source: string) {
  const trimmed = notes?.trim();
  if (trimmed) return trimmed.slice(0, 40) + (trimmed.length > 40 ? "…" : "");
  return source === "consultation_booked" ? "Consultation" : "General enquiry";
}

function downloadCsv(rows: DashboardProps["exportRows"]) {
  const header = ["Name", "Email", "Recruiter", "Journey Stage", "Applications"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.name, r.email, r.recruiter, String(r.journeyStage), String(r.applications)]
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `techpath-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard({
  staffName,
  staffRole,
  portalLabel,
  newLeads,
  newLeadsTrend,
  consultations,
  consultationsTrend,
  activeCandidates,
  activeCandidatesTrend,
  ndasPending,
  ndasPendingTrend,
  interviewsThisWeek,
  interviewsThisWeekTrend,
  recruitersAssigned,
  recruitersAssignedTrend,
  marketingLiveTrend,
  unreadMessages,
  marketingLiveZeroApps,
  periodLabel,
  funnel,
  recentAudit,
  recentMessages,
  recentLeads,
  assignments,
  marketingProgress,
  weeklyTrend,
  candidateNames,
  exportRows,
}: DashboardProps) {
  const isRecruiter = staffRole === "recruiter";
  const applicationTotal = exportRows.reduce((total, row) => total + row.applications, 0);
  const assessmentTotal = marketingProgress.reduce((total, row) => total + row.assessments, 0);
  const trendFlat = weeklyTrend.every(
    (w) => w.Enquiries + w.Consultations + w.Portal + w.Marketing + w.Interviews === 0,
  );

  const attentionItems = [
    !isRecruiter && newLeads > 0
      ? { label: `${newLeads} uncontacted enquir${newLeads === 1 ? "y" : "ies"}`, href: "/admin/leads" }
      : null,
    ndasPending > 0
      ? { label: `${ndasPending} NDA${ndasPending === 1 ? "" : "s"} pending`, href: "/admin/nda" }
      : null,
    unreadMessages > 0
      ? {
          label: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
          href: "/admin/messages",
        }
      : null,
    interviewsThisWeek > 0
      ? {
          label: `${interviewsThisWeek} interview${interviewsThisWeek === 1 ? "" : "s"} this week`,
          href: "/admin/interviews",
        }
      : null,
    marketingLiveZeroApps > 0
      ? {
          label: `${marketingLiveZeroApps} live with 0 apps`,
          href: "/admin/marketing",
        }
      : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const statCards = isRecruiter
    ? [
        {
          label: "My Candidates",
          value: activeCandidates,
          trend: activeCandidatesTrend,
          icon: Users,
          iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
        },
        {
          label: "Marketing Live",
          value: funnel.marketingLive,
          trend: marketingLiveTrend,
          icon: TrendingUp,
          iconBg: "bg-green-50 text-green-600 border border-green-100",
        },
        {
          label: "Applications",
          value: applicationTotal,
          trend: FLAT_TREND,
          icon: FileText,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
        {
          label: "Interviews This Week",
          value: interviewsThisWeek,
          trend: interviewsThisWeekTrend,
          icon: Clock,
          iconBg: "bg-teal-50 text-teal-600 border border-teal-100",
        },
        {
          label: "Assessments",
          value: assessmentTotal,
          trend: FLAT_TREND,
          icon: CheckCircle,
          iconBg: "bg-orange-50 text-orange-600 border border-orange-100",
        },
        {
          label: "Unread Messages",
          value: unreadMessages,
          trend: FLAT_TREND,
          icon: MessageCircle,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
      ]
    : [
        {
          label: "New Enquiries",
          value: newLeads,
          trend: newLeadsTrend,
          icon: UserPlus,
          iconBg: "bg-green-50 text-green-600 border border-green-100",
        },
        {
          label: "Consultation Bookings",
          value: consultations,
          trend: consultationsTrend,
          icon: Calendar,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
        {
          label: "Active Candidates",
          value: activeCandidates,
          trend: activeCandidatesTrend,
          icon: Users,
          iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
        },
        {
          label: "NDAs Pending",
          value: ndasPending,
          trend: ndasPendingTrend,
          icon: Lock,
          iconBg: "bg-orange-50 text-orange-600 border border-orange-100",
        },
        {
          label: "Recruiters Assigned",
          value: recruitersAssigned,
          trend: recruitersAssignedTrend,
          icon: CheckCircle,
          iconBg: "bg-teal-50 text-teal-600 border border-teal-100",
        },
        {
          label: "Interviews Scheduled",
          value: interviewsThisWeek,
          trend: interviewsThisWeekTrend,
          icon: Clock,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
      ];

  const pipeline = isRecruiter
    ? [
        { label: "Assigned Candidates", value: activeCandidates, conversion: null as string | null },
        { label: "Portal Active", value: funnel.portalAccess, conversion: null },
        { label: "NDA Signed", value: funnel.ndaSigned, conversion: funnel.conversions.ndaSigned },
        { label: "Marketing Live", value: funnel.marketingLive, conversion: funnel.conversions.marketing },
        { label: "Interviews in Progress", value: funnel.interviewsInProgress, conversion: funnel.conversions.interviews },
      ]
    : [
        { label: "Enquiry Received", value: funnel.enquiries, conversion: null as string | null },
        { label: "Consultation Completed", value: funnel.consultations, conversion: funnel.conversions.consultations },
        { label: "Portal Access Granted", value: funnel.portalAccess, conversion: funnel.conversions.portal },
        { label: "NDA Signed", value: funnel.ndaSigned, conversion: funnel.conversions.ndaSigned },
        { label: "Marketing Live", value: funnel.marketingLive, conversion: funnel.conversions.marketing },
        { label: "Interviews in Progress", value: funnel.interviewsInProgress, conversion: funnel.conversions.interviews },
      ];

  return (
    <div className="grid gap-6 min-w-0 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-text-primary">Welcome back, {staffName}</h2>
          <p className="text-xs text-text-muted mt-0.5">
            TheTechPath {portalLabel} · Full-Time Placement Services
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {unreadMessages > 0 && (
            <Badge variant="warning" className="text-xs px-2.5 py-1 flex items-center gap-1">
              <MessageCircle size={12} /> {unreadMessages} unread messages
            </Badge>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-strong bg-white text-xs font-semibold text-text-primary shadow-xs">
            <Calendar size={13} className="text-text-muted" />
            <span>{periodLabel}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border border-border-strong bg-white hover:bg-surface text-text-primary shadow-xs"
            onClick={() => downloadCsv(exportRows)}
          >
            <Download size={13} className="mr-1.5" /> Export Report
          </Button>
        </div>
      </div>

      {attentionItems.length > 0 && (
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-3 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex-shrink-0">
              Needs attention
            </span>
            <div className="flex flex-wrap gap-2 min-w-0">
              {attentionItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0">
        {statCards.map((stat) => {
          const toneClass =
            stat.trend.tone === "up"
              ? "text-green-600"
              : stat.trend.tone === "down"
                ? "text-red-600"
                : "text-text-muted";
          return (
            <Card
              key={stat.label}
              variant="glass"
              className="bg-white border border-border-strong/50 shadow-xs p-3 sm:p-4 flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-[10px] font-medium text-text-muted truncate">{stat.label}</span>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", stat.iconBg)}>
                    <stat.icon size={13} />
                  </div>
                </div>
                <div className="text-xl font-bold text-text-primary">{stat.value}</div>
              </div>
              <div className={cn("text-[9px] font-semibold mt-2.5 truncate", toneClass)}>
                {stat.trend.text}
              </div>
            </Card>
          );
        })}
      </div>

      <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-4 sm:p-5 min-w-0 overflow-hidden">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
          {isRecruiter ? "My Candidate Pipeline" : "Candidate Pipeline"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 min-w-0">
          {pipeline.map((step, i) => (
            <div key={step.label} className="relative min-w-0">
              <div className="h-full p-3 rounded-xl bg-surface/50 border border-border-subtle flex flex-col items-center justify-center text-center min-w-0">
                <span className="text-[10px] font-semibold text-text-muted leading-tight">{step.label}</span>
                <span className="text-base font-bold text-text-primary mt-1">{step.value}</span>
                {step.conversion && (
                  <span className="text-[9px] font-semibold text-success mt-0.5">{step.conversion}</span>
                )}
              </div>
              {i < pipeline.length - 1 && (
                <div className="hidden xl:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 text-text-muted/40" aria-hidden="true">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">
        {isRecruiter ? (
          <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
            <div>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Candidates Needing Attention
                </CardTitle>
                <Link href="/admin/candidates" className="text-xs font-semibold text-brand-500 hover:underline">View All</Link>
              </CardHeader>
              <div className="p-4 space-y-3">
                {marketingProgress.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">No assigned candidates yet.</p>
                ) : (
                  marketingProgress.slice(0, 6).map((row) => (
                    <Link key={row.candidateId} href={`/admin/candidates/${row.candidateId}`} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle px-3 py-2.5 hover:bg-surface/50">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-text-primary">{row.candidateName}</span>
                        <span className="block text-[10px] text-text-muted">{row.appCount} applications · {row.interviews} interviews</span>
                      </span>
                      <Badge variant={row.appCount === 0 ? "warning" : "muted"} className="text-[9px]">
                        {row.appCount === 0 ? "Needs activity" : "Review"}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-border-subtle p-3.5 text-center bg-surface/10">
              <Link href="/admin/marketing" className="text-xs font-semibold text-brand-500 hover:underline">Open marketing work queue →</Link>
            </div>
          </Card>
        ) : (
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
          <div className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4 gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Recent Enquiries
              </CardTitle>
              <Link href="/admin/leads" className="text-xs font-semibold text-brand-500 hover:underline flex-shrink-0">
                View All
              </Link>
            </CardHeader>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs table-fixed" aria-label="Recent enquiries">
                <thead>
                  <tr className="bg-surface/30 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th scope="col" className="px-3 py-2 w-[32%]">Candidate</th>
                    <th scope="col" className="px-3 py-2 w-[28%]">Role</th>
                    <th scope="col" className="px-3 py-2 w-[18%]">Years</th>
                    <th scope="col" className="px-3 py-2 w-[22%]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                        No enquiries yet
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-strong text-[9px] font-bold text-text-primary flex-shrink-0">
                              {getInitials(lead.name)}
                            </div>
                            <span className="font-medium text-text-primary truncate">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-text-muted truncate">
                          {lead.roleInterest || roleInterestFromNotes(lead.notes, lead.source) || "General enquiry"}
                        </td>
                        <td className="px-3 py-2.5 text-text-muted">
                          {formatExperienceYears(lead.experienceSummary)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={leadStatusVariant(lead.status)} className="text-[9px] px-1.5 py-0 capitalize max-w-full truncate">
                            {lead.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-border-subtle p-3.5 text-center bg-surface/10">
            <Link href="/admin/leads" className="text-xs font-semibold text-brand-500 hover:underline">
              View all enquiries →
            </Link>
          </div>
        </Card>
        )}

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
          <div className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4 gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary truncate">
                {isRecruiter ? "My Assigned Candidates" : "Recruiter Assignments"}
              </CardTitle>
              <Link href="/admin/candidates" className="text-xs font-semibold text-brand-500 hover:underline flex-shrink-0">
                View All
              </Link>
            </CardHeader>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs table-fixed" aria-label="Recruiter assignments">
                <thead>
                  <tr className="bg-surface/30 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th scope="col" className="px-3 py-2 w-[28%]">Candidate</th>
                    <th scope="col" className="px-3 py-2 w-[36%]">Recruiter</th>
                    <th scope="col" className="px-3 py-2 w-[20%]">Assigned</th>
                    <th scope="col" className="px-3 py-2 w-[16%]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                        No assignments yet
                      </td>
                    </tr>
                  ) : (
                    assignments.map((row) => (
                      <tr key={row.candidateId}>
                        <td className="px-3 py-2.5 font-medium text-text-primary truncate">{row.candidateName}</td>
                        <td className="px-3 py-2.5 text-text-muted">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[8px] font-bold text-brand-700 flex-shrink-0">
                              {getInitials(row.recruiterEmail.split("@")[0] ?? "R")}
                            </div>
                            <span className="truncate">
                              {(row.recruiterEmail.split("@")[0] ?? row.recruiterEmail)
                                .split(/[._-]/)
                                .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                                .join(" ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-text-muted truncate">
                          {row.assignedAt ? formatDateTime(row.assignedAt) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-border-subtle p-3.5 text-center bg-surface/10">
            <Link href="/admin/candidates" className="text-xs font-semibold text-brand-500 hover:underline">
              {isRecruiter ? "View my candidates →" : "Manage assignments →"}
            </Link>
          </div>
        </Card>

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden min-w-0">
          <div className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4 gap-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Marketing Progress
              </CardTitle>
              <Link href="/admin/marketing" className="text-xs font-semibold text-brand-500 hover:underline flex-shrink-0">
                View All
              </Link>
            </CardHeader>
            <div className="p-4 space-y-3.5 max-h-72 overflow-y-auto">
              {marketingProgress.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No candidate marketing data yet</p>
              ) : (
                marketingProgress.slice(0, 8).map((row) => (
                  <div key={row.candidateId} className="min-w-0">
                    <div className="flex items-center justify-between text-xs font-semibold text-text-primary mb-1 gap-2">
                      <span className="truncate">{row.candidateName}</span>
                      <span className="text-[10px] text-text-muted flex-shrink-0">
                        {row.appCount} Apps · {row.interviews} Int · {row.assessments} Assm
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden flex">
                      <div className="h-full bg-brand-500" style={{ width: `${row.appliedPct}%` }} />
                      <div className="h-full bg-success" style={{ width: `${row.interviewPct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border-t border-border-subtle p-3.5 text-center bg-surface/10">
            <Link href="/admin/marketing" className="text-xs font-semibold text-brand-500 hover:underline">
              View marketing progress →
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5 flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              {isRecruiter ? "Activity Notifications" : "Admin Notifications"}
            </h3>
            <div className="space-y-3.5">
              {recentAudit.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-text-muted flex-shrink-0">
                    <CheckCircle size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">
                      {formatAuditAction(a.action)}
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">{formatDateTime(a.createdAt)}</div>
                  </div>
                </div>
              ))}
              {recentMessages.slice(0, 2).map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/candidates/${m.candidateId}?tab=Messages`}
                  className="flex items-start gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 flex-shrink-0">
                    <MessageCircle size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">
                      {candidateNames[m.candidateId] ?? "Candidate"} sent a message
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5 line-clamp-1">{m.body}</div>
                    <div className="text-[9px] text-brand-500 mt-0.5 font-semibold">Open thread →</div>
                    <div className="text-[9px] text-text-muted mt-0.5">{formatDateTime(m.sentAt)}</div>
                  </div>
                </Link>
              ))}
              {recentAudit.length === 0 && recentMessages.length === 0 && (
                <p className="text-xs text-text-muted">No recent notifications</p>
              )}
            </div>
          </div>
          <div className="border-t border-border-subtle pt-4 mt-5">
            <Link href="/admin/candidates" className="text-xs font-semibold text-brand-500 hover:underline">
              View candidates →
            </Link>
          </div>
        </Card>

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5 min-w-0 overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
            {isRecruiter ? "Weekly Placement Activity" : "Conversion Trend (Weekly)"}
          </h3>
          {trendFlat ? (
            <p className="text-xs text-text-muted py-10 text-center">
              Trends appear as weekly activity grows.
            </p>
          ) : (
            <>
              <div className="h-48 w-full min-w-0 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, "auto"]}
                    />
                    <ChartTooltip />
                    {!isRecruiter && (
                      <Line type="monotone" dataKey="Enquiries" stroke="#64748b" strokeWidth={1.5} dot={{ r: 2 }} />
                    )}
                    {!isRecruiter && (
                      <Line
                        type="monotone"
                        dataKey="Consultations"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                    )}
                    <Line type="monotone" dataKey="Portal" stroke="#2563eb" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Marketing" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Interviews" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3.5 mt-3 flex-wrap text-[9px] font-semibold text-text-muted">
                {!isRecruiter && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" /> Enquiry
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Consultation
                    </span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" /> Portal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Marketing
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" /> Interviews
                </span>
              </div>
            </>
          )}
        </Card>

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              Quick Reports
            </h3>
            <div className="space-y-2">
              {(isRecruiter
                ? [
                    { href: "/admin/applications", label: "Applications Work Queue", desc: "Manage verified submissions.", icon: FileText },
                    { href: "/admin/interviews", label: "Upcoming Interviews", desc: "See your scheduled interviews.", icon: Clock },
                    { href: "/admin/assessments", label: "Assessment Follow-ups", desc: "Recorded activity.", icon: CheckCircle },
                    { href: "/admin/marketing", label: "Marketing Activity", desc: "Marketing profiles actively marketed.", icon: TrendingUp },
                  ]
                : [
                    { href: "/admin/reports/enquiry-source", label: "Enquiry Source Report", desc: "Analyze enquiries by source and channel.", icon: FileText },
                    { href: "/admin/reports/conversion-funnel", label: "Conversion Funnel Report", desc: "Track conversion across all pipeline stages.", icon: TrendingUp },
                    { href: "/admin/reports/recruiter-performance", label: "Recruiter Performance Report", desc: "Evaluate recruiter assignments and outcomes.", icon: Users },
                    { href: "/admin/reports/marketing-activity", label: "Marketing Activity Report", desc: "Applications, interviews & assessments overview.", icon: Inbox },
                  ]
              ).map(({ href, label, desc, icon: QuickIcon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-start justify-between gap-2 p-3 rounded-xl border border-border-strong/30 hover:bg-surface transition-colors min-w-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <QuickIcon size={14} className="text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary truncate">{label}</div>
                      <div className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{desc}</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-muted/60 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-border-subtle pt-4 mt-5">
            <Link href={isRecruiter ? "/admin/applications" : "/admin/reports"} className="text-xs font-semibold text-brand-500 hover:underline">
              {isRecruiter ? "Open placement workspace →" : "View all reports →"}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
