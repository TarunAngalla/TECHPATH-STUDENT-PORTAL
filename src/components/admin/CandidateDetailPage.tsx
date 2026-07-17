"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft,
  Download,
  FileText,
  Mail,
  Phone,
  Play,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { adminResetCandidatePassword } from "@/lib/actions/auth";
import { reassignRecruiter, updateJourneyStage } from "@/lib/actions/candidates";
import { deleteDocument, uploadDocument } from "@/lib/actions/documents";
import { sendRecruiterMessage } from "@/lib/actions/messages";
import {
  assignTrainingToCandidate,
  markTrainingComplete,
} from "@/lib/actions/trainings";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants/document-sections";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { AdminApplicationsTable } from "./AdminApplicationsTable";
import { JourneyBar } from "@/components/shared/JourneyBar";
import { TabBar } from "@/components/shared/TabBar";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import type { Application } from "@/lib/db/schema";
import type { DocumentCategory } from "@/lib/db/schema";
import { documentCategories } from "@/lib/db/schema";
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

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
};

type CandidateDetail = {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  optType: "OPT" | "STEM_OPT";
  journeyStage: number;
  recruiterId: string | null;
  email: string;
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
}: {
  candidate: CandidateDetail;
  recruiters: { id: string; email: string }[];
  applications: Application[];
  documents: {
    id: string;
    name: string;
    category: string;
    fileUrl: string;
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
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Profile");
  const [journeyStage, setJourneyStage] = useState(candidate.journeyStage);
  const [recruiterId, setRecruiterId] = useState(candidate.recruiterId ?? "");
  const [reply, setReply] = useState("");
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleJourneyChange = (stage: number) => {
    setJourneyStage(stage);
    startTransition(async () => {
      await updateJourneyStage(candidate.id, stage);
      router.refresh();
    });
  };

  const handleRecruiterChange = (id: string) => {
    setRecruiterId(id);
    startTransition(async () => {
      await reassignRecruiter(candidate.id, id);
      router.refresh();
    });
  };

  const handleSendMessage = () => {
    if (!reply.trim()) return;
    startTransition(async () => {
      await sendRecruiterMessage(candidate.id, reply.trim());
      setReply("");
      router.refresh();
    });
  };

  const handleResetPassword = () => {
    startTransition(async () => {
      const result = await adminResetCandidatePassword(candidate.userId);
      setResetPassword(result.password);
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
          <Avatar name={candidate.fullName} size="lg" />
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
              disabled={isPending}
              className="h-9 text-xs"
            >
              <option value="">Unassigned</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.email}
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
        </div>
      </Card>

      <TabBar tabs={[...CANDIDATE_TABS]} active={tab} onChange={setTab} ariaLabel="Candidate sections" />

      {tab === "Profile" && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Journey</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <JourneyBar current={journeyStage} big />
            <p className="text-xs mt-6 text-text-muted">
              This is the exact stepper {candidate.fullName} sees on their own dashboard.
              Changing the journey stage dropdown above updates it immediately.
            </p>
          </CardContent>
        </Card>
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
        <Card variant="glass" className="overflow-hidden flex flex-col h-[420px]">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface/40">
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
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle">
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
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs mb-4 flex items-center gap-1.5 text-text-muted">
              <ShieldCheck size={12} aria-hidden="true" />
              {passwordHistory[0]
                ? `Last changed: ${formatDateTime(passwordHistory[0].changedAt)} · ${PASSWORD_METHOD_LABELS[passwordHistory[0].method] ?? passwordHistory[0].method}`
                : "No password changes recorded yet."}
            </p>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleResetPassword}
              disabled={isPending}
              loading={isPending}
              className="mb-4"
            >
              Reset password
            </Button>
            {resetPassword && (
              <div
                className="text-xs p-3 rounded-xl mb-6 font-mono bg-warning-soft text-text-primary"
                role="status"
              >
                New temporary password: <strong>{resetPassword}</strong> — share with the candidate
                directly.
              </div>
            )}
            <h3 className="text-sm font-semibold mb-2 text-text-primary">Change history</h3>
            {passwordHistory.length === 0 ? (
              <p className="text-xs text-text-muted">No history yet.</p>
            ) : (
              <div className="space-y-2">
                {passwordHistory.map((entry, i) => (
                  <div
                    key={i}
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
    fileUrl: string;
    uploadedAt: Date;
  }[];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await uploadDocument(formData);
      setShowUpload(false);
      router.refresh();
    });
  };

  return (
    <Card variant="glass" className="overflow-hidden">
      <div className="flex justify-end p-3 border-b border-border-subtle">
        <Button type="button" size="sm" onClick={() => setShowUpload(!showUpload)}>
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
          <input name="file" type="file" required className="text-xs" />
          <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
            Upload
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
                href={d.fileUrl}
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
                    await deleteDocument(d.id, candidateId);
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
