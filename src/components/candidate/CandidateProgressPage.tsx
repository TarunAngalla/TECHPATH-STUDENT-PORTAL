"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building,
  Send,
  Compass,
  ChevronRight,
  Clock,
  Circle
} from "lucide-react";
import { StaggerChildren, StaggerItem } from "@/components/motion/PageTransition";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import type { Application } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const STAGE_INFO: Record<
  number,
  { title: string; meaning: string; nextAction: string }
> = {
  0: {
    title: JOURNEY_STEPS[0],
    meaning:
      "You're completing initial training and profile setup with your recruiter. This stage covers resume positioning and getting your candidate profile ready for marketing.",
    nextAction:
      "Finish any assigned training modules and make sure your contact details are up to date under Settings.",
  },
  1: {
    title: JOURNEY_STEPS[1],
    meaning:
      "A dedicated recruiter has been assigned to guide your job search. They'll review your profile and prepare it for submission to partner companies.",
    nextAction:
      "Introduce yourself via Messages if you haven't already. Your recruiter will reach out with next steps.",
  },
  2: {
    title: JOURNEY_STEPS[2],
    meaning:
      "Your profile is now live and being actively submitted to open roles by your recruiter and their partner network. This is usually the longest stage — most candidates are here for several weeks while applications and first-round conversations build up.",
    nextAction:
      "Nothing required from you right now beyond staying reachable. Watch for interview requests under Upcoming, and keep an eye on Applications in case a company sends a take-home task.",
  },
  3: {
    title: JOURNEY_STEPS[3],
    meaning:
      "You're in active interview and assessment stages with one or more companies. Your recruiter is coordinating scheduling and prep notes for each round.",
    nextAction:
      "Review upcoming interviews under Upcoming, complete any assigned assessments, and keep your recruiter updated via Messages.",
  },
};

export function CandidateProgressPage({
  journeyStage,
  applications,
  createdAt,
}: {
  journeyStage: number;
  applications: Application[];
  createdAt: Date | string;
}) {
  const stage = STAGE_INFO[journeyStage] ?? STAGE_INFO[0];
  const uniqueCompanies = new Set(applications.map((a) => a.companyName)).size;

  const timeline = JOURNEY_STEPS.map((label, i) => {
    const done = i < journeyStage;
    const active = i === journeyStage;
    let date = "Not started";
    let note = "";

    if (i === 0) {
      date = formatDate(createdAt);
      note = done ? "Completed resume and profile training with your recruiter." : "In progress.";
    } else if (i === 1) {
      date = journeyStage >= 1 ? formatDate(createdAt) : "Not started";
      note = journeyStage >= 1 ? "Recruiter assigned to your profile." : "Waiting for recruiter assignment.";
    } else if (i === 2) {
      date = journeyStage >= 2 ? formatDate(createdAt) : "Not started";
      note =
        journeyStage >= 2
          ? `Your profile went live with ${uniqueCompanies || "several"} companies in the pipeline.`
          : "Begins once marketing launches.";
    } else if (i === 3) {
      const hasInterview = applications.some((a) =>
        ["interview_r1", "interview_r2", "interview_r3", "hr_round", "final_round", "offer"].includes(
          a.status,
        ),
      );
      date = hasInterview ? "In progress" : "Not started";
      note = hasInterview
        ? "Active interviews and assessments underway."
        : "Begins once you have a confirmed first interview.";
    }

    return {
      label,
      date,
      duration: active ? "Current stage" : done ? "Complete" : null,
      note,
      done: done || active,
      active,
    };
  });

  const statTiles = [
    { value: uniqueCompanies, label: "Companies in Pipeline", icon: Building, iconColor: "text-brand-500 bg-brand-50 border border-brand-100" },
    { value: applications.length, label: "Applications Submitted", icon: Send, iconColor: "text-success bg-green-50 border border-green-100" },
    { value: `${journeyStage + 1} / ${JOURNEY_STEPS.length}`, label: "Current Stage", icon: Compass, iconColor: "text-purple-600 bg-purple-50 border border-purple-100" },
  ];

  return (
    <section aria-labelledby="progress-heading" className="grid gap-6">
      <h2 id="progress-heading" className="sr-only">
        My progress
      </h2>


      {/* Highlight Where You Are Card */}
      <Card variant="glass" className="col-span-full bg-brand-50/15 border border-brand-500/20 rounded-2xl p-6 shadow-xs">
        <span className="text-[10px] font-semibold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Current Status</span>
        <h3 className="text-base font-bold text-text-primary mt-2">Active Stage: {stage.title}</h3>
        <p className="text-xs text-text-muted mt-1.5 max-w-3xl leading-relaxed">{stage.meaning}</p>
        
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border-strong/50 shadow-xs mt-4">
          <CheckCircle2
            size={16}
            className="text-success mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <div className="text-xs font-bold text-text-primary">Recommended Actions</div>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">{stage.nextAction}</p>
          </div>
        </div>
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

      {/* Footer recruiter help message */}
      <div className="col-span-full text-center py-2">
        <Link
          href="/messages"
          className="text-xs font-semibold text-brand-500 hover:underline inline-flex items-center gap-1"
        >
          Have questions about your placement timeline? Contact Recruiter <ChevronRight size={13} />
        </Link>
      </div>
    </section>
  );
}
