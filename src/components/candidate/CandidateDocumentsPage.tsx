"use client";

import { useRef, useTransition } from "react";
import { ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadResumeAsCandidate } from "@/lib/actions/documents";
import { DocumentRow } from "@/components/shared/DocumentRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

function ResumeUploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadResumeAsCandidate(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully uploaded resume: ${file.name}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <Card variant="glass" className="p-6 mb-6 bg-white border border-border-strong/50 shadow-xs rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary leading-tight">Upload your resume</h3>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed font-medium">
            Upload your latest resume (PDF, DOC, or DOCX up to 5MB) for recruiter marketing.
          </p>
        </div>
        <div className="flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
            id="candidate-resume-upload-input"
          />
          <Button
            type="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold bg-brand-500 text-white flex items-center gap-1.5 shadow-xs hover:bg-brand-600 transition-colors"
          >
            <Upload size={13} aria-hidden="true" />
            {isPending ? "Uploading…" : "Choose file"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function CandidateDocumentsPage({
  sections,
  allowResumeUpload = false,
  showBoundaryNote = true,
}: {
  sections: { title: string; documents: Document[] }[];
  allowResumeUpload?: boolean;
  showBoundaryNote?: boolean;
}) {
  const hasDocuments = sections.some((s) => s.documents.length > 0);

  return (
    <section aria-labelledby="documents-heading">
      <h2 id="documents-heading" className="sr-only">
        Documents
      </h2>

      {allowResumeUpload && <ResumeUploadZone />}

      {!hasDocuments ? (
        <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs rounded-2xl">
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
                  <Badge variant={badgeVariant} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md">{section.title}</Badge>
                  <span className="text-xs text-text-muted font-semibold">
                    {section.documents.length} {section.documents.length === 1 ? "file" : "files"}
                  </span>
                </div>
                <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/50 shadow-xs rounded-2xl" role="list" aria-label={section.title}>
                  {section.documents.map((doc, i) => (
                    <div key={doc.id} role="listitem">
                      <DocumentRow
                        name={doc.name}
                        subtitle={`${DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]} · ${formatDate(doc.uploadedAt)}`}
                        href={`/api/documents/${doc.id}/download`}
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

      {showBoundaryNote && (
        <div
          className="mt-8 px-4 py-3.5 rounded-xl text-xs flex items-start gap-3 bg-brand-50/15 border border-brand-500/20 text-text-muted font-semibold leading-relaxed"
          role="note"
        >
          <ShieldCheck size={16} className="text-brand-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          All official offer letters, payroll, timesheets, and compliance documents are managed
          securely on radxsys.com.
        </div>
      )}
    </section>
  );
}
