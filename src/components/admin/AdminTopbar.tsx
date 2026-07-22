"use client";

import { useState } from "react";
import { Bell, Search, PanelLeft, PanelLeftClose } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export function AdminTopbar({
  title,
  setMobileOpen,
  staffName,
  unreadMessages,
  collapsed,
  setCollapsed,
}: {
  title: string;
  setMobileOpen: (open: boolean) => void;
  staffName: string;
  staffInitials?: string;
  unreadMessages: number;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 gap-4 bg-surface-elevated/95 backdrop-blur-md border-b border-border-subtle shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden flex-shrink-0"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <div className="space-y-1" aria-hidden="true">
            <div className="w-5 h-0.5 bg-text-primary rounded-full" />
            <div className="w-5 h-0.5 bg-text-primary rounded-full" />
            <div className="w-5 h-0.5 bg-text-primary rounded-full" />
          </div>
        </button>
        <button
          type="button"
          className="hidden lg:flex flex-shrink-0 p-1 rounded-lg hover:bg-brand-50 text-text-muted hover:text-text-primary transition-colors mr-1"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <h1 className="text-base font-semibold truncate text-text-primary">{title}</h1>
      </div>

      <form action="/admin/candidates" method="get" className="hidden md:flex items-center flex-1 max-w-xs relative">
        <Search
          size={14}
          className="absolute left-3 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <label htmlFor="admin-search" className="sr-only">
          Search candidates
        </label>
        <Input
          id="admin-search"
          name="q"
          placeholder="Search candidates..."
          className="pl-9 h-9 text-xs bg-surface/60"
        />
      </form>

      <div className="flex items-center gap-4 flex-shrink-0 relative">
        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative text-text-muted hover:text-text-primary transition-colors"
          aria-label={
            unreadMessages > 0
              ? `Notifications, ${unreadMessages} unread candidate messages`
              : "Notifications"
          }
          aria-expanded={notifOpen}
        >
          <Bell size={18} aria-hidden="true" />
          {unreadMessages > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full",
                "flex items-center justify-center text-[9px] font-semibold text-white",
                "bg-danger border-[1.5px] border-surface-elevated px-0.5",
              )}
            >
              {unreadMessages}
            </span>
          )}
        </button>
        {notifOpen && (
          <Card
            variant="glass"
            className="absolute right-10 top-8 w-72 overflow-hidden z-20 shadow-elevated !rounded-xl"
          >
            <div className="px-4 py-3 text-xs font-medium border-b border-border-subtle text-text-primary">
              Candidate messages
            </div>
            <p className="px-4 py-3 text-xs text-text-muted">
              {unreadMessages > 0
                ? `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"} from candidates.`
                : "No unread candidate messages."}
            </p>
          </Card>
        )}
        <Avatar name={staffName} size="sm" className="ring-2 ring-brand-500/20" />
      </div>
    </header>
  );
}
