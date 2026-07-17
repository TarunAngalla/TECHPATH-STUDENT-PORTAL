"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCandidateMessages,
  markMessagesRead,
  sendCandidateMessage,
} from "@/lib/actions/messages";
import { ChatThread } from "@/components/shared/ChatThread";
import type { ChatMessage } from "@/components/shared/ChatThread";

const POLL_INTERVAL_MS = 10_000;

function mergeWithOptimistic(server: ChatMessage[], current: ChatMessage[]): ChatMessage[] {
  const optimistic = current.filter((m) => m.id.startsWith("optimistic-"));
  if (optimistic.length === 0) return server;

  const serverCandidateBodies = new Set(
    server.filter((m) => m.senderRole === "candidate").map((m) => m.body),
  );
  const pending = optimistic.filter((o) => !serverCandidateBodies.has(o.body));

  return [...server, ...pending].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

export function CandidateMessagesPage({
  candidateId,
  recruiterName,
  messages: initialMessages,
}: {
  candidateId: string;
  recruiterName: string;
  messages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages((current) => mergeWithOptimistic(initialMessages, current));
  }, [initialMessages]);

  const refreshMessages = useCallback(async () => {
    const result = await fetchCandidateMessages(candidateId);
    if (result.messages) {
      setMessages((current) => mergeWithOptimistic(result.messages!, current));
    }
  }, [candidateId]);

  useEffect(() => {
    const handleMount = () => {
      markMessagesRead(candidateId);
    };
    handleMount();
  }, [candidateId]);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    };

    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", poll);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [refreshMessages]);

  const handleSend = useCallback(
    async (body: string) => {
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        senderRole: "candidate",
        body,
        sentAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      const result = await sendCandidateMessage(candidateId, body);
      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return { error: result.error };
      }

      await refreshMessages();
      return {};
    },
    [candidateId, refreshMessages],
  );

  return (
    <ChatThread
      recruiterName={recruiterName}
      messages={messages}
      onSend={handleSend}
    />
  );
}
