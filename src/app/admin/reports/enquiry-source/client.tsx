"use client";

import {
  ReportEmptyState,
  ReportInsightStats,
  ReportSharedLayout,
} from "@/components/admin/ReportSharedLayout";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/reports/chart";
import { formatReportPercent } from "@/lib/reports/range";
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

  return (
    <ReportSharedLayout
      title="Enquiry Source Report"
      description="Enquiry volume and conversion by source."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      {data.breakdown.length === 0 ? (
        <ReportEmptyState message="No enquiries in this period. Try Last 90 days or All time." />
      ) : (
        <>
          <BarChartCard
            title="Conversion by source"
            data={data.breakdown}
            xAxisKey="sourceLabel"
            layout="vertical"
            series={[
              { dataKey: "count", name: "Enquiries", color: "#cbd5e1" },
              { dataKey: "consultations", name: "Consult done", color: "#64748b" },
              { dataKey: "portals", name: "Portal access", color: "#3b82f6" },
            ]}
          />

          <ReportInsightStats
            items={[
              {
                label: "Uncontacted",
                value: data.kpis.uncontacted,
              },
              {
                label: "Consultation completed",
                value: fmtPct(data.kpis.consultationCompletedPct),
              },
            ]}
          />

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3.5">Source</th>
                    <th className="px-5 py-3.5 text-right">Enquiries</th>
                    <th className="px-5 py-3.5 text-right">% of total</th>
                    <th className="px-5 py-3.5 text-right">Consult done</th>
                    <th className="px-5 py-3.5 text-right">Consult %</th>
                    <th className="px-5 py-3.5 text-right">Portal</th>
                    <th className="px-5 py-3.5 text-right">Portal %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.breakdown.map((row) => (
                    <tr key={row.source} className="hover:bg-surface/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-text-primary">{row.sourceLabel}</td>
                      <td className="px-5 py-4 text-right font-medium text-text-primary">{row.count}</td>
                      <td className="px-5 py-4 text-right text-text-muted">
                        {formatReportPercent(row.count, data.kpis.totalEnquiries)}
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.consultations}</td>
                      <td className="px-5 py-4 text-right text-brand-600 font-medium">
                        {fmtPct(row.consultationsPct)}
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">{row.portals}</td>
                      <td className="px-5 py-4 text-right text-green-600 font-medium">
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
