"use client";

import Link from "next/link";
import { ReportEmptyState, ReportSharedLayout } from "@/components/admin/ReportSharedLayout";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/reports/chart";
import { formatDateTime } from "@/lib/utils/dates";
import { BarChartCard } from "@/components/admin/charts/BarChartCard";
import { DonutChartCard } from "@/components/admin/charts/DonutChartCard";

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
    .filter((b) => b.applications + b.interviews + b.assessments > 0)
    .slice(0, 15)
    .map((b) => ({
      name: b.candidateName.length > 14 ? `${b.candidateName.slice(0, 12)}…` : b.candidateName,
      Applications: b.applications,
      Interviews: b.interviews,
      Assessments: b.assessments,
    }));

  const statusCounts = data.breakdown.reduce((acc, row) => {
    const s = row.marketingStatus || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const donutData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return (
    <ReportSharedLayout
      title="Marketing Activity Report"
      description="Applications, interviews, and assessments in this period — plus marketing-live candidates with zero applications."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Applications (period)
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.applications}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Interviews (period)
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.interviews}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Assessments (period)
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.assessments}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Needs attention
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.needsAttention}</div>
          <div className="text-[10px] text-text-muted mt-1">Live with 0 apps</div>
        </Card>
      </div>

      {data.breakdown.length === 0 ? (
        <ReportEmptyState message="No marketing activity in this period." />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
            <div className="lg:col-span-1 min-w-0">
              <DonutChartCard
                title="Marketing Status"
                subtitle="Distribution of candidates by current status."
                data={donutData}
                dataKey="count"
                nameKey="status"
              />
            </div>
            <div className="lg:col-span-2 min-w-0">
              <BarChartCard
                title="Activity Volume by Candidate (Top 15)"
                subtitle="Breakdown of applications, interviews, and assessments."
                data={chartRows}
                xAxisKey="name"
                layout="horizontal"
                series={[
                  { dataKey: "Applications", name: "Applications", stackId: "a", color: "#cbd5e1" },
                  { dataKey: "Interviews", name: "Interviews", stackId: "a", color: "#64748b" },
                  { dataKey: "Assessments", name: "Assessments", stackId: "a", color: "#1e293b" },
                ]}
              />
            </div>
          </div>

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Recruiter</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Apps</th>
                    <th className="px-4 py-3 text-right">Interviews</th>
                    <th className="px-4 py-3 text-right">Assessments</th>
                    <th className="px-4 py-3">Last activity</th>
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
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        <Link
                          href={`/admin/candidates/${row.candidateId}`}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {row.candidateName}
                        </Link>
                        {row.needsAttention && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-700">Needs apps</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{row.recruiterName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(row.marketingStatus)} className="text-[9px] capitalize">
                          {row.marketingStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">
                        {row.applications}
                        <span className="text-text-muted/60"> / {row.lifetimeApplications}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.interviews}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.assessments}</td>
                      <td className="px-4 py-3 text-text-muted">
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
