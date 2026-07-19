"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { createCandidateFromLead, generateCandidatePassword } from "@/lib/actions/candidates";
import { createLead, saveLeadNotes, updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUS_META, type LeadStatus } from "@/lib/constants/lead-status";
import { formatDate } from "@/lib/utils/dates";
import type { leads } from "@/lib/db/schema";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type Lead = typeof leads.$inferSelect;

const LEAD_BADGE_VARIANT = {
  new: "muted",
  contacted: "default",
  qualified: "success",
  rejected: "danger",
  converted: "accent",
} as const;

function LeadStatusPill({ status }: { status: LeadStatus }) {
  const m = LEAD_STATUS_META[status];
  return (
    <Badge variant={LEAD_BADGE_VARIANT[status]}>
      {m.label}
    </Badge>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  enquiry_form: "Enquiry form",
  consultation_booked: "Consultation booked",
};

function LeadCreateAccountPanel({
  lead,
  recruiters,
  onCreated,
}: {
  lead: Lead;
  recruiters: { id: string; email: string }[];
  onCreated: (candidateId: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [recruiterId, setRecruiterId] = useState(recruiters[0]?.id ?? "");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateCandidatePassword();
      setPassword(result.password);
    });
  };

  const handleCreate = () => {
    const trimmed = password.trim();
    if (!trimmed) {
      setError("Enter or generate a temporary password first.");
      return;
    }
    if (trimmed.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const result = await createCandidateFromLead({
        leadId: lead.id,
        fullName: lead.name,
        optType: (lead.optType ?? "OPT") as "OPT" | "STEM_OPT",
        recruiterId: recruiterId || undefined,
        password: trimmed,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setCreated({ email: result.email!, password: result.password! });
      onCreated(result.candidateId!);
    });
  };

  if (created) {
    return (
      <Card variant="solid" className="mt-3 p-4 bg-success-soft border-success/20">
        <p className="text-xs flex items-center gap-1.5 mb-3 text-success" role="status">
          <CheckCircle2 size={13} aria-hidden="true" />
          Portal account created. Share these credentials with the candidate directly.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-medium mb-1 text-text-muted">Login email</div>
            <div className="text-xs px-2.5 py-2 rounded-xl font-mono bg-surface-elevated border border-border-subtle text-text-primary">
              {created.email}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium mb-1 text-text-muted">Temporary password</div>
            <div className="text-xs px-2.5 py-2 rounded-xl font-mono bg-surface-elevated border border-border-subtle text-text-primary">
              {created.password}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="solid" className="mt-3 p-4 bg-brand-50 border-brand-500/10">
      <div className="text-xs font-medium mb-3 flex items-center gap-1.5 text-text-primary">
        <UserPlus size={13} aria-hidden="true" /> Create candidate portal account for {lead.name}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-medium mb-1 text-text-muted">Login email</label>
          <Input value={lead.email} disabled className="h-9 text-xs" />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1 text-text-muted">
            Temporary password
          </label>
          <div className="flex gap-1.5">
            <Input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Type one or click refresh to generate"
              autoComplete="new-password"
              minLength={8}
              className="h-9 text-xs font-mono flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleGenerate}
              disabled={isPending}
              aria-label="Generate new temporary password"
              title="Generate password"
              className="h-9 w-9 flex-shrink-0"
            >
              <RefreshCw size={13} aria-hidden="true" />
            </Button>
          </div>
          <p className="text-[10px] text-text-muted mt-1 font-medium">
            Editable · min 8 characters · refresh icon regenerates
          </p>
        </div>
        {recruiters.length > 0 && (
          <div className="sm:col-span-2">
            <label htmlFor={`recruiter-${lead.id}`} className="block text-[11px] font-medium mb-1 text-text-muted">
              Assign recruiter
            </label>
            <Select
              id={`recruiter-${lead.id}`}
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
              className="h-9 text-xs"
            >
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.email}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs mb-2 text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="button" size="sm" onClick={handleCreate} disabled={isPending} loading={isPending}>
        Create portal account
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
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="relative">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={isPending}
        placeholder="Add an internal note..."
        rows={2}
        className="text-xs min-h-0"
      />
      {saved && (
        <span className="absolute right-2 top-2 text-[11px] font-medium text-success">Saved</span>
      )}
    </div>
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
  const [expandedCreate, setExpandedCreate] = useState<string | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOptType, setNewOptType] = useState<"OPT" | "STEM_OPT" | "">("");
  const [newSource, setNewSource] = useState<"enquiry_form" | "consultation_booked">("enquiry_form");
  const [newNotes, setNewNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await createLead({
        name: newName,
        email: newEmail,
        phone: newPhone || undefined,
        optType: newOptType || undefined,
        source: newSource,
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
      setNewSource("enquiry_form");
      setNewNotes("");
      router.refresh();
    });
  };

  const handleStatus = (leadId: string, direction: "approve" | "reject") => {
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, direction);
      if (result.status) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: result.status! } : l)),
        );
        if (result.status === "qualified") setExpandedCreate(leadId);
      }
      router.refresh();
    });
  };

  const filtered = leads
    .filter((l) => filter === "all" || l.status === filter)
    .filter(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.email.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="lead-search" className="sr-only">
            Search leads by name or email
          </label>
          <Input
            id="lead-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as LeadStatus | "all")}
          className="h-9 text-xs flex-shrink-0 w-full sm:w-auto"
        >
          <option value="all">All statuses</option>
          {Object.entries(LEAD_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowNewLead((v) => !v)}
          className="text-xs font-semibold bg-brand-500 text-white flex items-center gap-1.5 shadow-xs hover:bg-brand-600"
        >
          <Plus size={13} aria-hidden="true" /> New lead
        </Button>
      </div>

      {showNewLead && (
        <Card variant="glass" className="p-5 mb-4 bg-white border border-border-strong/50 shadow-xs">
          <form onSubmit={handleCreateLead} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-lead-name" className="block text-[11px] font-semibold text-text-muted mb-1">
                Full name
              </label>
              <Input
                id="new-lead-name"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 text-xs"
                placeholder="Jordan Smith"
              />
            </div>
            <div>
              <label htmlFor="new-lead-email" className="block text-[11px] font-semibold text-text-muted mb-1">
                Email
              </label>
              <Input
                id="new-lead-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-9 text-xs"
                placeholder="jordan@example.com"
              />
            </div>
            <div>
              <label htmlFor="new-lead-phone" className="block text-[11px] font-semibold text-text-muted mb-1">
                Phone (optional)
              </label>
              <Input
                id="new-lead-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="h-9 text-xs"
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label htmlFor="new-lead-opt" className="block text-[11px] font-semibold text-text-muted mb-1">
                OPT type
              </label>
              <Select
                id="new-lead-opt"
                value={newOptType}
                onChange={(e) => setNewOptType(e.target.value as "OPT" | "STEM_OPT" | "")}
                className="h-9 text-xs"
              >
                <option value="">Not set</option>
                <option value="OPT">OPT</option>
                <option value="STEM_OPT">STEM OPT</option>
              </Select>
            </div>
            <div>
              <label htmlFor="new-lead-source" className="block text-[11px] font-semibold text-text-muted mb-1">
                Source
              </label>
              <Select
                id="new-lead-source"
                value={newSource}
                onChange={(e) =>
                  setNewSource(e.target.value as "enquiry_form" | "consultation_booked")
                }
                className="h-9 text-xs"
              >
                <option value="enquiry_form">Enquiry form</option>
                <option value="consultation_booked">Consultation booked</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="new-lead-notes" className="block text-[11px] font-semibold text-text-muted mb-1">
                Notes (optional)
              </label>
              <Textarea
                id="new-lead-notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                className="text-xs"
                placeholder="Internal note…"
              />
            </div>
            {formError && (
              <p className="sm:col-span-2 text-xs text-danger font-medium" role="alert">
                {formError}
              </p>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-brand-500 text-white">
                {isPending ? "Saving…" : "Add lead"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowNewLead(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <p className="text-xs mb-3 text-text-muted">
        {filtered.length} of {leads.length} leads
      </p>

      <Card variant="glass" className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-xs p-6 text-center text-text-muted">
            {leads.length === 0
              ? "No leads yet. Click New lead to add one."
              : "No leads match your filters."}
          </p>
        ) : (
          filtered.map((lead, i) => (
            <div
              key={lead.id}
              className={cn(i > 0 && "border-t border-border-subtle")}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary">{lead.name}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mt-1 text-text-muted">
                      <span className="flex items-center gap-1">
                        <Mail size={11} aria-hidden="true" /> {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} aria-hidden="true" /> {lead.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] mt-1 text-text-muted">
                      {lead.optType && (
                        <span>{lead.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}</span>
                      )}
                      <span>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <LeadStatusPill status={lead.status as LeadStatus} />
                    {lead.status !== "rejected" && lead.status !== "converted" && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => handleStatus(lead.id, "approve")}
                          disabled={isPending}
                          aria-label={`Approve ${lead.name} to next stage`}
                          className="h-7 w-7 bg-success-soft text-success hover:bg-success/20 hover:text-success"
                        >
                          <Check size={14} aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => handleStatus(lead.id, "reject")}
                          disabled={isPending}
                          aria-label={`Reject ${lead.name}`}
                          className="h-7 w-7 bg-danger-soft text-danger hover:bg-danger/20 hover:text-danger"
                        >
                          <X size={14} aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <label htmlFor={`lead-notes-${lead.id}`} className="sr-only">
                  Internal notes for {lead.name}
                </label>
                <LeadNotesField leadId={lead.id} notes={lead.notes} />

                {(lead.status === "qualified" || expandedCreate === lead.id) &&
                  lead.status !== "converted" &&
                  lead.status !== "rejected" && (
                    <LeadCreateAccountPanel
                      lead={lead}
                      recruiters={recruiters}
                      onCreated={() => {
                        setLeads((prev) =>
                          prev.map((l) =>
                            l.id === lead.id ? { ...l, status: "converted" as LeadStatus } : l,
                          ),
                        );
                        router.refresh();
                      }}
                    />
                  )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
