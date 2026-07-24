import { FileText, ShieldCheck } from "lucide-react";
import { CandidateDocumentsPage } from "@/components/candidate/CandidateDocumentsPage";
import { documents } from "@/lib/db/schema";

type Document = typeof documents.$inferSelect;

export function CandidateResourcesPage({
  sections,
}: {
  sections: { title: string; documents: Document[] }[];
}) {
  return (
    <section className="grid gap-5" aria-labelledby="resources-heading">
      <h2 id="resources-heading" className="sr-only">
        Resources
      </h2>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <FileText size={17} className="text-brand-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-text-primary">Secure files</h3>
        </div>
        <CandidateDocumentsPage sections={sections} allowResumeUpload={false} showBoundaryNote={false} />
      </div>

      <div
        className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-50/20 px-4 py-3.5 text-xs font-semibold text-text-muted"
        role="note"
      >
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-brand-500" aria-hidden="true" />
        Official offer letters, payroll, timesheets, and compliance records remain in Radxsys.
      </div>
    </section>
  );
}
