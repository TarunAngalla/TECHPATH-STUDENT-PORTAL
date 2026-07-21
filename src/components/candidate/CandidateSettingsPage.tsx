"use client";

import { useState, useTransition } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { candidateChangePasswordAction } from "@/lib/actions/auth";
import { updateCandidatePhone } from "@/lib/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils/dates";

function ReadOnlyField({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold mb-1.5 text-text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        readOnly
        className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border border-border-strong/30 bg-surface text-text-muted font-medium shadow-xs"
      />
    </div>
  );
}

export function CandidateSettingsPage({
  fullName,
  email,
  phone: initialPhone,
  lastAdminReset,
  allowPhoneEdit = false,
}: {
  fullName: string;
  email: string;
  phone: string;
  lastAdminReset: Date | string | null;
  allowPhoneEdit?: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateCandidatePhone(phone);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Phone number saved.");
    });
  };

  const handlePasswordChange = () => {
    startTransition(async () => {
      const result = await candidateChangePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    });
  };

  const passwordNote = lastAdminReset
    ? `Last admin reset: ${formatDateTime(lastAdminReset)}`
    : "You can change your password anytime.";

  return (
    <section aria-labelledby="settings-heading" className="max-w-md space-y-6">
      <h2 id="settings-heading" className="sr-only">
        Account settings
      </h2>

      <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-text-primary">Profile Details</CardTitle>
          <CardDescription className="text-xs text-text-muted mt-1">
            Your contact details visible to your recruiter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReadOnlyField label="Full Name" value={fullName} id="settings-name" />
          <ReadOnlyField label="Email Address" value={email} id="settings-email" />
          <div>
            <label
              htmlFor="settings-phone"
              className="block text-xs font-bold mb-1.5 text-text-muted"
            >
              Phone Number
            </label>
            <input
              id="settings-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              readOnly={!allowPhoneEdit}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border border-border-strong/45 bg-white text-text-primary focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/80 transition-colors shadow-xs font-medium"
            />
          </div>
          {allowPhoneEdit ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-500 text-white shadow-xs hover:bg-brand-600 transition-all disabled:opacity-60 disabled:pointer-events-none"
            >
              {isPending ? "Saving Changes…" : "Save Changes"}
            </button>
          ) : (
            <p className="text-xs text-text-muted">Contact your recruiter to update profile details.</p>
          )}
        </CardContent>
      </Card>

      <Card
        variant="glass"
        className="bg-white border border-border-strong/50 shadow-xs rounded-2xl"
        aria-labelledby="password-section-heading"
      >
        <CardHeader className="pb-4">
          <CardTitle id="password-section-heading" className="text-base font-bold text-text-primary">
            Password
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5 text-xs text-text-muted mt-1 font-medium">
            <ShieldCheck size={13} className="text-success" aria-hidden="true" />
            {passwordNote}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 bg-brand-50/15 border border-brand-500/20"
            role="note"
          >
            <Lock size={16} className="text-brand-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-text-muted leading-relaxed font-medium">
              Choose a strong password you don&apos;t use elsewhere. Password changes are audited for
              your recruiter.
            </p>
          </div>
          <div>
            <label htmlFor="current-password" className="block text-xs font-bold mb-1.5 text-text-muted">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border border-border-strong/45 bg-white"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-bold mb-1.5 text-text-muted">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border border-border-strong/45 bg-white"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-bold mb-1.5 text-text-muted">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border border-border-strong/45 bg-white"
            />
          </div>
          <Button
            type="button"
            onClick={handlePasswordChange}
            disabled={isPending || !currentPassword || !newPassword}
            className="w-full"
          >
            {isPending ? "Updating…" : "Update password"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
