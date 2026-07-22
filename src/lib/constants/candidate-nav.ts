import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  Settings,
  TrendingUp,
  Megaphone,
} from "lucide-react";

export type CandidateNavKey =
  | "dashboard"
  | "progress"
  | "applications"
  | "interview-details"
  | "assessments"
  | "upcoming"
  | "trainings"
  | "documents"
  | "announcements"
  | "messages"
  | "help"
  | "settings";

export const CANDIDATE_NAV_SECTIONS: {
  label: string;
  items: { key: CandidateNavKey; label: string; icon: LucideIcon; href: string }[];
}[] = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { key: "progress", label: "My progress", icon: TrendingUp, href: "/progress" },
    ],
  },
  {
    label: "Job search",
    items: [
      { key: "applications", label: "Applications", icon: Briefcase, href: "/applications" },
      { key: "interview-details", label: "Interview Details", icon: CalendarCheck, href: "/interview-details" },
      { key: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
    ],
  },
  {
    label: "Resources",
    items: [
      { key: "trainings", label: "Trainings", icon: GraduationCap, href: "/trainings" },
      { key: "documents", label: "Documents", icon: FileText, href: "/documents" },
      { key: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
    ],
  },
  {
    label: "Support",
    items: [
      { key: "messages", label: "Messages", icon: MessageCircle, href: "/messages" },
      { key: "help", label: "Help & support", icon: LifeBuoy, href: "/help" },
    ],
  },
  {
    label: "Account",
    items: [{ key: "settings", label: "Account settings", icon: Settings, href: "/settings" }],
  },
];

export const CANDIDATE_PAGE_TITLES: Record<CandidateNavKey, string> = {
  dashboard: "Dashboard",
  progress: "My progress",
  applications: "Applications",
  "interview-details": "Interview Details",
  assessments: "Assessments",
  upcoming: "Upcoming",
  trainings: "Trainings",
  documents: "Documents",
  announcements: "Announcements",
  messages: "Messages",
  help: "Help & support",
  settings: "Account settings",
};
