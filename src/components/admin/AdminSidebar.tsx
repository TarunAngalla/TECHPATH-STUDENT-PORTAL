"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { adminLogoutAction } from "@/lib/actions/auth";
import { ADMIN_NAV_SECTIONS } from "@/lib/constants/admin-nav";
import type { UserRole } from "@/lib/auth/session-config";
import { Logo } from "@/components/shared/Logo";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

export function AdminSidebar({
  mobileOpen,
  setMobileOpen,
  newLeadsBadge,
  unreadMessages = 0,
  collapsed = false,
  staffRole = "admin",
  portalSubtitle = "Admin console",
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  newLeadsBadge?: number;
  unreadMessages?: number;
  collapsed?: boolean;
  staffRole?: Extract<UserRole, "recruiter" | "admin">;
  portalSubtitle?: string;
}) {
  const pathname = usePathname();
  const navSections = ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !(staffRole === "recruiter" && (item.key === "team" || item.key === "leads" || item.key === "nda")),
    ),
  })).filter((section) => section.items.length > 0);

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
          "fixed lg:sticky z-30 top-0 left-0 h-full lg:h-screen flex flex-col transition-all duration-300 shadow-elevated glass-dark",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-64 lg:w-20" : "w-64",
        )}
      >
        <div className={cn("py-5 flex items-center justify-between border-b border-white/10", collapsed ? "px-4" : "px-5")}>
          <Logo dark subtitle={portalSubtitle} collapsed={collapsed} />
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
          {navSections.map((section, si) => (
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
                  const badge =
                    item.badgeKey === "newLeads"
                      ? newLeadsBadge
                      : item.key === "messages"
                      ? unreadMessages
                      : undefined;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                        collapsed ? "justify-center px-3 py-3 gap-0" : "px-3 py-2.5 gap-3",
                        active
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-white/70 hover:text-white hover:bg-white/6",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={17} aria-hidden="true" />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {badge != null && badge > 0 && (
                        <Badge
                          variant="accent"
                          className={cn(
                            "text-[10px] rounded-full",
                            collapsed ? "absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center" : "px-1.5 py-0"
                          )}
                        >
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

        {!collapsed && (
          <div className="mx-3 my-2 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80">
            <div className="font-semibold mb-1 text-white">Need Help?</div>
            <div className="text-[10px] text-white/50 mb-3">Contact support for any questions or assistance.</div>
            <Button variant="outline" size="sm" asChild className="w-full text-white border-white/20 hover:bg-white/10 hover:text-white">
              <a href="mailto:support@thetechpath.com" className="flex items-center justify-center gap-1.5 text-xs text-white">
                Contact Support
              </a>
            </Button>
          </div>
        )}

        <div className="p-3 border-t border-white/10">
          <form action={adminLogoutAction}>
            <button
              type="submit"
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-all duration-200",
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
