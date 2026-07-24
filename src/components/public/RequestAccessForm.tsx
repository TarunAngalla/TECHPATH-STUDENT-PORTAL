"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import {
  submitPublicEnquiryAction,
  type PublicEnquiryActionState,
} from "@/lib/actions/public-enquiries";
import { AuthShell } from "@/components/shared/AuthShell";
import { Button, Input, Select, Textarea } from "@/components/ui";

const initialState: PublicEnquiryActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1 text-[11px] font-medium text-danger" role="alert">
      {errors[0]}
    </p>
  );
}

export function RequestAccessForm() {
  const [state, formAction, pending] = useActionState(submitPublicEnquiryAction, initialState);

  if (state.success) {
    return (
      <AuthShell subtitle="Candidate access">
        <div className="w-full min-w-[min(100%,400px)] max-w-[420px] text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg">
            <CheckCircle2 size={22} aria-hidden="true" />
          </div>
          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Request received
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500 font-medium">
            The TechPath team will review your information and contact you about the next step.
            Portal access is created only after approval.
          </p>
          <Button asChild className="mt-8 w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
            <Link href="/login">Return to sign in</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Request candidate access">
      <div className="w-full min-w-[min(100%,400px)] max-w-[420px]">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <Send size={16} className="text-white/80" aria-hidden="true" />
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Request portal access
          </h1>
        </div>

        <form action={formAction} className="space-y-3.5" noValidate>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label htmlFor="request-name" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
                Full name
              </label>
              <Input
                id="request-name"
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                className="h-10 text-sm border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl"
              />
              <FieldError errors={state.fieldErrors?.name} />
            </div>
            <div>
              <label htmlFor="request-email" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
                Email address
              </label>
              <Input
                id="request-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className="h-10 text-sm border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl"
              />
              <FieldError errors={state.fieldErrors?.email} />
            </div>
            <div>
              <label htmlFor="request-phone" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
                Phone number
              </label>
              <Input
                id="request-phone"
                name="phone"
                maxLength={40}
                autoComplete="tel"
                className="h-10 text-sm border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl"
              />
              <FieldError errors={state.fieldErrors?.phone} />
            </div>
            <div>
              <label htmlFor="request-opt" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
                Work authorization
              </label>
              <Select
                id="request-opt"
                name="optType"
                defaultValue=""
                className="h-10 text-sm border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl"
              >
                <option value="">Select an option</option>
                <option value="OPT">OPT</option>
                <option value="STEM_OPT">STEM OPT</option>
              </Select>
              <FieldError errors={state.fieldErrors?.optType} />
            </div>
          </div>

          <div>
            <label htmlFor="request-role" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
              Role interest
            </label>
            <Input
              id="request-role"
              name="roleInterest"
              required
              maxLength={160}
              placeholder="Example: Java Developer, Data Analyst"
              className="h-10 text-sm border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl"
            />
            <FieldError errors={state.fieldErrors?.roleInterest} />
          </div>

          <div>
            <label htmlFor="request-experience" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
              Experience years
            </label>
            <Input
              id="request-experience"
              name="experienceSummary"
              type="text"
              inputMode="decimal"
              maxLength={40}
              placeholder="Example: 3"
              className="h-10 text-sm border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl"
            />
            <FieldError errors={state.fieldErrors?.experienceSummary} />
          </div>

          <div>
            <label htmlFor="request-additional" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">
              Additional information
            </label>
            <Textarea
              id="request-additional"
              name="additionalInformation"
              maxLength={2000}
              rows={2}
              placeholder="Share anything else the TechPath team should know."
              className="text-sm py-2.5 border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl min-h-0"
            />
            <FieldError errors={state.fieldErrors?.additionalInformation} />
          </div>

          <label className="flex items-start gap-2.5 text-[11px] leading-snug text-slate-500 pt-1">
            <input
              name="consent"
              type="checkbox"
              required
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
            />
            <span>
              I consent to TechPath using this information to review my access request and contact
              me about candidate services.
            </span>
          </label>
          <FieldError errors={state.fieldErrors?.consent} />

          {state.error && (
            <div className="rounded-xl border border-danger/20 bg-danger-soft/40 px-3 py-2.5" role="alert">
              <p className="text-xs font-semibold text-danger">{state.error}</p>
              {state.code === "existing_account" && (
                <p className="mt-1.5 text-[11px] text-slate-600">
                  Already have access?{" "}
                  <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                    Sign in here
                  </Link>
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="ghost"
            disabled={pending}
            loading={pending}
            className="w-full text-[13px] font-bold bg-black text-white shadow-xl hover:bg-slate-800 hover:text-white hover:shadow-2xl transition-all py-3 rounded-xl flex items-center justify-center gap-2 tracking-wide mt-1 disabled:opacity-60 disabled:pointer-events-none"
          >
            <Send size={14} aria-hidden="true" />
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[12px] text-slate-500">
          Already approved?{" "}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
