"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchConversation,
  markConversationReadAction,
  sendMessageAction,
} from "@/lib/actions/messages";
import { ChatThread } from "@/components/shared/ChatThread";
import type { ChatMessage } from "@/components/shared/ChatThread";
import { Badge, Card } from "@/components/ui";
import { MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/dates";

const POLL_INTERVAL_MS = 10_000;

type ChatThreadInfo = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  latestMessage: {
    body: string;
    sentAt: Date | string;
    senderId: string;
  } | null;
  unreadCount: number;
};

function mergeWithOptimistic(
  server: ChatMessage[],
  current: ChatMessage[],
  currentUserId: string,
): ChatMessage[] {
  const optimistic = current.filter((m) => m.id.startsWith("optimistic-"));
  if (optimistic.length === 0) return server;

  const serverMyBodies = new Set(
    server.filter((m) => m.senderId === currentUserId).map((m) => m.body),
  );
  const pending = optimistic.filter((o) => !serverMyBodies.has(o.body));

  return [...server, ...pending].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

export function CandidateMessagesPage({
  threads: initialThreads,
  selectedPartnerId: initialSelectedId,
  initialMessages,
  currentUserId,
}: {
  threads: ChatThreadInfo[];
  selectedPartnerId: string | null;
  initialMessages: { id: string; senderId: string; receiverId: string; body: string; sentAt: Date }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState(initialThreads);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, startTransition] = useTransition();

  // Convert raw message format to ChatThread expected format
  const mapMessages = useCallback(
    (rawMsgs: typeof initialMessages): ChatMessage[] => {
      return rawMsgs.map((m) => ({
        id: m.id,
        senderRole: m.senderId === currentUserId ? "candidate" : "recruiter", // mapping role back for UI alignment compatibility
        body: m.body,
        sentAt: m.sentAt,
        senderId: m.senderId,
        receiverId: m.receiverId,
      }));
    },
    [currentUserId],
  );

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  useEffect(() => {
    setMessages((current) => mergeWithOptimistic(mapMessages(initialMessages), current, currentUserId));
  }, [initialMessages, mapMessages, currentUserId]);

  const refreshActiveMessages = useCallback(async () => {
    if (!selectedId) return;
    const result = await fetchConversation(selectedId);
    if (result.messages) {
      const mapped: ChatMessage[] = result.messages.map((m) => ({
        ...m,
        senderRole: (m.senderId === currentUserId ? "candidate" : "recruiter") as
          | "candidate"
          | "recruiter",
      }));
      setMessages((current) => mergeWithOptimistic(mapped, current, currentUserId));
    }
  }, [selectedId, currentUserId]);

  useEffect(() => {
    if (selectedId) {
      void markConversationReadAction(selectedId);
      setThreads((current) =>
        current.map((t) => (t.id === selectedId ? { ...t, unreadCount: 0 } : t)),
      );
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const poll = () => {
      if (document.visibilityState === "visible") {
        void refreshActiveMessages();
      }
    };

    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", poll);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [selectedId, refreshActiveMessages]);

  const handleSelectThread = (partnerId: string) => {
    setSelectedId(partnerId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("partnerId", partnerId);
    startTransition(() => {
      router.push(`/messages?${params.toString()}`);
    });
  };

  const handleSend = useCallback(
    async (body: string) => {
      if (!selectedId) return { error: "No thread selected" };

      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        senderRole: "candidate",
        body,
        sentAt: new Date(),
        senderId: currentUserId,
        receiverId: selectedId,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      const result = await sendMessageAction(selectedId, body);
      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return { error: result.error };
      }

      await refreshActiveMessages();
      return {};
    },
    [selectedId, currentUserId, refreshActiveMessages],
  );

  const activeThread = threads.find((t) => t.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100dvh-8.5rem)] min-h-[28rem] max-h-[calc(100dvh-8.5rem)] overflow-hidden">
      {/* Sidebar Threads List */}
      <div className="lg:col-span-4 flex flex-col min-h-0 h-full bg-white border border-border-strong/50 rounded-2xl shadow-xs overflow-hidden">
        <header className="px-5 py-4 border-b border-border-strong/45 bg-white flex-shrink-0">
          <h3 className="text-sm font-bold text-text-primary">Conversations</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Chat with Admin or your assigned Recruiter</p>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
          {threads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="mx-auto text-text-muted opacity-40 mb-3" size={24} />
              <p className="text-xs text-text-muted font-semibold">No contacts available</p>
            </div>
          ) : (
            threads.map((t) => {
              const active = t.id === selectedId;
              const hasUnread = t.unreadCount > 0;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex gap-3 relative group",
                    active
                      ? "bg-brand-500/5 border-brand-500/30 text-text-primary shadow-xs"
                      : "bg-white border-border-subtle/50 text-text-primary hover:bg-surface/40 hover:border-border-strong/20",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
                      active
                        ? "bg-brand-500 text-white"
                        : "bg-surface border border-border-strong/30 text-text-muted group-hover:bg-brand-50 group-hover:text-brand-500",
                    )}
                  >
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs font-bold truncate",
                          hasUnread && "text-brand-600 font-extrabold",
                        )}
                      >
                        {t.fullName}
                      </span>
                      {t.latestMessage && (
                        <span className="text-[9px] text-text-muted font-medium whitespace-nowrap flex-shrink-0">
                          {formatDateTime(t.latestMessage.sentAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center text-[9px] font-bold text-text-muted/80 uppercase">
                        {t.role}
                      </span>
                    </div>
                    {t.latestMessage && (
                      <p
                        className={cn(
                          "text-[11px] truncate mt-1.5 leading-snug",
                          hasUnread ? "text-text-primary font-bold" : "text-text-muted",
                        )}
                      >
                        {t.latestMessage.senderId === currentUserId ? "You: " : ""}
                        {t.latestMessage.body}
                      </p>
                    )}
                  </div>

                  {hasUnread && (
                    <Badge
                      variant="accent"
                      className="absolute top-3.5 right-3.5 px-1 py-0 rounded-full text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center"
                    >
                      {t.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="lg:col-span-8 flex flex-col min-h-0 h-full overflow-hidden">
        {selectedId && activeThread ? (
          <div className="flex-1 flex flex-col min-h-0 h-full">
            <ChatThread
              recruiterName={activeThread.fullName}
              messages={messages}
              onSend={handleSend}
            />
          </div>
        ) : (
          <Card
            variant="glass"
            className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-border-strong/50 rounded-2xl shadow-xs"
          >
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-4 text-brand-500 shadow-inner">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-sm font-bold text-text-primary mb-1">Select a Conversation</h3>
            <p className="text-xs text-text-muted text-center max-w-sm leading-relaxed">
              Choose a contact from the sidebar to view message history and send a new message.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
