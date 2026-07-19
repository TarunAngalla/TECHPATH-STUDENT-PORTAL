"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { updateStaffPassword } from "@/lib/actions/settings";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

export function AdminSettingsPage({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateStaffPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  };

  return (
    <Card variant="glass" className="max-w-md bg-white border border-border-strong/50 shadow-xs rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-text-primary">Change Password</CardTitle>
        <p className="text-xs text-text-muted mt-1 font-medium">Signed in as {email}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="current-pw" className="block text-xs font-bold mb-1.5 text-text-muted">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10 h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-pw" className="block text-xs font-bold mb-1.5 text-text-muted">
              New Password
            </label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10 h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-pw" className="block text-xs font-bold mb-1.5 text-text-muted">
              Confirm New Password
            </label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-danger" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs font-semibold text-success" role="status">
              Password updated successfully.
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full text-xs font-semibold bg-brand-500 text-white shadow-xs hover:bg-brand-600 transition-colors py-2 rounded-xl mt-2"
          >
            {isPending ? "Updating Password…" : "Update Password"}
          </Button>
        </form>

        <div className="mt-6 pt-4 flex items-center gap-2 text-[11px] border-t border-border-strong/30 text-text-muted font-semibold">
          <Lock size={12} className="text-brand-500" aria-hidden="true" />
          <ShieldCheck size={12} className="text-success" aria-hidden="true" />
          Password changes are logged for security.
        </div>
      </CardContent>
    </Card>
  );
}
