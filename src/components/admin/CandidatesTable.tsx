"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { formatDateTime } from "@/lib/utils/dates";
import { Avatar, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type CandidateRow = {
  id: string;
  fullName: string;
  optType: "OPT" | "STEM_OPT";
  journeyStage: number;
  applicationCount: number;
  lastActivity: Date;
  recruiterEmail: string | null;
};

export function CandidatesTable({ candidates }: { candidates: CandidateRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = candidates.filter((c) =>
    c.fullName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center flex-1 max-w-sm relative">
          <Search
            size={14}
            className="absolute left-3 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="candidate-search" className="sr-only">
            Search candidates by name
          </label>
          <Input
            id="candidate-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <span className="text-xs text-text-muted">
          {filtered.length} of {candidates.length} candidates
        </span>
      </div>

      <Card variant="glass" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 720 }}>
            <thead>
              <tr className="bg-surface/60 border-b border-border-subtle">
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Candidate</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Recruiter</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Journey stage</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Applications</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Last activity</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-xs text-center text-text-muted">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={cn(i > 0 && "border-t border-border-subtle")}
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/candidates/${c.id}`} className="flex items-center gap-2.5">
                        <Avatar name={c.fullName} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{c.fullName}</div>
                          <div className="text-[11px] text-text-muted">
                            {c.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-muted">
                      {c.recruiterEmail ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-primary">
                      {JOURNEY_STEPS[c.journeyStage] ?? `Stage ${c.journeyStage}`}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-primary">
                      {c.applicationCount}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-muted">
                      {formatDateTime(c.lastActivity)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/candidates/${c.id}`}
                        aria-label={`View ${c.fullName}`}
                        className="text-text-muted hover:text-text-primary transition-colors"
                      >
                        <ChevronRight size={15} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
