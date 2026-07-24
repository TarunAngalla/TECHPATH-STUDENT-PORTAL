"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Centered pop-out overlay (command-palette style: blur + ESC). */
export function StaffFormModal({
  open,
  title,
  onClose,
  children,
  className,
  pending = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm"
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
        className={cn(
          "relative z-10 my-8 w-full max-w-2xl rounded-2xl border border-border-strong/50 bg-white p-5 shadow-elevated sm:my-4",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <h2 id={titleId} className="text-base font-bold text-text-primary">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-border-strong/50 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
              ESC
            </kbd>
            <button
              type="button"
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary disabled:opacity-50"
              onClick={onClose}
              disabled={pending}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
