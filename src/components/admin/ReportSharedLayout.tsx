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

export type ReportInsight = {
  label: string;
  value: string | number;
  hint?: string;
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
    <div className="max-w-6xl mx-auto space-y-8 pb-12 min-w-0 w-full">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/reports"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors w-fit"
        >
          <ArrowLeft size={14} /> All reports
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 min-w-0">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
            <p className="text-sm text-text-muted max-w-2xl leading-relaxed">{description}</p>
            {rangeLabel && (
              <p className="text-xs font-medium text-text-muted pt-1">{rangeLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <div className="flex flex-wrap bg-surface rounded-xl p-1 text-xs font-semibold">
              {REPORT_RANGES.map((key) => (
                <Link
                  key={key}
                  href={`?range=${key}`}
                  className={`px-3 py-2 rounded-lg transition-colors ${
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
                className="text-xs bg-white border-border-strong/50 shadow-xs h-10"
              >
                <Download size={14} className="mr-1.5" /> Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-8 min-w-0">{children}</div>
    </div>
  );
}

/** 1–2 prominent insight stats — not a KPI wall, not muted inline text. */
export function ReportInsightStats({ items }: { items: ReportInsight[] }) {
  const visible = items.slice(0, 2);
  if (visible.length === 0) return null;

  return (
    <div className={`grid gap-4 min-w-0 ${visible.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 sm:grid-cols-2"}`}>
      {visible.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border-strong/40 bg-white px-6 py-5 shadow-xs min-w-0"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {item.label}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-text-primary tabular-nums">
            {item.value}
          </div>
          {item.hint && (
            <p className="mt-2 text-sm text-text-muted leading-snug">{item.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong/50 bg-white px-8 py-14 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
