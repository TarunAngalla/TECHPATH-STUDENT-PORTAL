"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Application } from "@/lib/db/schema";
import { CANDIDATE_PAGE_TITLES, type CandidateNavKey } from "@/lib/constants/candidate-nav";
import { useScrollToTopOnRouteChange } from "@/lib/hooks/useScrollToTopOnRouteChange";
import { PageTransition } from "@/components/motion/PageTransition";
import { CandidateSidebar } from "./CandidateSidebar";
import { CandidateTopbar } from "./CandidateTopbar";

function pathToNavKey(pathname: string): CandidateNavKey {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  if (segment in CANDIDATE_PAGE_TITLES) return segment as CandidateNavKey;
  return "dashboard";
}

export function CandidatePortalShell({
  children,
  candidateName,
  messageBadge,
  unreadAnnouncements,
  announcements,
  applications,
}: {
  children: React.ReactNode;
  candidateName: string;
  messageBadge: number;
  unreadAnnouncements: number;
  announcements: { id: string; title: string; createdAt: Date | string; isRead: boolean }[];
  applications: Application[];
}) {
  const pathname = usePathname();
  useScrollToTopOnRouteChange();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navKey = pathToNavKey(pathname);
  const title = CANDIDATE_PAGE_TITLES[navKey];

  return (
    <div className="min-h-screen flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 glass rounded-xl text-sm font-medium text-text-primary shadow-elevated"
      >
        Skip to main content
      </a>
      <CandidateSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        messageBadge={messageBadge}
        collapsed={collapsed}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <CandidateTopbar
          title={title}
          setMobileOpen={setMobileOpen}
          candidateName={candidateName}
          unreadAnnouncements={unreadAnnouncements}
          announcements={announcements}
          applications={applications}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main id="main-content" className="flex-1 px-5 sm:px-8 py-6 flex flex-col" tabIndex={-1}>
          <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col">
            <div className="flex-1">
              <PageTransition key={pathname}>{children}</PageTransition>
            </div>
            <PortalFooter />
          </div>
        </main>
      </div>
    </div>
  );
}

function PortalFooter() {
  return (
    <footer className="glass rounded-2xl flex flex-wrap items-center justify-between gap-3 mt-8 px-5 py-4 text-xs text-text-muted shadow-glass">
      <span>© 2026 the tech path. All rights reserved.</span>
      <div className="flex items-center gap-4">
        <Link href="/help" className="hover:text-text-primary transition-colors">
          Help & support
        </Link>
        <Link href="/messages" className="hover:text-text-primary transition-colors">
          Contact recruiter
        </Link>
        <span>Privacy policy</span>
      </div>
    </footer>
  );
}
