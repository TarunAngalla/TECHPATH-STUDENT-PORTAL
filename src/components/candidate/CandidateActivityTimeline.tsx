"use client";

import { CalendarPlus, CheckCircle2, Clock, ExternalLink, MapPin, UserRound } from "lucide-react";
import { CompanyBadge } from "@/components/shared/CompanyBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge, Button, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/utils/dates";
import { downloadActivityICS, getActivityGoogleCalendarLink } from "@/lib/utils/ics";

export type CandidateActivityView = {
  id: string;
  applicationId: string;
  eventType: string;
  activityType: string | null;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  timezone: string;
  completedAt: Date | string | null;
  result: string | null;
  score: string | null;
  roundNumber: number | null;
  roundName: string | null;
  withPerson: string | null;
  companyContactName: string | null;
  meetingLink: string | null;
  location: string | null;
  externalUrl: string | null;
  preparationNotes: string | null;
  candidateVisibleNotes: string | null;
  companyName: string;
  roleTitle: string;
  appNo: string;
};

const upcomingStatuses = new Set(["scheduled", "confirmed", "rescheduled", "assigned", "in_progress"]);

function ActivityCard({ activity }: { activity: CandidateActivityView }) {
  const calendarActivity = {
    companyName: activity.companyName,
    title: activity.title,
    scheduledAt: activity.scheduledAt,
    scheduledEndAt: activity.scheduledEndAt,
    description: activity.candidateVisibleNotes ?? activity.preparationNotes ?? activity.description,
    location: activity.location,
    meetingLink: activity.meetingLink,
  };
  return (
    <Card variant="glass" className="p-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <CompanyBadge name={activity.companyName} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{activity.companyName}</p>
            <p className="text-xs text-text-muted mt-0.5">{activity.roleTitle} · {activity.appNo}</p>
            <h3 className="text-sm font-semibold text-text-primary mt-3">{activity.title}</h3>
            {(activity.roundName || activity.roundNumber) && (
              <p className="text-xs text-text-muted mt-1">
                {activity.roundName ?? `Round ${activity.roundNumber}`}
              </p>
            )}
          </div>
        </div>
        <Badge variant={activity.status === "passed" ? "success" : activity.status === "failed" ? "danger" : "muted"}>
          {activity.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 mt-4 text-xs text-text-muted">
        {activity.scheduledAt && <span className="flex items-center gap-1.5"><Clock size={13} /> {formatDateTime(activity.scheduledAt, activity.timezone)} · {activity.timezone}</span>}
        {(activity.withPerson || activity.companyContactName) && <span className="flex items-center gap-1.5"><UserRound size={13} /> {activity.withPerson ?? activity.companyContactName}</span>}
        {activity.location && <span className="flex items-center gap-1.5"><MapPin size={13} /> {activity.location}</span>}
        {activity.completedAt && <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> Completed {formatDateTime(activity.completedAt, activity.timezone)}</span>}
      </div>

      {(activity.candidateVisibleNotes || activity.preparationNotes || activity.result || activity.score) && (
        <div className="mt-4 rounded-xl bg-surface border border-border-subtle p-3.5 text-xs leading-relaxed text-text-muted space-y-2">
          {(activity.candidateVisibleNotes || activity.preparationNotes) && <p>{activity.candidateVisibleNotes ?? activity.preparationNotes}</p>}
          {activity.result && <p><strong className="text-text-primary">Result:</strong> {activity.result}</p>}
          {activity.score && <p><strong className="text-text-primary">Score:</strong> {activity.score}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {activity.meetingLink && upcomingStatuses.has(activity.status) && (
          <Button asChild size="sm"><a href={activity.meetingLink} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Join meeting</a></Button>
        )}
        {activity.externalUrl && (
          <Button asChild size="sm" variant="outline"><a href={activity.externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Open assessment</a></Button>
        )}
        {activity.scheduledAt && (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => downloadActivityICS(calendarActivity)}><CalendarPlus size={13} /> Download calendar</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => {
              const link = getActivityGoogleCalendarLink(calendarActivity);
              if (link) window.open(link, "_blank", "noopener,noreferrer");
            }}>Google Calendar</Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function CandidateActivityTimeline({
  activities,
  kind,
}: {
  activities: CandidateActivityView[];
  kind: "interview" | "assessment";
}) {
  const now = Date.now();
  const upcoming = activities.filter((activity) => activity.scheduledAt && new Date(activity.scheduledAt).getTime() >= now && upcomingStatuses.has(activity.status));
  const history = activities.filter((activity) => !upcoming.includes(activity));
  const label = kind === "interview" ? "interviews" : "assessments";

  if (activities.length === 0) {
    return <Card variant="glass"><EmptyState title={`No ${label} yet`} note={`Verified ${label} added by your recruiter will appear here.`} /></Card>;
  }

  return (
    <div className="grid gap-7">
      <section>
        <h2 className="text-sm font-bold text-text-primary mb-3">Upcoming</h2>
        <div className="grid gap-3">
          {upcoming.length ? upcoming.map((activity) => <ActivityCard key={activity.id} activity={activity} />) : <p className="text-xs text-text-muted">Nothing scheduled right now.</p>}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-bold text-text-primary mb-3">History</h2>
        <div className="grid gap-3">
          {history.length ? history.map((activity) => <ActivityCard key={activity.id} activity={activity} />) : <p className="text-xs text-text-muted">No completed history yet.</p>}
        </div>
      </section>
    </div>
  );
}
