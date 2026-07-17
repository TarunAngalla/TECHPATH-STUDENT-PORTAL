"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { APPLICATION_STATUS_OPTIONS, STATUS_META } from "@/lib/constants/status-meta";
import type { Application } from "@/lib/db/schema";

type StatusDatum = {
  status: string;
  label: string;
  count: number;
  color: string;
};

function buildStatusData(applications: Application[]): StatusDatum[] {
  const counts = new Map<string, number>();
  for (const app of applications) {
    counts.set(app.status, (counts.get(app.status) ?? 0) + 1);
  }

  return APPLICATION_STATUS_OPTIONS.map(({ value, label }) => ({
    status: value,
    label,
    count: counts.get(value) ?? 0,
    color: STATUS_META[value].color,
  })).filter((d) => d.count > 0);
}

export function ApplicationPipelineChart({ applications }: { applications: Application[] }) {
  const data = useMemo(() => buildStatusData(applications), [applications]);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card variant="glass" className="h-full">
      <CardHeader>
        <CardTitle>Application status breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-text-muted">No applications to chart yet.</p>
        ) : (
          <>
            <div
              className="h-48 w-full"
              role="img"
              aria-labelledby="pipeline-chart-title pipeline-chart-summary"
            >
              <p id="pipeline-chart-title" className="sr-only">
                Application status breakdown
              </p>
              <p id="pipeline-chart-summary" className="sr-only">
                {data.map((d) => `${d.label}: ${d.count}`).join(", ")}. Total: {total} applications.
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(15, 76, 129, 0.08)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul
              className="mt-4 space-y-2"
              aria-label="Application status breakdown (text alternative)"
            >
              {data.map((d) => (
                <li key={d.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-text-primary">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                      aria-hidden="true"
                    />
                    {d.label}
                  </span>
                  <span className="font-medium text-text-muted tabular-nums">
                    {d.count}
                    <span className="sr-only"> applications</span>
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between text-xs pt-2 border-t border-border-subtle font-medium text-text-primary">
                <span>Total</span>
                <span className="tabular-nums">{total}</span>
              </li>
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
