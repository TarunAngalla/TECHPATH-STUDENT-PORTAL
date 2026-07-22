"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ClipboardCheck, Plus, Save } from "lucide-react";
import { createApplicationActivityAction, updateApplicationActivityAction, updateApplicationAdmin } from "@/lib/actions/applications";
import { APPLICATION_EVENT_STATUSES, ASSESSMENT_ACTIVITY_TYPES, ASSESSMENT_TYPE_LABELS, INTERVIEW_ACTIVITY_TYPES, INTERVIEW_TYPE_LABELS } from "@/lib/constants/application-activity";
import { APPLICATION_STATUS_OPTIONS, type ApplicationStatus } from "@/lib/constants/status-meta";
import type { Application, ApplicationEvent } from "@/lib/db/schema";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils/dates";

function blankToNull(value: string) { return value.trim() ? value.trim() : null; }

function ActivityForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<"interview" | "assessment">("interview");
  const [activityType, setActivityType] = useState("technical_interview");
  const [title, setTitle] = useState("Technical interview");
  const [status, setStatus] = useState("scheduled");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [roundNumber, setRoundNumber] = useState("1");
  const [withPerson, setWithPerson] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const options = kind === "interview" ? INTERVIEW_ACTIVITY_TYPES : ASSESSMENT_ACTIVITY_TYPES;

  function changeKind(next: "interview" | "assessment") {
    setKind(next);
    if (next === "interview") { setActivityType("technical_interview"); setTitle("Technical interview"); }
    else { setActivityType("coding_test"); setTitle("Coding assessment"); }
  }

  return (
    <Card variant="glass" className="p-5 bg-white">
      <div className="flex items-center gap-2 mb-4"><CalendarPlus size={16} className="text-brand-500" /><h2 className="text-sm font-bold">Add interview or assessment</h2></div>
      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => {
        event.preventDefault(); setError(null);
        startTransition(async () => {
          const result = await createApplicationActivityAction({
            applicationId, eventKey: crypto.randomUUID(), eventType: kind, activityType, title, status,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null,
            timezone, roundNumber: kind === "interview" && roundNumber ? Number(roundNumber) : null,
            withPerson: blankToNull(withPerson), meetingLink: blankToNull(meetingLink), externalUrl: blankToNull(externalUrl),
            preparationNotes: blankToNull(candidateNotes), candidateVisibleNotes: blankToNull(candidateNotes),
            internalNotes: blankToNull(internalNotes), candidateVisible: true,
          });
          if (result.error) { setError(result.error); return; }
          setScheduledAt(""); setScheduledEndAt(""); setWithPerson(""); setMeetingLink(""); setExternalUrl(""); setCandidateNotes(""); setInternalNotes("");
          router.refresh();
        });
      }}>
        <Select value={kind} onChange={(event) => changeKind(event.target.value as "interview" | "assessment")}><option value="interview">Interview</option><option value="assessment">Assessment</option></Select>
        <Select value={activityType} onChange={(event) => setActivityType(event.target.value)}>{options.map((value) => <option key={value} value={value}>{kind === "interview" ? INTERVIEW_TYPE_LABELS[value as keyof typeof INTERVIEW_TYPE_LABELS] : ASSESSMENT_TYPE_LABELS[value as keyof typeof ASSESSMENT_TYPE_LABELS]}</option>)}</Select>
        <Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Activity title" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>{APPLICATION_EVENT_STATUSES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</Select>
        <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required={["scheduled","confirmed","rescheduled"].includes(status)} aria-label="Start time" title={["scheduled","confirmed","rescheduled"].includes(status) ? "Start time is required for scheduled activity" : "Start time"} />
        <Input type="datetime-local" value={scheduledEndAt} onChange={(event) => setScheduledEndAt(event.target.value)} aria-label="End time" />
        <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Timezone" />
        {kind === "interview" && <Input type="number" min="1" max="20" value={roundNumber} onChange={(event) => setRoundNumber(event.target.value)} placeholder="Round" />}
        <Input value={withPerson} onChange={(event) => setWithPerson(event.target.value)} placeholder="Interviewer / contact" />
        <Input type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="Meeting link" />
        <Input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="Assessment link" />
        <Textarea value={candidateNotes} onChange={(event) => setCandidateNotes(event.target.value)} placeholder="Candidate-visible preparation notes" rows={3} />
        <Textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} placeholder="Internal notes" rows={3} />
        <div className="md:col-span-2 xl:col-span-3 flex items-center gap-3"><Button type="submit" loading={pending} disabled={pending}><Plus size={14} /> Add activity</Button>{error && <span className="text-xs text-danger">{error}</span>}</div>
      </form>
    </Card>
  );
}

function EventRow({ event }: { event: ApplicationEvent }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(event.status);
  const [scheduledAt, setScheduledAt] = useState(event.scheduledAt ? new Date(event.scheduledAt).toISOString().slice(0, 16) : "");
  const [scheduledEndAt, setScheduledEndAt] = useState(event.scheduledEndAt ? new Date(event.scheduledEndAt).toISOString().slice(0, 16) : "");
  const [meetingLink, setMeetingLink] = useState(event.meetingLink ?? "");
  const [externalUrl, setExternalUrl] = useState(event.externalUrl ?? "");
  const [result, setResult] = useState(event.result ?? "");
  const [score, setScore] = useState(event.score ?? "");
  const [candidateNotes, setCandidateNotes] = useState(event.candidateVisibleNotes ?? "");
  const [internalNotes, setInternalNotes] = useState(event.internalNotes ?? "");
  const [pending, startTransition] = useTransition();
  return (
    <div className="border border-border-subtle rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3 flex-wrap"><div><h3 className="text-sm font-semibold text-text-primary">{event.title}</h3><p className="text-xs text-text-muted mt-1">{event.eventType} · {event.activityType?.replaceAll("_", " ") ?? "activity"}{event.scheduledAt ? ` · ${formatDateTime(event.scheduledAt)}` : ""}</p></div><Badge variant="muted">{event.status.replaceAll("_", " ")}</Badge></div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 mt-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>{APPLICATION_EVENT_STATUSES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</Select>
        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <Input type="datetime-local" value={scheduledEndAt} onChange={(e) => setScheduledEndAt(e.target.value)} />
        <Input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="Meeting link" />
        <Input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="Assessment link" />
        <Input value={result} onChange={(e) => setResult(e.target.value)} placeholder="Result" />
        <Input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" />
        <Textarea value={candidateNotes} onChange={(e) => setCandidateNotes(e.target.value)} placeholder="Candidate-visible notes" rows={2} />
        <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Internal notes" rows={2} />
      </div>
      <Button className="mt-3" size="sm" variant="outline" loading={pending} onClick={() => startTransition(async () => {
        const response = await updateApplicationActivityAction({
          eventId: event.id,
          status,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null,
          meetingLink: blankToNull(meetingLink),
          externalUrl: blankToNull(externalUrl),
          result: blankToNull(result),
          score: blankToNull(score),
          candidateVisibleNotes: blankToNull(candidateNotes),
          internalNotes: blankToNull(internalNotes),
        });
        if (!response.error) router.refresh();
      })}><Save size={13} /> Save activity</Button>
    </div>
  );
}

export function ApplicationActivityManager({ application, events, candidateName }: { application: Application; events: ApplicationEvent[]; candidateName: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(application.status as ApplicationStatus);
  const [nextAction, setNextAction] = useState(application.nextAction ?? "");
  const [nextActionAt, setNextActionAt] = useState(application.nextActionAt ? new Date(application.nextActionAt).toISOString().slice(0,16) : "");
  const [candidateNotes, setCandidateNotes] = useState(application.candidateVisibleNotes ?? application.comment ?? "");
  const [internalNotes, setInternalNotes] = useState(application.internalNotes ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const activityEvents = useMemo(() => events.filter((event) => event.eventType === "interview" || event.eventType === "assessment"), [events]);
  return (
    <div className="grid gap-5">
      <Card variant="glass" className="p-5 bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap"><div><p className="text-xs text-text-muted">{candidateName} · {application.appNo}</p><h2 className="text-xl font-bold text-text-primary mt-1">{application.companyName}</h2><p className="text-sm text-text-muted">{application.roleTitle}</p></div><Badge variant="muted">{application.priority} priority</Badge></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mt-5">
          <Select value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>{APPLICATION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Next action" />
          <Input type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
          <Textarea value={candidateNotes} onChange={(event) => setCandidateNotes(event.target.value)} placeholder="Candidate-visible notes" rows={3} />
          <Textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} placeholder="Internal recruiter notes" rows={3} />
        </div>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <Button loading={pending} disabled={pending} onClick={() => startTransition(async () => {
            setSaveError(null);
            setSaveOk(false);
            const response = await updateApplicationAdmin({ applicationId: application.id, status, nextAction: blankToNull(nextAction), nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null, candidateVisibleNotes: blankToNull(candidateNotes), internalNotes: blankToNull(internalNotes) });
            if (response.error) { setSaveError(response.error); return; }
            setSaveOk(true);
            router.refresh();
          })}><Save size={14} /> Save application</Button>
          {saveError && <span className="text-xs text-danger">{saveError}</span>}
          {saveOk && !saveError && <span className="text-xs text-success">Saved</span>}
        </div>
      </Card>
      <ActivityForm applicationId={application.id} />
      <Card variant="glass" className="p-5 bg-white">
        <div className="flex items-center gap-2 mb-4"><ClipboardCheck size={16} className="text-brand-500" /><h2 className="text-sm font-bold">Interview and assessment history</h2></div>
        <div className="grid gap-3">{activityEvents.length ? activityEvents.map((event) => <EventRow key={event.id} event={event} />) : <p className="text-xs text-text-muted">No interview or assessment activity yet.</p>}</div>
      </Card>
    </div>
  );
}
