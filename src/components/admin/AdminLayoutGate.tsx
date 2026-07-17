"use client";

import { usePathname } from "next/navigation";

export function AdminLayoutGate({
  children,
  shell,
}: {
  children: React.ReactNode;
  shell: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return children;
  }
  return shell;
}
