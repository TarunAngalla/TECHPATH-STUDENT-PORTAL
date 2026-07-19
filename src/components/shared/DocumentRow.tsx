import {
  BookOpen,
  ClipboardList,
  Clock,
  Download,
  File,
  FileText,
  Receipt,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DocumentCategory } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

const CATEGORY_ICONS: Record<DocumentCategory, LucideIcon> = {
  resume: FileText,
  handbook: BookOpen,
  stem_compliance: ShieldCheck,
  offer_letter: ClipboardList,
  payslip: Receipt,
  timesheet: Clock,
  onboarding: ClipboardList,
  other: File,
};

const EMPLOYMENT_CATEGORIES: DocumentCategory[] = [
  "offer_letter",
  "payslip",
  "timesheet",
  "onboarding",
  "other",
];

export function DocumentRow({
  name,
  subtitle,
  href,
  category,
  isFirst = false,
}: {
  name: string;
  subtitle: string;
  href: string;
  category: DocumentCategory;
  isFirst?: boolean;
}) {
  const Icon = CATEGORY_ICONS[category] ?? FileText;
  const isEmployment = EMPLOYMENT_CATEGORIES.includes(category);

  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface/30 bg-white",
        !isFirst && "border-t border-border-subtle",
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs",
            isEmployment
              ? "bg-blue-50 border-blue-100/50 text-blue-600"
              : "bg-purple-50 border-purple-100/50 text-purple-600"
          )}
        >
          <Icon
            size={14}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate leading-tight">{name}</div>
          <div className="text-[11px] text-text-muted truncate mt-1 font-medium">{subtitle}</div>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild className="flex-shrink-0 ml-3 text-xs hover:bg-surface text-text-primary border border-border-strong/30 bg-white shadow-xs">
        <a href={href} download target="_blank" rel="noopener noreferrer" aria-label={`Download ${name}`}>
          <Download size={13} className="mr-1.5" aria-hidden="true" /> Download
        </a>
      </Button>
    </div>
  );
}
