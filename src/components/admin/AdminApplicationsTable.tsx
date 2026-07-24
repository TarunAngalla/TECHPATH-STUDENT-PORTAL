"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Plus } from "lucide-react";
import {
  createApplication,
  updateApplicationAdmin,
} from "@/lib/actions/applications";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status-meta";
import type { ApplicationStatus } from "@/lib/constants/status-meta";
import { CompanyBadge } from "@/components/shared/CompanyBadge";
import { formatDate } from "@/lib/utils/dates";
import type { Application } from "@/lib/db/schema";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

function ApplicationRow({ app }: { app: Application }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(app.status as ApplicationStatus);
  const [comment, setComment] = useState(app.candidateVisibleNotes ?? app.comment);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = (fields: Parameters<typeof updateApplicationAdmin>[0]) => {
    startTransition(async () => {
      await updateApplicationAdmin(fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  };

  return (
    <tr className="border-t border-border-subtle align-top">
      <td className="px-4 py-3.5 text-xs whitespace-nowrap text-text-muted">{app.appNo}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <CompanyBadge name={app.companyName} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-text-primary">{app.companyName}</div>
            <div className="text-[11px] truncate text-text-muted">{app.roleTitle}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs whitespace-nowrap text-text-muted">
        {formatDate(app.dateApplied)}
      </td>
      <td className="px-4 py-3.5">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ApplicationStatus);
            save({ applicationId: app.id, status: e.target.value });
          }}
          disabled={isPending}
          className="h-8 text-[11px] w-auto"
        >
          {APPLICATION_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3.5 min-w-[180px]">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => {
            if (comment !== (app.candidateVisibleNotes ?? app.comment)) save({ applicationId: app.id, candidateVisibleNotes: comment || null });
          }}
          rows={2}
          placeholder="Candidate-visible note..."
          className="text-[11px] min-h-0"
        />
      </td>
      <td className="px-4 py-3.5 min-w-[200px] text-xs text-text-muted">
        {app.upcomingWhen && app.upcomingLabel ? (
          <div>
            <div className="font-semibold text-text-primary">{app.upcomingLabel}</div>
            <div className="mt-1">{formatDate(app.upcomingWhen)}</div>
            <div className="text-[10px] mt-1">Managed through interview and assessment activity.</div>
          </div>
        ) : (
          <span>No upcoming activity</span>
        )}
      </td>
      <td className="px-2 py-3.5">
        <div className="flex flex-col gap-1.5 items-start">
          {saved && <span className="text-[10px] font-medium text-success">Saved</span>}
          <Link href={`/admin/applications/${app.id}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-500 hover:underline">
            Manage activity <ExternalLink size={10} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function AddApplicationForm({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("applied");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createApplication({
        candidateId,
        companyName,
        roleTitle,
        dateApplied,
        status,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setCompanyName("");
      setRoleTitle("");
      router.refresh();
    });
  };

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus size={13} aria-hidden="true" /> Add application
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <Input
        required
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company"
        className="h-8 text-xs w-auto"
      />
      <Input
        required
        value={roleTitle}
        onChange={(e) => setRoleTitle(e.target.value)}
        placeholder="Role"
        className="h-8 text-xs w-auto"
      />
      <Input
        type="date"
        required
        value={dateApplied}
        onChange={(e) => setDateApplied(e.target.value)}
        className="h-8 text-xs w-auto"
      />
      <Select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-8 text-xs w-auto"
      >
        {APPLICATION_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
        Save
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && <span className="text-xs w-full text-danger">{error}</span>}
    </form>
  );
}

export function AdminApplicationsTable({
  applications,
  candidateId,
  candidateName,
}: {
  applications: Application[];
  candidateId: string;
  candidateName: string;
}) {
  return (
    <Card variant="glass" className="overflow-hidden">
      <div className="flex justify-end p-3 border-b border-border-subtle">
        <AddApplicationForm candidateId={candidateId} />
      </div>
      {applications.length === 0 ? (
        <p className="text-xs p-6 text-center text-text-muted">
          No applications yet for {candidateName}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 960 }}>
            <thead>
              <tr className="bg-surface/60 border-b border-border-subtle">
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">App No.</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Company / role</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Date</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Comment</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Upcoming</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <ApplicationRow key={app.id} app={app} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
