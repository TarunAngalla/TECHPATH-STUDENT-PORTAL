"use client";

import { useEffect, useState } from "react";
import { getUnreadMessagesCountAction } from "@/lib/actions/messages";

const DEFAULT_INTERVAL_MS = 4000;
export const MESSAGES_READ_EVENT = "techpath:messages-read";

/** Poll unread inbox count so sidebar/topbar badges update without a full page refresh. */
export function useUnreadMessageCount(initialCount: number, intervalMs = DEFAULT_INTERVAL_MS) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const result = await getUnreadMessagesCountAction();
        if (!cancelled && typeof result.count === "number") {
          setCount(result.count);
        }
      } catch {
        // Keep the last known count if a poll fails.
      }
    };

    const schedule = () => {
      window.clearInterval(timer);
      timer = window.setInterval(poll, intervalMs);
    };

    void poll();
    schedule();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll();
        schedule();
      }
    };
    const onMessagesRead = () => {
      void poll();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(MESSAGES_READ_EVENT, onMessagesRead);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(MESSAGES_READ_EVENT, onMessagesRead);
    };
  }, [intervalMs]);

  return count;
}

export function notifyMessagesRead() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
  }
}
