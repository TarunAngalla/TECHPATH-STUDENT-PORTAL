"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, MessageCircle, PanelLeft, PanelLeftClose, Search, Settings } from "lucide-react";
import { adminLogoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";
import {
  Avatar,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@/components/ui";

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
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && notifRef.current?.contains(target)) return;
      setNotifOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNotifOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notifOpen]);

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

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((open) => !open)}
            className="relative text-text-muted hover:text-text-primary transition-colors"
            aria-label={
              unreadMessages > 0
                ? `Notifications, ${unreadMessages} unread candidate messages`
                : "Notifications"
            }
            aria-expanded={notifOpen}
            aria-haspopup="true"
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
              role="menu"
              aria-label="Notifications"
              className="absolute right-0 top-full mt-2 w-72 overflow-hidden z-50 shadow-elevated !rounded-xl"
            >
              <div className="px-4 py-3 text-xs font-medium border-b border-border-subtle text-text-primary">
                Notifications
              </div>
              {unreadMessages > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    router.push("/admin/messages");
                  }}
                  className="flex w-full items-start gap-3 border-b border-border-subtle px-4 py-3 text-left hover:bg-brand-50/60 transition-colors"
                >
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <MessageCircle size={14} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-text-primary">
                      Candidate messages
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>
              ) : (
                <p className="px-4 py-3 text-xs text-text-muted">No notifications</p>
              )}
            </Card>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open profile menu"
            >
              <Avatar name={staffName} size="sm" className="ring-2 ring-brand-500/20" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <div className="px-3 py-2 text-xs text-text-muted truncate">{staffName}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
              <Settings size={14} aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/messages")}>
              <MessageCircle size={14} aria-hidden="true" />
              Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ""}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={adminLogoutAction}>
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
  );
}
