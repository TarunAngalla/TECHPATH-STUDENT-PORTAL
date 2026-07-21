"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  Send,
  UserPlus,
  XCircle,
} from "lucide-react";
import { createCandidateFromLead } from "@/lib/actions/candidates";
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

function LeadCreateAccountPanel({
  lead,
  recruiters,
  onCreated,
}: {
  lead: Lead;
  recruiters: { id: string; email: string }[];
  onCreated: () => void;
}) {
  const [recruiterId, setRecruiterId] = useState(recruiters[0]?.id ?? "");
  const [optType, setOptType] = useState<"OPT" | "STEM_OPT" | "">(lead.optType ?? "");
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setError(null);
    if (!optType) {
      setError("Select OPT or STEM OPT before creating the candidate account.");
      return;
    }
    startTransition(async () => {
      const result = await createCandidateFromLead({
        leadId: lead.id,
        fullName: lead.name,
        optType,
        recruiterId: recruiterId || undefined,
      });
      if (result.error) {
        setError(result.error);
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
          <label className="block text-[11px] font-medium mb-1 text-text-muted">Login email</label>
          <Input value={lead.email} disabled className="h-9 text-xs" />
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
      <p className="mb-3 text-[11px] leading-relaxed text-text-muted">
        No temporary password is displayed or emailed. The candidate creates a password using an expiring, single-use link.
      </p>
      {error && <p className="mb-2 text-xs text-danger" role="alert">{error}</p>}
      <Button type="button" size="sm" onClick={handleCreate} loading={isPending}>
        <Send size={13} aria-hidden="true" /> Create account and send invite
      </Button>
    </Card>
  );
}

function LeadNotesField({ leadId, notes }: { leadId: string; notes: string }) {
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

  return (
    <div className="relative">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={handleBlur}
        disabled={isPending}
        placeholder="Add an internal note…"
        rows={2}
        className="text-xs min-h-0"
      />
      {saved && <span className="absolute right-2 top-2 text-[11px] font-medium text-success">Saved</span>}
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
}: {
  leads: Lead[];
  recruiters: { id: string; email: string }[];
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
            aria-label="Search enquiries"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or role"
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
        <Button type="button" size="sm" onClick={() => setShowNewLead((value) => !value)}>
          <Plus size={13} aria-hidden="true" /> New enquiry
        </Button>
      </div>

      {showNewLead && (
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
            <Input value={newExperience} onChange={(event) => setNewExperience(event.target.value)} placeholder="Experience summary" />
            <Textarea value={newNotes} onChange={(event) => setNewNotes(event.target.value)} rows={2} placeholder="Internal notes" className="sm:col-span-2" />
            {formError && <p className="sm:col-span-2 text-xs text-danger" role="alert">{formError}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" size="sm" loading={isPending}>Add enquiry</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewLead(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <p className="text-xs mb-3 text-text-muted">{filtered.length} of {leads.length} enquiries</p>

      <Card variant="glass" className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-xs p-6 text-center text-text-muted">No enquiries match the current filters.</p>
        ) : (
          filtered.map((lead, index) => (
            <div key={lead.id} className={cn(index > 0 && "border-t border-border-subtle")}>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary">{lead.name}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1 text-text-muted">
                      <span className="flex items-center gap-1"><Mail size={11} aria-hidden="true" /> {lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone size={11} aria-hidden="true" /> {lead.phone}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mt-1 text-text-muted">
                      {lead.roleInterest && <span>Role: {lead.roleInterest}</span>}
                      {lead.optType && <span>{lead.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}</span>}
                      <span>Submitted {formatDate(lead.createdAt)}</span>
                    </div>
                    {lead.experienceSummary && <p className="mt-2 text-xs text-text-muted">{lead.experienceSummary}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <LeadStatusPill status={lead.status as LeadStatus} />
                    <Badge variant={lead.consultationStatus === "completed" ? "success" : "muted"}>
                      {CONSULTATION_LABELS[lead.consultationStatus]}
                    </Badge>
                  </div>
                </div>

                <LeadNotesField leadId={lead.id} notes={lead.notes} />

                {!(["rejected", "converted", "qualified"] as string[]).includes(lead.status) && (
                  <>
                    <LeadConsultationPanel lead={lead} onUpdated={refresh} />
                    <LeadDecisionPanel lead={lead} onUpdated={refresh} />
                  </>
                )}

                {lead.status === "qualified" && (
                  <LeadCreateAccountPanel
                    lead={lead}
                    recruiters={recruiters}
                    onCreated={() => {
                      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: "converted" } : item));
                    }}
                  />
                )}

                {lead.status === "rejected" && lead.rejectionReason && (
                  <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger">
                    Internal rejection reason: {lead.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
