"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { createCandidateFromLead, generateCandidatePassword } from "@/lib/actions/candidates";
import { saveLeadNotes, updateLeadStatus } from "@/lib/actions/leads";
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
    if (!password) {
      setError("Generate a temporary password first.");
      return;
    }
    startTransition(async () => {
      const result = await createCandidateFromLead({
        leadId: lead.id,
        fullName: lead.name,
        optType: (lead.optType ?? "OPT") as "OPT" | "STEM_OPT",
        recruiterId: recruiterId || undefined,
        password,
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
            <Input value={password} readOnly className="h-9 text-xs font-mono flex-1" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleGenerate}
              disabled={isPending}
              aria-label="Generate new temporary password"
              className="h-9 w-9 flex-shrink-0"
            >
              <RefreshCw size={13} aria-hidden="true" />
            </Button>
          </div>
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
  const [isPending, startTransition] = useTransition();

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
      </div>
      <p className="text-xs mb-3 text-text-muted">
        {filtered.length} of {leads.length} leads
      </p>

      <Card variant="glass" className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-xs p-6 text-center text-text-muted">No leads match your filters.</p>
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
