"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { candidateLoginAction, type AuthActionState } from "@/lib/actions/auth";
import { AuthShell } from "@/components/shared/AuthShell";
import { Button, Card, CardContent, Input } from "@/components/ui";

const initialState: AuthActionState = {};

export function CandidateLoginForm() {
  const [state, formAction, pending] = useActionState(candidateLoginAction, initialState);

  return (
    <AuthShell>
      <Card
        variant="glass"
        className="w-full min-w-[min(100%,420px)] max-w-[480px] shadow-elevated border-white/70"
      >
        <CardContent className="pt-10 pb-10 px-8 sm:px-10">
          <h1 className="text-2xl sm:text-[1.75rem] font-semibold mb-2 text-text-primary font-display">
            Log in to your portal
          </h1>
          <p className="text-sm sm:text-base mb-8 text-text-muted leading-relaxed">
            Use the credentials your recruiter sent you by email.
          </p>
          <form action={formAction} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-text-muted">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="h-11 text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-text-muted">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your temporary password"
                required
                className="h-11 text-base"
              />
            </div>
            {state.error && (
              <p className="text-sm text-danger" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full h-12 text-base mt-2" loading={pending}>
              {pending ? "Logging in…" : "Log in"}
              {!pending && <ArrowRight size={18} aria-hidden="true" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
