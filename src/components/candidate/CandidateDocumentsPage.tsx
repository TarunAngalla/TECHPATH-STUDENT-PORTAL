import { ShieldCheck } from "lucide-react";
import { DocumentRow } from "@/components/shared/DocumentRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants/document-sections";
import type { DocumentCategory } from "@/lib/db/schema";
import { documents } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils/dates";

type Document = typeof documents.$inferSelect;

const SECTION_BADGE_VARIANT: Record<string, "default" | "accent" | "success" | "warning"> = {
  "Core documents": "default",
  "STEM compliance": "accent",
  "Employment documents": "success",
};

export function CandidateDocumentsPage({
  sections,
}: {
  sections: { title: string; documents: Document[] }[];
}) {
  const hasDocuments = sections.some((s) => s.documents.length > 0);

  return (
    <section aria-labelledby="documents-heading">
      <h2 id="documents-heading" className="sr-only">
        Documents
      </h2>

      {!hasDocuments ? (
        <Card variant="glass" className="overflow-hidden">
          <EmptyState
            title="No documents yet"
            note="Your recruiter will upload resumes, handbooks, and other files here as your search progresses."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            if (section.documents.length === 0) return null;
            const badgeVariant = SECTION_BADGE_VARIANT[section.title] ?? "default";

            return (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={badgeVariant}>{section.title}</Badge>
                  <span className="text-xs text-text-muted">
                    {section.documents.length} {section.documents.length === 1 ? "file" : "files"}
                  </span>
                </div>
                <Card variant="glass" className="overflow-hidden" role="list" aria-label={section.title}>
                  {section.documents.map((doc, i) => (
                    <div key={doc.id} role="listitem">
                      <DocumentRow
                        name={doc.name}
                        subtitle={`${DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]} · ${formatDate(doc.uploadedAt)}`}
                        href={doc.fileUrl}
                        category={doc.category as DocumentCategory}
                        isFirst={i === 0}
                      />
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="mt-8 px-4 py-3 rounded-xl text-xs flex items-start gap-2 bg-surface/80 text-text-muted border border-border-subtle"
        role="note"
      >
        <ShieldCheck size={15} className="text-text-muted mt-0.5 flex-shrink-0" aria-hidden="true" />
        All official offer letters, payroll, timesheets, and compliance documents are managed
        securely on radxsys.com.
      </div>
    </section>
  );
}
