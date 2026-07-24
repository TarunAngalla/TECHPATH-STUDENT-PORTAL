"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidateAnnouncementsPulseAction } from "@/lib/actions/announcements";

const DEFAULT_INTERVAL_MS = 4000;

type AnnouncementPreview = {
  id: string;
  title: string;
  createdAt: Date | string;
  isRead: boolean;
};

/** Poll announcements so the bell badge updates when staff schedule interviews/assessments. */
export function useCandidateAnnouncements(
  initialUnread: number,
  initialAnnouncements: AnnouncementPreview[],
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const lastUnreadRef = useRef(initialUnread);

  useEffect(() => {
    setUnreadCount(initialUnread);
    setAnnouncements(initialAnnouncements);
    lastUnreadRef.current = initialUnread;
  }, [initialUnread, initialAnnouncements]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const result = await getCandidateAnnouncementsPulseAction();
        if (cancelled) return;
        setUnreadCount(result.unreadCount);
        setAnnouncements(
          result.announcements.map((a) => ({
            id: a.id,
            title: a.title,
            createdAt: a.createdAt,
            isRead: a.isRead,
          })),
        );
        if (result.unreadCount > lastUnreadRef.current) {
          router.refresh();
        }
        lastUnreadRef.current = result.unreadCount;
      } catch {
        // Keep last known values.
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
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, router]);

  return { unreadCount, announcements };
}
