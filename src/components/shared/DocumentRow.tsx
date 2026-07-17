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
        "flex items-center justify-between px-5 py-4 transition-colors hover:bg-brand-50/40",
        !isFirst && "border-t border-border-subtle",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            isEmployment ? "bg-brand-100" : "bg-accent-soft",
          )}
        >
          <Icon
            size={14}
            className={isEmployment ? "text-brand-600" : "text-accent"}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">{name}</div>
          <div className="text-xs text-text-muted truncate">{subtitle}</div>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild className="flex-shrink-0 ml-3">
        <a href={href} download target="_blank" rel="noopener noreferrer" aria-label={`Download ${name}`}>
          <Download size={13} aria-hidden="true" /> Download
        </a>
      </Button>
    </div>
  );
}
