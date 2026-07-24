"use client";

import {
  ReportEmptyState,
  ReportInsightStats,
  ReportSharedLayout,
} from "@/components/admin/ReportSharedLayout";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/reports/chart";
import { BarChartCard } from "@/components/admin/charts/BarChartCard";

type Row = {
  recruiterId: string;
  recruiterName: string;
  displayName: string;
  bookSize: number;
  assignedInPeriod: number;
  marketingLive: number;
  applications: number;
  interviews: number;
  assessments: number;
  offers: number;
};

type Data = {
  kpis: {
    activeRecruiters: number;
    candidatesAssignedPeriod: number;
    interviewsPeriod: number;
    offersHired: number;
  };
  breakdown: Row[];
};

export function RecruiterPerformanceClient({
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
        Recruiter: b.displayName,
        Email: b.recruiterName,
        "Current book": b.bookSize,
        "Assigned in period": b.assignedInPeriod,
        "Marketing live": b.marketingLive,
        Applications: b.applications,
        Interviews: b.interviews,
        Assessments: b.assessments,
        "Offers / Hired": b.offers,
      })),
      `recruiter-performance-report-${range}.csv`,
    );
  };

  const zeroInterviewRecruiters = data.breakdown.filter(
    (r) => r.bookSize > 0 && r.interviews === 0,
  ).length;
  const chartData = data.breakdown.map((b) => ({
    name: b.displayName,
    Assigned: b.assignedInPeriod,
    Apps: b.applications,
    Interviews: b.interviews,
  }));

  return (
    <ReportSharedLayout
      title="Recruiter Performance Report"
      description="Assignments, apps, and interviews by recruiter."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      {data.breakdown.length === 0 ? (
        <ReportEmptyState message="No recruiter activity in this period." />
      ) : (
        <>
          <BarChartCard
            title="Recruiter activity"
            data={chartData}
            xAxisKey="name"
            layout="horizontal"
            series={[
              { dataKey: "Assigned", name: "Assigned", color: "#cbd5e1" },
              { dataKey: "Apps", name: "Applications", color: "#64748b" },
              { dataKey: "Interviews", name: "Interviews", color: "#3b82f6" },
            ]}
          />

          <ReportInsightStats
            items={[
              {
                label: "Offers / Hired",
                value: data.kpis.offersHired,
              },
              {
                label: "Recruiters with 0 interviews",
                value: zeroInterviewRecruiters,
              },
            ]}
          />

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3.5">Recruiter</th>
                    <th className="px-5 py-3.5 text-right">Book</th>
                    <th className="px-5 py-3.5 text-right">Assigned</th>
                    <th className="px-5 py-3.5 text-right">Live</th>
                    <th className="px-5 py-3.5 text-right">Apps</th>
                    <th className="px-5 py-3.5 text-right">Interviews</th>
                    <th className="px-5 py-3.5 text-right">Assessments</th>
                    <th className="px-5 py-3.5 text-right">Offers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.breakdown.map((row) => (
                    <tr
                      key={row.recruiterId}
                      className={`hover:bg-surface/30 transition-colors ${
                        row.interviews === 0 && row.bookSize > 0 ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 flex-shrink-0">
                            {row.displayName.slice(0, 1)}
                          </span>
                          <span className="truncate">{row.displayName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.bookSize}</td>
                      <td className="px-5 py-4 text-right font-medium text-text-primary">
                        {row.assignedInPeriod}
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.marketingLive}</td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.applications}</td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.interviews}</td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.assessments}</td>
                      <td
                        className={`px-5 py-4 text-right font-medium ${
                          row.offers > 0 ? "text-green-700" : "text-text-muted"
                        }`}
                      >
                        {row.offers}
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
