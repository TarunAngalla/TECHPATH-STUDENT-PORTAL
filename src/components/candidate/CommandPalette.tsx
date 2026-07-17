"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Briefcase } from "lucide-react";
import { CANDIDATE_NAV_SECTIONS } from "@/lib/constants/candidate-nav";
import type { Application } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

export function CommandPalette({
  applications,
  open,
  onOpenChange,
}: {
  applications: Application[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const navItems = CANDIDATE_NAV_SECTIONS.flatMap((section) => section.items);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search portal"
      overlayClassName="fixed inset-0 z-50 bg-text-primary/40 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 px-4"
    >
      <div className="glass-dark rounded-2xl shadow-elevated overflow-hidden border border-white/10">
        <div className="flex items-center border-b border-white/10 px-4">
          <Command.Input
            placeholder="Search companies, roles, or pages…"
            className="flex h-12 w-full bg-transparent text-sm text-text-inverse outline-none placeholder:text-white/40"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-white/50">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Navigation"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-white/40"
          >
            {navItems.map((item) => (
              <Command.Item
                key={item.key}
                value={`${item.label} ${item.href}`}
                onSelect={() => navigate(item.href)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-inverse/80",
                  "aria-selected:bg-white/10 aria-selected:text-text-inverse transition-colors",
                )}
              >
                <item.icon size={16} className="text-white/50" aria-hidden="true" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>

          {applications.length > 0 && (
            <Command.Group
              heading="Applications"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-white/40"
            >
              {applications.map((app) => (
                <Command.Item
                  key={app.id}
                  value={`${app.companyName} ${app.roleTitle}`}
                  onSelect={() => navigate("/applications")}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-inverse/80",
                    "aria-selected:bg-white/10 aria-selected:text-text-inverse transition-colors",
                  )}
                >
                  <Briefcase size={16} className="text-white/50" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{app.companyName}</div>
                    <div className="truncate text-xs text-white/50">{app.roleTitle}</div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
