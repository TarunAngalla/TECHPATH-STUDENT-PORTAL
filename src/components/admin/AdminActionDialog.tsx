"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export type AdminActionField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox";
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
};

export type AdminActionDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  fields?: AdminActionField[];
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  error?: string | null;
  dangerActionLabel?: string;
  onClose: () => void;
  onConfirm: (values: Record<string, string | boolean>) => void;
  onDangerAction?: () => void;
};

export function AdminActionDialog({
  open,
  title,
  description,
  fields = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  pending = false,
  error = null,
  dangerActionLabel,
  onClose,
  onConfirm,
  onDangerAction,
}: AdminActionDialogProps) {
  const titleId = useId();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string | boolean> = {};
    for (const field of fields) {
      if (field.type === "checkbox") {
        next[field.name] = Boolean(field.defaultValue);
      } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
        next[field.name] = String(field.defaultValue);
      } else {
        next[field.name] = "";
      }
    }
    setValues(next);
    setLocalError(null);
    // Reset only when the dialog opens; field config is set by the caller for that open cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    for (const field of fields) {
      if (!field.required) continue;
      const value = values[field.name];
      if (field.type === "checkbox") continue;
      if (typeof value !== "string" || !value.trim()) {
        setLocalError(`${field.label} is required.`);
        return;
      }
    }
    setLocalError(null);
    onConfirm(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        disabled={pending}
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border-strong/50 bg-white p-5 shadow-elevated"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-base font-bold text-text-primary">
              {title}
            </h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>}
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-text-muted hover:bg-surface hover:text-text-primary disabled:opacity-50"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {fields.map((field) => {
            const id = `${titleId}-${field.name}`;
            if (field.type === "checkbox") {
              return (
                <label key={field.name} htmlFor={id} className="flex items-start gap-2 text-xs text-text-primary">
                  <input
                    id={id}
                    type="checkbox"
                    className="mt-0.5 rounded border-border-strong"
                    checked={Boolean(values[field.name])}
                    disabled={pending}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.checked }))
                    }
                  />
                  <span>
                    <span className="font-semibold">{field.label}</span>
                    {field.helpText && <span className="mt-0.5 block text-text-muted">{field.helpText}</span>}
                  </span>
                </label>
              );
            }

            return (
              <div key={field.name}>
                <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold text-text-muted">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={id}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={pending}
                    rows={4}
                    className="text-xs"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  />
                ) : (
                  <Input
                    id={id}
                    type={field.type === "number" ? "number" : "text"}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={pending}
                    min={field.min}
                    max={field.max}
                    className="h-9 text-xs"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.name]: event.target.value }))
                    }
                  />
                )}
                {field.helpText && <p className="mt-1 text-[11px] text-text-muted">{field.helpText}</p>}
              </div>
            );
          })}

          {(localError || error) && (
            <p className="text-xs font-semibold text-danger" role="alert">
              {localError || error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {dangerActionLabel && onDangerAction ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDangerAction}
                  disabled={pending}
                  className="text-danger hover:bg-danger-soft hover:text-danger"
                >
                  {dangerActionLabel}
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
                {cancelLabel}
              </Button>
              <Button
                type="submit"
                size="sm"
                variant={danger ? "danger" : "primary"}
                loading={pending}
                disabled={pending}
                className={cn(!danger && "bg-brand-500 hover:bg-brand-600")}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
