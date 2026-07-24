"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronLeft,
  Download,
  FileText,
  Mail,
  Phone,
  Play,
  RefreshCw,
  Send,
  ShieldX,
  Upload,
} from "lucide-react";
import {
  resendCandidateInviteAction,
  revokeCandidateInvitesAction,
} from "@/lib/actions/candidate-invites";
import { reassignRecruiter, updateJourneyStage } from "@/lib/actions/candidates";
import { updateMarketingStatusAction } from "@/lib/actions/marketing";
import { deleteDocument, uploadDocument } from "@/lib/actions/documents";
import { sendMessageAction } from "@/lib/actions/messages";
import {
  assignTrainingToCandidate,
  markTrainingComplete,
} from "@/lib/actions/trainings";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants/document-sections";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { MARKETING_STATUS_LABELS } from "@/lib/constants/marketing";
import { AdminApplicationsTable } from "./AdminApplicationsTable";
import { JourneyBar } from "@/components/shared/JourneyBar";
import { TabBar } from "@/components/shared/TabBar";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import type { Application, MarketingStatus } from "@/lib/db/schema";
import type { DocumentCategory } from "@/lib/db/schema";
import { documentCategories } from "@/lib/db/schema";
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";
import { toast } from "sonner";

const CANDIDATE_TABS = [
  "Profile",
  "Applications",
  "Documents",
  "Trainings",
  "Messages",
  "Account & Security",
] as const;

type Tab = (typeof CANDIDATE_TABS)[number];

const PASSWORD_METHOD_LABELS: Record<string, string> = {
  forced_first_login: "Forced reset on first login",
  self_service: "Self-service password change",
  admin_reset: "Admin password reset",
  secure_invite: "Password created through secure invitation",
};

type CandidateDetail = {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  optType: "OPT" | "STEM_OPT";
  journeyStage: number;
  recruiterId: string | null;
  marketingStatus: MarketingStatus;
  marketingReadyAt: Date | null;
  marketingLiveAt: Date | null;
  marketingPausedAt: Date | null;
  marketingCompletedAt: Date | null;
  marketingNotes: string | null;
  email: string;
  accountState: "pending_setup" | "nda_pending" | "active" | "suspended";
  firstLogin: boolean;
  avatarUrl?: string | null;
};

export function CandidateDetailPage({
  candidate,
  recruiters,
  applications,
  documents,
  trainings,
  trainingCatalog,
  messages,
  passwordHistory,
  latestInvite,
  assignmentHistory,
  journeyHistory,
  marketingReadiness,
  canManageInvites = false,
  canReassignRecruiter = true,
  initialTab = "Profile",
}: {
  candidate: CandidateDetail;
  recruiters: {
    id: string;
    email: string;
    fullName: string;
    title: string;
    phone: string | null;
    maxActiveCandidates: number;
    isAvailable: boolean;
  }[];
  applications: Application[];
  documents: {
    id: string;
    name: string;
    category: string;
    fileUrl: string | null;
    storagePath?: string | null;
    uploadedAt: Date;
  }[];
  trainings: {
    id: string;
    status: string;
    title: string;
    type: string;
    trainingId: string;
  }[];
  trainingCatalog: { id: string; title: string; type: string }[];
  messages: {
    id: string;
    body: string;
    sentAt: Date;
    senderRole: string;
  }[];
  passwordHistory: {
    changedAt: Date;
    method: string;
  }[];
  latestInvite: {
    id: string;
    expiresAt: Date;
    usedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    status: "active" | "used" | "revoked" | "expired";
    setupUrl?: string | null;
  } | null;
  assignmentHistory: {
    id: string;
    recruiterId: string;
    recruiterEmail: string;
    recruiterName: string | null;
    recruiterTitle: string | null;
    status: string;
    reason: string | null;
    assignedAt: Date;
    endedAt: Date | null;
    endReason: string | null;
  }[];
  journeyHistory: {
    id: string;
    stage: number;
    previousStage: number | null;
    eventType: string;
    source: string;
    note: string | null;
    candidateVisible: boolean;
    occurredAt: Date;
    actorEmail: string | null;
  }[];
  marketingReadiness: {
    ready: boolean;
    checks: { key: string; label: string; complete: boolean }[];
    missing: string[];
  } | null;
  canManageInvites?: boolean;
  canReassignRecruiter?: boolean;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [journeyStage, setJourneyStage] = useState(candidate.journeyStage);
  const [recruiterId, setRecruiterId] = useState(candidate.recruiterId ?? "");
  const [marketingStatus, setMarketingStatus] = useState<MarketingStatus>(candidate.marketingStatus);
  const [reply, setReply] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const [inviteFeedback, setInviteFeedback] = useState<{
    kind: "success" | "error";
    message: string;
    previewUrl?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<
    | { type: "journey"; stage: number; requireReason: boolean }
    | { type: "recruiter"; recruiterId: string }
    | { type: "marketing"; nextStatus: MarketingStatus; requireReason: boolean }
    | null
  >(null);

  useEffect(() => {
    if (tab !== "Messages") return;
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "auto" });
  }, [tab, messages.length]);

  const handleJourneyChange = (stage: number) => {
    if (stage === journeyStage) return;
    setDialogError(null);
    setActionDialog({ type: "journey", stage, requireReason: stage < journeyStage });
  };

  const handleRecruiterChange = (id: string) => {
    if (id === recruiterId) return;
    setDialogError(null);
    setActionDialog({ type: "recruiter", recruiterId: id });
  };

  const handleMarketingChange = (nextStatus: MarketingStatus) => {
    if (nextStatus === marketingStatus) return;
    setDialogError(null);
    setActionDialog({
      type: "marketing",
      nextStatus,
      requireReason: ["paused", "completed", "not_ready"].includes(nextStatus),
    });
  };

  const closeActionDialog = () => {
    if (isPending) return;
    setActionDialog(null);
    setDialogError(null);
  };

  const confirmActionDialog = (values: Record<string, string | boolean>) => {
    if (!actionDialog) return;
    const note = String(values.note ?? "").trim();

    if (actionDialog.type === "journey") {
      if (actionDialog.requireReason && !note) {
        setDialogError("A reason is required when moving back to an earlier stage.");
        return;
      }
      startTransition(async () => {
        const result = await updateJourneyStage(
          candidate.id,
          actionDialog.stage,
          note || undefined,
          true,
        );
        if (result.error) {
          setDialogError(result.error);
          toast.error(result.error);
          return;
        }
        setJourneyStage(actionDialog.stage);
        setActionDialog(null);
        setDialogError(null);
        router.refresh();
      });
      return;
    }

    if (actionDialog.type === "recruiter") {
      if (!note) {
        setDialogError("An assignment reason is required.");
        return;
      }
      startTransition(async () => {
        const result = await reassignRecruiter(candidate.id, actionDialog.recruiterId, note);
        if (result.error) {
          setDialogError(result.error);
          toast.error(result.error);
          return;
        }
        setRecruiterId(actionDialog.recruiterId);
        setActionDialog(null);
        setDialogError(null);
        router.refresh();
      });
      return;
    }

    if (actionDialog.requireReason && !note) {
      setDialogError("A reason is required for this marketing status change.");
      return;
    }
    startTransition(async () => {
      const result = await updateMarketingStatusAction({
        candidateId: candidate.id,
        nextStatus: actionDialog.nextStatus,
        note: note || undefined,
      });
      if (result.error) {
        setDialogError(result.error);
        toast.error(result.error);
        return;
      }
      setMarketingStatus(actionDialog.nextStatus);
      if (actionDialog.nextStatus === "live" && journeyStage < 2) setJourneyStage(2);
      setActionDialog(null);
      setDialogError(null);
      router.refresh();
    });
  };

  const handleSendMessage = () => {
    if (!reply.trim()) return;
    startTransition(async () => {
      await sendMessageAction(candidate.userId, reply.trim());
      setReply("");
      router.refresh();
    });
  };

  const handleResendInvite = () => {
    setInviteFeedback(null);
    startTransition(async () => {
      const result = await resendCandidateInviteAction(candidate.id);
      if (result.error) {
        setInviteFeedback({ kind: "error", message: result.error });
        return;
      }
      setInviteFeedback({
        kind: "success",
        message: `A new single-use setup link was issued. Delivery: ${result.delivery}.`,
        previewUrl: result.previewUrl,
      });
      router.refresh();
    });
  };

  const handleRevokeInvites = () => {
    setInviteFeedback(null);
    startTransition(async () => {
      const result = await revokeCandidateInvitesAction(candidate.id);
      setInviteFeedback({
        kind: "success",
        message: `${result.count} active invitation${result.count === 1 ? "" : "s"} revoked.`,
      });
      router.refresh();
    });
  };

  return (
    <div>
      <Link
        href="/admin/candidates"
        className="text-xs font-medium flex items-center gap-1 mb-4 text-brand-500 hover:text-brand-600 transition-colors"
      >
        <ChevronLeft size={14} aria-hidden="true" /> All candidates
      </Link>

      <Card variant="glass" className="p-5 mb-5 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={candidate.fullName} src={candidate.avatarUrl} size="lg" />
          <div>
            <div className="text-base font-semibold text-text-primary">{candidate.fullName}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mt-1 text-text-muted">
              <span className="flex items-center gap-1">
                <Mail size={11} aria-hidden="true" /> {candidate.email}
              </span>
              {candidate.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={11} aria-hidden="true" /> {candidate.phone}
                </span>
              )}
              <span>{candidate.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label htmlFor="recruiter-select" className="block text-[11px] font-medium mb-1 text-text-muted">
              Recruiter
            </label>
            <Select
              id="recruiter-select"
              value={recruiterId}
              onChange={(e) => handleRecruiterChange(e.target.value)}
              disabled={isPending || !canReassignRecruiter}
              className="h-9 text-xs"
            >
              <option value="">Unassigned</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} · {r.email}{r.isAvailable ? "" : " · unavailable"}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="stage-select" className="block text-[11px] font-medium mb-1 text-text-muted">
              Journey stage
            </label>
            <Select
              id="stage-select"
              value={journeyStage}
              onChange={(e) => handleJourneyChange(Number(e.target.value))}
              disabled={isPending}
              className="h-9 text-xs"
            >
              {JOURNEY_STEPS.map((s, i) => (
                <option key={s} value={i}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="marketing-select" className="block text-[11px] font-medium mb-1 text-text-muted">
              Marketing status
            </label>
            <Select
              id="marketing-select"
              value={marketingStatus}
              onChange={(e) => handleMarketingChange(e.target.value as MarketingStatus)}
              disabled={isPending}
              className="h-9 text-xs"
            >
              {Object.entries(MARKETING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <TabBar tabs={[...CANDIDATE_TABS]} active={tab} onChange={setTab} ariaLabel="Candidate sections" />

      {tab === "Profile" && (
        <div className="grid gap-5">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Journey and marketing readiness</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-6">
              <JourneyBar current={journeyStage} big />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {marketingReadiness?.checks.map((check) => (
                  <div key={check.key} className="rounded-xl border border-border-subtle bg-white p-3 text-xs">
                    <div className={cn("font-semibold", check.complete ? "text-success" : "text-text-muted")}>
                      {check.complete ? "Complete" : "Required"}
                    </div>
                    <div className="mt-1 text-text-primary">{check.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                Marketing: <strong>{MARKETING_STATUS_LABELS[marketingStatus]}</strong>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card variant="glass">
              <CardHeader><CardTitle>Recruiter assignment history</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                {assignmentHistory.length === 0 ? (
                  <p className="text-xs text-text-muted">No recruiter assignment has been recorded.</p>
                ) : assignmentHistory.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border-subtle bg-white p-3 text-xs">
                    <div className="font-semibold text-text-primary">{item.recruiterName ?? item.recruiterEmail}</div>
                    <div className="text-text-muted mt-1">Assigned {formatDateTime(item.assignedAt)}</div>
                    <div className="text-text-muted mt-1">{item.reason || "No assignment reason recorded"}</div>
                    {item.endedAt && <div className="text-text-muted mt-1">Ended {formatDateTime(item.endedAt)}{item.endReason ? ` · ${item.endReason}` : ""}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader><CardTitle>Journey event history</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3 max-h-[360px] overflow-y-auto">
                {journeyHistory.length === 0 ? (
                  <p className="text-xs text-text-muted">No journey events recorded.</p>
                ) : journeyHistory.map((event) => (
                  <div key={event.id} className="rounded-xl border border-border-subtle bg-white p-3 text-xs">
                    <div className="font-semibold text-text-primary">{JOURNEY_STEPS[event.stage] ?? `Stage ${event.stage + 1}`}</div>
                    <div className="text-text-muted mt-1">{formatDateTime(event.occurredAt)} · {event.source}</div>
                    <div className="text-text-muted mt-1">{event.note || event.eventType.replaceAll("_", " ")}</div>
                    {!event.candidateVisible && <div className="text-[10px] text-warning mt-1">Internal only</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "Applications" && (
        <AdminApplicationsTable
          applications={applications}
          candidateId={candidate.id}
          candidateName={candidate.fullName}
        />
      )}

      {tab === "Documents" && (
        <DocumentsTab
          candidateId={candidate.id}
          documents={documents}
          isPending={isPending}
          startTransition={startTransition}
          router={router}
        />
      )}

      {tab === "Trainings" && (
        <TrainingsTab
          candidateId={candidate.id}
          trainings={trainings}
          catalog={trainingCatalog}
          isPending={isPending}
          startTransition={startTransition}
          router={router}
        />
      )}

      {tab === "Messages" && (
        <Card variant="glass" className="overflow-hidden flex flex-col h-[420px] max-h-[min(420px,60vh)]">
          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface/40 min-h-0"
          >
            {messages.length === 0 ? (
              <p className="text-xs text-center pt-8 text-text-muted">
                No messages yet with {candidate.fullName}.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.senderRole === "recruiter" ? "justify-end" : "justify-start",
                  )}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-xl text-xs leading-relaxed",
                        m.senderRole === "recruiter"
                          ? "brand-gradient text-white"
                          : "glass text-text-primary",
                      )}
                    >
                      {m.body}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] mt-1 text-text-muted",
                        m.senderRole === "recruiter" && "text-right",
                      )}
                    >
                      {m.senderRole === "recruiter" ? "You" : candidate.fullName} ·{" "}
                      {formatDateTime(m.sentAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle flex-shrink-0">
            <label htmlFor="reply-input" className="sr-only">
              Reply to {candidate.fullName}
            </label>
            <Input
              id="reply-input"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={`Reply to ${candidate.fullName}...`}
              className="flex-1 h-9 text-xs"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSendMessage}
              disabled={isPending}
              aria-label="Send reply"
              className="h-9 w-9 flex-shrink-0"
            >
              <Send size={15} aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}

      {tab === "Account & Security" && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Account setup and security</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2 mb-5">
              <div className="rounded-xl bg-surface/60 px-3 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Account state
                </div>
                <div className="mt-1 text-sm font-semibold text-text-primary">
                  {candidate.accountState.replace("_", " ")}
                </div>
              </div>
              <div className="rounded-xl bg-surface/60 px-3 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Latest invitation
                </div>
                <div className="mt-1 text-sm font-semibold text-text-primary">
                  {latestInvite?.status ?? "Not issued"}
                </div>
                {latestInvite && (
                  <div className="mt-1 text-[11px] text-text-muted">
                    Created {formatDateTime(latestInvite.createdAt)} · Expires {formatDateTime(latestInvite.expiresAt)}
                  </div>
                )}
              </div>
            </div>

            {(inviteFeedback?.previewUrl || latestInvite?.setupUrl) &&
              candidate.accountState === "pending_setup" &&
              latestInvite?.status === "active" && (
                <div className="mb-5 rounded-xl border border-brand-500/20 bg-brand-50 px-4 py-3">
                  <div className="text-xs font-semibold text-text-primary">Setup link</div>
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      readOnly
                      value={inviteFeedback?.previewUrl || latestInvite?.setupUrl || ""}
                      className="h-9 flex-1 font-mono text-[11px]"
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const url = inviteFeedback?.previewUrl || latestInvite?.setupUrl;
                          if (!url) return;
                          try {
                            await navigator.clipboard.writeText(url);
                            setInviteFeedback({
                              kind: "success",
                              message: "Setup link copied to clipboard.",
                              previewUrl: url,
                            });
                          } catch {
                            setInviteFeedback({
                              kind: "error",
                              message: "Could not copy automatically — select the link and copy it manually.",
                              previewUrl: url,
                            });
                          }
                        }}
                      >
                        Copy link
                      </Button>
                      <Button type="button" size="sm" asChild>
                        <a
                          href={inviteFeedback?.previewUrl || latestInvite?.setupUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {candidate.accountState === "pending_setup" &&
              !inviteFeedback?.previewUrl &&
              !latestInvite?.setupUrl &&
              canManageInvites && (
                <p className="mb-4 rounded-xl bg-surface/60 px-3 py-2 text-xs text-text-muted">
                  No setup link stored. Click <span className="font-semibold text-text-primary">Resend invite</span> to generate one.
                </p>
              )}

            {canManageInvites ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleResendInvite}
                  disabled={isPending || candidate.accountState !== "pending_setup"}
                  loading={isPending}
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  {latestInvite ? "Resend invite" : "Send setup invite"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRevokeInvites}
                  disabled={isPending || latestInvite?.status !== "active"}
                >
                  <ShieldX size={13} aria-hidden="true" /> Revoke active invite
                </Button>
              </div>
            ) : (
              <p className="mb-4 text-xs text-text-muted">Only administrators can manage invitations.</p>
            )}

            {candidate.accountState !== "pending_setup" && (
              <p className="mb-4 rounded-xl bg-success-soft px-3 py-2 text-xs text-success">
                Account setup complete.
              </p>
            )}

            {inviteFeedback && (
              <div
                className={cn(
                  "mb-5 rounded-xl px-3 py-2 text-xs",
                  inviteFeedback.kind === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
                )}
                role="status"
              >
                {inviteFeedback.message}
                {inviteFeedback.previewUrl && (
                  <a
                    href={inviteFeedback.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 font-semibold underline"
                  >
                    Open development link
                  </a>
                )}
              </div>
            )}

            <h3 className="text-sm font-semibold mb-2 text-text-primary">Password change history</h3>
            {passwordHistory.length === 0 ? (
              <p className="text-xs text-text-muted">No password changes recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {passwordHistory.map((entry, index) => (
                  <div
                    key={`${entry.method}-${entry.changedAt.toISOString()}-${index}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface/60"
                  >
                    <span className="text-xs text-text-primary">
                      {PASSWORD_METHOD_LABELS[entry.method] ?? entry.method}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {formatDateTime(entry.changedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AdminActionDialog
        open={actionDialog !== null}
        title={
          actionDialog?.type === "journey"
            ? actionDialog.requireReason
              ? "Move journey stage back"
              : "Update journey stage"
            : actionDialog?.type === "recruiter"
              ? actionDialog.recruiterId
                ? "Assign recruiter"
                : "Unassign recruiter"
              : actionDialog?.requireReason
                ? "Change marketing status"
                : "Update marketing status"
        }
        description={
          actionDialog?.type === "journey"
            ? actionDialog.requireReason
              ? "A reason is required when reopening an earlier stage. Candidates can see this note."
              : "Optional note is stored on the journey timeline and can be visible to the candidate."
            : actionDialog?.type === "recruiter"
              ? "Assignment changes are audited and written to recruiter history."
              : actionDialog?.requireReason
                ? "A reason is required when pausing, completing, or returning marketing to not ready."
                : "Optional note is recorded in journey and marketing history."
        }
        fields={[
          {
            name: "note",
            label:
              actionDialog?.type === "recruiter"
                ? "Reason"
                : actionDialog?.requireReason
                  ? "Reason"
                  : "Note (optional)",
            type: "textarea",
            required: Boolean(
              actionDialog?.type === "recruiter" ||
                (actionDialog && "requireReason" in actionDialog && actionDialog.requireReason),
            ),
            placeholder:
              actionDialog?.type === "recruiter"
                ? "Why is this recruiter being assigned or removed?"
                : "Add context for this operational change",
          },
        ]}
        confirmLabel="Save change"
        pending={isPending}
        error={dialogError}
        onClose={closeActionDialog}
        onConfirm={confirmActionDialog}
      />
    </div>
  );
}

function DocumentsTab({
  candidateId,
  documents,
  isPending,
  startTransition,
  router,
}: {
  candidateId: string;
  documents: {
    id: string;
    name: string;
    category: string;
    fileUrl: string | null;
    storagePath?: string | null;
    uploadedAt: Date;
  }[];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await uploadDocument(formData);
      setShowUpload(false);
      setSelectedFileName(null);
      router.refresh();
    });
  };

  return (
    <Card variant="glass" className="overflow-hidden">
      <div className="flex justify-end p-3 border-b border-border-subtle">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setShowUpload((open) => !open);
            setSelectedFileName(null);
          }}
        >
          <Upload size={13} aria-hidden="true" /> Upload document
        </Button>
      </div>
      {showUpload && (
        <form onSubmit={handleUpload} className="p-4 space-y-3 border-b border-border-subtle">
          <input type="hidden" name="candidateId" value={candidateId} />
          <Input name="name" required placeholder="Document name" className="h-9 text-xs" />
          <Select name="category" required className="h-9 text-xs">
            {documentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory]}
              </option>
            ))}
          </Select>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-text-muted">File</p>
            <input
              ref={fileInputRef}
              name="file"
              type="file"
              required
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={(event) => {
                setSelectedFileName(event.target.files?.[0]?.name ?? null);
              }}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="justify-start sm:min-w-[9.5rem]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} aria-hidden="true" />
                Choose file
              </Button>
              <span
                className={cn(
                  "text-xs truncate min-w-0",
                  selectedFileName ? "text-text-primary font-medium" : "text-text-muted",
                )}
              >
                {selectedFileName ?? "No file chosen"}
              </span>
            </div>
            <p className="text-[10px] text-text-muted">PDF, DOC, DOCX, PNG, or JPG</p>
          </div>
          <Button type="submit" size="sm" disabled={isPending || !selectedFileName} loading={isPending}>
            Upload document
          </Button>
        </form>
      )}
      {documents.length === 0 ? (
        <p className="text-xs p-6 text-center text-text-muted">No documents uploaded yet.</p>
      ) : (
        documents.map((d, i) => (
          <div
            key={d.id}
            className={cn(
              "flex items-center justify-between px-5 py-4",
              i > 0 && "border-t border-border-subtle",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-100">
                <FileText size={14} className="text-brand-600" aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">{d.name}</div>
                <div className="text-xs text-text-muted">
                  {DOCUMENT_CATEGORY_LABELS[d.category as DocumentCategory]} ·{" "}
                  {formatDate(d.uploadedAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/api/documents/${d.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors"
              >
                <Download size={13} aria-hidden="true" /> Download
              </a>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await deleteDocument(d.id);
                    router.refresh();
                  })
                }
                className="text-xs text-danger hover:text-danger/80 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

function TrainingsTab({
  candidateId,
  trainings,
  catalog,
  isPending,
  startTransition,
  router,
}: {
  candidateId: string;
  trainings: { id: string; status: string; title: string; type: string; trainingId: string }[];
  catalog: { id: string; title: string; type: string }[];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const assignedIds = new Set(trainings.map((t) => t.trainingId));
  const unassigned = catalog.filter((t) => !assignedIds.has(t.id));

  return (
    <div>
      {unassigned.length > 0 && (
        <Card variant="glass" className="p-4 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">Assign training:</span>
          {unassigned.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await assignTrainingToCandidate(candidateId, t.id);
                  router.refresh();
                })
              }
            >
              + {t.title}
            </Button>
          ))}
        </Card>
      )}
      <Card variant="glass" className="overflow-hidden">
        {trainings.length === 0 ? (
          <p className="text-xs p-6 text-center text-text-muted">No trainings assigned yet.</p>
        ) : (
          trainings.map((t, i) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center justify-between px-5 py-4",
                i > 0 && "border-t border-border-subtle",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-50">
                  <Play size={14} className="text-brand-500" aria-hidden="true" />
                </div>
                <div className="text-sm font-medium text-text-primary">{t.title}</div>
              </div>
              <Select
                value={t.status}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(async () => {
                    if (e.target.value === "completed") {
                      await markTrainingComplete(t.id, candidateId);
                    }
                    router.refresh();
                  })
                }
                className="h-8 text-[11px] w-auto"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
