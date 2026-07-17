"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react";
import { ApplicationPipelineChart } from "@/components/candidate/ApplicationPipelineChart";
import { AnimatedProgress, StaggerChildren, StaggerItem } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { JourneyBar } from "@/components/shared/JourneyBar";
import { StatCard } from "@/components/shared/StatCard";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { dayLabel, daysUntil, formatDate, formatDateTime } from "@/lib/utils/dates";
import { downloadInterviewICS } from "@/lib/utils/ics";
import type { Application } from "@/lib/db/schema";

function NextUpBanner({ next }: { next: Application }) {
  if (!next.upcomingWhen || !next.upcomingLabel) return null;
  const days = daysUntil(next.upcomingWhen);
  const label = dayLabel(days);

  return (
    <Card variant="glass" className="col-span-full p-4 bg-warning-soft/40 border-warning/20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center flex-shrink-0 shadow-sm">
            <Clock size={18} className="text-warning" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-primary">
              Next up: {next.companyName} — {next.upcomingLabel}
              {label ? `, ${label}` : ""}
            </div>
            <div className="text-xs text-text-muted">{formatDateTime(next.upcomingWhen)}</div>
          </div>
          {days !== null && days >= 0 && (
            <Badge variant="warning" className="ml-1 flex-shrink-0">
              {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadInterviewICS({
                companyName: next.companyName,
                upcomingLabel: next.upcomingLabel,
                upcomingWhen: next.upcomingWhen,
                upcomingPrep: next.upcomingPrep,
              })
            }
          >
            <CalendarCheck size={13} aria-hidden="true" /> Add to calendar
          </Button>
          <Button size="sm" asChild>
            <Link href="/upcoming">View details</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

type ChecklistItem = { label: string; done: boolean; href: string };

function OnboardingChecklist({ checklist }: { checklist: ChecklistItem[] }) {
  const doneCount = checklist.filter((i) => i.done).length;
  const progress = checklist.length ? (doneCount / checklist.length) * 100 : 0;

  return (
    <Card variant="glass" hover="lift" className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Getting started</CardTitle>
        <span className="text-xs font-medium text-brand-500">
          {doneCount} of {checklist.length} complete
        </span>
      </CardHeader>
      <CardContent>
        <AnimatedProgress value={progress} className="mb-4" />
        <StaggerChildren className="space-y-2.5" stagger={0.06}>
          {checklist.map((item) => (
            <StaggerItem key={item.label}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done
                      ? "bg-success text-white"
                      : "bg-surface border border-border-strong"
                  }`}
                >
                  {item.done && <CheckCircle2 size={11} aria-hidden="true" />}
                </div>
                <span
                  className={`text-xs ${
                    item.done ? "text-text-muted line-through" : "text-text-primary"
                  }`}
                >
                  {item.label}
                </span>
                {!item.done && (
                  <Link
                    href={item.href}
                    className="text-[11px] font-medium ml-auto text-brand-500 hover:text-brand-600"
                  >
                    Go <ChevronRight size={11} className="inline" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </CardContent>
    </Card>
  );
}

function RecruiterCard({ recruiter }: { recruiter: { email: string; name: string } | null }) {
  return (
    <Card variant="glass" hover="lift" className="h-full">
      <CardHeader>
        <CardTitle>Assigned recruiter</CardTitle>
      </CardHeader>
      <CardContent>
        {recruiter ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={recruiter.name} size="lg" />
              <div>
                <div className="text-sm font-medium text-text-primary">{recruiter.name}</div>
                <div className="text-xs text-text-muted">Recruiter</div>
              </div>
            </div>
            <div className="text-xs text-text-muted flex items-center gap-2 mb-4">
              <Mail size={13} aria-hidden="true" /> {recruiter.email}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/messages" className="inline-flex items-center gap-2">
                <MessageCircle size={13} aria-hidden="true" />
                <span>Message recruiter</span>
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-xs text-text-muted">A recruiter will be assigned to you shortly.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AnnouncementsCard({
  announcements,
}: {
  announcements: { id: string; title: string; createdAt: Date | string }[];
}) {
  return (
    <Card variant="glass" hover="lift" className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Announcements</CardTitle>
        <Link
          href="/announcements"
          className="text-xs font-medium flex items-center gap-1 text-brand-500 hover:text-brand-600"
        >
          View all <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-xs text-text-muted">No announcements yet.</p>
          ) : (
            announcements.slice(0, 2).map((a) => (
              <div key={a.id}>
                <div className="text-sm font-medium text-text-primary">{a.title}</div>
                <div className="text-xs text-text-muted">{formatDate(a.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CandidateDashboard({
  candidateName,
  journeyStage,
  profileLastUpdated,
  stats,
  recruiter,
  announcements,
  checklist,
}: {
  candidateName: string;
  journeyStage: number;
  profileLastUpdated: string;
  stats: {
    totalApplications: number;
    inInterviewProcess: number;
    upcomingThisMonth: number;
    applications: Application[];
    upcoming: Application[];
  };
  recruiter: { email: string; name: string } | null;
  announcements: { id: string; title: string; createdAt: Date | string }[];
  checklist: ChecklistItem[];
}) {
  if (stats.totalApplications === 0) {
    return (
      <Card variant="solid" className="p-10">
        <EmptyState
          title="Your recruiter is setting up your profile"
          note="Once marketing begins, your applications, interviews, and progress will show up here automatically."
        />
      </Card>
    );
  }

  const uniqueCompanies = new Set(stats.applications.map((a) => a.companyName)).size;
  const nextUp = stats.upcoming[0];

  return (
    <div className="grid gap-4 md:gap-6">
      <Card variant="gradient" className="col-span-full p-6 relative overflow-hidden">
        <div
          className="absolute rounded-full bg-white/6"
          style={{ width: 160, height: 160, right: -40, top: -50 }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-white/5"
          style={{ width: 110, height: 110, right: 60, bottom: -60 }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="text-xs font-medium mb-1.5 text-white/70">Welcome back</div>
          <h2 className="text-xl font-semibold text-white mb-1.5">{candidateName}</h2>
          <p className="text-sm max-w-md mb-2 text-white/80">
            Your profile is being marketed to top employers. {stats.totalApplications} active
            applications in progress across {uniqueCompanies} companies.
          </p>
          <p className="text-[11px] text-white/60">Profile last updated {profileLastUpdated}</p>
          <p className="text-[11px] mt-1 text-white/60">
            Current stage: {JOURNEY_STEPS[journeyStage] ?? JOURNEY_STEPS[0]}
          </p>
        </div>
      </Card>

      {nextUp && <NextUpBanner next={nextUp} />}

      <StaggerChildren className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <StatCard
            label="Applications submitted"
            value={stats.totalApplications}
            icon={Briefcase}
            iconVariant="brand"
            href="/applications"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="In interview process"
            value={stats.inInterviewProcess}
            icon={Users}
            iconVariant="teal"
            href="/upcoming"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Upcoming this month"
            value={stats.upcomingThisMonth}
            icon={Clock}
            iconVariant="warning"
            href="/upcoming"
          />
        </StaggerItem>
      </StaggerChildren>

      <Card variant="glass" className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Your journey</CardTitle>
          <Link
            href="/progress"
            className="text-xs font-medium flex items-center gap-1 text-brand-500 hover:text-brand-600"
          >
            View details <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="pt-2">
          <JourneyBar current={journeyStage} />
        </CardContent>
      </Card>

      <div className="col-span-full grid md:grid-cols-2 gap-4 md:gap-6">
        <ApplicationPipelineChart applications={stats.applications} />
        <OnboardingChecklist checklist={checklist} />
      </div>

      <div className="col-span-full grid md:grid-cols-2 gap-4 md:gap-6">
        <RecruiterCard recruiter={recruiter} />
        <AnnouncementsCard announcements={announcements} />
      </div>
    </div>
  );
}
