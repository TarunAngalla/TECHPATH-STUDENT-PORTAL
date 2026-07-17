import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { FaqAccordion } from "@/components/shared/FaqAccordion";

const FAQS = [
  {
    q: "How do I know when my application status changes?",
    a: "You'll get an email notification and it will appear under Announcements. The Applications page always reflects the current stage.",
  },
  {
    q: "Can I apply to companies myself?",
    a: "No — the marketing phase is fully handled by your assigned recruiter. If you have a specific company in mind, message your recruiter and they'll evaluate the fit.",
  },
  {
    q: "What happens after I receive an offer?",
    a: "Offer letters, payroll setup, and onboarding paperwork move to radxsys.com, our dedicated employment platform. This portal stays focused on the job search phase.",
  },
  {
    q: "How do I update my resume?",
    a: "Send your updated resume to your recruiter through Messages. They'll review it and upload the final version under Documents.",
  },
];

export function CandidateHelpPage() {
  return (
    <section aria-labelledby="help-heading">
      <h2 id="help-heading" className="sr-only">
        Help and support
      </h2>

      <div className="mb-6">
        <FaqAccordion items={FAQS} />
      </div>

      <div className="brand-gradient rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-elevated">
        <div className="min-w-0">
          <div className="text-sm font-semibold mb-1 text-white">Still need help?</div>
          <p className="text-xs text-white/80 max-w-md">
            Message your assigned recruiter directly — they can answer anything specific to your
            search.
          </p>
        </div>
        <Link
          href="/messages"
          className="px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 flex-shrink-0 bg-white/15 text-white border border-white/25 hover:bg-white/25 transition-colors"
        >
          <MessageCircle size={13} aria-hidden="true" />
          Message recruiter
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
