"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const REPORTS = [
  ["candidates", "Candidates"],
  ["enquiries", "Enquiries"],
  ["applications", "Applications"],
  ["interviews", "Interviews"],
  ["assessments", "Assessments"],
  ["recruiters", "Recruiters"],
] as const;

export function ReportExportPanel() {
  const [type, setType] = useState<(typeof REPORTS)[number][0]>("candidates");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const href = useMemo(() => {
    const query = new URLSearchParams({ type });
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    return `/api/admin/reports/export?${query.toString()}`;
  }, [from, to, type]);

  return (
    <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs rounded-2xl">
      <CardHeader className="pb-3"><CardTitle className="text-base font-bold">CSV exports</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-bold text-text-muted">
          Report
          <select className="mt-1.5 h-10 w-full rounded-xl border border-border-strong bg-white px-3 text-sm text-text-primary" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            {REPORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-text-muted">From<Input className="mt-1.5" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="text-xs font-bold text-text-muted">To<Input className="mt-1.5" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <Button asChild className="h-10"><a href={href}><Download size={16} aria-hidden="true" />Export CSV</a></Button>
      </CardContent>
    </Card>
  );
}
