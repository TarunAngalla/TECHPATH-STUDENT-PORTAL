/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { ReportChartCard } from "./ReportChartCard";

export type BarSeries = {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
  colorByIndex?: boolean;
};

type BarChartProps = {
  title: string;
  subtitle?: string;
  data: any[];
  xAxisKey: string;
  series: BarSeries[];
  layout?: "horizontal" | "vertical";
  className?: string;
  colors?: string[];
};

const DEFAULT_COLORS = ["#3b82f6", "#64748b", "#1e293b", "#94a3b8", "#60a5fa", "#cbd5e1"];

const TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  fontSize: "12px",
} as const;

export function BarChartCard({ title, subtitle, data, xAxisKey, series, layout = "horizontal", className, colors = DEFAULT_COLORS }: BarChartProps) {
  const [barHovered, setBarHovered] = useState(false);
  const isEmpty = !data || data.length === 0;
  const categoryCount = isEmpty ? 0 : data.length;
  const calculatedHeight =
    layout === "vertical" && !isEmpty
      ? Math.max(280, Math.min(480, categoryCount * 52 + 72))
      : categoryCount <= 3
        ? 300
        : 340;

  return (
    <ReportChartCard title={title} subtitle={subtitle} isEmpty={isEmpty} className={className} minHeight={calculatedHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 5, right: 16, left: layout === "vertical" ? 0 : -12, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={layout === "horizontal" ? false : true} horizontal={layout === "horizontal" ? true : false} stroke="#f1f5f9" />

          {layout === "horizontal" ? (
            <>
              <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis allowDecimals={false} stroke="#64748b" fontSize={10} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis dataKey={xAxisKey} type="category" width={110} stroke="#64748b" fontSize={10} tickLine={false} />
            </>
          )}

          <Tooltip
            shared={false}
            cursor={false}
            active={barHovered ? undefined : false}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />

          {series.map((s, index) => {
            const isStacked = !!s.stackId;
            return (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color || colors[index % colors.length]}
                stackId={s.stackId}
                radius={isStacked ? [0, 0, 0, 0] : layout === "horizontal" ? [4, 4, 0, 0] : [0, 4, 4, 0]}
                maxBarSize={40}
                onMouseEnter={() => setBarHovered(true)}
                onMouseLeave={() => setBarHovered(false)}
              >
                {s.colorByIndex &&
                  data.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </ReportChartCard>
  );
}
