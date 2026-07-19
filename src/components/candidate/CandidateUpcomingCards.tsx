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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import type { Application } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils/dates";
import { downloadInterviewICS, getGoogleCalendarLink } from "@/lib/utils/ics";
import { cn } from "@/lib/utils/cn";

function PrepNotes({ prep }: { prep: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        aria-expanded={expanded}
      >
        Prep Notes
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="mt-2 p-3.5 rounded-xl bg-surface border border-border-strong/30 text-xs text-text-muted leading-relaxed font-medium">
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
      <p id="upcoming-heading" className="text-xs mb-5 text-text-muted font-medium">
        Everything currently scheduled, across all your applications, in date order.
      </p>

      {upcoming.length === 0 ? (
        <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <EmptyState
            title="Nothing scheduled right now"
            note="Once your recruiter books an interview or HR call, it will appear here automatically."
          />
        </Card>
      ) : (
        <div className="relative pl-8" role="list" aria-label="Upcoming interviews and calls">
          <div
            className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-border-strong/60"
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
                className="absolute -left-7 top-[18px] w-4.5 h-4.5 rounded-full bg-brand-500 ring-4 ring-white shadow-sm flex items-center justify-center text-white"
                aria-hidden="true"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              <Card variant="glass" className="p-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl transition-all duration-200 hover:border-border-strong">
                <div className="flex items-start justify-between mb-2 gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CompanyBadge name={app.companyName} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-text-primary truncate leading-tight">
                        {app.companyName}
                      </div>
                      <div className="text-xs text-text-muted truncate mt-0.5 font-medium">{app.upcomingLabel}</div>
                    </div>
                  </div>
                  <StatusPill status={app.status} />
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-muted mt-3.5 font-medium">
                  <span className="flex items-center gap-1.5 text-brand-500 font-semibold">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs border border-border-strong/40 hover:bg-surface bg-white shadow-xs"
                        aria-label={`Add ${app.companyName} interview to calendar`}
                      >
                        <CalendarCheck size={13} className="mr-1.5" aria-hidden="true" /> Add to calendar <ChevronDown size={12} className="ml-1 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleCalendarDownload(app)}>
                        <span>Download iCal (.ics)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getGoogleCalendarLink({
                            companyName: app.companyName,
                            upcomingLabel: app.upcomingLabel,
                            upcomingWhen: app.upcomingWhen,
                            upcomingPrep: app.upcomingPrep,
                          });
                          if (url) window.open(url, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <span>Add to Google Calendar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
