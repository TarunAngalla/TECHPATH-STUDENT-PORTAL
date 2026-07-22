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
  | "resources"
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
      { key: "progress", label: "My Progress", icon: TrendingUp, href: "/progress" },
    ],
  },
  {
    label: "Placement journey",
    items: [
      { key: "trainings", label: "Trainings", icon: GraduationCap, href: "/trainings" },
      { key: "interview-details", label: "Interview Details", icon: CalendarCheck, href: "/interview-details" },
      { key: "assessments", label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
    ],
  },
  {
    label: "Updates & resources",
    items: [
      { key: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
      { key: "resources", label: "Resources", icon: FileText, href: "/resources" },
    ],
  },
  {
    label: "Account",
    items: [{ key: "settings", label: "Account Settings", icon: Settings, href: "/settings" }],
  },
];

export const CANDIDATE_PAGE_TITLES: Record<CandidateNavKey, string> = {
  dashboard: "Dashboard",
  progress: "My Progress",
  applications: "Applications",
  "interview-details": "Interview Details",
  assessments: "Assessments",
  upcoming: "Upcoming",
  trainings: "Trainings",
  documents: "Resources",
  resources: "Resources",
  announcements: "Announcements",
  messages: "Messages",
  help: "Help & Support",
  settings: "Account Settings",
};

// Kept for direct links and command-palette compatibility. These routes are intentionally
// not part of the primary candidate navigation in the client-aligned view-only portal.
export const CANDIDATE_SECONDARY_NAV: {
  key: CandidateNavKey;
  label: string;
  icon: LucideIcon;
  href: string;
}[] = [
  { key: "applications", label: "Applications", icon: Briefcase, href: "/applications" },
  { key: "messages", label: "Messages", icon: MessageCircle, href: "/messages" },
  { key: "help", label: "Help & Support", icon: LifeBuoy, href: "/help" },
];
