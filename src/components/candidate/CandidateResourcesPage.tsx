import Link from "next/link";
import { BookOpen, CalendarCheck, ClipboardCheck, FileText, LifeBuoy, MessageCircle, ShieldCheck } from "lucide-react";
import { CandidateDocumentsPage } from "@/components/candidate/CandidateDocumentsPage";
import { Card } from "@/components/ui";
import { documents } from "@/lib/db/schema";

type Document = typeof documents.$inferSelect;

const resourceLinks = [
  {
    title: "Training library",
    description: "Review recruiter-assigned preparation modules and upcoming sessions.",
    href: "/trainings",
    icon: BookOpen,
  },
  {
    title: "Interview preparation",
    description: "See confirmed rounds, preparation notes, meeting details, and calendar options.",
    href: "/interview-details",
    icon: CalendarCheck,
  },
  {
    title: "Assessment guidance",
    description: "Review verified assessments, due dates, instructions, and results shared with you.",
    href: "/assessments",
    icon: ClipboardCheck,
  },
  {
    title: "Contact your recruiter",
    description: "Ask questions about your progress or a company activity through the secure message thread.",
    href: "/messages",
    icon: MessageCircle,
  },
];

export function CandidateResourcesPage({
  sections,
}: {
  sections: { title: string; documents: Document[] }[];
}) {
  return (
    <section className="grid gap-7" aria-labelledby="resources-heading">
      <div>
        <h2 id="resources-heading" className="text-xl font-bold text-text-primary">Resources</h2>
        <p className="mt-1 text-sm text-text-muted">Approved TechPath guidance and files available to your account.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {resourceLinks.map(({ title, description, href, icon: Icon }) => (
          <Link key={title} href={href} className="group">
            <Card variant="glass" className="h-full bg-white p-5 border border-border-strong/50 shadow-xs transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-brand-500">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={17} aria-hidden="true" /></div>
              <h3 className="mt-4 text-sm font-bold text-text-primary">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <FileText size={17} className="text-brand-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-text-primary">Secure files</h3>
        </div>
        <CandidateDocumentsPage sections={sections} allowResumeUpload={false} showBoundaryNote={false} />
      </div>

      <Card variant="glass" className="bg-white p-5 border border-border-strong/50 shadow-xs">
        <div className="flex items-start gap-3">
          <LifeBuoy size={18} className="mt-0.5 text-brand-500" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Need help?</h3>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Contact your assigned recruiter for placement questions or email support@thetechpath.com for portal assistance.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-50/20 px-4 py-3.5 text-xs font-semibold leading-relaxed text-text-muted" role="note">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-brand-500" aria-hidden="true" />
        Official offer letters, payroll, timesheets, and compliance records remain in Radxsys and are not managed in TechPath.
      </div>
    </section>
  );
}
