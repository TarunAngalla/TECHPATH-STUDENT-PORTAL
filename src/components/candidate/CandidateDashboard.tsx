"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendMessageAction } from "@/lib/actions/messages";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
  Mail,
  MessageCircle,
  Users,
  Send,
  ClipboardCheck,
  Headphones,
  Target,
  ShieldCheck,
  Calendar,
  BookOpen
} from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, CardTitle, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui";
import { dayLabel, daysUntil, formatDate, formatDateTime } from "@/lib/utils/dates";
import { downloadInterviewICS, getGoogleCalendarLink } from "@/lib/utils/ics";
import type { Application } from "@/lib/db/schema";
import { STATUS_META, type ApplicationStatus } from "@/lib/constants/status-meta";
import { cn } from "@/lib/utils/cn";

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  href: string;
};

// Custom SVG Arrow for horizontal stepper
function StepperArrow({ solid = true }: { solid?: boolean }) {
  return (
    <div className="hidden md:flex items-center justify-center flex-1 min-w-[20px] max-w-[60px] mx-2">
      <svg
        width="100%"
        height="8"
        viewBox="0 0 40 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-brand-500 opacity-60"
      >
        <path
          d="M0 4H36M36 4L32 1M36 4L32 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={solid ? undefined : "3 3"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function NextUpBanner({ next }: { next: Application }) {
  if (!next.upcomingWhen || !next.upcomingLabel) return null;
  const days = daysUntil(next.upcomingWhen);
  const label = dayLabel(days);

  return (
    <Card variant="glass" className="col-span-full p-4 bg-warning-soft/10 border border-warning/20 rounded-2xl shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0 border border-border-strong/40">
            <Clock size={18} className="text-warning" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">
              Next up: {next.companyName} — {next.upcomingLabel}
              {label ? `, ${label}` : ""}
            </div>
            <div className="text-xs text-text-muted">{formatDateTime(next.upcomingWhen)}</div>
          </div>
          {days !== null && days >= 0 && (
            <Badge variant="warning" className="ml-1 flex-shrink-0 text-[10px]">
              {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="text-xs border border-border-strong/40 bg-white hover:bg-surface text-text-primary">
                <CalendarCheck size={13} aria-hidden="true" /> Add to calendar <ChevronDown size={12} className="ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  downloadInterviewICS({
                    companyName: next.companyName,
                    upcomingLabel: next.upcomingLabel,
                    upcomingWhen: next.upcomingWhen,
                    upcomingPrep: next.upcomingPrep,
                  })
                }
              >
                <span>Download iCal (.ics)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = getGoogleCalendarLink({
                    companyName: next.companyName,
                    upcomingLabel: next.upcomingLabel,
                    upcomingWhen: next.upcomingWhen,
                    upcomingPrep: next.upcomingPrep,
                  });
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <span>Add to Google Calendar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" asChild className="text-xs bg-brand-500 hover:bg-brand-600 text-white">
            <Link href="/interview-details">View details</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RecruiterCard({
  recruiter,
}: {
  recruiter: { id: string; email: string; name: string; title: string; phone: string | null; timezone: string } | null;
  candidateId?: string;
}) {
  const [quickMsg, setQuickMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSendQuickMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.trim() || !recruiter) return;

    startTransition(async () => {
      const result = await sendMessageAction(recruiter.id, quickMsg);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Message sent to recruiter!");
        setQuickMsg("");
      }
    });
  };

  return (
    <Card variant="glass" className="rounded-2xl border border-border-strong/50 shadow-xs p-5 bg-white">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Assigned Recruiter</h3>
      {recruiter ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={recruiter.name} size="lg" className="h-12 w-12 border border-border-strong/50 shadow-xs" />
            <div>
              <div className="text-sm font-semibold text-text-primary">{recruiter.name}</div>
              <div className="text-xs text-text-muted">{recruiter.title}</div>
            </div>
          </div>
          <div className="text-xs text-text-muted space-y-2">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-text-muted/70" />
              <a href={`mailto:${recruiter.email}`} className="hover:underline">{recruiter.email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Users size={13} className="text-text-muted/70" />
              <span>{recruiter.phone ?? "Phone available through TechPath support"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <form onSubmit={handleSendQuickMsg} className="flex gap-2">
              <input
                type="text"
                placeholder="Send a quick message..."
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                disabled={isPending}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs outline-none border border-border-strong/50 bg-surface text-text-primary focus:border-brand-500/40 focus:bg-white transition-all duration-200"
              />
              <Button type="submit" size="sm" disabled={isPending || !quickMsg.trim()} className="bg-brand-500 text-white hover:bg-brand-600">
                {isPending ? "Sending" : "Send"}
              </Button>
            </form>
            <Button variant="outline" size="sm" asChild className="w-full text-xs text-brand-500 border-brand-500/30 hover:bg-brand-50 bg-white">
              <Link href="/messages" className="inline-flex items-center justify-center gap-1.5">
                <MessageCircle size={13} />
                <span>Open Chat Thread</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">A recruiter will be assigned to you shortly.</p>
      )}
    </Card>
  );
}

function TrainingsCard({
  trainings,
}: {
  trainings: {
    completed: { id: string; title: string; status: string }[];
    upcoming: { id: string; title: string; status: string }[];
    total: number;
    completedCount: number;
  };
}) {
  const pct =
    trainings.total === 0 ? 0 : Math.round((trainings.completedCount / trainings.total) * 100);

  return (
    <Card variant="glass" className="rounded-2xl border border-border-strong/50 shadow-xs p-5 bg-white h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Trainings</h3>
          <Link href="/trainings" className="text-xs font-semibold text-brand-500 hover:underline">
            View All Trainings →
          </Link>
        </div>

        {trainings.total === 0 ? (
          <p className="text-xs text-text-muted py-6 text-center">
            No trainings assigned yet. Your recruiter will add modules soon.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-medium text-text-primary mb-1">
                <span>Overall progress</span>
                <span className="text-brand-500 font-semibold">{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-text-muted mt-1.5">
                {trainings.completedCount} of {trainings.total} completed
              </p>
            </div>

            {trainings.completed.length > 0 && (
              <div className="space-y-3 mb-5">
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Completed</div>
                <div className="space-y-2">
                  {trainings.completed.slice(0, 4).map((t) => (
                    <div key={t.id}>
                      <div className="flex items-center justify-between text-xs font-medium text-text-primary mb-1">
                        <span className="truncate pr-2">{t.title}</span>
                        <span className="text-success font-semibold flex-shrink-0">100%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trainings.upcoming.length > 0 && (
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Upcoming</div>
                <div className="space-y-2.5">
                  {trainings.upcoming.slice(0, 4).map((t) => (
                    <div key={t.id} className="flex items-start gap-2.5">
                      <BookOpen size={14} className="text-text-muted/70 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-text-primary">{t.title}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Assigned · not completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="pt-5 border-t border-border-subtle mt-5">
        <Button variant="outline" size="sm" asChild className="w-full text-xs text-brand-500 border-brand-500/30 hover:bg-brand-50 bg-white">
          <Link href="/trainings" className="inline-flex items-center justify-center gap-1.5">
            <BookOpen size={13} />
            <span>Browse All Trainings</span>
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function AnnouncementsCard({
  announcements,
  checklist,
}: {
  announcements: { id: string; title: string; createdAt: Date | string }[];
  checklist: ChecklistItem[];
}) {
  return (
    <Card variant="glass" className="rounded-2xl border border-border-strong/50 shadow-xs p-5 bg-white h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Announcements & Next Steps</h3>
        </div>

        <div className="space-y-4">
          {announcements.map((ann, i) => (
            <div key={ann.id || `ann-${i}`} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success flex-shrink-0">
                <Send size={14} />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">{ann.title}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{formatDate(ann.createdAt)}</div>
              </div>
            </div>
          ))}

          {checklist.filter((item) => !item.done).map((item, i) => (
            <div key={item.key || `check-${i}`} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50/70 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Target size={14} />
              </div>
              <div>
                <div className="text-xs font-semibold text-text-primary">Next Step: {item.label}</div>
                <Link href={item.href} className="text-[10px] text-brand-500 hover:underline font-semibold block mt-0.5">
                  Complete now →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-border-subtle mt-5">
        <Link href="/interview-details" className="text-xs font-semibold text-brand-500 hover:underline flex items-center justify-center gap-1">
          View My Interviews & Assessments <ChevronRight size={13} />
        </Link>
      </div>
    </Card>
  );
}

export function CandidateDashboard({
  candidateId,
  candidateName,
  journeyStage,
  profileLastUpdated,
  stats,
  recruiter,
  announcements,
  checklist,
}: {
  candidateId: string;
  candidateName: string;
  journeyStage: number;
  profileLastUpdated: string;
  stats: {
    totalApplications: number;
    inInterviewProcess: number;
    interviewsAttended: number;
    assessmentsCompleted: number;
    upcomingThisMonth: number;
    upcomingInterviewCount: number;
    appsThisWeek: number;
    applications: Application[];
    upcoming: Application[];
    trainings: {
      completed: { id: string; title: string; status: string }[];
      upcoming: { id: string; title: string; status: string }[];
      total: number;
      completedCount: number;
    };
    recentActivity: Application[];
  };
  recruiter: { id: string; email: string; name: string; title: string; phone: string | null; timezone: string } | null;
  announcements: { id: string; title: string; createdAt: Date | string }[];
  checklist: ChecklistItem[];
}) {
  const uniqueCompanies = new Set(stats.applications.map((a) => a.companyName)).size;
  const nextUp = stats.upcoming[0];
  const emptyApplications = stats.totalApplications === 0;
  const marketingLive = journeyStage >= 2;

  const welcomeSubtitle = emptyApplications
    ? marketingLive
      ? "Marketing is live. Your recruiter will add applications here as they submit them to employers."
      : "Your recruiter is preparing your profile. Check Messages or trainings while you wait."
    : `You're being marketed to employers with ${stats.totalApplications} applications across ${uniqueCompanies} companies.`;

  const emptyTitle = marketingLive
    ? "Marketing is underway"
    : "Your recruiter is setting up your profile";

  const emptyBody = marketingLive
    ? "No applications have been logged yet. As soon as your recruiter submits roles for you, they will show up on Applications and here on your dashboard."
    : "Applications will appear here once marketing begins. Meanwhile, complete your checklist and message your recruiter if you have questions.";

  return (
    <div className="grid gap-6">
      <Card variant="glass" className="col-span-full p-6 bg-white border border-border-strong/45 shadow-xs relative overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted font-medium">Profile last updated {profileLastUpdated}</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mt-1.5">Welcome back, {candidateName}!</h2>
            <p className="text-sm text-text-muted mt-1 max-w-xl">{welcomeSubtitle}</p>
          </div>
          <div className="flex-shrink-0">
            <Badge variant="accent" className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 size={12} /> Stage {journeyStage} · Active
            </Badge>
          </div>
        </div>

        <div className="border-t border-border-subtle mt-6 pt-6">
          <div className="flex items-center justify-between md:justify-start flex-wrap md:flex-nowrap gap-y-4 md:gap-y-0 px-2">
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-sm", journeyStage >= 1 ? "bg-success text-white" : "bg-brand-500 text-white")}>
                <CheckCircle2 size={16} />
              </div>
              <span className="text-xs font-semibold text-text-primary mt-2">Resume & Profile Training</span>
            </div>
            <StepperArrow solid />
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-sm", journeyStage >= 2 ? "bg-success text-white" : journeyStage === 1 ? "bg-brand-500 text-white" : "bg-surface border border-border-strong text-text-muted")}>
                {journeyStage >= 2 ? <CheckCircle2 size={16} /> : <Users size={15} />}
              </div>
              <span className={cn("text-xs font-semibold mt-2", journeyStage >= 2 ? "text-text-primary" : journeyStage === 1 ? "text-brand-500" : "text-text-muted")}>Recruiter Assigned</span>
            </div>
            <StepperArrow solid />
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-sm", journeyStage >= 3 ? "bg-success text-white" : journeyStage === 2 ? "bg-brand-500 text-white" : "bg-surface border border-border-strong text-text-muted")}>
                {journeyStage >= 3 ? <CheckCircle2 size={16} /> : <Send size={15} />}
              </div>
              <span className={cn("text-xs font-semibold mt-2", journeyStage >= 3 ? "text-text-primary" : journeyStage === 2 ? "text-brand-500" : "text-text-muted")}>Marketing Launched</span>
            </div>
            <StepperArrow solid={false} />
            <div className="flex flex-col items-center text-center w-full md:w-auto">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-sm", journeyStage >= 4 ? "bg-success text-white" : journeyStage === 3 ? "bg-brand-500 text-white" : "bg-surface border border-border-strong text-text-muted")}>
                {journeyStage >= 4 ? <CheckCircle2 size={16} /> : <Calendar size={15} />}
              </div>
              <span className={cn("text-xs font-semibold mt-2", journeyStage >= 4 ? "text-text-primary" : journeyStage === 3 ? "text-brand-500" : "text-text-muted")}>Interviews & Assessments</span>
            </div>
          </div>
        </div>
      </Card>

      {emptyApplications ? (
        <Card variant="glass" className="p-10 text-center bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          {marketingLive ? (
            <Send size={28} className="mx-auto text-brand-500 mb-3" />
          ) : (
            <Users size={28} className="mx-auto text-brand-500 mb-3" />
          )}
          <h3 className="text-base font-bold text-text-primary">{emptyTitle}</h3>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">{emptyBody}</p>
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <Button asChild size="sm" className="bg-brand-500 text-white hover:bg-brand-600">
              <Link href="/messages">Message recruiter</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={marketingLive ? "/applications" : "/documents"}>
                {marketingLive ? "View applications" : "Upload resume"}
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {nextUp && <NextUpBanner next={nextUp} />}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/applications">
              <Card variant="glass" className="p-5 flex items-center justify-between bg-white border border-border-strong/50 shadow-xs hover:border-brand-500/40 transition-colors h-full">
                <div>
                  <div className="text-xs text-text-muted font-medium">Applications submitted</div>
                  <div className="text-2xl font-bold text-text-primary mt-1">{stats.totalApplications}</div>
                  <div className="text-[10px] text-text-muted font-semibold mt-1">
                    {stats.appsThisWeek > 0 ? (
                      <span className="text-success">+{stats.appsThisWeek} this week</span>
                    ) : (
                      <span>No new apps this week</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/10">
                  <Send size={18} />
                </div>
              </Card>
            </Link>

            <Link href="/interview-details">
              <Card variant="glass" className="p-5 flex items-center justify-between bg-white border border-border-strong/50 shadow-xs hover:border-brand-500/40 transition-colors h-full">
                <div>
                  <div className="text-xs text-text-muted font-medium">Interviews attended</div>
                  <div className="text-2xl font-bold text-text-primary mt-1">{stats.interviewsAttended}</div>
                  <div className="text-[10px] text-text-muted font-semibold mt-1">{stats.upcomingInterviewCount} upcoming</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/10">
                  <Users size={18} />
                </div>
              </Card>
            </Link>

            <Link href="/assessments">
              <Card variant="glass" className="p-5 flex items-center justify-between bg-white border border-border-strong/50 shadow-xs hover:border-brand-500/40 transition-colors h-full">
                <div>
                  <div className="text-xs text-text-muted font-medium">Assessments completed</div>
                  <div className="text-2xl font-bold text-text-primary mt-1">{stats.assessmentsCompleted}</div>
                  <div className="text-[10px] text-text-muted font-semibold mt-1">Verified assessment activity</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-500/10">
                  <ClipboardCheck size={18} />
                </div>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-6">
              <RecruiterCard recruiter={recruiter} candidateId={candidateId} />
              <Card variant="glass" className="rounded-2xl border border-border-strong/50 shadow-xs p-5 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 border border-brand-500/10">
                    <Headphones size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Need Help?</h4>
                    <p className="text-[10px] text-text-muted">Message your recruiter for support.</p>
                  </div>
                </div>
                <Link href="/messages" className="text-[11px] font-semibold text-brand-500 hover:underline block mt-3">
                  Open messages →
                </Link>
              </Card>
            </div>

            <div>
              <TrainingsCard trainings={stats.trainings} />
            </div>

            <div>
              <AnnouncementsCard announcements={announcements} checklist={checklist} />
            </div>
          </div>

          <Card variant="glass" className="rounded-2xl border border-border-strong/50 shadow-xs bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 border-b border-border-subtle">
              <CardTitle className="text-sm font-semibold text-text-primary">Recent application activity</CardTitle>
              <Link href="/applications" className="text-xs font-semibold text-brand-500 hover:underline">
                View All Activity →
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left" aria-label="Recent activity">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle">
                    <th scope="col" className="px-6 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-6 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Updated</th>
                    <th scope="col" className="px-6 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs">
                  {stats.recentActivity.map((app) => {
                    const meta = STATUS_META[app.status as ApplicationStatus] ?? STATUS_META.applied;
                    return (
                      <tr key={app.id}>
                        <td className="px-6 py-4 font-semibold text-text-primary">{app.companyName}</td>
                        <td className="px-6 py-4 text-text-muted">{app.roleTitle}</td>
                        <td className="px-6 py-4">
                          <Badge variant="default" className="px-2 py-0.5 rounded-full text-[10px]">
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text-muted">{formatDate(app.updatedAt)}</td>
                        <td className="px-6 py-4">
                          <Link href="/applications" className="text-brand-500 font-semibold hover:underline">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {emptyApplications && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecruiterCard recruiter={recruiter} candidateId={candidateId} />
          <TrainingsCard trainings={stats.trainings} />
          <AnnouncementsCard announcements={announcements} checklist={checklist} />
        </div>
      )}

      <div className="col-span-full border border-border-strong/50 rounded-2xl p-4 bg-brand-50/20 text-xs text-text-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-500" />
          <span>
            Official offer letters, payroll, timesheets, and compliance documents are managed securely on{" "}
            <a href="https://radxsys.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-500 hover:underline">
              radxsys.com
            </a>
            .
          </span>
        </div>
        <Clock size={14} className="text-text-muted/60 hidden md:block" />
      </div>
    </div>
  );
}
