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
  /** Present for 1-to-1 messaging; used for optimistic merge */
  senderId?: string;
  receiverId?: string;
};

export function ChatThread({
  recruiterName,
  messages,
  onSend,
  onMount,
  isStaff = false,
  partnerRole,
}: {
  recruiterName: string;
  messages: ChatMessage[];
  onSend: (body: string) => Promise<{ error?: string }>;
  onMount?: () => void;
  isStaff?: boolean;
  /** Role of the person on the other side of the thread (staff view). */
  partnerRole?: string;
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

  const staffSubtitle =
    partnerRole === "recruiter"
      ? "Recruiter"
      : partnerRole === "candidate"
        ? "Candidate"
        : partnerRole === "admin"
          ? "Admin"
          : "Portal user";

  return (
    <section
      aria-label={`Conversation with ${recruiterName}`}
      className="bg-white border border-border-strong/50 rounded-2xl overflow-hidden flex flex-col shadow-xs min-h-[55vh] max-h-[calc(100vh-14rem)] w-full"
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border-strong/45 flex-shrink-0 bg-white">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-brand-500 text-white shadow-xs border border-brand-500/20"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <div className="text-sm font-bold text-text-primary leading-tight">{recruiterName}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-success font-semibold mt-0.5">
            <span
              className="rounded-full w-1.5 h-1.5 bg-success"
              aria-hidden="true"
            />
            {isStaff ? staffSubtitle : "Usually replies within a few hours"}
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0 bg-surface/10"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Message history"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-center py-12 text-text-muted font-medium">
            {isStaff ? `No messages yet. Say hello to ${recruiterName}.` : "No messages yet. Say hello to your recruiter."}
          </p>
        ) : (
          messages.map((m) => {
            const isMyMessage = isStaff ? m.senderRole === "recruiter" : m.senderRole === "candidate";
            const isOptimistic = m.id.startsWith("optimistic-");

            return (
              <div
                key={m.id}
                className={cn("flex", isMyMessage ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[70%]">
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium shadow-xs border",
                      isMyMessage
                        ? "bg-brand-500 text-white border-brand-500 rounded-br-sm"
                        : "bg-white text-text-primary border-border-strong/40 rounded-bl-sm",
                      isOptimistic && "opacity-80",
                    )}
                  >
                    {m.body}
                  </div>
                  <time
                    className={cn(
                      "text-[10px] mt-1.5 block text-text-muted font-semibold px-1",
                      isMyMessage && "text-right",
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

      <div className="flex-shrink-0 bg-white">
        <ChatInput
          onSend={onSend}
          placeholder={isStaff ? `Write a message to ${recruiterName}...` : "Write a message to your recruiter..."}
        />
      </div>
    </section>
  );
}
