import { requireAdminAuth } from "@/lib/auth/guards";
import Link from "next/link";
import { FileText, TrendingUp, Users, Inbox, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ReportExportPanel } from "@/components/admin/ReportExportPanel";

const REPORTS = [
  {
    href: "/admin/reports/enquiry-source",
    title: "Enquiry Source Report",
    description: "Volume and conversion by source.",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    href: "/admin/reports/conversion-funnel",
    title: "Conversion Funnel Report",
    description: "Pipeline stages and drop-off.",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50 border-green-100",
  },
  {
    href: "/admin/reports/recruiter-performance",
    title: "Recruiter Performance Report",
    description: "Assignments, apps, and interviews.",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-100",
  },
  {
    href: "/admin/reports/marketing-activity",
    title: "Marketing Activity Report",
    description: "Placement activity by candidate.",
    icon: Inbox,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100",
  },
];

export default async function AdminReportsPage() {
  await requireAdminAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 min-w-0 w-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Analytics & Reports</h1>
        <p className="text-sm text-text-muted mt-1">Quick reports for pipeline and performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {REPORTS.map((report) => (
          <Link key={report.href} href={report.href} className="group min-w-0">
            <Card
              variant="glass"
              className="h-full bg-white border border-border-strong/50 shadow-xs hover:shadow-md transition-all duration-200 hover:border-brand-300"
            >
              <div className="p-5 flex flex-col h-full min-w-0">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${report.bg}`}
                  >
                    <report.icon size={22} className={report.color} />
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface text-text-muted group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors flex-shrink-0">
                    <ArrowRight size={16} />
                  </div>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-brand-600 transition-colors">
                  {report.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-1">{report.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-6 border-t border-border-subtle">
        <h2 className="text-lg font-bold text-text-primary mb-4">Bulk Data Export</h2>
        <ReportExportPanel />
      </div>
    </div>
  );
}
