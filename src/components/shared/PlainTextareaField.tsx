"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { SaveConfirmation } from "./SaveConfirmation";

export function PlainTextareaField({
  id,
  value,
  onSave,
  placeholder = "",
  rows = 2,
  readOnly = false,
}: {
  id: string;
  value: string;
  onSave: (value: string) => Promise<{ error?: string }>;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}) {
  const [text, setText] = useState(value);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBlur = () => {
    if (readOnly || text === value) return;
    startTransition(async () => {
      const result = await onSave(text);
      if (result.error) {
        setMessage(result.error);
        setText(value);
      } else {
        setMessage("Saved");
        setTimeout(() => setMessage(null), 2000);
      }
    });
  };

  return (
    <div className="relative">
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        readOnly={readOnly || isPending}
        className={cn(
          "w-full px-2 py-1.5 rounded text-xs outline-none resize-y border border-border-subtle text-text-primary",
          "focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent",
          readOnly ? "bg-surface text-text-muted" : "bg-surface-elevated",
        )}
      />
      <div className="absolute right-1 top-1">
        <SaveConfirmation message={message} />
      </div>
    </div>
  );
}
