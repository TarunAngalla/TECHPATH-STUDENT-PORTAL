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

const APPLICATIONS_HELP =
  "Comments are saved notes visible to both you and your recruiter — not a live chat.";

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ApplicationCommentField({
  id,
  value,
  onSave,
}: {
  id: string;
  value: string;
  onSave: (comment: string) => Promise<{ error?: string }>;
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

  return (
    <Textarea
      id={id}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      placeholder="Add a note..."
      rows={2}
      disabled={isPending}
      className="text-xs min-h-[60px]"
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
        "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
        active
          ? "brand-gradient text-white shadow-sm"
          : "bg-surface-elevated/80 text-text-muted border border-border-subtle hover:text-text-primary hover:border-border-strong",
      )}
    >
      {label}
    </button>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  return (
    <Card variant="glass" className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyBadge name={app.companyName} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">{app.companyName}</div>
            <div className="text-xs text-text-muted truncate">{app.roleTitle}</div>
          </div>
        </div>
        <StatusPill status={app.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <Badge variant="muted">{app.appNo}</Badge>
        <span>Applied {formatDate(app.dateApplied)}</span>
      </div>
      <ApplicationCommentField
        id={`comment-mobile-${app.id}`}
        value={app.comment}
        onSave={(comment) => saveApplicationComment(app.id, comment)}
      />
    </Card>
  );
}

export function CandidateApplicationsTable({ applications }: { applications: Application[] }) {
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

      <div className="flex flex-col gap-3 mb-4">
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
            placeholder="Search by company or role"
            className="pl-9 text-xs"
          />
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          role="group"
          aria-label="Filter by status"
        >
          <FilterChip
            label="All statuses"
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

      <p className="text-xs mb-3 text-text-muted" aria-live="polite">
        {filtered.length} of {applications.length} applications
      </p>

      {filtered.length === 0 ? (
        <Card variant="glass" className="overflow-hidden">
          <EmptyState
            title="No applications match"
            note="Try a different search term or filter. Once your recruiter moves an application here, it will show up automatically."
          />
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3" aria-label="Applications">
            {filtered.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>

          <Card variant="glass" className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[780px]" aria-label="Applications">
                <thead>
                  <tr className="bg-surface/60 border-b border-border-subtle">
                    <th scope="col" className="px-4 py-3 text-[11px] font-medium text-text-muted">
                      App No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-medium text-text-muted">
                      Company / role
                    </th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-medium text-text-muted">
                      Date applied
                    </th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-medium text-text-muted">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-medium text-text-muted">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      className="border-t border-border-subtle align-top transition-colors hover:bg-brand-50/40"
                    >
                      <td className="px-4 py-3.5 text-xs text-text-muted whitespace-nowrap">
                        {app.appNo}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CompanyBadge name={app.companyName} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">
                              {app.companyName}
                            </div>
                            <div className="text-[11px] text-text-muted truncate">
                              {app.roleTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-muted whitespace-nowrap">
                        {formatDate(app.dateApplied)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={app.status} />
                      </td>
                      <td className="px-4 py-3.5 min-w-[220px]">
                        <ApplicationCommentField
                          id={`comment-${app.id}`}
                          value={app.comment}
                          onSave={(comment) => saveApplicationComment(app.id, comment)}
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

      <p className="text-[11px] mt-3 text-text-muted">{APPLICATIONS_HELP}</p>
    </section>
  );
}
