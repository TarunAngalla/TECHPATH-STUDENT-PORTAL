"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createApplication } from "@/lib/actions/applications";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status-meta";
import { Button, Input, Select } from "@/components/ui";
import { StaffFormModal } from "@/components/admin/StaffFormModal";

export type CandidateOption = {
  id: string;
  fullName: string;
  email: string;
};

export function StaffAddApplicationPanel({ candidates }: { candidates: CandidateOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("applied");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => {
    if (!isPending) setOpen(false);
  }, [isPending]);

  if (candidates.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Add a candidate first, then you can create applications here.
      </p>
    );
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} aria-hidden="true" /> Add application
      </Button>

      <StaffFormModal open={open} title="New application" onClose={close} pending={isPending}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
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
              setStatus("applied");
              if (result.applicationId) {
                router.push(`/admin/applications/${result.applicationId}`);
                return;
              }
              router.refresh();
            });
          }}
        >
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Candidate</span>
            <Select
              required
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              disabled={isPending}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} · {c.email}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Company</span>
            <Input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company"
              disabled={isPending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Role title</span>
            <Input
              required
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Role title"
              disabled={isPending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Date applied</span>
            <Input
              type="date"
              required
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              disabled={isPending}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-text-muted">Status</span>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isPending}
            >
              {APPLICATION_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </label>
          {error && (
            <p className="text-xs font-semibold text-danger sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 sm:col-span-2">
            <Button type="button" size="sm" variant="ghost" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
              Create application
            </Button>
          </div>
        </form>
      </StaffFormModal>
    </>
  );
}
