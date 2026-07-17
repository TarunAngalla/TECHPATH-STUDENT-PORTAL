"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ChatInput({
  onSend,
  placeholder = "Write a message to your recruiter...",
  disabled = false,
}: {
  onSend: (body: string) => Promise<{ error?: string }>;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    const body = draft.trim();
    if (!body || isPending || disabled) return;

    startTransition(async () => {
      const result = await onSend(body);
      if (result.error) {
        setError(result.error);
      } else {
        setDraft("");
        setError(null);
      }
    });
  };

  const canSend = draft.trim().length > 0 && !isPending && !disabled;

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle">
        <label htmlFor="chat-message-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-message-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || isPending}
          className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none border border-border-subtle bg-surface-elevated text-text-primary placeholder:text-text-muted focus:border-brand-500/40 transition-colors"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
            canSend
              ? "brand-gradient text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              : "bg-border-subtle text-text-muted cursor-not-allowed",
          )}
          aria-label="Send message"
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="px-4 pb-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {isPending ? "Sending message…" : ""}
      </div>
    </div>
  );
}
