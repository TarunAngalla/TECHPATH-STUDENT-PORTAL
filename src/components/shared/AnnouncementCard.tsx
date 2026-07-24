"use client";

import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate, formatIsoTimestampsInText } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export function AnnouncementCard({
  id,
  title,
  body,
  createdAt,
  isRead,
  onMarkRead,
}: {
  id?: string;
  title: string;
  body: string;
  createdAt: Date | string;
  isRead: boolean;
  onMarkRead?: () => void;
}) {
  const displayBody = formatIsoTimestampsInText(body);
  return (
    <Card
      id={id}
      variant="glass"
      className={cn(
        "relative overflow-hidden p-5 bg-white shadow-xs rounded-2xl transition-all duration-200 hover:border-border-strong border scroll-mt-24",
        isRead ? "border-border-strong/40" : "border-border-strong/60 border-l-4 border-l-brand-500 bg-brand-50/5 cursor-pointer"
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
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border",
          isRead ? "bg-surface border-border-strong/30 text-text-muted" : "bg-brand-50 border-brand-100 text-brand-500"
        )}>
          <Megaphone size={12} aria-hidden="true" />
        </div>
        <time className="text-xs text-text-muted font-semibold" dateTime={toValidDateTimeAttr(createdAt)}>
          {formatDate(createdAt)}
        </time>
        {!isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead?.();
            }}
            className="ml-auto focus:outline-none"
            aria-label={`Mark "${title}" as read`}
          >
            <Badge variant="accent" className="text-[9px] font-bold px-1.5 py-0.5 rounded-md">New</Badge>
          </button>
        )}
      </div>
      <h3 className="text-sm font-bold mb-1 text-text-primary leading-tight">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed font-medium mt-1.5">{displayBody}</p>
    </Card>
  );
}

function toValidDateTimeAttr(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
