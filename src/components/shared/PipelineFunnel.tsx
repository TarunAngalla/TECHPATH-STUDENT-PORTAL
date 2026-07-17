import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export type FunnelStage = {
  label: string;
  value: number;
  barClass: string;
  trackClass?: string;
};

export function PipelineFunnel({
  stages,
  title = "Pipeline, last 90 days",
  reportHref,
}: {
  stages: FunnelStage[];
  title?: string;
  reportHref?: string;
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>{title}</CardTitle>
        {reportHref && (
          <Link
            href={reportHref}
            className="text-xs font-medium flex items-center gap-1 text-brand-500 hover:text-brand-600 transition-colors"
          >
            Full report <ChevronRight size={13} aria-hidden="true" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          {stages.map((stage) => (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="text-xs w-40 flex-shrink-0 text-text-muted">{stage.label}</div>
              <div
                className={cn(
                  "flex-1 h-6 rounded-lg overflow-hidden",
                  stage.trackClass ?? "bg-surface",
                )}
              >
                <div
                  className={cn(
                    "h-6 rounded-lg flex items-center justify-end px-2 min-w-[2rem] transition-all duration-500",
                    stage.barClass,
                  )}
                  style={{
                    width: `${Math.max((stage.value / max) * 100, stage.value > 0 ? 8 : 0)}%`,
                  }}
                >
                  {stage.value > 0 && (
                    <span className="text-xs font-medium text-white">{stage.value}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
