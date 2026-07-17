"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { candidateLogoutAction } from "@/lib/actions/auth";
import { CANDIDATE_NAV_SECTIONS } from "@/lib/constants/candidate-nav";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils/cn";

export function CandidateSidebar({
  mobileOpen,
  setMobileOpen,
  messageBadge,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  messageBadge?: number;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-text-primary/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={cn(
          "glass-dark fixed lg:static z-30 top-0 left-0 h-full w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-elevated",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <Logo dark subtitle="Candidate portal" />
          <button
            type="button"
            className="lg:hidden text-text-inverse hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Main navigation">
          {CANDIDATE_NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={si > 0 ? "mt-5" : ""}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const badge = item.key === "messages" ? messageBadge : undefined;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-white/10 text-text-inverse"
                          : "text-white/60 hover:bg-white/5 hover:text-text-inverse",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full brand-gradient shadow-glow"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          aria-hidden="true"
                        />
                      )}
                      <item.icon size={17} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      <AnimatePresence>
                        {badge != null && badge > 0 && (
                          <motion.span
                            key="badge"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-danger text-text-inverse"
                          >
                            {badge}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <form action={candidateLogoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-text-inverse hover:bg-white/5 transition-all duration-200"
            >
              <LogOut size={17} aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
