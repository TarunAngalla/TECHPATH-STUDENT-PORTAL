"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { StaggerChildren, StaggerItem } from "@/components/motion/PageTransition";
import { JourneyBar } from "@/components/shared/JourneyBar";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import type { Application } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils/dates";

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
    { value: uniqueCompanies, label: "Companies in your pipeline" },
    { value: applications.length, label: "Applications submitted so far" },
    { value: journeyStage + 1, label: `Journey stage (of ${JOURNEY_STEPS.length})` },
  ];

  return (
    <section aria-labelledby="progress-heading" className="grid gap-4 md:gap-6">
      <h2 id="progress-heading" className="sr-only">
        My progress
      </h2>

      <Card variant="glass" className="col-span-full">
        <CardHeader>
          <CardTitle>Your marketing journey</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-8">
          <JourneyBar current={journeyStage} big />
        </CardContent>
      </Card>

      <Card variant="glass" className="col-span-full bg-brand-50/50">
        <CardHeader>
          <CardTitle>Where you are right now: {stage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-muted mb-4">{stage.meaning}</p>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-elevated border border-border-subtle">
            <CheckCircle2
              size={14}
              className="text-brand-500 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <div className="text-xs font-medium mb-0.5 text-text-primary">What you should do</div>
              <p className="text-xs text-text-muted">{stage.nextAction}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <StaggerChildren className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statTiles.map((tile) => (
          <StaggerItem key={tile.label}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card variant="solid" hover="lift" className="p-4 text-center">
                <div className="text-xl font-semibold text-text-primary">{tile.value}</div>
                <div className="text-[11px] mt-1 text-text-muted">{tile.label}</div>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      <Card variant="glass" className="col-span-full">
        <CardHeader>
          <CardTitle>Journey timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5" role="list" aria-label="Journey timeline">
            {timeline.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex gap-4"
                role="listitem"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      s.done ? "bg-success" : "bg-border-strong"
                    }`}
                    aria-hidden="true"
                  />
                  {i < timeline.length - 1 && (
                    <div
                      className="w-0.5 flex-1 mt-1 bg-border-subtle"
                      style={{ minHeight: 30 }}
                    />
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-text-primary">{s.label}</div>
                    {s.duration && (
                      <Badge variant={s.active ? "accent" : "muted"}>{s.duration}</Badge>
                    )}
                  </div>
                  <div className="text-xs mb-1 text-brand-500">{s.date}</div>
                  <div className="text-xs text-text-muted">{s.note}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="col-span-full text-center">
        <Link
          href="/messages"
          className="text-xs font-medium text-brand-500 hover:text-brand-600"
        >
          Questions about your timeline? Message your recruiter →
        </Link>
      </div>
    </section>
  );
}
