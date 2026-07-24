"use client";

import {
  ReportEmptyState,
  ReportInsightStats,
  ReportSharedLayout,
} from "@/components/admin/ReportSharedLayout";
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

  const biggestDrop = data.stages
    .slice(1)
    .reduce<Stage | null>((best, stage) => {
      if (stage.drop <= 0) return best;
      if (!best || stage.drop > best.drop) return stage;
      return best;
    }, null);

  return (
    <ReportSharedLayout
      title="Conversion Funnel Report"
      description="Pipeline stages and drop-off."
      range={range}
      rangeLabel={rangeLabel}
      onExport={handleExport}
    >
      {data.stages.every((s) => s.count === 0) ? (
        <ReportEmptyState message="No pipeline data yet." />
      ) : (
        <>
          <BarChartCard
            title="Pipeline snapshot"
            data={data.stages}
            xAxisKey="shortLabel"
            layout="horizontal"
            series={[{ dataKey: "count", name: "Candidates", colorByIndex: true }]}
          />

          <ReportInsightStats
            items={[
              {
                label: "Overall conversion",
                value: fmtPct(data.kpis.overallConversionPct),
                hint: data.kpis.overallConversionLabel,
              },
              {
                label: "Biggest drop-off",
                value: biggestDrop ? `−${biggestDrop.drop}` : "—",
                hint: biggestDrop ? biggestDrop.label : undefined,
              },
            ]}
          />

          <p className="text-sm text-text-muted">
            Period — Enquiries {data.periodActivity.newLeads}
            {" · "}Candidates {data.periodActivity.newCandidates}
            {" · "}Interviews {data.periodActivity.interviewsScheduled}
          </p>

          <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs min-w-0">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface/50 border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3.5">Pipeline stage</th>
                    <th className="px-5 py-3.5 text-right">Count</th>
                    <th className="px-5 py-3.5 text-right">Conversion from prev</th>
                    <th className="px-5 py-3.5 text-right">Drop-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.stages.map((stage, i) => (
                    <tr key={stage.key} className="hover:bg-surface/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        <span className="inline-flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-text-primary">{stage.count}</td>
                      <td className="px-5 py-4 text-right text-text-muted">
                        {i === 0 ? "—" : fmtPct(stage.fromPrev)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-medium ${
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
