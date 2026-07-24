"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { saveApplicationComment } from "@/lib/actions/applications";
import { CompanyBadge } from "@/components/shared/CompanyBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status-meta";
import type { ApplicationStatus } from "@/lib/constants/status-meta";
import type { Application } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ApplicationCommentField({
  id, value, onSave, readOnly = false,
}: {
  id: string; value: string; onSave: (comment: string) => Promise<{ error?: string }>; readOnly?: boolean;
}) {
  const [text, setText] = useState(value);
  const [isPending, startTransition] = useTransition();

  const handleBlur = () => {
    if (text === value) return;
    startTransition(async () => {
      const result = await onSave(text);
      if (result.error) {
        toast.error("Could not save comment", { description: result.error });
        setText(value);
      } else {
        toast.success("Comment saved");
      }
    });
  };

  if (readOnly) {
    return <div className="min-h-[50px] rounded-xl border border-border-strong/30 bg-surface/20 px-3 py-2 text-xs leading-relaxed text-text-muted">{value.trim() || "No candidate-visible note yet."}</div>;
  }
  return (
    <Textarea
      id={id}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      placeholder="Add a note..."
      rows={2}
      disabled={isPending}
      className="text-xs min-h-[50px] bg-surface/20 hover:bg-surface/40 focus:bg-white border-border-strong/40 focus:border-brand-500 rounded-xl"
    />
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-xs",
        active
          ? "bg-brand-500 text-white border border-brand-500"
          : "bg-white text-text-muted border border-border-strong/45 hover:text-text-primary hover:bg-surface",
      )}
    >
      {label}
    </button>
  );
}

function ApplicationCard({ app, allowComments }: { app: Application; allowComments: boolean }) {
  return (
    <Card variant="glass" className="p-4 space-y-3 bg-white border border-border-strong/50 shadow-xs rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyBadge name={app.companyName} />
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary truncate">{app.companyName}</div>
            <div className="text-xs text-text-muted truncate">{app.roleTitle}</div>
          </div>
        </div>
        <StatusPill status={app.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <Badge variant="muted" className="bg-surface border border-border-strong/30 text-[10px]">{app.appNo}</Badge>
        <span className="text-[11px]">Applied {formatDate(app.dateApplied)}</span>
      </div>
      <ApplicationCommentField
        id={`comment-mobile-${app.id}`}
        value={app.candidateVisibleNotes ?? app.comment}
        onSave={(comment) => saveApplicationComment(app.id, comment)}
        readOnly={!allowComments}
      />
    </Card>
  );
}

export function CandidateApplicationsTable({ applications, allowComments = false }: { applications: Application[]; allowComments?: boolean }) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const filtered = useMemo(
    () =>
      applications
        .filter((a) => filter === "all" || a.status === filter)
        .filter(
          (a) =>
            a.companyName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            a.roleTitle.toLowerCase().includes(debouncedQuery.toLowerCase()),
        ),
    [applications, filter, debouncedQuery],
  );

  return (
    <section aria-labelledby="applications-heading">
      <h2 id="applications-heading" className="sr-only">
        Applications list
      </h2>

      <div className="flex flex-col gap-4 mb-5">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="applications-search" className="sr-only">
            Search by company or role
          </label>
          <Input
            id="applications-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company or role..."
            className="pl-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
          />
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 scrollbar-thin"
          role="group"
          aria-label="Filter by status"
        >
          <FilterChip
            label="All Statuses"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {APPLICATION_STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={filter === opt.value}
              onClick={() => setFilter(opt.value)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs font-semibold mb-3 text-text-muted" aria-live="polite">
        {filtered.length} of {applications.length} applications
      </p>

      {filtered.length === 0 ? (
        <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <EmptyState
            title="No applications match"
            note="Try a different search term or filter. Once your recruiter moves an application here, it will show up automatically."
          />
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3" aria-label="Applications">
            {filtered.map((app) => (
              <ApplicationCard key={app.id} app={app} allowComments={allowComments} />
            ))}
          </div>

          <Card variant="glass" className="hidden md:block overflow-hidden bg-white border border-border-strong/55 shadow-xs rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[780px]" aria-label="Applications">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-strong/50">
                    <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      App No.
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Company / Role
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Date Applied
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Comments / Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      className="border-t border-border-subtle align-top transition-colors hover:bg-surface/30 bg-white"
                    >
                      <td className="px-5 py-4 text-xs font-semibold text-text-muted whitespace-nowrap">
                        {app.appNo}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <CompanyBadge name={app.companyName} />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-text-primary truncate">
                              {app.companyName}
                            </div>
                            <div className="text-[11px] text-text-muted truncate mt-0.5 font-medium">
                              {app.roleTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-muted whitespace-nowrap font-medium">
                        {formatDate(app.dateApplied)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={app.status} />
                      </td>
                      <td className="px-5 py-4 min-w-[220px]">
                        <ApplicationCommentField
                          id={`comment-${app.id}`}
                          value={app.candidateVisibleNotes ?? app.comment}
                          onSave={(comment) => saveApplicationComment(app.id, comment)}
                          readOnly={!allowComments}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
