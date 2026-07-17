"use client";

import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export function AnnouncementCard({
  title,
  body,
  createdAt,
  isRead,
  onMarkRead,
}: {
  title: string;
  body: string;
  createdAt: Date | string;
  isRead: boolean;
  onMarkRead?: () => void;
}) {
  return (
    <Card
      variant="glass"
      hover={isRead ? "none" : "lift"}
      className={cn(
        "relative overflow-hidden p-5",
        !isRead && "cursor-pointer",
      )}
      aria-label={isRead ? undefined : `Unread announcement: ${title}`}
      onClick={!isRead ? onMarkRead : undefined}
      onKeyDown={
        !isRead && onMarkRead
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMarkRead();
              }
            }
          : undefined
      }
      role={!isRead ? "button" : undefined}
      tabIndex={!isRead ? 0 : undefined}
    >
      {!isRead && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 brand-gradient"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2 mb-1.5">
        <Megaphone size={14} className="text-accent flex-shrink-0" aria-hidden="true" />
        <time className="text-xs text-text-muted" dateTime={String(createdAt)}>
          {formatDate(createdAt)}
        </time>
        {!isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead?.();
            }}
            className="ml-auto"
            aria-label={`Mark "${title}" as read`}
          >
            <Badge variant="accent">New</Badge>
          </button>
        )}
      </div>
      <h3 className="text-sm font-medium mb-1 text-text-primary">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{body}</p>
    </Card>
  );
}
