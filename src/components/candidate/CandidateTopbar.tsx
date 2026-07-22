"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, HelpCircle, LogOut, MessageCircle, Settings, PanelLeft, PanelLeftClose } from "lucide-react";
import { candidateLogoutAction } from "@/lib/actions/auth";
import type { Application } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { CommandPalette } from "./CommandPalette";

type AnnouncementPreview = {
  id: string;
  title: string;
  createdAt: Date | string;
  isRead: boolean;
};

export function CandidateTopbar({
  title,
  setMobileOpen,
  candidateName,
  unreadAnnouncements,
  unreadMessages,
  announcements,
  applications,
  collapsed,
  setCollapsed,
}: {
  title: string;
  setMobileOpen: (open: boolean) => void;
  candidateName: string;
  unreadAnnouncements: number;
  unreadMessages: number;
  announcements: AnnouncementPreview[];
  applications: Application[];
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const recent = announcements.slice(0, 3);
  const unreadTotal = unreadAnnouncements + unreadMessages;

  return (
    <>
      <header className="bg-surface-elevated/95 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 gap-4 border-b border-border-subtle shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="lg:hidden flex-shrink-0 p-1 rounded-lg hover:bg-brand-50 transition-colors"
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

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:inline-flex gap-2 text-text-muted"
            aria-label="Open command palette"
          >
            <span>Search</span>
            <kbd className="inline-flex items-center gap-0.5 rounded-md border border-border-subtle bg-surface-elevated/80 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaletteOpen(true)}
            className="sm:hidden"
            aria-label="Open search"
          >
            <span className="sr-only">Search</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl hover:bg-brand-50 transition-colors"
              aria-label={
                unreadTotal > 0
                  ? `Notifications, ${unreadTotal} unread`
                  : "Notifications"
              }
              aria-expanded={notifOpen}
            >
              <Bell size={18} className="text-text-muted" aria-hidden="true" />
              {unreadTotal > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-semibold text-text-inverse bg-danger border-[1.5px] border-surface-elevated px-0.5">
                  {unreadTotal}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close notifications"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl glass shadow-elevated overflow-hidden z-20 animate-in fade-in-0 zoom-in-95">
                  <div className="px-4 py-3 text-xs font-medium text-text-primary border-b border-border-subtle">
                    Notifications
                  </div>
                  {unreadMessages > 0 && (
                    <Link
                      href="/messages"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 border-b border-border-subtle px-4 py-3 hover:bg-brand-50/60"
                    >
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <MessageCircle size={14} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-text-primary">Recruiter messages</span>
                        <span className="block text-[11px] text-text-muted">{unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}</span>
                      </span>
                    </Link>
                  )}
                  {recent.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-text-muted">No announcements yet.</p>
                  ) : (
                    recent.map((a) => (
                      <div
                        key={a.id}
                        className="px-4 py-3 flex items-start gap-2 border-b border-border-subtle last:border-0"
                      >
                        <span
                          className={cn(
                            "rounded-full flex-shrink-0 w-1.5 h-1.5 mt-1.5",
                            a.isRead ? "bg-border-subtle" : "bg-brand-500",
                          )}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-text-primary truncate">
                            {a.title}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {formatDate(a.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Link
                    href="/announcements"
                    onClick={() => setNotifOpen(false)}
                    className="block w-full py-2.5 text-center text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    View all announcements
                  </Link>
                </div>
              </>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <Avatar name={candidateName} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <div className="px-3 py-2 text-xs text-text-muted truncate">{candidateName}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings size={14} aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/messages")}>
                <MessageCircle size={14} aria-hidden="true" />
                Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/resources")}>
                <HelpCircle size={14} aria-hidden="true" />
                Help & Resources
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={candidateLogoutAction}>
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger outline-none hover:bg-danger-soft transition-colors"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Logout
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette
        applications={applications}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </>
  );
}
