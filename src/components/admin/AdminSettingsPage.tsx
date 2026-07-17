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
    <Card variant="glass" className="max-w-md">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <p className="text-xs text-text-muted mt-1">Signed in as {email}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="current-pw" className="block text-xs font-medium mb-1.5 text-text-muted">
              Current password
            </label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-pw" className="block text-xs font-medium mb-1.5 text-text-muted">
              New password
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
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-pw" className="block text-xs font-medium mb-1.5 text-text-muted">
              Confirm new password
            </label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-success" role="status">
              Password updated successfully.
            </p>
          )}

          <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
            Update password
          </Button>
        </form>

        <div className="mt-6 pt-4 flex items-center gap-2 text-[11px] border-t border-border-subtle text-text-muted">
          <Lock size={12} aria-hidden="true" />
          <ShieldCheck size={12} aria-hidden="true" />
          Password changes are logged for security.
        </div>
      </CardContent>
    </Card>
  );
}
