"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_PAGE_TITLES, adminPathToNavKey } from "@/lib/constants/admin-nav";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminPortalShell({
  children,
  staffName,
  staffInitials,
  newLeadsBadge,
  unreadMessages,
}: {
  children: React.ReactNode;
  staffName: string;
  staffInitials: string;
  newLeadsBadge: number;
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navKey = adminPathToNavKey(pathname);
  const title = ADMIN_PAGE_TITLES[navKey];

  return (
    <div className="min-h-screen flex">
      <AdminSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        newLeadsBadge={newLeadsBadge}
      />
      <div className="flex-1 min-w-0">
        <AdminTopbar
          title={title}
          setMobileOpen={setMobileOpen}
          staffName={staffName}
          staffInitials={staffInitials}
          unreadMessages={unreadMessages}
        />
        <main className="px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
