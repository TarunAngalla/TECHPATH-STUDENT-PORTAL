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
  avatarUrl?: string | null;
};

export function CandidatesTable({
  candidates,
  scopedToRecruiter = false,
  initialQuery = "",
}: {
  candidates: CandidateRow[];
  scopedToRecruiter?: boolean;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = candidates.filter((c) =>
    c.fullName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {scopedToRecruiter ? "My candidates" : "All candidates"}
          </p>
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
              className="pl-9 h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-text-muted">
          {filtered.length} of {candidates.length} candidates
        </span>
      </div>

      <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/55 shadow-xs rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]" aria-label="Candidates list">
            <thead>
              <tr className="bg-surface/50 border-b border-border-strong/50">
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Candidate</th>
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Recruiter</th>
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Journey Stage</th>
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Applications</th>
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Last Activity</th>
                <th scope="col" className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-xs font-semibold text-center text-text-muted bg-white">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border-subtle align-middle transition-colors hover:bg-surface/30 bg-white"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/admin/candidates/${c.id}?tab=Messages`} className="flex items-center gap-3">
                        <Avatar
                          name={c.fullName}
                          src={c.avatarUrl}
                          size="sm"
                          className="shadow-xs border border-border-strong/30"
                        />
                        <div>
                          <div className="text-sm font-bold text-text-primary leading-tight">{c.fullName}</div>
                          <span className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold mt-1 border",
                            c.optType === "STEM_OPT"
                              ? "bg-purple-50 text-purple-600 border-purple-100/50"
                              : "bg-blue-50 text-blue-600 border-blue-100/50"
                          )}>
                            {c.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-text-muted">
                      {c.recruiterEmail ?? "Unassigned"}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-text-primary">
                      {JOURNEY_STEPS[c.journeyStage] ?? `Stage ${c.journeyStage}`}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-text-primary">
                      {c.applicationCount}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-text-muted">
                      {formatDateTime(c.lastActivity)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/candidates/${c.id}?tab=Messages`}
                        aria-label={`Open messages for ${c.fullName}`}
                        className="inline-flex items-center justify-center text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-surface rounded-lg border border-transparent hover:border-border-strong/30"
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
