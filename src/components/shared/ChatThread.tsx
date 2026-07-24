"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui";
import { ChatInput } from "./ChatInput";

export type ChatMessage = {
  id: string;
  senderRole: "candidate" | "recruiter";
  body: string;
  sentAt: Date | string;
  /** Present for 1-to-1 messaging; used for optimistic merge */
  senderId?: string;
  receiverId?: string;
  /** When the receiver read this message (null if unread / unknown) */
  seenAt?: Date | string | null;
};

export function ChatThread({
  recruiterName,
  avatarUrl = null,
  messages,
  onSend,
  onMount,
  isStaff = false,
  partnerRole,
}: {
  recruiterName: string;
  avatarUrl?: string | null;
  messages: ChatMessage[];
  onSend: (body: string) => Promise<{ error?: string }>;
  onMount?: () => void;
  isStaff?: boolean;
  /** Role of the person on the other side of the thread (staff view). */
  partnerRole?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Keep scroll inside the message pane — never scroll the document/window.
    list.scrollTo({
      top: list.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages.length, prefersReducedMotion]);

  const staffSubtitle =
    partnerRole === "recruiter"
      ? "Recruiter"
      : partnerRole === "candidate"
        ? "Candidate"
        : partnerRole === "admin"
          ? "Admin"
          : "Portal user";

  const isMine = (m: ChatMessage) =>
    isStaff ? m.senderRole === "recruiter" : m.senderRole === "candidate";

  const lastMessage = messages[messages.length - 1];
  const showSeen = Boolean(
    lastMessage &&
      isMine(lastMessage) &&
      !lastMessage.id.startsWith("optimistic-") &&
      lastMessage.seenAt,
  );

  return (
    <section
      aria-label={`Conversation with ${recruiterName}`}
      className="bg-white border border-border-strong/50 rounded-2xl overflow-hidden flex flex-col shadow-xs h-full min-h-0 w-full"
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border-strong/45 flex-shrink-0 bg-white">
        <Avatar name={recruiterName} src={avatarUrl} size="md" className="flex-shrink-0 shadow-xs" />
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
        ref={listRef}
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
          <>
            {messages.map((m) => {
              const isMyMessage = isMine(m);
              const isOptimistic = m.id.startsWith("optimistic-");
              const showTimestamp = isOptimistic || expandedId === m.id;

              return (
                <div
                  key={m.id}
                  className={cn("flex", isMyMessage ? "justify-end" : "justify-start")}
                >
                  <div className="max-w-[70%]">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) => (current === m.id ? null : m.id))
                      }
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium shadow-xs border cursor-pointer transition-opacity",
                        isMyMessage
                          ? "bg-brand-500 text-white border-brand-500 rounded-br-sm"
                          : "bg-white text-text-primary border-border-strong/40 rounded-bl-sm",
                        isOptimistic && "opacity-80",
                      )}
                      aria-expanded={showTimestamp}
                      aria-label={
                        showTimestamp
                          ? "Hide message time"
                          : "Show message time"
                      }
                    >
                      {m.body}
                    </button>
                    {showTimestamp && (
                      <time
                        className={cn(
                          "text-[10px] mt-1.5 block text-text-muted font-semibold px-1",
                          isMyMessage && "text-right",
                        )}
                        dateTime={String(m.sentAt)}
                      >
                        {isOptimistic ? "Sending…" : formatDateTime(m.sentAt)}
                      </time>
                    )}
                  </div>
                </div>
              );
            })}
            {showSeen && (
              <p className="text-[10px] text-right text-text-muted font-semibold px-1 -mt-1">
                Seen
              </p>
            )}
          </>
        )}
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
