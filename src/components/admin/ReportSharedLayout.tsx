"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_REPORT_RANGE,
  REPORT_RANGES,
  type ReportRangeKey,
} from "@/lib/reports/range";

type Props = {
  title: string;
  description: string;
  range?: string;
  rangeLabel?: string;
  onExport?: () => void;
  children: React.ReactNode;
};

const RANGE_LABELS: Record<ReportRangeKey, string> = {
  this_week: "This week",
  last_30_days: "Last 30 days",
  last_90_days: "Last 90 days",
  all_time: "All time",
};

export function ReportSharedLayout({
  title,
  description,
  range = DEFAULT_REPORT_RANGE,
  rangeLabel,
  onExport,
  children,
}: Props) {
  const active = (REPORT_RANGES as readonly string[]).includes(range)
    ? (range as ReportRangeKey)
    : DEFAULT_REPORT_RANGE;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10 min-w-0 w-full">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/reports"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors w-fit"
        >
          <ArrowLeft size={14} /> All reports
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{title}</h1>
            <p className="text-sm text-text-muted mt-1 max-w-2xl">{description}</p>
            {rangeLabel && (
              <p className="text-[11px] font-semibold text-text-muted mt-2">{rangeLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <div className="flex flex-wrap bg-surface rounded-xl p-1 text-[11px] font-semibold">
              {REPORT_RANGES.map((key) => (
                <Link
                  key={key}
                  href={`?range=${key}`}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                    active === key
                      ? "bg-white shadow-xs text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {RANGE_LABELS[key]}
                </Link>
              ))}
            </div>
            {onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                size="sm"
                className="text-xs bg-white border-border-strong/50 shadow-xs"
              >
                <Download size={13} className="mr-1.5" /> Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-5 min-w-0">{children}</div>
    </div>
  );
}

export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong/50 bg-white px-6 py-10 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
