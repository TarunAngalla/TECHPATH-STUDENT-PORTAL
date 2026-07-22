"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_PAGE_TITLES, adminPathToNavKey } from "@/lib/constants/admin-nav";
import type { UserRole } from "@/lib/auth/session-config";
import { useScrollToTopOnRouteChange } from "@/lib/hooks/useScrollToTopOnRouteChange";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminPortalShell({
  children,
  staffName,
  staffInitials,
  staffRole,
  portalSubtitle,
  newLeadsBadge,
  unreadMessages,
}: {
  children: React.ReactNode;
  staffName: string;
  staffInitials: string;
  staffRole: Extract<UserRole, "recruiter" | "admin">;
  portalSubtitle: string;
  newLeadsBadge: number;
  unreadMessages: number;
}) {
  const pathname = usePathname();
  useScrollToTopOnRouteChange();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navKey = adminPathToNavKey(pathname);
  const title = staffRole === "recruiter" && navKey === "candidates"
    ? "My Candidates"
    : ADMIN_PAGE_TITLES[navKey];

  return (
    <div className="min-h-screen flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 glass rounded-xl text-sm font-medium text-text-primary shadow-elevated"
      >
        Skip to main content
      </a>
      <AdminSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        newLeadsBadge={newLeadsBadge}
        unreadMessages={unreadMessages}
        collapsed={collapsed}
        staffRole={staffRole}
        portalSubtitle={portalSubtitle}
      />
      <div className="flex-1 min-w-0">
        <AdminTopbar
          title={title}
          setMobileOpen={setMobileOpen}
          staffName={staffName}
          staffInitials={staffInitials}
          unreadMessages={unreadMessages}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main id="main-content" className="px-5 sm:px-8 py-6 max-w-[1500px] mx-auto w-full" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
