"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { candidateLoginAction, type AuthActionState } from "@/lib/actions/auth";
import { AuthShell } from "@/components/shared/AuthShell";
import { Button, Input } from "@/components/ui";

const initialState: AuthActionState = {};

export function CandidateLoginForm() {
  const [state, formAction, pending] = useActionState(candidateLoginAction, initialState);

  return (
    <AuthShell>
      <div className="w-full min-w-[min(100%,400px)] max-w-[420px]">
        {/* Header */}
        <div className="mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center mb-5 shadow-lg">
            <Lock size={18} className="text-white/80" />
          </div>
          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Sign in
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 font-medium">
            Candidates, recruiters, and admins use this page
          </p>
        </div>

        <form action={formAction} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-600">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                required
                className="h-12 text-sm pl-10 border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-600">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className="h-12 text-sm pl-10 border border-slate-200 bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white rounded-xl transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          {state.error && (
            <p className="text-sm text-red-500 font-medium" role="alert">
              {state.error}
            </p>
          )}
          <Button
            type="submit"
            variant="ghost"
            disabled={pending}
            className="w-full text-[13px] font-bold bg-black text-white shadow-xl hover:bg-slate-800 hover:text-white hover:shadow-2xl transition-all py-3.5 rounded-xl mt-3 flex items-center justify-center gap-2 tracking-wide"
          >
            {pending ? "Signing In…" : "Sign In"}
            {!pending && <ArrowRight size={16} aria-hidden="true" />}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Need portal access?{" "}
          <Link href="/request-access" className="font-semibold text-slate-900 hover:underline">
            Submit a request
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-5 font-medium">
          Protected by The Tech Path &middot; Secure Login
        </p>
      </div>
    </AuthShell>
  );
}
