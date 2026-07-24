/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ReportChartCard } from "./ReportChartCard";

type DonutChartProps = {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  className?: string;
};

const DEFAULT_COLORS = ["#3b82f6", "#64748b", "#1e293b", "#94a3b8", "#60a5fa", "#cbd5e1"];

export function DonutChartCard({ title, subtitle, data, dataKey, nameKey, colors = DEFAULT_COLORS, className }: DonutChartProps) {
  const isEmpty = !data || data.length === 0 || data.every((d) => !d[dataKey]);

  return (
    <ReportChartCard title={title} subtitle={subtitle} isEmpty={isEmpty} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
            itemStyle={{ color: '#0f172a', fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </ReportChartCard>
  );
}
