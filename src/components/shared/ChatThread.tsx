"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { ChatInput } from "./ChatInput";

export type ChatMessage = {
  id: string;
  senderRole: "candidate" | "recruiter";
  body: string;
  sentAt: Date | string;
};

export function ChatThread({
  recruiterName,
  messages,
  onSend,
  onMount,
}: {
  recruiterName: string;
  messages: ChatMessage[];
  onSend: (body: string) => Promise<{ error?: string }>;
  onMount?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages.length, prefersReducedMotion]);

  const initials = recruiterName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <section
      aria-label={`Conversation with ${recruiterName}`}
      className="glass rounded-2xl overflow-hidden flex flex-col shadow-glass min-h-[50vh] max-h-[calc(100vh-14rem)]"
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 brand-gradient text-white ring-2 ring-brand-500/20"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">{recruiterName}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-success">
            <span
              className="rounded-full w-1.5 h-1.5 bg-success"
              aria-hidden="true"
            />
            Usually replies within a few hours
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Message history"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-center py-8 text-text-muted">
            No messages yet. Say hello to your recruiter.
          </p>
        ) : (
          messages.map((m) => {
            const isCandidate = m.senderRole === "candidate";
            const isOptimistic = m.id.startsWith("optimistic-");

            return (
              <div
                key={m.id}
                className={cn("flex", isCandidate ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[75%]">
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-xl text-xs leading-relaxed",
                      isCandidate
                        ? "brand-gradient text-white rounded-br-sm"
                        : "glass text-text-primary rounded-bl-sm",
                      isOptimistic && "opacity-80",
                    )}
                  >
                    {m.body}
                  </div>
                  <time
                    className={cn(
                      "text-[10px] mt-1 block text-text-muted",
                      isCandidate && "text-right",
                    )}
                    dateTime={String(m.sentAt)}
                  >
                    {isOptimistic ? "Sending…" : formatDateTime(m.sentAt)}
                  </time>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0">
        <ChatInput onSend={onSend} />
      </div>
    </section>
  );
}
