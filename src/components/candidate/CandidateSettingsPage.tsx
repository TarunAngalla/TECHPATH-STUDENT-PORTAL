"use client";

import { useState, useTransition } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { updateCandidatePhone } from "@/lib/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils/dates";

function ReadOnlyField({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5 text-text-muted">
        {label}
      </label>
      <input
        id={id}
        value={value}
        readOnly
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-border-subtle bg-surface text-text-muted"
      />
    </div>
  );
}

export function CandidateSettingsPage({
  fullName,
  email,
  phone: initialPhone,
  lastAdminReset,
}: {
  fullName: string;
  email: string;
  phone: string;
  lastAdminReset: Date | string | null;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateCandidatePhone(phone);
      toast.success("Phone number saved.");
    });
  };

  const passwordNote = lastAdminReset
    ? `Last admin reset: ${formatDateTime(lastAdminReset)}`
    : "No admin password reset on record.";

  return (
    <section aria-labelledby="settings-heading" className="max-w-md space-y-6">
      <h2 id="settings-heading" className="sr-only">
        Account settings
      </h2>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your contact details visible to your recruiter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReadOnlyField label="Full name" value={fullName} id="settings-name" />
          <ReadOnlyField label="Email" value={email} id="settings-email" />
          <div>
            <label
              htmlFor="settings-phone"
              className="block text-xs font-medium mb-1.5 text-text-muted"
            >
              Phone
            </label>
            <input
              id="settings-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-border-subtle bg-surface-elevated text-text-primary focus:border-brand-500/40 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-medium brand-gradient text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </CardContent>
      </Card>

      <Card variant="glass" aria-labelledby="password-section-heading">
        <CardHeader>
          <CardTitle id="password-section-heading">Password</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <ShieldCheck size={12} aria-hidden="true" />
            {passwordNote}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 bg-accent-soft/60 border border-accent/10"
            role="note"
          >
            <Lock size={16} className="text-brand-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-text-muted leading-relaxed">
              Password changes are managed by your recruiter. Contact them through Messages if you
              need a reset — you cannot change your password here.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
