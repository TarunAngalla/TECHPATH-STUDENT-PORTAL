"use client";

import { ReportEmptyState, ReportSharedLayout } from "@/components/admin/ReportSharedLayout";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/reports/chart";
import { formatReportPercent } from "@/lib/reports/range";
import { DonutChartCard } from "@/components/admin/charts/DonutChartCard";
import { BarChartCard } from "@/components/admin/charts/BarChartCard";

type BreakdownRow = {
  source: string;
  sourceLabel: string;
  count: number;
  pctTotal: number;
  consultations: number;
  consultationsPct: number | null;
  portals: number;
  portalsPct: number | null;
};

type Data = {
  kpis: {
    totalEnquiries: number;
    consultationCompletedPct: number | null;
    portalConvertedPct: number | null;
    uncontacted: number;
  };
  breakdown: BreakdownRow[];
};

function fmtPct(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}

export function EnquirySourceClient({
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
        Source: b.sourceLabel,
        "Total Enquiries": b.count,
        "% of Total": `${b.pctTotal.toFixed(1)}%`,
        "Consultations Completed": b.consultations,
        "Consultation Conv %": b.consultationsPct === null ? "" : `${b.consultationsPct.toFixed(1)}%`,
        "Portal Access": b.portals,
        "Portal Conv %": b.portalsPct === null ? "" : `${b.portalsPct.toFixed(1)}%`,
      })),
      `enquiry-source-report-${range}.csv`,
    );
  };

  const chartData = data.breakdown;

  return (
    <ReportSharedLayout
      title="Enquiry Source Report"
      description="Where enquiries come from and how well each source converts to completed consultations and portal access."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Total Enquiries
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.totalEnquiries}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Consultation Completed
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {fmtPct(data.kpis.consultationCompletedPct)}
          </div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Portal Converted
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {fmtPct(data.kpis.portalConvertedPct)}
          </div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Uncontacted
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.uncontacted}</div>
          <div className="text-[10px] text-text-muted mt-1">Status = new</div>
        </Card>
      </div>

      {data.breakdown.length === 0 ? (
        <ReportEmptyState message="No enquiries in this period. Try Last 90 days or All time." />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutChartCard
              title="Enquiry Distribution"
              subtitle="Breakdown of enquiries by source channel."
              data={chartData}
              dataKey="count"
              nameKey="sourceLabel"
            />
            <BarChartCard
              title="Conversion by Source"
              subtitle="Comparing Enquiries, Consultations, and Portal conversions."
              data={chartData}
              xAxisKey="sourceLabel"
              layout="vertical"
              series={[
                { dataKey: "count", name: "Enquiries", color: "#cbd5e1" },
                { dataKey: "consultations", name: "Consultations", color: "#64748b" },
                { dataKey: "portals", name: "Portal Access", color: "#3b82f6" },
              ]}
            />
          </div>

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Enquiries</th>
                    <th className="px-4 py-3 text-right">% of total</th>
                    <th className="px-4 py-3 text-right">Consult done</th>
                    <th className="px-4 py-3 text-right">Consult %</th>
                    <th className="px-4 py-3 text-right">Portal</th>
                    <th className="px-4 py-3 text-right">Portal %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.breakdown.map((row) => (
                    <tr key={row.source} className="hover:bg-surface/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{row.sourceLabel}</td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">{row.count}</td>
                      <td className="px-4 py-3 text-right text-text-muted">
                        {formatReportPercent(row.count, data.kpis.totalEnquiries)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.consultations}</td>
                      <td className="px-4 py-3 text-right text-brand-600 font-medium">
                        {fmtPct(row.consultationsPct)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">{row.portals}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">
                        {fmtPct(row.portalsPct)}
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
