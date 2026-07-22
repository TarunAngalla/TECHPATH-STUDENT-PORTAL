"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, FileSignature, LockKeyhole } from "lucide-react";
import { signNdaAction, type NdaSignActionState } from "@/lib/actions/nda";
import { NDA_CONSENT_TEXT } from "@/lib/constants/nda";
import { Button, Input } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
      <FileSignature size={17} aria-hidden="true" /> Sign NDA and enter portal
    </Button>
  );
}

export function NdaSigningForm({ candidateName }: { candidateName: string }) {
  const initialState: NdaSignActionState = {};
  const [state, action] = useActionState(signNdaAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="signerName" className="mb-1.5 block text-sm font-semibold text-text-primary">
          Type your full legal name
        </label>
        <Input
          id="signerName"
          name="signerName"
          autoComplete="name"
          required
          defaultValue={candidateName}
          maxLength={160}
          aria-describedby="signer-help"
        />
        <p id="signer-help" className="mt-1.5 text-xs text-text-muted">
          The name must match your candidate profile: <strong>{candidateName}</strong>.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle bg-surface/60 p-4">
        <input
          type="checkbox"
          name="consentAccepted"
          required
          className="mt-1 h-4 w-4 rounded border-border-strong accent-brand-500"
        />
        <span className="text-sm leading-relaxed text-text-primary">{NDA_CONSENT_TEXT}</span>
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <LockKeyhole size={14} className="text-success" aria-hidden="true" />
          Signature evidence and the signed PDF are stored securely.
        </div>
        <SubmitButton />
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-success-soft/60 px-4 py-3 text-xs text-success">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        A copy of your signed NDA will be emailed to you after signing.
      </div>
    </form>
  );
}
