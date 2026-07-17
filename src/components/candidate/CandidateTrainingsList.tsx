"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Eye, FileText, Play } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

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
              <stop offset="0%" stopColor="#0f4c81" />
              <stop offset="100%" stopColor="#1b9aaa" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-text-primary">
          {pct}%
        </span>
      </div>
      <div>
        <div className="text-xs font-medium text-text-primary">Your progress</div>
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
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white",
        isVideo
          ? "bg-gradient-to-r from-brand-600 to-accent"
          : "bg-gradient-to-r from-brand-600 to-brand-500",
      )}
    >
      {isVideo ? <Play size={10} aria-hidden="true" /> : <FileText size={10} aria-hidden="true" />}
      {isVideo ? "Video" : "PDF"}
    </span>
  );
}

function TrainingRow({ training }: { training: TrainingItem }) {
  const isVideo = training.type === "video";

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border-subtle first:border-t-0 transition-colors hover:bg-brand-50/30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-soft">
          {isVideo ? (
            <Play size={14} className="text-accent" aria-hidden="true" />
          ) : (
            <FileText size={14} className="text-accent" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">{training.title}</div>
          <TypeChip type={training.type} />
        </div>
      </div>
      {training.contentUrl ? (
        <Button variant="ghost" size="sm" asChild className="flex-shrink-0 ml-3">
          <a
            href={training.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={isVideo ? `View ${training.title}` : `Download ${training.title}`}
          >
            {isVideo ? (
              <>
                <Eye size={13} aria-hidden="true" /> View
              </>
            ) : (
              <>
                <Download size={13} aria-hidden="true" /> Download
              </>
            )}
          </a>
        </Button>
      ) : (
        <Badge variant="muted" className="flex-shrink-0 ml-3">
          Coming soon
        </Badge>
      )}
    </div>
  );
}

const TAB_NOTES: Record<Tab, string> = {
  upcoming:
    "Your recruiter will assign training modules as you progress through your journey.",
  completed: "Completed trainings will appear here once you finish assigned modules.",
};

export function CandidateTrainingsList({ trainings }: { trainings: TrainingItem[] }) {
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
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
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
        <Card variant="glass" className="overflow-hidden">
          <EmptyState
            title={`No ${activeTab} trainings`}
            note={TAB_NOTES[activeTab]}
          />
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden" role="list" aria-label={activeTab}>
          {activeList.map((t) => (
            <div key={t.id} role="listitem">
              <TrainingRow training={t} />
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}
