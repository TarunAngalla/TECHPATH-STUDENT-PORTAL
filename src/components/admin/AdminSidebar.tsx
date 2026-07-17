"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { adminLogoutAction } from "@/lib/actions/auth";
import { ADMIN_NAV_SECTIONS } from "@/lib/constants/admin-nav";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export function AdminSidebar({
  mobileOpen,
  setMobileOpen,
  newLeadsBadge,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  newLeadsBadge?: number;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 lg:hidden bg-brand-700/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={cn(
          "fixed lg:static z-30 top-0 left-0 h-full w-64 flex flex-col transition-transform lg:translate-x-0 glass-dark shadow-elevated",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <Logo dark subtitle="Admin console" />
          <button
            type="button"
            className="lg:hidden text-white/80 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Main navigation">
          {ADMIN_NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={si > 0 ? "mt-5" : ""}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const badge =
                    item.badgeKey === "newLeads" ? newLeadsBadge : undefined;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "bg-white/12 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/6",
                      )}
                    >
                      <item.icon size={17} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {badge != null && badge > 0 && (
                        <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                          {badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <form action={adminLogoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-colors"
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
