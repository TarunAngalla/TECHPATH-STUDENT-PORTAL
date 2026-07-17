"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, ChevronDown, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { CompanyBadge } from "@/components/shared/CompanyBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Application } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils/dates";
import { downloadInterviewICS } from "@/lib/utils/ics";
import { cn } from "@/lib/utils/cn";

function PrepNotes({ prep }: { prep: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        aria-expanded={expanded}
      >
        Prep notes
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="mt-2 p-3 rounded-xl bg-surface/80 text-xs text-text-muted leading-relaxed">
              {prep}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function handleCalendarDownload(app: Application) {
  downloadInterviewICS({
    companyName: app.companyName,
    upcomingLabel: app.upcomingLabel,
    upcomingWhen: app.upcomingWhen,
    upcomingPrep: app.upcomingPrep,
  });
  toast.success("Added to calendar", {
    description: `${app.companyName} — ${app.upcomingLabel}`,
  });
}

export function CandidateUpcomingCards({ applications }: { applications: Application[] }) {
  const upcoming = applications.filter((a) => a.upcomingWhen && a.upcomingLabel);

  return (
    <section aria-labelledby="upcoming-heading">
      <p id="upcoming-heading" className="text-xs mb-4 text-text-muted">
        Everything currently scheduled, across all your applications, in date order.
      </p>

      {upcoming.length === 0 ? (
        <Card variant="glass" className="overflow-hidden">
          <EmptyState
            title="Nothing scheduled right now"
            note="Once your recruiter books an interview or HR call, it will appear here automatically."
          />
        </Card>
      ) : (
        <div className="relative pl-8" role="list" aria-label="Upcoming interviews and calls">
          <div
            className="absolute left-3 top-2 bottom-2 w-px bg-border-strong"
            aria-hidden="true"
          />

          {upcoming.map((app, i) => (
            <article
              key={app.id}
              role="listitem"
              className={cn("relative", i < upcoming.length - 1 && "pb-6")}
              aria-label={`${app.companyName}: ${app.upcomingLabel}`}
            >
              <div
                className="absolute -left-5 top-5 w-3 h-3 rounded-full brand-gradient ring-4 ring-surface"
                aria-hidden="true"
              />

              <Card variant="glass" hover="lift" className="p-5">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyBadge name={app.companyName} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {app.companyName}
                      </div>
                      <div className="text-xs text-text-muted truncate">{app.upcomingLabel}</div>
                    </div>
                  </div>
                  <StatusPill status={app.status} />
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted mt-3">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} aria-hidden="true" /> {formatDateTime(app.upcomingWhen)}
                  </span>
                  {app.upcomingWithPerson && (
                    <span className="flex items-center gap-1.5">
                      <Users size={13} aria-hidden="true" /> {app.upcomingWithPerson}
                    </span>
                  )}
                </div>

                {app.upcomingPrep && <PrepNotes prep={app.upcomingPrep} />}

                <div className="mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCalendarDownload(app)}
                    aria-label={`Add ${app.companyName} interview to calendar`}
                  >
                    <CalendarCheck size={13} aria-hidden="true" /> Add to calendar
                  </Button>
                </div>
              </Card>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
