"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { forcedFirstLoginAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/shared/AuthShell";

const initial: AuthActionState = {};

export function ForcedPasswordResetForm() {
  const [state, formAction, pending] = useActionState(forcedFirstLoginAction, initial);

  return (
    <AuthShell subtitle="Candidate portal" showHero={false}>
      <div className="space-y-6">
        <div>
          <div className="w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center mb-4">
            <Lock size={18} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Set a new password</h1>
          <p className="text-sm text-text-muted mt-1">
            For security, you must choose your own password before continuing.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">
              New password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wide text-text-muted mb-1.5">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11"
            />
          </div>
          {state.error && (
            <p className="text-xs text-red-600 font-medium" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full h-11">
            {pending ? "Saving…" : "Save and continue"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
