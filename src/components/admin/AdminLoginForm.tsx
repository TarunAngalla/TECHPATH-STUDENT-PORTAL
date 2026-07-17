"use client";

import { useActionState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { adminLoginAction, type AuthActionState } from "@/lib/actions/auth";
import { AuthShell } from "@/components/shared/AuthShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

const initialState: AuthActionState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);
  const [showPw, setShowPw] = useState(false);

  return (
    <AuthShell
      subtitle="Admin console"
      showHero={false}
      badge={
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-text-muted">
          <ShieldCheck size={16} className="text-brand-500" aria-hidden="true" />
          Internal access only
        </div>
      }
    >
      <Card variant="glass" className="w-full min-w-[min(100%,420px)] max-w-[480px] shadow-elevated">
        <CardHeader>
          <CardTitle className="text-xl">Sign in to the admin console</CardTitle>
          <p className="text-sm text-text-muted mt-1">
            For recruiters and staff at the tech path. Sign-ins and permission changes are logged.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <form action={formAction} className="space-y-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium mb-1.5 text-text-muted">
                Work email
              </label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@thetechpath.com"
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium mb-1.5 text-text-muted">
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>
            {state.error && (
              <p className="text-xs text-danger" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending} loading={pending} className="w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
