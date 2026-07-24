"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Search,
  Send,
  StickyNote,
  UserPlus,
  Video,
  XCircle,
} from "lucide-react";
import { createCandidateFromLead, checkCandidateLoginEmail, suggestCandidateLoginEmail } from "@/lib/actions/candidates";
import {
  approveLeadForPortal,
  createLead,
  rejectLead,
  saveLeadNotes,
  scheduleLeadConsultation,
  updateLeadConsultationStatus,
} from "@/lib/actions/leads";
import { LEAD_STATUS_META, type LeadStatus } from "@/lib/constants/lead-status";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { formatExperienceYears } from "@/lib/utils/experience";
import type { leads } from "@/lib/db/schema";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type Lead = typeof leads.$inferSelect;

type CreatedAccount = {
  email: string;
  delivery?: string;
  expiresAt?: string;
  previewUrl?: string;
  warning?: string;
};

const LEAD_BADGE_VARIANT = {
  new: "muted",
  contacted: "default",
  qualified: "success",
  rejected: "danger",
  converted: "accent",
} as const;

const CONSULTATION_LABELS: Record<Lead["consultationStatus"], string> = {
  not_scheduled: "Not scheduled",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

function LeadStatusPill({ status }: { status: LeadStatus }) {
  return <Badge variant={LEAD_BADGE_VARIANT[status]}>{LEAD_STATUS_META[status].label}</Badge>;
}

function toLocalDateTimeInput(value: Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localPartFromName(fullName: string) {
  const slug = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/[\s_]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
  return slug || "candidate";
}

function LeadCreateAccountPanel({
  lead,
  recruiters,
  emailDomain,
  onCreated,
}: {
  lead: Lead;
  recruiters: { id: string; email: string }[];
  emailDomain: string;
  onCreated: () => void;
}) {
  const domain = emailDomain.toLowerCase();
  const initialGuess = `${localPartFromName(lead.name)}@${domain}`;
  const [loginEmail, setLoginEmail] = useState(initialGuess);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailHint, setEmailHint] = useState<string | null>(
    `Suggested company login: ${initialGuess}`,
  );
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [recruiterId, setRecruiterId] = useState(recruiters[0]?.id ?? "");
  const [optType, setOptType] = useState<"OPT" | "STEM_OPT" | "">(lead.optType ?? "");
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await suggestCandidateLoginEmail(lead.name);
      if (cancelled) return;
      // Never accept a non-company suggestion (guards against stale server actions).
      const email = result.email.toLowerCase().endsWith(`@${domain}`)
        ? result.email
        : `${localPartFromName(lead.name)}@${domain}`;
      setLoginEmail(email);
      setEmailStatus("available");
      setEmailHint(`Suggested company login: ${email}`);
      setSuggestion(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [domain, lead.name]);

  const validateLoginEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setEmailStatus("idle");
      setEmailHint(null);
      setSuggestion(null);
      return;
    }
    if (!trimmed.endsWith(`@${domain}`)) {
      setEmailStatus("taken");
      setEmailHint(`Portal login must end with @${domain} (not a personal email).`);
      void suggestCandidateLoginEmail(lead.name).then((alt) => {
        setSuggestion(alt.email);
      });
      return;
    }
    setEmailStatus("checking");
    startTransition(async () => {
      const result = await checkCandidateLoginEmail(trimmed);
      if (result.available) {
        setEmailStatus("available");
        setEmailHint(null);
        setSuggestion(null);
        setError(null);
        return;
      }
      setEmailStatus("taken");
      setEmailHint(result.error ?? "This email is already taken. Rename it.");
      const alt = await suggestCandidateLoginEmail(lead.name, trimmed);
      setSuggestion(alt.email);
    });
  };

  const handleCreate = () => {
    setError(null);
    if (!optType) {
      setError("Select OPT or STEM OPT before creating the candidate account.");
      return;
    }
    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setError(`Enter a @${domain} portal login email.`);
      return;
    }
    if (!trimmedEmail.endsWith(`@${domain}`)) {
      setError(`Portal login must be a @${domain} address, not ${trimmedEmail}.`);
      setEmailStatus("taken");
      return;
    }
    if (emailStatus === "taken") {
      setError(
        suggestion
          ? `That login email is already taken. Rename it — try ${suggestion}.`
          : "That login email is already taken. Rename it and try again.",
      );
      return;
    }
    startTransition(async () => {
      const result = await createCandidateFromLead({
        leadId: lead.id,
        fullName: lead.name,
        loginEmail: trimmedEmail,
        optType,
        recruiterId: recruiterId || undefined,
      });
      if (result.error) {
        setError(result.error);
        setEmailStatus("taken");
        if (result.suggestion) {
          setSuggestion(result.suggestion);
          setEmailHint(result.error);
        }
        return;
      }
      setCreated({
        email: result.email!,
        delivery: result.invite?.delivery,
        expiresAt: result.invite?.expiresAt,
        previewUrl: result.invite?.previewUrl,
        warning: result.warning,
      });
      onCreated();
    });
  };

  if (created) {
    return (
      <Card variant="solid" className="mt-3 p-4 bg-success-soft border-success/20">
        <p className="text-xs flex items-center gap-1.5 text-success" role="status">
          <CheckCircle2 size={14} aria-hidden="true" />
          Candidate account created and a single-use setup invitation was issued to {created.email}.
        </p>
        {created.expiresAt && (
          <p className="mt-2 text-[11px] text-text-muted">
            Link expires {formatDateTime(new Date(created.expiresAt))}. Delivery: {created.delivery ?? "unknown"}.
          </p>
        )}
        {created.warning && <p className="mt-2 text-xs text-warning">{created.warning}</p>}
        {created.previewUrl && (
          <a
            href={created.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Open development setup link
          </a>
        )}
      </Card>
    );
  }

  return (
    <Card variant="solid" className="mt-3 p-4 bg-brand-50 border-brand-500/10">
      <div className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-text-primary">
        <UserPlus size={14} aria-hidden="true" /> Create portal account and send secure invitation
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor={`login-email-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
            Portal login email (@{domain})
          </label>
          <Input
            id={`login-email-${lead.id}`}
            type="email"
            required
            value={loginEmail}
            onChange={(event) => {
              setLoginEmail(event.target.value);
              setError(null);
              setEmailStatus("idle");
              setEmailHint(null);
              setSuggestion(null);
            }}
            onBlur={(event) => validateLoginEmail(event.target.value)}
            placeholder={`e.g. ${localPartFromName(lead.name)}@${domain}`}
            className={cn(
              "h-9 text-xs",
              emailStatus === "taken" && "border-danger focus:border-danger focus:ring-danger/20",
              emailStatus === "available" && "border-success/50",
            )}
          />
          <p className="mt-1 text-[10px] text-text-muted font-medium">
            Personal enquiry email ({lead.email}) stays for contact only. Login must be @{domain}.
          </p>
          {emailStatus === "checking" && (
            <p className="mt-1 text-[10px] text-text-muted font-medium">Checking email availability…</p>
          )}
          {emailHint && emailStatus === "taken" && (
            <p className="mt-1 text-[11px] text-danger font-semibold" role="alert">
              {emailHint}
            </p>
          )}
          {suggestion && emailStatus === "taken" && (
            <button
              type="button"
              className="mt-1.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
              onClick={() => {
                setLoginEmail(suggestion);
                setEmailStatus("available");
                setEmailHint(null);
                setSuggestion(null);
                setError(null);
              }}
            >
              Use suggested email: {suggestion}
            </button>
          )}
          {emailStatus === "available" && emailHint && (
            <p className="mt-1 text-[10px] text-success font-medium">{emailHint}</p>
          )}
        </div>
        <div>
          <label htmlFor={`opt-type-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
            Work authorization
          </label>
          <Select
            id={`opt-type-${lead.id}`}
            value={optType}
            onChange={(event) => setOptType(event.target.value as "OPT" | "STEM_OPT" | "")}
            className="h-9 text-xs"
          >
            <option value="">Select</option>
            <option value="OPT">OPT</option>
            <option value="STEM_OPT">STEM OPT</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`recruiter-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
            Initial recruiter
          </label>
          <Select
            id={`recruiter-${lead.id}`}
            value={recruiterId}
            onChange={(event) => setRecruiterId(event.target.value)}
            className="h-9 text-xs"
          >
            <option value="">Assign later</option>
            {recruiters.map((recruiter) => (
              <option key={recruiter.id} value={recruiter.id}>
                {recruiter.email}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="mb-3 text-[11px] text-text-muted">
        Invite goes to the @{domain} login email. Candidate sets their own password.
      </p>
      {error && <p className="mb-2 text-xs text-danger" role="alert">{error}</p>}
      <Button
        type="button"
        size="sm"
        onClick={handleCreate}
        loading={isPending}
        disabled={emailStatus === "taken" || emailStatus === "checking" || !loginEmail.trim()}
      >
        <Send size={13} aria-hidden="true" /> Create account and send invite
      </Button>
    </Card>
  );
}

function LeadNotesField({ leadId, notes }: { leadId: string; notes: string }) {
  const [open, setOpen] = useState(Boolean(notes.trim()));
  const [text, setText] = useState(notes);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleBlur = () => {
    if (text === notes) return;
    startTransition(async () => {
      await saveLeadNotes(leadId, text);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-muted hover:text-text-primary"
      >
        <StickyNote size={12} aria-hidden="true" />
        {notes.trim() ? "View / edit note" : "Add internal note"}
      </button>
    );
  }

  return (
    <div className="relative w-full mt-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium text-text-muted">Internal note</label>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] font-semibold text-text-muted hover:text-text-primary"
        >
          Hide
        </button>
      </div>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={handleBlur}
        disabled={isPending}
        placeholder="Add an internal note…"
        rows={2}
        className="text-xs min-h-0"
      />
      {saved && <span className="absolute right-2 top-8 text-[11px] font-medium text-success">Saved</span>}
    </div>
  );
}

function LeadConsultationPanel({
  lead,
  onUpdated,
  recruiters = [],
  compact = false,
}: {
  lead: Lead;
  onUpdated: () => void;
  recruiters?: { id: string; email: string }[];
  compact?: boolean;
}) {
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTimeInput(lead.consultationScheduledAt));
  const [meetingLink, setMeetingLink] = useState(lead.consultationMeetingLink ?? "");
  const [notes, setNotes] = useState(lead.consultationNotes);
  const [notifyRecruiterId, setNotifyRecruiterId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveSchedule = () => {
    if (!scheduledAt) {
      setError("Choose a consultation date and time.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await scheduleLeadConsultation({
        leadId: lead.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        meetingLink,
        notes,
        notifyRecruiterId: notifyRecruiterId || null,
      });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const setStatus = (status: "completed" | "cancelled" | "no_show") => {
    setError(null);
    startTransition(async () => {
      const result = await updateLeadConsultationStatus({ leadId: lead.id, status, notes });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  return (
    <Card variant="solid" className={cn("p-5 border-border-subtle space-y-4", compact ? "bg-white" : "bg-surface/70")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <CalendarClock size={15} aria-hidden="true" />
          {compact ? "Meeting" : "Schedule consultation"}
        </div>
        {!compact && (
          <Badge variant={lead.consultationStatus === "completed" ? "success" : "muted"}>
            {CONSULTATION_LABELS[lead.consultationStatus]}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`consultation-date-${lead.id}`} className="block text-xs font-medium mb-1.5 text-text-muted">
            Date and time
          </label>
          <Input
            id={`consultation-date-${lead.id}`}
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="h-10 text-xs"
          />
        </div>
        <div>
          <label htmlFor={`consultation-link-${lead.id}`} className="block text-xs font-medium mb-1.5 text-text-muted">
            Meeting link
          </label>
          <Input
            id={`consultation-link-${lead.id}`}
            value={meetingLink}
            onChange={(event) => setMeetingLink(event.target.value)}
            placeholder="https://meet.google.com/..."
            className="h-10 text-xs"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`consultation-notes-${lead.id}`} className="block text-xs font-medium mb-1.5 text-text-muted">
            Consultation notes
          </label>
          <Textarea
            id={`consultation-notes-${lead.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={3000}
            rows={3}
            placeholder="Notes from or about this consultation…"
            className="text-xs min-h-[4.5rem]"
          />
        </div>
        {!compact && (
          <div className="sm:col-span-2">
            <label htmlFor={`consultation-notify-${lead.id}`} className="block text-xs font-medium mb-1.5 text-text-muted">
              Notify about this meeting
            </label>
            <select
              id={`consultation-notify-${lead.id}`}
              value={notifyRecruiterId}
              onChange={(event) => setNotifyRecruiterId(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-text-primary"
            >
              <option value="">Admin inbox (default)</option>
              {recruiters.map((recruiter) => (
                <option key={recruiter.id} value={recruiter.id}>
                  {recruiter.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger" role="alert">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" size="sm" onClick={saveSchedule} loading={isPending}>
          {lead.consultationScheduledAt ? "Update schedule" : "Save schedule"}
        </Button>
        {compact && (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={() => setStatus("completed")} disabled={isPending}>
              Mark completed
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setStatus("no_show")} disabled={isPending}>
              No-show
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setStatus("cancelled")} disabled={isPending}>
              Cancelled
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function LeadDecisionPanel({
  lead,
  onUpdated,
  allowApprove = true,
}: {
  lead: Lead;
  onUpdated: () => void;
  allowApprove?: boolean;
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState(lead.rejectionReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const approve = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveLeadForPortal(lead.id);
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const reject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectLead({ leadId: lead.id, reason });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  return (
    <Card variant="solid" className="mt-3 p-4 bg-white border-border-subtle">
      <div className="flex flex-wrap gap-2">
        {allowApprove && (
          <Button type="button" size="sm" onClick={approve} disabled={isPending} loading={isPending}>
            <CheckCircle2 size={13} aria-hidden="true" /> Approve access
          </Button>
        )}
        <Button type="button" size="sm" variant="danger" onClick={() => setShowReject(true)} disabled={isPending}>
          <XCircle size={13} aria-hidden="true" /> Reject
        </Button>
      </div>
      {showReject && (
        <div className="mt-3 space-y-2">
          <label htmlFor={`rejection-${lead.id}`} className="block text-[11px] font-medium text-text-muted">
            Rejection reason (required)
          </label>
          <Input
            id={`rejection-${lead.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={2000}
            placeholder="Why is this enquiry being rejected?"
            className="h-9 text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={reject}
              disabled={isPending || reason.trim().length < 3}
              loading={isPending}
            >
              Confirm reject
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
    </Card>
  );
}

function nextStepHint(lead: Lead): string {
  if (lead.status === "qualified") return "Step 3 of 3 — Create the candidate portal account.";
  if (lead.status === "converted") return "Portal account created.";
  if (lead.status === "rejected") return "This enquiry was rejected.";
  if (lead.consultationStatus === "completed") return "Step 2 of 3 — Approve access or reject.";
  if (lead.consultationStatus === "scheduled") {
    return "Consultation scheduled — manage it under Consultations, then mark completed.";
  }
  if (lead.consultationStatus === "no_show" || lead.consultationStatus === "cancelled") {
    return "Reschedule the consultation, or reject this enquiry.";
  }
  return "Step 1 of 3 — Schedule a consultation.";
}

function LeadRow({
  lead,
  index,
  view,
  recruiters,
  emailDomain,
  refresh,
  setLeads,
}: {
  lead: Lead;
  index: number;
  view: "enquiries" | "consultations";
  recruiters: { id: string; email: string }[];
  emailDomain: string;
  refresh: () => void;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}) {
  const canAct = !(["rejected", "converted"] as string[]).includes(lead.status);
  const needsSchedule =
    canAct &&
    lead.status !== "qualified" &&
    (lead.consultationStatus === "not_scheduled" ||
      lead.consultationStatus === "cancelled" ||
      lead.consultationStatus === "no_show");
  const isScheduled = lead.consultationStatus === "scheduled";
  const consultDone = lead.consultationStatus === "completed";
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (view === "consultations") {
    return (
      <div className={cn(index > 0 && "border-t border-border-subtle")}>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2.5">
              <div className="text-base font-bold text-text-primary leading-snug">{lead.name}</div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} aria-hidden="true" /> {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} aria-hidden="true" /> {lead.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {lead.consultationScheduledAt
                  ? `Scheduled ${formatDateTime(lead.consultationScheduledAt)}`
                  : "Not scheduled yet"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={consultDone ? "success" : "muted"}>
                {CONSULTATION_LABELS[lead.consultationStatus]}
              </Badge>
              {lead.consultationMeetingLink && (
                <Button type="button" size="sm" asChild>
                  <a href={lead.consultationMeetingLink} target="_blank" rel="noreferrer">
                    <Video size={13} aria-hidden="true" /> Join meeting
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-3">
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
            >
              <ChevronDown
                size={13}
                className={cn("transition-transform", showDetails && "rotate-180")}
                aria-hidden="true"
              />
              {showDetails ? "Hide details" : "Details"}
            </button>
          </div>

          {showDetails && (
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
              <table className="w-full text-left text-xs">
                <tbody>
                  {[
                    { label: "Role interest", value: lead.roleInterest || "—" },
                    {
                      label: "Visa / OPT",
                      value: lead.optType ? (lead.optType === "STEM_OPT" ? "STEM OPT" : "OPT") : "—",
                    },
                    { label: "Submitted", value: formatDate(lead.createdAt) },
                    {
                      label: "Source",
                      value: lead.source === "consultation_booked" ? "Consultation booked" : "Enquiry form",
                    },
                    { label: "Experience years", value: formatExperienceYears(lead.experienceSummary) },
                    { label: "Additional info", value: lead.additionalInformation || "—" },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border-subtle last:border-b-0">
                      <th
                        scope="row"
                        className="w-[8.5rem] shrink-0 bg-surface/50 px-3.5 py-3 align-top font-semibold text-text-muted"
                      >
                        {row.label}
                      </th>
                      <td className="px-3.5 py-3 text-text-primary whitespace-pre-wrap break-words">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {canAct && lead.status !== "qualified" && (
            <LeadConsultationPanel lead={lead} recruiters={recruiters} onUpdated={refresh} compact />
          )}

          {consultDone && canAct && lead.status !== "qualified" && (
            <p className="text-xs text-text-muted">
              Consultation done.{" "}
              <a href="/admin/leads" className="font-semibold text-brand-600 hover:underline">
                Return to Enquiries
              </a>{" "}
              to approve portal access.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(index > 0 && "border-t border-border-subtle")}>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 space-y-2.5">
            <div className="text-base font-bold text-text-primary leading-snug">{lead.name}</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Mail size={12} aria-hidden="true" /> {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={12} aria-hidden="true" /> {lead.phone}
                </span>
              )}
            </div>
            <p className="pt-0.5 text-xs font-medium text-brand-700">{nextStepHint(lead)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusPill status={lead.status as LeadStatus} />
            {isScheduled && <Badge variant="accent">Consultation scheduled</Badge>}
            {consultDone && lead.status !== "qualified" && lead.status !== "converted" && (
              <Badge variant="success">Ready to approve</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-3">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
          >
            <ChevronDown
              size={13}
              className={cn("transition-transform", showDetails && "rotate-180")}
              aria-hidden="true"
            />
            {showDetails ? "Hide details" : "Details"}
          </button>
          <LeadNotesField leadId={lead.id} notes={lead.notes} />
        </div>

        {showDetails && (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
            <table className="w-full text-left text-xs">
              <tbody>
                {[
                  { label: "Role interest", value: lead.roleInterest || "—" },
                  {
                    label: "Visa / OPT",
                    value: lead.optType ? (lead.optType === "STEM_OPT" ? "STEM OPT" : "OPT") : "—",
                  },
                  { label: "Submitted", value: formatDate(lead.createdAt) },
                  { label: "Source", value: lead.source === "consultation_booked" ? "Consultation booked" : "Enquiry form" },
                  { label: "Experience years", value: formatExperienceYears(lead.experienceSummary) },
                  { label: "Additional info", value: lead.additionalInformation || "—" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-border-subtle last:border-b-0">
                    <th
                      scope="row"
                      className="w-[8.5rem] shrink-0 bg-surface/50 px-3.5 py-3 align-top font-semibold text-text-muted"
                    >
                      {row.label}
                    </th>
                    <td className="px-3.5 py-3 text-text-primary whitespace-pre-wrap break-words">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {needsSchedule && !showScheduleForm && (
          <div className="pt-1">
            <Button type="button" size="sm" onClick={() => setShowScheduleForm(true)}>
              <CalendarClock size={13} aria-hidden="true" /> Schedule consultation
            </Button>
          </div>
        )}

        {needsSchedule && showScheduleForm && (
          <LeadConsultationPanel
            lead={lead}
            recruiters={recruiters}
            onUpdated={() => {
              setShowScheduleForm(false);
              refresh();
            }}
          />
        )}

        {isScheduled && canAct && lead.status !== "qualified" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface/50 px-4 py-3">
            <p className="text-xs text-text-muted flex-1 min-w-[12rem]">
              Scheduled for{" "}
              <span className="font-semibold text-text-primary">
                {lead.consultationScheduledAt ? formatDateTime(lead.consultationScheduledAt) : "—"}
              </span>
            </p>
            {lead.consultationMeetingLink && (
              <Button type="button" size="sm" variant="secondary" asChild>
                <a href={lead.consultationMeetingLink} target="_blank" rel="noreferrer">
                  <Video size={13} aria-hidden="true" /> Join
                </a>
              </Button>
            )}
            <Button type="button" size="sm" variant="secondary" asChild>
              <a href="/admin/consultations">
                <ExternalLink size={13} aria-hidden="true" /> Open Consultations
              </a>
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowScheduleForm((value) => !value)}>
              {showScheduleForm ? "Hide edit" : "Edit"}
            </Button>
          </div>
        )}

        {isScheduled && showScheduleForm && (
          <LeadConsultationPanel lead={lead} recruiters={recruiters} onUpdated={refresh} />
        )}

        {consultDone && canAct && lead.status !== "qualified" && (
          <LeadDecisionPanel lead={lead} onUpdated={refresh} />
        )}

        {(lead.consultationStatus === "no_show" || lead.consultationStatus === "cancelled") &&
          canAct &&
          lead.status !== "qualified" &&
          showScheduleForm === false && (
            <LeadDecisionPanel lead={lead} onUpdated={refresh} allowApprove={false} />
          )}

        {lead.status === "qualified" && (
          <LeadCreateAccountPanel
            lead={lead}
            recruiters={recruiters}
            emailDomain={emailDomain}
            onCreated={() => {
              setLeads((current) =>
                current.map((item) => (item.id === lead.id ? { ...item, status: "converted" } : item)),
              );
            }}
          />
        )}

        {lead.status === "rejected" && lead.rejectionReason && (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
            Rejected: {lead.rejectionReason}
          </p>
        )}
      </div>
    </div>
  );
}

function LeadConsultationPanel({ lead, onUpdated }: { lead: Lead; onUpdated: () => void }) {
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTimeInput(lead.consultationScheduledAt));
  const [notes, setNotes] = useState(lead.consultationNotes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveSchedule = () => {
    if (!scheduledAt) {
      setError("Choose a consultation date and time.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await scheduleLeadConsultation({
        leadId: lead.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes,
      });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const setStatus = (status: "completed" | "cancelled" | "no_show") => {
    setError(null);
    startTransition(async () => {
      const result = await updateLeadConsultationStatus({ leadId: lead.id, status, notes });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  return (
    <Card variant="solid" className="mt-3 p-4 bg-surface/70 border-border-subtle">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
          <CalendarClock size={14} aria-hidden="true" /> Consultation
        </div>
        <Badge variant={lead.consultationStatus === "completed" ? "success" : "muted"}>
          {CONSULTATION_LABELS[lead.consultationStatus]}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`consultation-date-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
            Date and time
          </label>
          <Input
            id={`consultation-date-${lead.id}`}
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <div>
          <label htmlFor={`consultation-notes-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
            Consultation notes
          </label>
          <Input
            id={`consultation-notes-${lead.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={3000}
            className="h-9 text-xs"
          />
        </div>
      </div>
      {lead.consultationScheduledAt && (
        <p className="mt-2 text-[11px] text-text-muted">
          Scheduled: {formatDateTime(lead.consultationScheduledAt)}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={saveSchedule} loading={isPending}>
          Save schedule
        </Button>
        <Button type="button" size="sm" onClick={() => setStatus("completed")} disabled={isPending}>
          Mark completed
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setStatus("no_show")} disabled={isPending}>
          No-show
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setStatus("cancelled")} disabled={isPending}>
          Cancelled
        </Button>
      </div>
    </Card>
  );
}

function LeadDecisionPanel({ lead, onUpdated }: { lead: Lead; onUpdated: () => void }) {
  const [reason, setReason] = useState(lead.rejectionReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const approve = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveLeadForPortal(lead.id);
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const reject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectLead({ leadId: lead.id, reason });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  return (
    <Card variant="solid" className="mt-3 p-4 bg-white border-border-subtle">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`rejection-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
            Internal rejection reason
          </label>
          <Input
            id={`rejection-${lead.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={2000}
            placeholder="Required only when rejecting"
            className="h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={approve}
            disabled={isPending || lead.consultationStatus !== "completed"}
          >
            <CheckCircle2 size={13} aria-hidden="true" /> Approve access
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={reject} disabled={isPending || reason.trim().length < 3}>
            <XCircle size={13} aria-hidden="true" /> Reject
          </Button>
        </div>
      </div>
      {lead.consultationStatus !== "completed" && (
        <p className="mt-2 text-[11px] text-warning">Complete the consultation before approving portal access.</p>
      )}
      {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
    </Card>
  );
}

export function LeadsTable({
  leads: initialLeads,
  recruiters,
  view = "enquiries",
  emailDomain,
}: {
  leads: Lead[];
  recruiters: { id: string; email: string }[];
  view?: "enquiries" | "consultations";
  /** Company domain from ORG_EMAIL_DOMAIN / ADMIN_EMAIL_DOMAIN — required, no hardcoded brand. */
  emailDomain: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState(initialLeads);
  const [showNewLead, setShowNewLead] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOptType, setNewOptType] = useState<"OPT" | "STEM_OPT" | "">("");
  const [newRoleInterest, setNewRoleInterest] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLeads(initialLeads), [initialLeads]);

  const refresh = () => router.refresh();

  const handleCreateLead = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await createLead({
        name: newName,
        email: newEmail,
        phone: newPhone || undefined,
        optType: newOptType || undefined,
        roleInterest: newRoleInterest || undefined,
        experienceSummary: newExperience || undefined,
        source: "enquiry_form",
        notes: newNotes || undefined,
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setShowNewLead(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewOptType("");
      setNewRoleInterest("");
      setNewExperience("");
      setNewNotes("");
      refresh();
    });
  };

  const filtered = useMemo(
    () =>
      leads
        .filter((lead) => filter === "all" || lead.status === filter)
        .filter((lead) => {
          const haystack = `${lead.name} ${lead.email} ${lead.roleInterest ?? ""}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        }),
    [filter, leads, query],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center flex-1 relative">
          <Search size={14} className="absolute left-3 text-text-muted pointer-events-none" aria-hidden="true" />
          <Input
            aria-label={view === "consultations" ? "Search consultations" : "Search enquiries"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={view === "consultations" ? "Search consultations by name, email, or role" : "Search by name, email, or role"}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Select
          aria-label="Filter enquiry status"
          value={filter}
          onChange={(event) => setFilter(event.target.value as LeadStatus | "all")}
          className="h-9 text-xs w-full sm:w-auto"
        >
          <option value="all">All statuses</option>
          {Object.entries(LEAD_STATUS_META).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </Select>
        {view === "enquiries" && (
          <Button type="button" size="sm" onClick={() => setShowNewLead((value) => !value)}>
            <Plus size={13} aria-hidden="true" /> New enquiry
          </Button>
        )}
      </div>

      {view === "enquiries" && showNewLead && (
        <Card variant="glass" className="p-5 mb-4 bg-white border border-border-strong/50 shadow-xs">
          <form onSubmit={handleCreateLead} className="grid sm:grid-cols-2 gap-3">
            <Input required value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Full name" />
            <Input required type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Email" />
            <Input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} placeholder="Phone" />
            <Select value={newOptType} onChange={(event) => setNewOptType(event.target.value as "OPT" | "STEM_OPT" | "")}>
              <option value="">Work authorization</option>
              <option value="OPT">OPT</option>
              <option value="STEM_OPT">STEM OPT</option>
            </Select>
            <Input value={newRoleInterest} onChange={(event) => setNewRoleInterest(event.target.value)} placeholder="Role interest" />
            <Input value={newExperience} onChange={(event) => setNewExperience(event.target.value)} placeholder="Experience years (e.g. 3)" />
            <Textarea value={newNotes} onChange={(event) => setNewNotes(event.target.value)} rows={2} placeholder="Internal notes" className="sm:col-span-2" />
            {formError && <p className="sm:col-span-2 text-xs text-danger" role="alert">{formError}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" size="sm" loading={isPending}>Add enquiry</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewLead(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <p className="text-xs mb-3 text-text-muted">
        {filtered.length} of {leads.length} {view === "consultations" ? "consultations" : "enquiries"}
      </p>

      <Card variant="glass" className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-xs p-6 text-center text-text-muted">
            No {view === "consultations" ? "consultations" : "enquiries"} match the current filters.
          </p>
        ) : (
          filtered.map((lead, index) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              index={index}
              view={view}
              recruiters={recruiters}
              emailDomain={emailDomain}
              refresh={refresh}
              setLeads={setLeads}
            />
          ))
        )}
      </Card>
    </div>
  );
}
