"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { assignRecruiterAction } from "@/lib/actions/recruiter-assignments";
import { MARKETING_STATUS_LABELS } from "@/lib/constants/marketing";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { formatDate } from "@/lib/utils/dates";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select, Avatar } from "@/components/ui";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";

export function RecruiterAssignmentsPage({
  workloads,
  workQueue,
  unassigned,
  isAdmin,
}: {
  workloads: {
    id: string;
    email: string;
    fullName: string;
    title: string;
    phone: string | null;
    timezone: string;
    maxActiveCandidates: number;
    isAvailable: boolean;
    activeCount: number;
    remainingCapacity: number;
    utilizationPct: number;
  }[];
  workQueue: {
    assignmentId: string;
    candidateId: string;
    candidateName: string;
    avatarUrl?: string | null;
    journeyStage: number;
    marketingStatus: "not_ready" | "ready" | "live" | "paused" | "completed";
    assignedAt: Date;
    assignmentReason: string | null;
    recruiterId: string;
    recruiterEmail: string;
    recruiterName: string | null;
  }[];
  unassigned: {
    id: string;
    fullName: string;
    journeyStage: number;
    marketingStatus: "not_ready" | "ready" | "live" | "paused" | "completed";
    createdAt: Date;
  }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [assignTarget, setAssignTarget] = useState<{ candidateId: string; recruiterId: string } | null>(
    null,
  );
  const [dialogError, setDialogError] = useState<string | null>(null);

  const openAssignDialog = (candidateId: string) => {
    const recruiterId = selected[candidateId];
    if (!recruiterId) return;
    setDialogError(null);
    setAssignTarget({ candidateId, recruiterId });
  };

  return (
    <section className="grid gap-6" aria-labelledby="assignments-heading">
      <div>
        <h1 id="assignments-heading" className="text-xl font-bold text-text-primary">
          Recruiter Assignments
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workloads.map((recruiter) => (
          <Card key={recruiter.id} variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{recruiter.fullName}</CardTitle>
                  <p className="mt-1 text-xs text-text-muted">{recruiter.title}</p>
                </div>
                <Badge variant={recruiter.isAvailable ? "success" : "muted"}>
                  {recruiter.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-text-primary">{recruiter.activeCount}</div>
                  <div className="text-xs text-text-muted">
                    of {recruiter.maxActiveCandidates} active candidates
                  </div>
                </div>
                <div className="text-sm font-semibold text-brand-500">{recruiter.utilizationPct}%</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${recruiter.utilizationPct}%` }} />
              </div>
              <div className="mt-3 text-xs text-text-muted">
                {recruiter.remainingCapacity} assignment slots remaining
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={17} /> Unassigned candidates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {unassigned.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <CheckCircle2 size={16} /> All candidates are assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {unassigned.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="grid gap-3 rounded-xl border border-border-subtle bg-white p-4 md:grid-cols-[1fr_260px_auto] md:items-center"
                  >
                    <div>
                      <Link
                        href={`/admin/candidates/${candidate.id}`}
                        className="font-semibold text-text-primary hover:text-brand-500"
                      >
                        {candidate.fullName}
                      </Link>
                      <div className="mt-1 text-xs text-text-muted">
                        Created {formatDate(candidate.createdAt)} · {JOURNEY_STEPS[candidate.journeyStage]}
                      </div>
                    </div>
                    <Select
                      value={selected[candidate.id] ?? ""}
                      onChange={(event) =>
                        setSelected((current) => ({ ...current, [candidate.id]: event.target.value }))
                      }
                      disabled={isPending}
                    >
                      <option value="">Choose recruiter</option>
                      {workloads
                        .filter((recruiter) => recruiter.isAvailable && recruiter.remainingCapacity > 0)
                        .map((recruiter) => (
                          <option key={recruiter.id} value={recruiter.id}>
                            {recruiter.fullName} ({recruiter.activeCount}/{recruiter.maxActiveCandidates})
                          </option>
                        ))}
                    </Select>
                    <Button
                      onClick={() => openAssignDialog(candidate.id)}
                      disabled={isPending || !selected[candidate.id]}
                    >
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound size={17} /> Active work queue
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {workQueue.length === 0 ? (
            <p className="text-sm text-text-muted">No active candidate assignments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border-subtle text-xs text-text-muted">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Candidate</th>
                    <th className="py-3 pr-4 font-medium">Recruiter</th>
                    <th className="py-3 pr-4 font-medium">Journey</th>
                    <th className="py-3 pr-4 font-medium">Marketing</th>
                    <th className="py-3 pr-4 font-medium">Assigned</th>
                    <th className="py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workQueue.map((row) => (
                    <tr key={row.assignmentId} className="border-b border-border-subtle/70">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5 font-semibold text-text-primary">
                          <Avatar
                            name={row.candidateName}
                            src={row.avatarUrl}
                            size="sm"
                            className="shadow-xs border border-border-strong/30"
                          />
                          {row.candidateName}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-text-muted">{row.recruiterName ?? row.recruiterEmail}</td>
                      <td className="py-3 pr-4 text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <BriefcaseBusiness size={13} /> {JOURNEY_STEPS[row.journeyStage]}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={row.marketingStatus === "live" ? "success" : "muted"}>
                          {MARKETING_STATUS_LABELS[row.marketingStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={13} /> {formatDate(row.assignedAt)}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/candidates/${row.candidateId}`}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminActionDialog
        open={assignTarget !== null}
        title="Assign recruiter"
        description="Provide a short operational reason. This is stored on the assignment history."
        fields={[
          {
            name: "reason",
            label: "Assignment reason",
            type: "textarea",
            required: true,
            defaultValue: "Initial operational assignment",
            placeholder: "Why is this recruiter being assigned?",
          },
        ]}
        confirmLabel="Assign recruiter"
        pending={isPending}
        error={dialogError}
        onClose={() => {
          if (!isPending) {
            setAssignTarget(null);
            setDialogError(null);
          }
        }}
        onConfirm={(values) => {
          if (!assignTarget) return;
          const reason = String(values.reason ?? "").trim();
          if (!reason) {
            setDialogError("Assignment reason is required.");
            return;
          }
          startTransition(async () => {
            const result = await assignRecruiterAction({
              candidateId: assignTarget.candidateId,
              recruiterId: assignTarget.recruiterId,
              reason,
            });
            if (result.error) {
              setDialogError(result.error);
              toast.error(result.error);
              return;
            }
            setAssignTarget(null);
            setDialogError(null);
            router.refresh();
          });
        }}
      />
    </section>
  );
}
