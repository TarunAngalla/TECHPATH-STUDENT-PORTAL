"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building,
  Send,
  Compass,
  Clock,
  Circle
} from "lucide-react";
import { StaggerChildren, StaggerItem } from "@/components/motion/PageTransition";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import type { Application, MarketingStatus } from "@/lib/db/schema";
import { MARKETING_STATUS_LABELS } from "@/lib/constants/marketing";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const STAGE_INFO: Record<number, { title: string; nextAction: string }> = {
  0: {
    title: JOURNEY_STEPS[0],
    nextAction: "Finish assigned trainings and keep your contact details current.",
  },
  1: {
    title: JOURNEY_STEPS[1],
    nextAction: "Message your recruiter if you haven’t introduced yourself yet.",
  },
  2: {
    title: JOURNEY_STEPS[2],
    nextAction: "Watch Interviews, Assessments, and Announcements for updates.",
  },
  3: {
    title: JOURNEY_STEPS[3],
    nextAction: "Review upcoming interviews and complete assigned assessments.",
  },
};

export function CandidateProgressPage({
  journeyStage,
  applications,
  journeyEvents,
  marketingStatus,
  createdAt,
}: {
  journeyStage: number;
  applications: Application[];
  journeyEvents: {
    id: string;
    stage: number;
    previousStage: number | null;
    eventType: string;
    source: string;
    note: string | null;
    occurredAt: Date | string;
  }[];
  marketingStatus: MarketingStatus;
  createdAt: Date | string;
}) {
  const stage = STAGE_INFO[journeyStage] ?? STAGE_INFO[0];
  const uniqueCompanies = new Set(applications.map((a) => a.companyName)).size;

  const timeline = JOURNEY_STEPS.map((label, i) => {
    const stageEvents = journeyEvents.filter((event) => event.stage === i);
    const latestEvent = stageEvents.at(-1);
    const done = i < journeyStage;
    const active = i === journeyStage;

    return {
      label,
      date: latestEvent
        ? formatDate(latestEvent.occurredAt)
        : i === 0 && journeyStage === 0 && journeyEvents.length === 0
          ? formatDate(createdAt)
          : "Not started",
      duration: active ? "Current stage" : done && latestEvent ? "Complete" : null,
      note: latestEvent?.note?.trim() || (latestEvent ? "Stage update recorded." : "Not started yet."),
      done: Boolean(latestEvent) || active,
      active,
    };
  });

  const statTiles = [
    { value: uniqueCompanies, label: "Companies in Pipeline", icon: Building, iconColor: "text-brand-500 bg-brand-50 border border-brand-100" },
    { value: applications.length, label: "Applications Submitted", icon: Send, iconColor: "text-success bg-green-50 border border-green-100" },
    { value: MARKETING_STATUS_LABELS[marketingStatus], label: "Marketing Status", icon: Compass, iconColor: "text-purple-600 bg-purple-50 border border-purple-100" },
  ];

  return (
    <section aria-labelledby="progress-heading" className="grid gap-6">
      <h2 id="progress-heading" className="sr-only">
        My progress
      </h2>


      <Card variant="glass" className="col-span-full bg-brand-50/15 border border-brand-500/20 rounded-2xl p-6 shadow-xs">
        <span className="text-[10px] font-semibold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Current stage
        </span>
        <h3 className="text-base font-bold text-text-primary mt-2">{stage.title}</h3>
        <p className="text-xs text-text-muted mt-1.5">{stage.nextAction}</p>
      </Card>

      {/* Stat grid */}
      <StaggerChildren className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statTiles.map((tile) => (
          <StaggerItem key={tile.label}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Card variant="glass" className="p-5 flex items-center justify-between bg-white border border-border-strong/50 shadow-xs rounded-2xl">
                <div>
                  <div className="text-xs text-text-muted font-medium">{tile.label}</div>
                  <div className="text-2xl font-bold text-text-primary mt-1">{tile.value}</div>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", tile.iconColor)}>
                  <tile.icon size={18} />
                </div>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* Journey Timeline */}
      <Card variant="glass" className="col-span-full bg-white border border-border-strong/50 shadow-xs p-6 rounded-2xl">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-base font-bold text-text-primary">Journey Timeline & History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative pl-6 space-y-6" role="list" aria-label="Journey timeline">
            
            {/* Vertical timeline line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border-strong/60" aria-hidden="true" />

            {timeline.map((s, i) => (
              <motion.div
                key={s.label}
                className="relative flex gap-4"
                role="listitem"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              >
                
                {/* Checkmark circle badge */}
                <div
                  className={cn(
                    "absolute -left-[22px] top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm z-10",
                    s.active
                      ? "bg-brand-500 text-white"
                      : s.done
                      ? "bg-success text-white"
                      : "bg-surface border border-border-strong text-text-muted"
                  )}
                  aria-hidden="true"
                >
                  {s.done || s.active ? <CheckCircle2 size={11} /> : <Circle size={8} className="fill-text-muted/20" />}
                </div>

                <div className="flex-1 bg-surface/30 border border-border-subtle p-4 rounded-xl hover:border-border-strong transition-all duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-sm font-bold text-text-primary">{s.label}</div>
                    {s.duration && (
                      <Badge variant={s.active ? "accent" : "success"} className="text-[9px] px-1.5 py-0.5 rounded-full">
                        {s.duration}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-brand-500 font-semibold mt-1 flex items-center gap-1">
                    <Clock size={11} /> {s.date}
                  </div>
                  <div className="text-xs text-text-muted mt-2 leading-relaxed">{s.note}</div>
                </div>

              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
