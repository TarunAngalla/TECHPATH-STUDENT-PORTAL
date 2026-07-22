import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Settings,
  ShieldCheck,
  FileSignature,
  Users,
  UsersRound,
} from "lucide-react";

export type AdminNavKey =
  | "dashboard"
  | "leads"
  | "candidates"
  | "applications"
  | "assignments"
  | "nda"
  | "trainings"
  | "announcements"
  | "reports"
  | "team"
  | "messages"
  | "settings";

export const ADMIN_NAV_SECTIONS: {
  label: string;
  items: {
    key: AdminNavKey;
    label: string;
    icon: LucideIcon;
    href: string;
    badgeKey?: "newLeads";
  }[];
}[] = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    ],
  },
  {
    label: "Recruiting",
    items: [
      { key: "leads", label: "Leads Inbox", icon: Inbox, href: "/admin/leads", badgeKey: "newLeads" },
      { key: "candidates", label: "Candidates", icon: Users, href: "/admin/candidates" },
      { key: "applications", label: "Applications", icon: BriefcaseBusiness, href: "/admin/applications" },
      { key: "assignments", label: "Recruiter Assignments", icon: UsersRound, href: "/admin/assignments" },
      { key: "nda", label: "NDA Signatures", icon: FileSignature, href: "/admin/nda" },
      { key: "messages", label: "Messages", icon: MessageCircle, href: "/admin/messages" },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "trainings", label: "Trainings Library", icon: GraduationCap, href: "/admin/trainings" },
      { key: "announcements", label: "Announcements", icon: Megaphone, href: "/admin/announcements" },
    ],
  },
  {
    label: "Insights",
    items: [{ key: "reports", label: "Reports", icon: BarChart3, href: "/admin/reports" }],
  },
  {
    label: "Admin",
    items: [
      { key: "team", label: "Team & Permissions", icon: ShieldCheck, href: "/admin/team" },
      { key: "settings", label: "Account Settings", icon: Settings, href: "/admin/settings" },
    ],
  },
];

export const ADMIN_PAGE_TITLES: Record<AdminNavKey, string> = {
  dashboard: "Dashboard",
  leads: "Leads Inbox",
  candidates: "Candidates",
  applications: "Applications",
  assignments: "Recruiter Assignments",
  nda: "NDA Signatures",
  trainings: "Trainings Library",
  announcements: "Announcements",
  reports: "Reports",
  team: "Team & Permissions",
  messages: "Messages",
  settings: "Account Settings",
};

export function adminPathToNavKey(pathname: string): AdminNavKey {
  const parts = pathname.split("/").filter(Boolean);
  const segment = parts[1] ?? "dashboard";
  if (segment in ADMIN_PAGE_TITLES) return segment as AdminNavKey;
  return "dashboard";
}
