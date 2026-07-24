import { Card } from "@/components/ui/Card";
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
  minHeight?: number;
};

export function ReportChartCard({ title, subtitle, children, isEmpty, className = "", minHeight = 300 }: Props) {
  return (
    <Card variant="glass" className={`p-6 bg-white border border-border-strong/50 shadow-xs flex flex-col ${className}`}>
      <div className="mb-6">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      </div>
      <div className="w-full relative" style={{ height: minHeight }}>
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted bg-surface/30 rounded-xl border border-dashed border-border-subtle">
            No data available for this period.
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
