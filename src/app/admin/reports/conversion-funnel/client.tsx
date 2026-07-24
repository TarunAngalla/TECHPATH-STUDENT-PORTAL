"use client";

import { ReportEmptyState, ReportSharedLayout } from "@/components/admin/ReportSharedLayout";
import { Card } from "@/components/ui/Card";
import { downloadCsv } from "@/lib/reports/chart";
import { BarChartCard } from "@/components/admin/charts/BarChartCard";

type Stage = {
  key: string;
  label: string;
  shortLabel: string;
  count: number;
  fromPrev: number | null;
  drop: number;
};

type Data = {
  stages: Stage[];
  periodActivity: {
    newLeads: number;
    newCandidates: number;
    interviewsScheduled: number;
  };
  kpis: {
    topOfFunnel: number;
    bottomOfFunnel: number;
    overallConversionPct: number | null;
    overallConversionLabel: string;
  };
};

const COLORS = ["#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#3b82f6"];

function fmtPct(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}

export function ConversionFunnelClient({
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
      data.stages.map((s) => ({
        Stage: s.label,
        Candidates: s.count,
        "Conversion from previous": s.fromPrev === null ? "" : `${s.fromPrev.toFixed(1)}%`,
        "Drop-off": s.drop,
      })),
      `conversion-funnel-report-${range}.csv`,
    );
  };

  return (
    <ReportSharedLayout
      title="Conversion Funnel Report"
      description="Current pipeline snapshot with stage-to-stage conversion, plus new activity in the selected period."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Top of funnel (enquiries)
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.topOfFunnel}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Offer / Hired
          </div>
          <div className="text-2xl font-bold text-text-primary">{data.kpis.bottomOfFunnel}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs min-w-0">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Overall conversion
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {fmtPct(data.kpis.overallConversionPct)}
          </div>
          <div className="text-[10px] text-text-muted mt-1">{data.kpis.overallConversionLabel}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            New enquiries (period)
          </div>
          <div className="text-xl font-bold text-text-primary">{data.periodActivity.newLeads}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            New portal candidates (period)
          </div>
          <div className="text-xl font-bold text-text-primary">{data.periodActivity.newCandidates}</div>
        </Card>
        <Card variant="glass" className="p-4 bg-white border border-border-strong/50 shadow-xs">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Interviews scheduled (period)
          </div>
          <div className="text-xl font-bold text-text-primary">
            {data.periodActivity.interviewsScheduled}
          </div>
        </Card>
      </div>

      {data.stages.every((s) => s.count === 0) ? (
        <ReportEmptyState message="No pipeline data yet." />
      ) : (
        <>
          <BarChartCard
            title="Pipeline Snapshot"
            subtitle="Current candidate distribution across funnel stages."
            data={data.stages}
            xAxisKey="shortLabel"
            layout="horizontal"
            series={[
              { dataKey: "count", name: "Candidates", colorByIndex: true },
            ]}
          />

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-[10px] font-semibold uppercase text-text-muted">
                    <th className="px-4 py-3">Pipeline stage</th>
                    <th className="px-4 py-3 text-right">Count</th>
                    <th className="px-4 py-3 text-right">Conversion from prev</th>
                    <th className="px-4 py-3 text-right">Drop-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.stages.map((stage, i) => (
                    <tr key={stage.key} className="hover:bg-surface/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">{stage.count}</td>
                      <td className="px-4 py-3 text-right text-text-muted">
                        {i === 0 ? "—" : fmtPct(stage.fromPrev)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          stage.drop > 0 ? "text-danger" : "text-text-muted"
                        }`}
                      >
                        {i === 0 ? "—" : stage.drop}
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
