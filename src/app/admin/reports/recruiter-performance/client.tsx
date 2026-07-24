"use client";

import { ReportEmptyState, ReportSharedLayout } from "@/components/admin/ReportSharedLayout";
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

  const chartData = data.breakdown.map((b) => ({
    name: b.displayName,
    Assigned: b.assignedInPeriod,
    Live: b.marketingLive,
    Apps: b.applications,
    Interviews: b.interviews,
    Assessments: b.assessments,
    Offers: b.offers,
  }));

  return (
    <ReportSharedLayout
      title="Recruiter Performance Report"
      description="Assignments in this period, plus applications and interviews against each recruiter’s current book."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Recruiters with activity
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.activeRecruiters}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Assigned in period
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {data.kpis.candidatesAssignedPeriod}
          </div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Interviews in period
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.interviewsPeriod}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Offers / Hired
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.offersHired}</div>
        </Card>
      </div>

      {data.breakdown.length === 0 ? (
        <ReportEmptyState message="No recruiter activity in this period." />
      ) : (
        <>
          <BarChartCard
            title="Recruiter Activity Comparison"
            subtitle="Comparing candidate volume, applications, and placement stages per recruiter."
            data={chartData}
            xAxisKey="name"
            layout="horizontal"
            series={[
              { dataKey: "Assigned", name: "Assigned", color: "#cbd5e1" },
              { dataKey: "Live", name: "Marketing Live", color: "#94a3b8" },
              { dataKey: "Apps", name: "Applications", color: "#64748b" },
              { dataKey: "Interviews", name: "Interviews", color: "#475569" },
              { dataKey: "Assessments", name: "Assessments", color: "#1e293b" },
              { dataKey: "Offers", name: "Offers", color: "#3b82f6" },
            ]}
          />

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th className="px-4 py-3">Recruiter</th>
                    <th className="px-4 py-3 text-right">Book</th>
                    <th className="px-4 py-3 text-right">Assigned</th>
                    <th className="px-4 py-3 text-right">Live</th>
                    <th className="px-4 py-3 text-right">Apps</th>
                    <th className="px-4 py-3 text-right">Interviews</th>
                    <th className="px-4 py-3 text-right">Assessments</th>
                    <th className="px-4 py-3 text-right">Offers</th>
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
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700 flex-shrink-0">
                            {row.displayName.slice(0, 1)}
                          </span>
                          <span className="truncate">{row.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.bookSize}</td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">
                        {row.assignedInPeriod}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.marketingLive}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.applications}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.interviews}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.assessments}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">{row.offers}</td>
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
