"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import {
  completeAccountSetupAction,
  type AccountSetupActionState,
} from "@/lib/actions/candidate-invites";
import { AuthShell } from "@/components/shared/AuthShell";
import { Button, Card, Input } from "@/components/ui";

const initialState: AccountSetupActionState = {};

export function AccountSetupForm({
  token,
  fullName,
  email,
  expiresAt,
}: {
  token: string;
  fullName: string;
  email: string;
  expiresAt: Date;
}) {
  const [state, formAction, pending] = useActionState(completeAccountSetupAction, initialState);

  return (
    <AuthShell subtitle="Secure account setup" showHero={false}>
      <Card variant="glass" className="p-6 sm:p-8 bg-white border border-border-strong/50 shadow-xs">
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create your portal password</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
            Welcome, {fullName}. This single-use invitation is for <strong>{email}</strong> and
            expires {expiresAt.toLocaleString()}.
          </p>
        </div>

        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="token" value={token} />
          <div>
            <label htmlFor="setup-password" className="block text-xs font-semibold text-text-muted mb-1.5">
              New password
            </label>
            <Input
              id="setup-password"
              name="newPassword"
              type="password"
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Use at least 10 characters with uppercase, lowercase, and a number.
            </p>
          </div>
          <div>
            <label htmlFor="setup-confirm" className="block text-xs font-semibold text-text-muted mb-1.5">
              Confirm password
            </label>
            <Input
              id="setup-confirm"
              name="confirmPassword"
              type="password"
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
            />
          </div>
          {state.error && (
            <p className="text-xs font-semibold text-danger" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending} loading={pending}>
            {pending ? "Creating account…" : "Create password and continue"}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}

export function InvalidAccountSetupLink() {
  return (
    <AuthShell subtitle="Secure account setup" showHero={false}>
      <Card variant="glass" className="p-7 text-center bg-white border border-border-strong/50 shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <KeyRound size={22} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-text-primary">Setup link unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          This link is invalid, expired, revoked, or already used. Contact the TechPath team to
          request a new invitation.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/login">Return to sign in</Link>
        </Button>
      </Card>
    </AuthShell>
  );
}
