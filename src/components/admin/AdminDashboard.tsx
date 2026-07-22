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
import { cn } from "@/lib/utils/cn";

type DashboardProps = {
  staffName: string;
  staffRole: "admin" | "recruiter";
  portalLabel: string;
  newLeads: number;
  consultations: number;
  activeCandidates: number;
  ndasPending: number;
  interviewsThisWeek: number;
  interviewsInProgress: number;
  recruitersAssigned: number;
  unreadMessages: number;
  periodLabel: string;
  funnel: {
    enquiries: number;
    consultations: number;
    portalAccess: number;
    marketingLive: number;
    interviewsInProgress: number;
    conversions: {
      consultations: string;
      portal: string;
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
  }[];
  assignments: {
    candidateId: string;
    candidateName: string;
    recruiterEmail: string;
    journeyStage: number;
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

function PipelineFunnelArrow() {
  return (
    <div className="hidden lg:flex items-center text-text-muted/40 mx-1 flex-shrink-0" aria-hidden="true">
      <ArrowRight size={14} />
    </div>
  );
}

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
  consultations,
  activeCandidates,
  ndasPending,
  interviewsThisWeek,
  interviewsInProgress,
  recruitersAssigned,
  unreadMessages,
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

  const statCards = isRecruiter
    ? [
        {
          label: "My Candidates",
          value: activeCandidates,
          hint: "Assigned active accounts",
          icon: Users,
          iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
        },
        {
          label: "Marketing Live",
          value: funnel.marketingLive,
          hint: "Profiles actively marketed",
          icon: TrendingUp,
          iconBg: "bg-green-50 text-green-600 border border-green-100",
        },
        {
          label: "Applications",
          value: applicationTotal,
          hint: "Verified submissions",
          icon: FileText,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
        {
          label: "Interviews This Week",
          value: interviewsThisWeek,
          hint: `${interviewsInProgress} in progress`,
          icon: Clock,
          iconBg: "bg-teal-50 text-teal-600 border border-teal-100",
        },
        {
          label: "Assessments",
          value: assessmentTotal,
          hint: "Recorded activity",
          icon: CheckCircle,
          iconBg: "bg-orange-50 text-orange-600 border border-orange-100",
        },
        {
          label: "Unread Messages",
          value: unreadMessages,
          hint: "Candidate follow-ups",
          icon: MessageCircle,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
      ]
    : [
        {
          label: "New Enquiries",
          value: newLeads,
          hint: "Open enquiries",
          icon: UserPlus,
          iconBg: "bg-green-50 text-green-600 border border-green-100",
        },
        {
          label: "Consultation Bookings",
          value: consultations,
          hint: "Scheduled or completed",
          icon: Calendar,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
        {
          label: "Active Candidates",
          value: activeCandidates,
          hint: "Portal accounts",
          icon: Users,
          iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
        },
        {
          label: "NDAs Pending",
          value: ndasPending,
          hint: "Awaiting signature",
          icon: Lock,
          iconBg: "bg-orange-50 text-orange-600 border border-orange-100",
        },
        {
          label: "Recruiters Assigned",
          value: recruitersAssigned,
          hint: "Candidates with owners",
          icon: CheckCircle,
          iconBg: "bg-teal-50 text-teal-600 border border-teal-100",
        },
        {
          label: "Interviews This Week",
          value: interviewsThisWeek,
          hint: `${interviewsInProgress} in progress`,
          icon: Clock,
          iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
        },
      ];

  const pipeline = isRecruiter
    ? [
        { label: "Assigned Candidates", value: activeCandidates, conversion: null as string | null },
        { label: "Portal Active", value: funnel.portalAccess, conversion: null },
        { label: "Marketing Live", value: funnel.marketingLive, conversion: funnel.conversions.marketing },
        { label: "Interviews in Progress", value: funnel.interviewsInProgress, conversion: funnel.conversions.interviews },
      ]
    : [
        { label: "Enquiry Received", value: funnel.enquiries, conversion: null as string | null },
        { label: "Consultation Completed", value: funnel.consultations, conversion: funnel.conversions.consultations },
        { label: "Portal Access Granted", value: funnel.portalAccess, conversion: funnel.conversions.portal },
        { label: "Marketing Live", value: funnel.marketingLive, conversion: funnel.conversions.marketing },
        { label: "Interviews in Progress", value: funnel.interviewsInProgress, conversion: funnel.conversions.interviews },
      ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            variant="glass"
            className="bg-white border border-border-strong/50 shadow-xs p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-text-muted truncate">{stat.label}</span>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.iconBg)}>
                  <stat.icon size={13} />
                </div>
              </div>
              <div className="text-xl font-bold text-text-primary">{stat.value}</div>
            </div>
            <div className="text-[9px] font-semibold mt-2.5 text-text-muted">{stat.hint}</div>
          </Card>
        ))}
      </div>

      <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">
          {isRecruiter ? "My Candidate Pipeline" : "Candidate Pipeline"}
        </h3>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-y-3 lg:gap-y-0">
          {pipeline.map((step, i) => (
            <div key={step.label} className="contents">
              {i > 0 && <PipelineFunnelArrow />}
              <div className="flex-1 p-3.5 rounded-xl bg-surface/50 border border-border-subtle flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-semibold text-text-muted">{step.label}</span>
                <span className="text-base font-bold text-text-primary mt-1">{step.value}</span>
                {step.conversion && (
                  <span className="text-[9px] font-semibold text-success mt-0.5">{step.conversion}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isRecruiter ? (
          <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden">
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
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Recent Enquiries
              </CardTitle>
              <Link href="/admin/leads" className="text-xs font-semibold text-brand-500 hover:underline">
                View All
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Recent enquiries">
                <thead>
                  <tr className="bg-surface/30 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th scope="col" className="px-4 py-2">Candidate</th>
                    <th scope="col" className="px-4 py-2">Role Interest</th>
                    <th scope="col" className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-text-muted">
                        No enquiries yet
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-4 py-2.5 font-medium text-text-primary">{lead.name}</td>
                        <td className="px-4 py-2.5 text-text-muted">
                          {roleInterestFromNotes(lead.notes, lead.source)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={leadStatusVariant(lead.status)} className="text-[9px] px-1.5 py-0 capitalize">
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

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">
                {isRecruiter ? "My Assigned Candidates" : "Recruiter Assignments"}
              </CardTitle>
              <Link href="/admin/candidates" className="text-xs font-semibold text-brand-500 hover:underline">
                View All
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Recruiter assignments">
                <thead>
                  <tr className="bg-surface/30 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th scope="col" className="px-4 py-2">Candidate</th>
                    <th scope="col" className="px-4 py-2">Assigned Recruiter</th>
                    <th scope="col" className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-text-muted">
                        No assignments yet
                      </td>
                    </tr>
                  ) : (
                    assignments.map((row) => (
                      <tr key={row.candidateId}>
                        <td className="px-4 py-2.5 font-medium text-text-primary">{row.candidateName}</td>
                        <td className="px-4 py-2.5 text-text-muted">
                          {(row.recruiterEmail.split("@")[0] ?? row.recruiterEmail)
                            .split(/[._-]/)
                            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                            .join(" ")}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">
                            Stage {row.journeyStage}
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

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle px-5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Marketing Progress
              </CardTitle>
              <Link href="/admin/marketing" className="text-xs font-semibold text-brand-500 hover:underline">
                View All
              </Link>
            </CardHeader>
            <div className="p-4 space-y-3.5">
              {marketingProgress.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No candidate marketing data yet</p>
              ) : (
                marketingProgress.map((row) => (
                  <div key={row.candidateId}>
                    <div className="flex items-center justify-between text-xs font-semibold text-text-primary mb-1">
                      <span>{row.candidateName}</span>
                      <span className="text-[10px] text-text-muted">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              {isRecruiter ? "Activity Notifications" : "Admin Notifications"}
            </h3>
            <div className="space-y-3.5">
              {recentAudit.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-text-muted flex-shrink-0">
                    <Lock size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">
                      {a.action === "admin_sign_in"
                        ? "Staff member signed in"
                        : a.action.replace(/_/g, " ")}
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

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
            {isRecruiter ? "Weekly Placement Activity" : "Conversion Trend (Weekly)"}
          </h3>
          <div className="h-48 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                <ChartTooltip />
                {!isRecruiter && <Line type="monotone" dataKey="Enquiries" stroke="#64748b" strokeWidth={1.5} dot={{ r: 2 }} />}
                {!isRecruiter && <Line type="monotone" dataKey="Consultations" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} />}
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
        </Card>

        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              Quick Reports
            </h3>
            <div className="space-y-2">
              {(isRecruiter
                ? [
                    { href: "/admin/applications", label: "Applications Work Queue", icon: FileText },
                    { href: "/admin/interviews", label: "Upcoming Interviews", icon: Clock },
                    { href: "/admin/assessments", label: "Assessment Follow-ups", icon: CheckCircle },
                    { href: "/admin/marketing", label: "Marketing Activity", icon: TrendingUp },
                  ]
                : [
                    { href: "/admin/reports", label: "Enquiry Source Report", icon: FileText },
                    { href: "/admin/reports", label: "Conversion Funnel Report", icon: TrendingUp },
                    { href: "/admin/reports", label: "Recruiter Performance Report", icon: Users },
                    { href: "/admin/reports", label: "Marketing Activity Report", icon: Inbox },
                  ]
              ).map(({ href, label, icon: QuickIcon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between p-3 rounded-xl border border-border-strong/30 hover:bg-surface text-xs font-semibold text-text-primary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <QuickIcon size={14} className="text-brand-500" />
                    <span>{label}</span>
                  </span>
                  <ChevronRight size={14} className="text-text-muted/60" />
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
