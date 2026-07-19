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
  collapsed = false,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  messageBadge?: number;
  collapsed?: boolean;
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
          "glass-dark fixed lg:sticky z-30 top-0 left-0 h-full lg:h-screen flex flex-col transition-all duration-300 shadow-elevated",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-64 lg:w-20" : "w-64",
        )}
      >
        <div className={cn("py-5 flex items-center justify-between border-b border-white/10", collapsed ? "px-4" : "px-5")}>
          <Logo dark subtitle="Candidate portal" collapsed={collapsed} />
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
              {!collapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {section.label}
                </div>
              )}
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
                        "relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                        collapsed ? "justify-center px-3 py-3 gap-0" : "px-3 py-2.5 gap-3",
                        active
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={17} aria-hidden="true" />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      <AnimatePresence>
                        {badge != null && badge > 0 && (
                          <motion.span
                            key="badge"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className={cn(
                              "text-[10px] font-semibold rounded-full bg-danger text-text-inverse",
                              collapsed ? "absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center" : "px-1.5 py-0.5"
                            )}
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

        {!collapsed && (
          <div className="mx-3 my-2 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80">
            <div className="font-semibold mb-1 text-white">Need Help?</div>
            <div className="text-[10px] text-white/50 mb-2">{"We're here to support you."}</div>
            <a
              href="mailto:support@thetechpath.com"
              className="text-[11px] font-medium text-brand-100 hover:underline block truncate"
            >
              support@thetechpath.com
            </a>
          </div>
        )}

        <div className="p-3 border-t border-white/10">
          <form action={candidateLogoutAction}>
            <button
              type="submit"
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200",
                collapsed ? "justify-center px-3 py-3 gap-0" : "px-3 py-2.5 gap-3"
              )}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut size={17} aria-hidden="true" />
              {!collapsed && <span>Logout</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
