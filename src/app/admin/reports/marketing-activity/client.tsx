"use client";

import Link from "next/link";
import {
  ReportEmptyState,
  ReportInsightStats,
  ReportSharedLayout,
} from "@/components/admin/ReportSharedLayout";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/reports/chart";
import { formatDateTime } from "@/lib/utils/dates";
import { BarChartCard } from "@/components/admin/charts/BarChartCard";

type Row = {
  candidateId: string;
  candidateName: string;
  recruiterName: string;
  applications: number;
  lifetimeApplications: number;
  interviews: number;
  assessments: number;
  marketingStatus: string;
  lastActivityDate: string | null;
  needsAttention: boolean;
};

type Data = {
  kpis: {
    applications: number;
    interviews: number;
    assessments: number;
    needsAttention: number;
  };
  breakdown: Row[];
};

function statusVariant(status: string): "success" | "warning" | "muted" | "accent" {
  if (status === "live") return "success";
  if (status === "ready") return "accent";
  if (status === "paused") return "warning";
  return "muted";
}

export function MarketingActivityClient({
  data,
  range,
  rangeLabel,
}: {
  data: Data;
  range: string;
  rangeLabel: string;
}) {
  const handleExport = () => {
    downloadCsv(
      data.breakdown.map((b) => ({
        Candidate: b.candidateName,
        Recruiter: b.recruiterName,
        "Marketing status": b.marketingStatus,
        "Apps (period)": b.applications,
        "Apps (lifetime)": b.lifetimeApplications,
        Interviews: b.interviews,
        Assessments: b.assessments,
        "Needs attention": b.needsAttention ? "Yes" : "No",
        "Last activity": b.lastActivityDate ?? "",
      })),
      `marketing-activity-report-${range}.csv`,
    );
  };

  const chartRows = data.breakdown
    .filter((b) => b.applications + b.interviews + b.assessments > 0 || b.needsAttention)
    .slice(0, 15)
    .map((b) => ({
      name: b.candidateName.length > 14 ? `${b.candidateName.slice(0, 12)}…` : b.candidateName,
      Applications: b.applications,
      Interviews: b.interviews,
      Assessments: b.assessments,
    }));

  return (
    <ReportSharedLayout
      title="Marketing Activity Report"
      description="Placement activity and candidates needing apps."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      {data.breakdown.length === 0 ? (
        <ReportEmptyState message="No marketing activity in this period." />
      ) : (
        <>
          {chartRows.length > 0 ? (
            <BarChartCard
              title="Activity by candidate"
              data={chartRows}
              xAxisKey="name"
              layout="horizontal"
              series={[
                { dataKey: "Applications", name: "Applications", stackId: "a", color: "#cbd5e1" },
                { dataKey: "Interviews", name: "Interviews", stackId: "a", color: "#64748b" },
                { dataKey: "Assessments", name: "Assessments", stackId: "a", color: "#1e293b" },
              ]}
            />
          ) : null}

          <ReportInsightStats
            items={[
              {
                label: "Needs attention",
                value: data.kpis.needsAttention,
              },
              {
                label: "Interviews in period",
                value: data.kpis.interviews,
              },
            ]}
          />

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Recruiter</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Apps</th>
                    <th className="px-5 py-3.5 text-right">Interviews</th>
                    <th className="px-5 py-3.5 text-right">Assessments</th>
                    <th className="px-5 py-3.5">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.breakdown.map((row) => (
                    <tr
                      key={row.candidateId}
                      className={`hover:bg-surface/30 transition-colors ${
                        row.needsAttention ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        <Link
                          href={`/admin/candidates/${row.candidateId}`}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {row.candidateName}
                        </Link>
                        {row.needsAttention && (
                          <span className="ml-2 text-xs font-semibold text-amber-700">Needs apps</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-text-muted">{row.recruiterName}</td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(row.marketingStatus)} className="text-[10px] capitalize">
                          {row.marketingStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">
                        {row.applications}
                        <span className="text-text-muted/60"> / {row.lifetimeApplications}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.interviews}</td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.assessments}</td>
                      <td className="px-5 py-4 text-text-muted">
                        {row.lastActivityDate ? formatDateTime(row.lastActivityDate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </ReportSharedLayout>
  );
}
