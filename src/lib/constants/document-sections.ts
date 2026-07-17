import type { DocumentCategory } from "@/lib/db/schema";

export const DOCUMENT_SECTIONS: {
  title: string;
  categories: DocumentCategory[];
  stemOnly?: boolean;
}[] = [
  {
    title: "Core documents",
    categories: ["resume", "handbook"],
  },
  {
    title: "STEM compliance",
    categories: ["stem_compliance"],
    stemOnly: true,
  },
  {
    title: "Employment documents",
    categories: ["offer_letter", "payslip", "timesheet", "onboarding", "other"],
  },
];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  resume: "Resume",
  handbook: "Handbook",
  stem_compliance: "STEM compliance",
  offer_letter: "Offer letter",
  payslip: "Payslip",
  timesheet: "Timesheet",
  onboarding: "Onboarding",
  other: "Other",
};
