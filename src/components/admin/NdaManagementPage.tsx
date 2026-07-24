"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, FileSignature, History, Plus, ShieldAlert, type LucideIcon } from "lucide-react";
import {
  activateNdaTemplateAction,
  createNdaTemplateAction,
  type NdaAdminActionState,
} from "@/lib/actions/nda";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CreateButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending}><Plus size={15} /> Create template</Button>;
}

type Template = {
  id: string;
  version: string;
  title: string;
  documentHash: string;
  effectiveFrom: Date;
  isActive: boolean;
  createdAt: Date;
  createdByEmail: string;
  signedCount: number;
  supersededCount: number;
};

type Agreement = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  templateId: string;
  templateVersion: string;
  templateTitle: string;
  status: string;
  presentedAt: Date;
  acceptedAt: Date | null;
  signerName: string | null;
  signingProvider: string | null;
  signedDocumentPath: string | null;
  emailSentAt: Date | null;
};

export function NdaManagementPage({
  templates,
  agreements,
  activeTemplate,
  pendingCandidates,
  summary,
}: {
  templates: Template[];
  agreements: Agreement[];
  activeTemplate: Omit<Template, "signedCount" | "supersededCount"> | null;
  pendingCandidates: { candidateId: string; candidateName: string; candidateEmail: string; accountState: string }[];
  summary: { pending: number; signedActive: number; totalSigned: number; templates: number };
}) {
  const initial: NdaAdminActionState = {};
  const [createState, createAction] = useActionState(createNdaTemplateAction, initial);
  const [showCreate, setShowCreate] = useState(templates.length === 0);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, startActivation] = useTransition();

  const activate = (templateId: string) => {
    setActivationError(null);
    startActivation(async () => {
      const result = await activateNdaTemplateAction(templateId);
      if (result.error) setActivationError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">NDA signatures</h2>
        </div>
        <Button type="button" variant="outline" onClick={() => setShowCreate((value) => !value)}>
          <Plus size={15} /> New NDA template
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(
          [
            { label: "NDAs pending", value: summary.pending, icon: ShieldAlert },
            { label: "Signed active NDA", value: summary.signedActive, icon: CheckCircle2 },
            { label: "Signed historically", value: summary.totalSigned, icon: History },
            { label: "Template versions", value: summary.templates, icon: FileSignature },
          ] satisfies { label: string; value: number; icon: LucideIcon }[]
        ).map(({ label, value, icon: Icon }) => (
          <Card key={label} variant="solid" className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted">{label}</p>
              <Icon size={16} className="text-brand-500" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-bold text-text-primary">{value}</p>
          </Card>
        ))}
      </div>

      {!activeTemplate && (
        <Card variant="solid" className="border-warning/30 bg-warning-soft/40 p-4 text-sm text-warning">
          No active NDA template exists. Candidates will remain on the NDA gate until an administrator activates one.
        </Card>
      )}

      {showCreate && (
        <Card variant="solid" className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-text-primary">Create NDA template</h3>
          <p className="mt-1 text-xs text-text-muted">
            Paste client-approved legal text only. Activated content becomes immutable signing evidence through its SHA-256 hash.
          </p>
          <form action={createAction} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="nda-version">Version</label>
                <Input id="nda-version" name="version" required placeholder="1.0" maxLength={50} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="nda-title">Title</label>
                <Input id="nda-title" name="title" required placeholder="TechPath Candidate Non-Disclosure Agreement" maxLength={200} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="nda-effective">Effective from</label>
              <Input id="nda-effective" name="effectiveFrom" type="datetime-local" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="nda-content">Agreement content</label>
              <Textarea id="nda-content" name="content" required rows={16} maxLength={100000} className="font-mono text-xs leading-6" />
            </div>
            <label className="flex items-start gap-2 text-sm text-text-primary">
              <input name="activateNow" type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" />
              Activate immediately and require every eligible candidate without this version to sign it.
            </label>
            {createState.error && <p className="text-sm text-danger" role="alert">{createState.error}</p>}
            {createState.success && <p className="text-sm text-success">Template created.</p>}
            <CreateButton />
          </form>
        </Card>
      )}

      <Card variant="solid" className="overflow-hidden">
        <div className="border-b border-border-subtle px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">Template versions</h3>
        </div>
        {activationError && <p className="mx-5 mt-4 text-sm text-danger" role="alert">{activationError}</p>}
        <div className="divide-y divide-border-subtle">
          {templates.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">No NDA templates created.</p>
          ) : templates.map((template) => (
            <div key={template.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text-primary">{template.title}</p>
                  <Badge variant={template.isActive ? "success" : "muted"}>{template.isActive ? "Active" : `Version ${template.version}`}</Badge>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Effective {formatDate(template.effectiveFrom)} · Created by {template.createdByEmail}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">Hash: {template.documentHash.slice(0, 16)}… · {template.signedCount} active signed · {template.supersededCount} historical</p>
              </div>
              {!template.isActive && (
                <Button type="button" size="sm" variant="outline" disabled={isActivating} onClick={() => activate(template.id)}>
                  Activate version
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {pendingCandidates.length > 0 && (
        <Card variant="solid" className="overflow-hidden">
          <div className="border-b border-border-subtle px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">Candidates awaiting active NDA</h3>
          </div>
          <div className="divide-y divide-border-subtle">
            {pendingCandidates.map((candidate) => (
              <div key={candidate.candidateId} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/admin/candidates/${candidate.candidateId}`} className="text-sm font-medium text-brand-600 hover:underline">{candidate.candidateName}</Link>
                  <p className="text-xs text-text-muted">{candidate.candidateEmail}</p>
                </div>
                <Badge variant="warning">NDA pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card variant="solid" className="overflow-hidden">
        <div className="border-b border-border-subtle px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">Signature history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/70 text-xs text-text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Candidate</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Signed</th>
                <th className="px-5 py-3 font-medium">Copy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {agreements.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-text-muted">No NDA activity yet.</td></tr>
              ) : agreements.map((agreement) => (
                <tr key={agreement.id}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/candidates/${agreement.candidateId}`} className="font-medium text-text-primary hover:text-brand-600">{agreement.candidateName}</Link>
                    <p className="text-xs text-text-muted">{agreement.candidateEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{agreement.templateVersion}</td>
                  <td className="px-5 py-3"><Badge variant={agreement.status === "signed" ? "success" : agreement.status === "superseded" ? "muted" : "warning"}>{agreement.status}</Badge></td>
                  <td className="px-5 py-3 text-text-muted">{formatDate(agreement.acceptedAt)}</td>
                  <td className="px-5 py-3">
                    {agreement.signedDocumentPath ? (
                      <Button asChild size="sm" variant="outline"><Link href={`/api/nda-agreements/${agreement.id}/download`}>Download</Link></Button>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
