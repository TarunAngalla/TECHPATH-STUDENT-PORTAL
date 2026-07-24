"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createApplicationActivityAction } from "@/lib/actions/applications";
import {
  APPLICATION_EVENT_STATUSES,
  ASSESSMENT_ACTIVITY_TYPES,
  ASSESSMENT_TYPE_LABELS,
  INTERVIEW_ACTIVITY_TYPES,
  INTERVIEW_TYPE_LABELS,
} from "@/lib/constants/application-activity";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { fromDateTimeLocalValue } from "@/lib/utils/dates";
import { StaffFormModal } from "@/components/admin/StaffFormModal";

export type ApplicationOption = {
  id: string;
  candidateName: string;
  companyName: string;
  roleTitle: string;
  appNo: string;
};

function blankToNull(value: string) {
  return value.trim() ? value.trim() : null;
}

export function StaffAddActivityPanel({
  kind,
  applications,
}: {
  kind: "interview" | "assessment";
  applications: ApplicationOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const defaultType = kind === "interview" ? "technical_interview" : "coding_test";
  const defaultTitle = kind === "interview" ? "Technical interview" : "Coding assessment";
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const [activityType, setActivityType] = useState(defaultType);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState("scheduled");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [roundNumber, setRoundNumber] = useState("1");
  const [withPerson, setWithPerson] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const typeOptions = kind === "interview" ? INTERVIEW_ACTIVITY_TYPES : ASSESSMENT_ACTIVITY_TYPES;
  const typeLabels = kind === "interview" ? INTERVIEW_TYPE_LABELS : ASSESSMENT_TYPE_LABELS;
  const singular = kind === "interview" ? "interview" : "assessment";

  const close = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);

  if (applications.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Create an application first, then you can schedule a {singular} here.
      </p>
    );
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} aria-hidden="true" /> Add {singular}
      </Button>

      <StaffFormModal
        open={open}
        title={`Schedule ${singular}`}
        onClose={close}
        pending={pending}
        className="max-w-3xl"
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await createApplicationActivityAction({
                applicationId,
                eventKey: crypto.randomUUID(),
                eventType: kind,
                activityType,
                title,
                status,
                scheduledAt: fromDateTimeLocalValue(scheduledAt),
                scheduledEndAt: fromDateTimeLocalValue(scheduledEndAt),
                timezone,
                roundNumber: kind === "interview" && roundNumber ? Number(roundNumber) : null,
                withPerson: blankToNull(withPerson),
                meetingLink: blankToNull(meetingLink),
                externalUrl: blankToNull(externalUrl),
                preparationNotes: blankToNull(candidateNotes),
                candidateVisibleNotes: blankToNull(candidateNotes),
                candidateVisible: true,
              });
              if (result.error) {
                setError(result.error);
                return;
              }
              setOpen(false);
              setScheduledAt("");
              setScheduledEndAt("");
              setWithPerson("");
              setMeetingLink("");
              setExternalUrl("");
              setCandidateNotes("");
              router.push(`/admin/applications/${applicationId}`);
            });
          }}
        >
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Application</span>
            <Select
              required
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              disabled={pending}
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.candidateName} · {app.companyName} · {app.roleTitle} ({app.appNo})
                </option>
              ))}
            </Select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Type</span>
            <Select
              value={activityType}
              disabled={pending}
              onChange={(e) => {
                setActivityType(e.target.value);
                const label = typeLabels[e.target.value as keyof typeof typeLabels];
                if (label) setTitle(label);
              }}
            >
              {typeOptions.map((value) => (
                <option key={value} value={value}>
                  {typeLabels[value as keyof typeof typeLabels]}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Title</span>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={pending}>
              {APPLICATION_EVENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Timezone</span>
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Timezone"
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Start</span>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required={["scheduled", "confirmed", "rescheduled"].includes(status)}
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">End</span>
            <Input
              type="datetime-local"
              value={scheduledEndAt}
              onChange={(e) => setScheduledEndAt(e.target.value)}
              disabled={pending}
            />
          </label>
          {kind === "interview" && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Round</span>
              <Input
                type="number"
                min="1"
                max="20"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
                disabled={pending}
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">
              {kind === "interview" ? "Interviewer / contact" : "Contact"}
            </span>
            <Input
              value={withPerson}
              onChange={(e) => setWithPerson(e.target.value)}
              placeholder={kind === "interview" ? "Interviewer / contact" : "Contact"}
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Meeting link</span>
            <Input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="Meeting link"
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">
              {kind === "assessment" ? "Assessment link" : "External link"}
            </span>
            <Input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder={kind === "assessment" ? "Assessment link" : "External link"}
              disabled={pending}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">
              Candidate-visible notes
            </span>
            <Textarea
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              placeholder="Candidate-visible notes"
              rows={3}
              disabled={pending}
            />
          </label>
          {error && (
            <p className="text-xs font-semibold text-danger md:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 md:col-span-2">
            <Button type="button" size="sm" variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending} loading={pending}>
              <Plus size={14} /> Schedule {singular}
            </Button>
          </div>
        </form>
      </StaffFormModal>
    </>
  );
}
