"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { YouTubePlayer } from "@/components/shared/YouTubePlayer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { completeTrainingAsCandidate } from "@/lib/actions/trainings";
import { cn } from "@/lib/utils/cn";
import { getDocumentViewerUrl } from "@/lib/utils/documents";
import { extractYouTubeId, isDirectVideoUrl } from "@/lib/utils/youtube";

export type TrainingItem = {
  id: string;
  status: "upcoming" | "completed";
  title: string;
  type: "video" | "pdf";
  contentUrl: string | null;
};

type Tab = "upcoming" | "completed";

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 flex-shrink-0" aria-hidden="true">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border-subtle"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="url(#progress-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-primary">
          {pct}%
        </span>
      </div>
      <div>
        <div className="text-xs font-bold text-text-primary">Your Progress</div>
        <div className="text-[11px] text-text-muted">
          {completed} of {total} completed
        </div>
      </div>
    </div>
  );
}

function TypeChip({ type }: { type: TrainingItem["type"] }) {
  const isVideo = type === "video";
  return (
    <Badge
      variant="muted"
      className={cn(
        "text-[9px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 mt-1.5 border",
        isVideo
          ? "bg-blue-50 text-blue-600 border-blue-100/50"
          : "bg-purple-50 text-purple-600 border-purple-100/50",
      )}
    >
      {isVideo ? <Play size={8} aria-hidden="true" fill="currentColor" /> : <FileText size={8} aria-hidden="true" />}
      {isVideo ? "Video" : "PDF"}
    </Badge>
  );
}

function TrainingRow({ training, allowSelfComplete }: { training: TrainingItem; allowSelfComplete: boolean }) {
  const router = useRouter();
  const isVideo = training.type === "video";
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const youtubeId = training.contentUrl ? extractYouTubeId(training.contentUrl) : null;
  const directVideo = training.contentUrl ? isDirectVideoUrl(training.contentUrl) : false;
  const canEmbedVideo = isVideo && Boolean(youtubeId || directVideo);
  const documentViewer =
    !isVideo && training.contentUrl ? getDocumentViewerUrl(training.contentUrl) : null;
  const canEmbedPdf = Boolean(documentViewer);

  const markComplete = () => {
    if (!allowSelfComplete || training.status === "completed" || isPending) return;
    startTransition(async () => {
      const result = await completeTrainingAsCandidate(training.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${training.title}" marked complete`);
      router.refresh();
    });
  };

  return (
    <div className="border-t border-border-subtle first:border-t-0 bg-white">
      <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface/30">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs",
              isVideo
                ? "bg-blue-50 border-blue-100/50 text-blue-600"
                : "bg-purple-50 border-purple-100/50 text-purple-600",
            )}
          >
            {isVideo ? (
              <Play size={14} aria-hidden="true" fill="currentColor" />
            ) : (
              <FileText size={14} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate leading-tight">
              {training.title}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TypeChip type={training.type} />
              {training.status === "completed" && (
                <Badge
                  variant="success"
                  className="text-[9px] px-2 py-0.5 rounded-full font-semibold mt-1.5"
                >
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {training.contentUrl ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs hover:bg-surface text-text-primary border border-border-strong/30 bg-white shadow-xs"
              aria-expanded={expanded}
            >
              {isVideo ? (
                <>
                  <Eye size={13} className="mr-1.5" aria-hidden="true" />
                  {expanded ? "Hide" : "Watch"}
                </>
              ) : (
                <>
                  <Download size={13} className="mr-1.5" aria-hidden="true" />
                  {expanded ? "Hide" : "Open"}
                </>
              )}
              <ChevronDown
                size={13}
                className={cn("ml-1 transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </Button>
          ) : (
            <Badge variant="muted" className="text-[10px]">
              Coming soon
            </Badge>
          )}

          {allowSelfComplete && training.status === "upcoming" && !canEmbedVideo && training.contentUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={markComplete}
              disabled={isPending}
              className="text-xs text-success hover:text-success hover:bg-green-50 border-green-500/30 hover:border-green-500 bg-white shadow-xs"
            >
              <CheckCircle size={12} className="mr-1.5 inline-block" />
              {isPending ? "Completing…" : "Complete"}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && training.contentUrl && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {canEmbedVideo && youtubeId && (
                <div className="space-y-2">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border-strong/40 bg-black shadow-xs">
                    <YouTubePlayer
                      videoId={youtubeId}
                      onEnded={allowSelfComplete && training.status === "upcoming" ? markComplete : undefined}
                    />
                  </div>
                  {allowSelfComplete && training.status === "upcoming" && (
                    <p className="text-[11px] text-text-muted font-medium">
                      Watch the full video to mark this training as complete.
                    </p>
                  )}
                </div>
              )}

              {canEmbedVideo && !youtubeId && directVideo && (
                <div className="space-y-2">
                  <video
                    className="w-full aspect-video rounded-xl border border-border-strong/40 bg-black shadow-xs"
                    src={training.contentUrl}
                    controls
                    playsInline
                    onEnded={allowSelfComplete && training.status === "upcoming" ? markComplete : undefined}
                  />
                  {allowSelfComplete && training.status === "upcoming" && (
                    <p className="text-[11px] text-text-muted font-medium">
                      Watch the full video to mark this training as complete.
                    </p>
                  )}
                </div>
              )}

              {canEmbedPdf && documentViewer && (
                <div className="space-y-3">
                  <iframe
                    title={training.title}
                    src={documentViewer.embedUrl}
                    className="w-full h-[min(70vh,560px)] rounded-xl border border-border-strong/40 bg-white shadow-xs"
                    allow="autoplay; fullscreen"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-text-muted font-medium">
                      {documentViewer.kind === "google"
                        ? "Google Doc opens in a built-in reader. Share the file as “Anyone with the link” can view."
                        : documentViewer.kind === "pdf-viewer"
                          ? "PDF is shown via Google’s document viewer."
                          : "If the preview is blank, open the document in a new tab."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs border border-border-strong/30"
                      >
                        <a href={training.contentUrl!} target="_blank" rel="noopener noreferrer">
                          Open in new tab
                        </a>
                      </Button>
                      {allowSelfComplete && training.status === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markComplete}
                          disabled={isPending}
                          className="text-xs text-success hover:text-success hover:bg-green-50 border-green-500/30 hover:border-green-500 bg-white shadow-xs"
                        >
                          <CheckCircle size={12} className="mr-1.5 inline-block" />
                          {isPending ? "Completing…" : "Mark as complete"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isVideo && !canEmbedVideo && (
                <div className="space-y-3 rounded-xl border border-border-strong/40 bg-surface/40 p-4">
                  <p className="text-xs text-text-muted font-medium">
                    This video can&apos;t be embedded. Open it externally, then mark complete when
                    finished.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" asChild className="text-xs border border-border-strong/30">
                      <a href={training.contentUrl} target="_blank" rel="noopener noreferrer">
                        Open video
                      </a>
                    </Button>
                    {allowSelfComplete && training.status === "upcoming" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markComplete}
                        disabled={isPending}
                        className="text-xs text-success hover:text-success hover:bg-green-50 border-green-500/30"
                      >
                        Mark as complete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CandidateTrainingsList({ trainings, allowSelfComplete = false }: { trainings: TrainingItem[]; allowSelfComplete?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const upcoming = trainings.filter((t) => t.status === "upcoming");
  const completed = trainings.filter((t) => t.status === "completed");
  const activeList = activeTab === "upcoming" ? upcoming : completed;
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length },
    { id: "completed", label: "Completed", count: completed.length },
  ];

  return (
    <section aria-labelledby="trainings-heading">
      <h2 id="trainings-heading" className="sr-only">
        Trainings
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex border-b border-border-subtle" role="tablist" aria-label="Training status">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-semibold transition-colors",
                activeTab === tab.id ? "text-text-primary" : "text-text-muted hover:text-text-primary",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-text-muted">({tab.count})</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="training-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 brand-gradient"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <ProgressRing completed={completed.length} total={trainings.length} />
      </div>

      {activeList.length === 0 ? (
        <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs">
          <EmptyState title={`No ${activeTab} trainings`} />
        </Card>
      ) : (
        <Card
          variant="glass"
          className="overflow-hidden bg-white border border-border-strong/50 shadow-xs"
          role="list"
          aria-label={activeTab}
        >
          {activeList.map((t) => (
            <div key={t.id} role="listitem">
              <TrainingRow training={t} allowSelfComplete={allowSelfComplete} />
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}
