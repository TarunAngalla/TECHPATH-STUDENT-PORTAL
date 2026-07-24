import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Settings,
  ShieldCheck,
  FileSignature,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";

export type AdminNavKey =
  | "dashboard"
  | "leads"
  | "consultations"
  | "candidates"
  | "applications"
  | "interviews"
  | "assessments"
  | "assignments"
  | "marketing"
  | "nda"
  | "trainings"
  | "announcements"
  | "reports"
  | "team"
  | "messages"
  | "settings";

type NavAudience = "admin" | "staff";

type AdminNavItem = {
  key: AdminNavKey;
  label: string;
  recruiterLabel?: string;
  icon: LucideIcon;
  href: string;
  badgeKey?: "newLeads";
  audience: NavAudience;
};

export const ADMIN_NAV_SECTIONS: {
  label: string;
  recruiterLabel?: string;
  items: AdminNavItem[];
}[] = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", audience: "staff" },
    ],
  },
  {
    label: "Candidate pipeline",
    recruiterLabel: "My workspace",
    items: [
      { key: "leads", label: "Enquiries", icon: Inbox, href: "/admin/leads", badgeKey: "newLeads", audience: "admin" },
      { key: "consultations", label: "Consultations", icon: CalendarClock, href: "/admin/consultations", audience: "admin" },
      { key: "candidates", label: "Candidates", recruiterLabel: "My Candidates", icon: Users, href: "/admin/candidates", audience: "staff" },
      { key: "nda", label: "NDA Signatures", icon: FileSignature, href: "/admin/nda", audience: "admin" },
      { key: "assignments", label: "Recruiter Assignments", icon: UsersRound, href: "/admin/assignments", audience: "admin" },
      { key: "marketing", label: "Marketing Progress", icon: TrendingUp, href: "/admin/marketing", audience: "staff" },
    ],
  },
  {
    label: "Placement activity",
    items: [
      { key: "applications", label: "Applications", icon: BriefcaseBusiness, href: "/admin/applications", audience: "staff" },
      { key: "interviews", label: "Interviews", icon: CalendarCheck, href: "/admin/interviews", audience: "staff" },
      { key: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/admin/assessments", audience: "staff" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { key: "trainings", label: "Trainings", icon: GraduationCap, href: "/admin/trainings", audience: "staff" },
      { key: "messages", label: "Messages", icon: MessageCircle, href: "/admin/messages", audience: "staff" },
      { key: "announcements", label: "Announcements", icon: Megaphone, href: "/admin/announcements", audience: "staff" },
    ],
  },
  {
    label: "Insights",
    items: [{ key: "reports", label: "Reports", icon: BarChart3, href: "/admin/reports", audience: "admin" }],
  },
  {
    label: "Administration",
    items: [
      { key: "team", label: "Team & Permissions", icon: ShieldCheck, href: "/admin/team", audience: "admin" },
      { key: "settings", label: "Account Settings", icon: Settings, href: "/admin/settings", audience: "staff" },
    ],
  },
];

export const ADMIN_PAGE_TITLES: Record<AdminNavKey, string> = {
  dashboard: "Dashboard",
  leads: "Enquiries",
  consultations: "Consultations",
  candidates: "Candidates",
  applications: "Applications",
  interviews: "Interviews",
  assessments: "Assessments",
  assignments: "Recruiter Assignments",
  marketing: "Marketing Progress",
  nda: "NDA Signatures",
  trainings: "Trainings",
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
