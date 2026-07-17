"use client";

import { useTransition } from "react";
import { markAnnouncementRead } from "@/lib/actions/announcements";
import { AnnouncementCard } from "@/components/shared/AnnouncementCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { StaggerChildren, StaggerItem } from "@/components/motion/PageTransition";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  createdAt: Date | string;
  isRead: boolean;
};

export function CandidateAnnouncementsFeed({
  announcements,
  candidateId,
}: {
  announcements: AnnouncementItem[];
  candidateId: string;
}) {
  const [, startTransition] = useTransition();

  const handleMarkRead = (announcementId: string) => {
    startTransition(() => {
      markAnnouncementRead(announcementId, candidateId);
    });
  };

  if (announcements.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <EmptyState
          title="No announcements yet"
          note="Updates about your applications, interviews, and profile will appear here."
        />
      </Card>
    );
  }

  return (
    <section aria-labelledby="announcements-feed-heading">
      <h2 id="announcements-feed-heading" className="sr-only">
        Announcements
      </h2>
      <div role="feed" aria-label="Announcements feed">
        <StaggerChildren className="space-y-3">
          {announcements.map((a) => (
            <StaggerItem key={a.id}>
              <AnnouncementCard
                title={a.title}
                body={a.body}
                createdAt={a.createdAt}
                isRead={a.isRead}
                onMarkRead={a.isRead ? undefined : () => handleMarkRead(a.id)}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
      <div className="sr-only" role="status" aria-live="polite" />
    </section>
  );
}
