import React, { useState } from "react";
import {
  LayoutDashboard, TrendingUp, Briefcase, Users, ClipboardCheck,
  GraduationCap, FileText, Megaphone, Settings, LogOut, Lock,
  CheckCircle2, ChevronRight, Bell, Mail, Phone, Download, Eye,
  Play, ArrowRight, ShieldCheck, Building2, Calendar, Clock,
  ExternalLink, X, ChevronDown, MessageCircle, LifeBuoy, Search,
  Send, Paperclip, ChevronUp, CalendarCheck, MapPin
} from "lucide-react";

const C = {
  navy: "#0B3B60",
  navyDark: "#082A47",
  navySoft: "#E7EEF4",
  teal: "#0E7C7B",
  tealSoft: "#E4F3F2",
  amber: "#B9791E",
  amberSoft: "#FBF0DC",
  green: "#2F8F5B",
  greenSoft: "#E7F5EC",
  red: "#B84332",
  redSoft: "#FBEAE7",
  ink: "#14213D",
  slate: "#5B6472",
  slateSoft: "#F1F2F0",
  surface: "#F6F7F5",
  card: "#FFFFFF",
  border: "#E3E5E0",
};

const CANDIDATE = {
  name: "Ravi Kumar",
  email: "ravi.kumar@example.com",
  optType: "STEM_OPT",
  journeyStage: 2,
};

const RECRUITER = {
  name: "Sarah Mitchell",
  role: "Senior Marketing Recruiter",
  email: "sarah.mitchell@thetechpath.com",
  phone: "(555) 214-7788",
  note: "Ravi's profile is now live with 4 recruiting partners. Focusing on backend / full-stack roles this week.",
};

const ROUND_TEMPLATE = [
  { key: "r1", label: "Round 1 — Screening" },
  { key: "r2", label: "Round 2 — Technical" },
  { key: "r3", label: "Round 3 — Technical" },
  { key: "final", label: "Final round" },
  { key: "hr", label: "HR / offer discussion" },
];

const APPLICATIONS = [
  {
    id: 1, appNo: "APP-001", company: "Nimbus Data Systems", role: "Backend Engineer",
    date: "Jun 12, 2026", status: "interview_r2",
    comment: "David confirmed Round 2 for Jul 8, 10am. Sending the caching walkthrough doc separately.",
    upcoming: { label: "Round 2 — Technical", when: "Jul 8, 2026, 10:00 AM", withPerson: "David Cho, Eng Manager", prep: "Review the caching walkthrough doc; be ready to whiteboard a rate limiter." },
  },
  {
    id: 2, appNo: "APP-002", company: "Alden Financial Group", role: "Full Stack Developer",
    date: "Jun 18, 2026", status: "assessment",
    comment: "Take-home challenge due Jul 5th. Recruiter says they're usually flexible on the deadline for strong candidates.",
    upcoming: null,
  },
  {
    id: 3, appNo: "APP-003", company: "Beacon Health Analytics", role: "Software Engineer",
    date: "Jun 20, 2026", status: "applied",
    comment: "",
    upcoming: null,
  },
  {
    id: 4, appNo: "APP-004", company: "Cartwright Logistics", role: "Java Developer",
    date: "May 29, 2026", status: "rejected",
    comment: "Feedback: strong fundamentals, but they went with someone with more direct logistics-domain experience.",
    upcoming: null,
  },
  {
    id: 5, appNo: "APP-005", company: "Fieldstone Tech", role: "Backend Engineer",
    date: "May 22, 2026", status: "decision_pending",
    comment: "Passed the final panel. HR wants to discuss comp expectations — call scheduled for next week.",
    upcoming: { label: "HR — Compensation discussion", when: "Jul 10, 2026, 3:00 PM", withPerson: "Sarah Mitchell (recruiter facilitated)", prep: "Have your target compensation range ready to discuss." },
  },
];

const TRAININGS = [
  { id: 1, title: "Resume & profile positioning", type: "video", status: "completed" },
  { id: 2, title: "Interview preparation fundamentals", type: "video", status: "completed" },
  { id: 3, title: "Workplace policies handbook", type: "pdf", status: "completed" },
  { id: 4, title: "Technical mock interview prep", type: "video", status: "upcoming" },
  { id: 5, title: "Salary negotiation basics", type: "pdf", status: "upcoming" },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "New recruiter partner added to your pipeline", date: "Jun 28, 2026", body: "We've added a new staffing partner focused on fintech roles. Your profile has been shared with their team.", read: false },
  { id: 2, title: "Interview scheduled with Nimbus Data Systems", date: "Jun 25, 2026", body: "Round 2 has been confirmed. Check the Interviews tab for full details and prep notes.", read: false },
  { id: 3, title: "Resume updated", date: "Jun 15, 2026", body: "Your recruiter has uploaded an updated resume version tailored to backend engineering roles. View it under Documents.", read: true },
];

const MESSAGES = [
  { id: 1, sender: "recruiter", text: "Hi Ravi, quick update — Nimbus Data confirmed your round 2 for July 8th at 10am. I'll send prep notes shortly.", time: "Jun 25, 9:14 AM" },
  { id: 2, sender: "candidate", text: "Great, thank you! Should I prepare anything specific for the system design portion?", time: "Jun 25, 9:20 AM" },
  { id: 3, sender: "recruiter", text: "Yes — review the caching walkthrough doc I shared, and be ready to whiteboard a rate limiter. David likes candidates who ask clarifying questions before diving in.", time: "Jun 25, 9:26 AM" },
  { id: 4, sender: "recruiter", text: "Also, I uploaded an updated resume tailored for backend roles. Take a look under Documents when you get a chance.", time: "Jun 15, 4:02 PM" },
];

const FAQS = [
  { q: "How do I know when my application status changes?", a: "You'll get an email notification and it will appear under Announcements. The Applications page always reflects the current stage." },
  { q: "Can I apply to companies myself?", a: "No — the marketing phase is fully handled by your assigned recruiter. If you have a specific company in mind, message your recruiter and they'll evaluate the fit." },
  { q: "What happens after I receive an offer?", a: "Offer letters, payroll setup, and onboarding paperwork move to radxsys.com, our dedicated employment platform. This portal stays focused on the job search phase." },
  { q: "How do I update my resume?", a: "Send your updated resume to your recruiter through Messages. They'll review it and upload the final version under Documents." },
];

const STATUS_META = {
  applied: { label: "Applied", color: C.slate, bg: C.slateSoft },
  assessment: { label: "Assessment", color: C.amber, bg: C.amberSoft },
  interview_r1: { label: "Interview Round 1", color: C.navy, bg: C.navySoft },
  interview_r2: { label: "Interview Round 2", color: C.navy, bg: C.navySoft },
  interview_r3: { label: "Interview Round 3", color: C.navy, bg: C.navySoft },
  hr_round: { label: "HR Round", color: "#6B3FA0", bg: "#F1EAFB" },
  final_round: { label: "Final Round", color: C.teal, bg: C.tealSoft },
  decision_pending: { label: "Decision Pending", color: C.amber, bg: C.amberSoft },
  offer: { label: "Offer", color: C.green, bg: C.greenSoft },
  rejected: { label: "Rejected", color: C.red, bg: C.redSoft },
};

const COMPANY_STYLES = [
  { bg: C.navySoft, color: C.navy },
  { bg: C.tealSoft, color: C.teal },
  { bg: C.amberSoft, color: C.amber },
  { bg: "#F1EAFB", color: "#6B3FA0" },
  { bg: C.redSoft, color: C.red },
];

function companyBadge(name) {
  const idx = name.length % COMPANY_STYLES.length;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return { ...COMPANY_STYLES[idx], initials };
}

function StatusPill({ status }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function Logo({ dark }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center font-semibold text-sm"
        style={{ backgroundColor: C.navy, color: "#fff", boxShadow: "0 1px 2px rgba(11,59,96,0.25)" }}
      >
        TP
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold" style={{ color: dark ? "#fff" : C.ink }}>
          the tech path
        </div>
        <div className="text-[11px]" style={{ color: dark ? "#B9C6D6" : C.slate }}>
          Candidate portal
        </div>
      </div>
    </div>
  );
}

function GlobalFocusStyles() {
  return (
    <style>{`
      a:focus-visible, button:focus-visible, input:focus-visible,
      select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid ${C.navy};
        outline-offset: 2px;
        border-radius: 4px;
      }
    `}</style>
  );
}

function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: C.surface }}>
      <GlobalFocusStyles />
      <svg className="absolute pointer-events-none" width="600" height="600" style={{ right: -150, top: -100, opacity: 0.06 }} viewBox="0 0 600 600" aria-hidden="true">
        <path d="M40 500 C 150 500, 150 350, 260 350 S 370 200, 480 200 S 560 80, 560 40" stroke={C.navy} strokeWidth="3" fill="none" strokeDasharray="2 14" strokeLinecap="round" />
        <circle cx="40" cy="500" r="7" fill={C.teal} />
        <circle cx="260" cy="350" r="7" fill={C.navy} />
        <circle cx="480" cy="200" r="7" fill={C.teal} />
        <circle cx="560" cy="40" r="7" fill={C.navy} />
      </svg>
      <header className="w-full px-6 py-5 flex items-center justify-between relative" style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}` }}>
        <Logo />
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium" style={{ color: C.slate }}>
          <ShieldCheck size={16} style={{ color: C.teal }} aria-hidden="true" />
          Secure portal
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10 relative">
        {children}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("ravi.kumar@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter both email and password to continue.");
      return;
    }
    setError("");
    onLogin();
  };

  return (
    <AuthShell>
      <div className="w-full max-w-sm rounded-xl p-8" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <h1 className="text-xl font-medium mb-1" style={{ color: C.ink }}>Log in to your portal</h1>
        <p className="text-sm mb-6" style={{ color: C.slate }}>
          Use the credentials your recruiter sent you by email.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your temporary password"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: C.red }}>{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
            style={{ backgroundColor: C.navy, color: "#fff", boxShadow: "0 1px 2px rgba(11,59,96,0.25)" }}
          >
            Log in <ArrowRight size={15} />
          </button>
          <div className="text-center">
            <a href="#" className="text-xs font-medium" style={{ color: C.teal }} onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}

function ResetPasswordPage({ onDone }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (pw1.length < 8) return setError("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setError("Passwords don't match.");
    setError("");
    onDone();
  };

  return (
    <AuthShell>
      <div className="w-full max-w-sm rounded-xl p-8" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: C.navySoft }}>
          <Lock size={18} style={{ color: C.navy }} />
        </div>
        <h1 className="text-xl font-medium mb-1" style={{ color: C.ink }}>Set a permanent password</h1>
        <p className="text-sm mb-6" style={{ color: C.slate }}>
          This is your first login. Set a password only you know.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>New password</label>
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Confirm password</label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: C.red }}>{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: C.navy, color: "#fff", boxShadow: "0 1px 2px rgba(11,59,96,0.25)" }}
          >
            Save & continue
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { key: "home", label: "Dashboard", icon: LayoutDashboard },
      { key: "progress", label: "My progress", icon: TrendingUp },
    ],
  },
  {
    label: "Job search",
    items: [
      { key: "applications", label: "Applications", icon: Briefcase },
      { key: "interviews", label: "Upcoming", icon: Users },
    ],
  },
  {
    label: "Resources",
    items: [
      { key: "trainings", label: "Trainings", icon: GraduationCap },
      { key: "documents", label: "Documents", icon: FileText },
      { key: "announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "Support",
    items: [
      { key: "messages", label: "Messages", icon: MessageCircle, badge: 2 },
      { key: "help", label: "Help & support", icon: LifeBuoy },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "settings", label: "Account settings", icon: Settings },
    ],
  },
];

function Sidebar({ page, setPage, onLogout, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: "rgba(8,42,71,0.4)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static z-30 top-0 left-0 h-full w-64 flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: C.navyDark, boxShadow: "2px 0 8px rgba(8,42,71,0.15)" }}
      >
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Logo dark />
          <button className="lg:hidden text-white" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Main navigation">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} className={si > 0 ? "mt-4" : ""}>
              <div className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: "#5D7591" }}>
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = page === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setPage(item.key); setMobileOpen(false); }}
                      aria-current={active ? "page" : undefined}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent",
                        color: active ? "#fff" : "#AEBBCB",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={17} aria-hidden="true" />
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className="text-[10px] font-semibold rounded-full flex items-center justify-center"
                          style={{ backgroundColor: C.teal, color: "#fff", width: 16, height: 16 }}
                        >
                          {item.badge}
                          <span className="sr-only"> unread</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: "#AEBBCB" }}
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ title, setMobileOpen, go }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const recent = ANNOUNCEMENTS.slice(0, 3);
  const unreadCount = ANNOUNCEMENTS.filter(a => !a.read).length;

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 gap-4"
      style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden flex-shrink-0" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <div className="space-y-1" aria-hidden="true">
            <div className="w-5 h-0.5" style={{ backgroundColor: C.ink }} />
            <div className="w-5 h-0.5" style={{ backgroundColor: C.ink }} />
            <div className="w-5 h-0.5" style={{ backgroundColor: C.ink }} />
          </div>
        </button>
        <h1 className="text-base font-medium truncate" style={{ color: C.ink }}>{title}</h1>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-xs px-3 py-2 rounded-lg" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <Search size={14} style={{ color: C.slate }} aria-hidden="true" />
        <label htmlFor="global-search" className="sr-only">Search companies or roles</label>
        <input
          id="global-search"
          placeholder="Search companies, roles..."
          className="ml-2 flex-1 bg-transparent text-xs outline-none"
          style={{ color: C.ink }}
        />
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          aria-expanded={notifOpen}
        >
          <Bell size={18} style={{ color: C.slate }} aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute rounded-full flex items-center justify-center text-white font-semibold"
              style={{ minWidth: 14, height: 14, fontSize: 9, backgroundColor: C.red, top: -4, right: -5, border: `1.5px solid ${C.card}`, padding: "0 3px" }}
            >
              {unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div
            className="absolute right-10 top-8 w-72 rounded-xl overflow-hidden z-20"
            style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(11,59,96,0.15)" }}
          >
            <div className="px-4 py-3 text-xs font-medium" style={{ borderBottom: `1px solid ${C.border}`, color: C.ink }}>
              Notifications
            </div>
            {recent.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, backgroundColor: a.read ? C.border : C.teal, marginTop: 5 }} aria-hidden="true" />
                <div>
                  <div className="text-xs font-medium" style={{ color: C.ink }}>{a.title}</div>
                  <div className="text-[11px]" style={{ color: C.slate }}>{a.date}</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => { setNotifOpen(false); go && go("announcements"); }}
              className="w-full py-2.5 text-xs font-medium"
              style={{ color: C.teal }}
            >
              View all announcements
            </button>
          </div>
        )}
        <img
          src="https://i.pravatar.cc/64?img=13"
          alt={CANDIDATE.name}
          className="w-8 h-8 rounded-full object-cover"
          style={{ border: `2px solid ${C.navySoft}` }}
        />
      </div>
    </header>
  );
}

function ComplianceFooter() {
  return (
    <div
      className="mt-8 px-4 py-3 rounded-lg text-xs flex items-start gap-2"
      style={{ backgroundColor: C.slateSoft, color: C.slate }}
    >
      <ShieldCheck size={15} style={{ color: C.slate, marginTop: 1, flexShrink: 0 }} />
      All official offer letters, payroll, timesheets, and compliance documents are managed securely on radxsys.com.
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-xl flex-1 min-w-[160px]"
      style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="text-2xl font-semibold" style={{ color: C.ink }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: C.slate }}>{label}</div>
    </button>
  );
}

const JOURNEY_STEPS = ["Resume & profile training", "Recruiter assigned", "Marketing launched", "Interviews & assessments"];

function JourneyBar({ current, big }) {
  return (
    <div className="flex items-center">
      {JOURNEY_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center" style={{ width: big ? 140 : "auto" }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{
                  backgroundColor: done ? C.green : active ? C.navy : C.slateSoft,
                  color: done || active ? "#fff" : C.slate,
                }}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {big && (
                <div className="text-xs text-center mt-2 px-1" style={{ color: active ? C.ink : C.slate, fontWeight: active ? 500 : 400 }}>
                  {step}
                </div>
              )}
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <div className="h-0.5 flex-1 mx-1" style={{ backgroundColor: i < current ? C.green : C.border, minWidth: 20 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const CHECKLIST = [
  { label: "Set your permanent password", done: true },
  { label: "Complete your candidate profile", done: true },
  { label: "Upload your resume", done: true },
  { label: "Attend your first interview", done: true },
  { label: "Finish technical mock interview training", done: false },
];

function OnboardingChecklist({ go }) {
  const doneCount = CHECKLIST.filter(i => i.done).length;
  return (
    <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium" style={{ color: C.ink }}>Getting started</h3>
        <span className="text-xs font-medium" style={{ color: C.teal }}>{doneCount} of {CHECKLIST.length} complete</span>
      </div>
      <div className="w-full h-1.5 rounded-full mb-4 mt-3" style={{ backgroundColor: C.slateSoft }}>
        <div className="h-1.5 rounded-full" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%`, backgroundColor: C.green }} />
      </div>
      <div className="space-y-2.5">
        {CHECKLIST.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: item.done ? C.green : C.surface, border: item.done ? "none" : `1.5px solid ${C.border}` }}
            >
              {item.done && <CheckCircle2 size={11} style={{ color: "#fff" }} />}
            </div>
            <span className="text-xs" style={{ color: item.done ? C.slate : C.ink, textDecoration: item.done ? "line-through" : "none" }}>
              {item.label}
            </span>
            {!item.done && (
              <button onClick={() => go("trainings")} className="text-[11px] font-medium ml-auto" style={{ color: C.teal }}>
                Go <ChevronRight size={11} className="inline" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const PROFILE_LAST_UPDATED = "Jun 28, 2026";

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function downloadInterviewICS(app) {
  const start = new Date(app.upcoming.when);
  if (isNaN(start.getTime())) return;
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${app.company} — ${app.upcoming.label}`,
    `DESCRIPTION:${app.upcoming.prep}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${app.company.replace(/\s+/g, "-")}-interview.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function NextUpBanner({ go }) {
  const upcoming = APPLICATIONS.filter(a => a.upcoming).sort((a, b) => new Date(a.upcoming.when) - new Date(b.upcoming.when));
  if (upcoming.length === 0) return null;
  const next = upcoming[0];
  const days = daysUntil(next.upcoming.when);
  const dayLabel = days === null ? "" : days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;

  return (
    <div className="rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: C.amberSoft, border: "1px solid #F0D9AE" }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fff" }}>
          <Clock size={16} style={{ color: C.amber }} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium" style={{ color: C.ink }}>
            Next up: {next.company} — {next.upcoming.label}, {dayLabel}
          </div>
          <div className="text-xs" style={{ color: C.slate }}>{next.upcoming.when}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => downloadInterviewICS(next)}
          className="text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5"
          style={{ backgroundColor: "#fff", color: C.ink, border: `1px solid ${C.border}` }}
        >
          <CalendarCheck size={13} aria-hidden="true" /> Add to calendar
        </button>
        <button
          onClick={() => go("interviews")}
          className="text-xs font-medium px-3 py-2 rounded-lg"
          style={{ backgroundColor: C.navy, color: "#fff" }}
        >
          View details
        </button>
      </div>
    </div>
  );
}

function DashboardHome({ go }) {
  if (APPLICATIONS.length === 0) {
    return (
      <div className="rounded-xl p-10" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <EmptyState
          title="Your recruiter is setting up your profile"
          note="Once marketing begins, your applications, interviews, and progress will show up here automatically."
        />
      </div>
    );
  }
  return (
    <div>
      <div className="relative rounded-xl p-6 mb-6 overflow-hidden" style={{ backgroundColor: C.navy }}>
        <div className="absolute rounded-full" style={{ width: 160, height: 160, right: -40, top: -50, backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div className="absolute rounded-full" style={{ width: 110, height: 110, right: 60, bottom: -60, backgroundColor: "rgba(255,255,255,0.05)" }} />
        <div className="relative">
          <div className="text-xs font-medium mb-1.5" style={{ color: "#9FC0DD" }}>Welcome back</div>
          <h2 className="text-xl font-medium text-white mb-1.5">{CANDIDATE.name}</h2>
          <p className="text-sm max-w-md mb-2" style={{ color: "#C7D4E1" }}>
            Your profile is being marketed to top employers. 5 active applications in progress across 4 companies.
          </p>
          <p className="text-[11px]" style={{ color: "#8FA9C2" }}>Profile last updated {PROFILE_LAST_UPDATED}</p>
        </div>
      </div>

      <NextUpBanner go={go} />

      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: C.ink }}>Your journey</h3>
          <button onClick={() => go("progress")} className="text-xs font-medium flex items-center gap-1" style={{ color: C.teal }}>
            View details <ChevronRight size={13} />
          </button>
        </div>
        <JourneyBar current={CANDIDATE.journeyStage} />
      </div>

      <OnboardingChecklist go={go} />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Applications submitted" value={APPLICATIONS.length} icon={Briefcase} color={C.navy} bg={C.navySoft} onClick={() => go("applications")} />
        <StatCard label="In interview process" value={APPLICATIONS.filter(a => ["interview_r1", "interview_r2", "interview_r3", "hr_round", "final_round", "decision_pending"].includes(a.status)).length} icon={Users} color={C.teal} bg={C.tealSoft} onClick={() => go("interviews")} />
        <StatCard label="Upcoming this month" value={APPLICATIONS.filter(a => a.upcoming).length} icon={Clock} color={C.amber} bg={C.amberSoft} onClick={() => go("interviews")} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Assigned recruiter</h3>
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://i.pravatar.cc/88?img=47"
              alt={RECRUITER.name}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              style={{ border: `2px solid ${C.tealSoft}` }}
            />
            <div>
              <div className="text-sm font-medium" style={{ color: C.ink }}>{RECRUITER.name}</div>
              <div className="text-xs" style={{ color: C.slate }}>{RECRUITER.role}</div>
            </div>
          </div>
          <div className="text-xs space-y-1.5 mb-3" style={{ color: C.slate }}>
            <div className="flex items-center gap-2"><Mail size={13} /> {RECRUITER.email}</div>
            <div className="flex items-center gap-2"><Phone size={13} /> {RECRUITER.phone}</div>
          </div>
          <p className="text-xs italic mb-4" style={{ color: C.slate }}>"{RECRUITER.note}"</p>
          <button onClick={() => go("messages")} className="text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ color: C.navy, border: `1px solid ${C.border}` }}>
            <MessageCircle size={13} /> Message Sarah
          </button>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: C.ink }}>Announcements</h3>
            <button onClick={() => go("announcements")} className="text-xs font-medium flex items-center gap-1" style={{ color: C.teal }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {ANNOUNCEMENTS.slice(0, 2).map((a) => (
              <div key={a.id}>
                <div className="text-sm font-medium" style={{ color: C.ink }}>{a.title}</div>
                <div className="text-xs" style={{ color: C.slate }}>{a.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGE_INFO = {
  2: {
    title: "Marketing launched",
    meaning: "Your profile is now live and being actively submitted to open roles by your recruiter and their partner network. This is usually the longest stage — most candidates are here for several weeks while applications and first-round conversations build up.",
    nextAction: "Nothing required from you right now beyond staying reachable. Watch for interview requests under Interview details, and keep an eye on Assessments in case a company sends a take-home task.",
  },
};

function ProgressPage({ go }) {
  const stage = STAGE_INFO[CANDIDATE.journeyStage];
  return (
    <div>
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <h3 className="text-sm font-medium mb-8" style={{ color: C.ink }}>Your marketing journey</h3>
        <JourneyBar current={CANDIDATE.journeyStage} big />
      </div>

      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: C.navySoft, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium" style={{ color: C.ink }}>Where you are right now: {stage.title}</h3>
          <span className="text-xs font-medium flex-shrink-0 ml-3" style={{ color: C.navy }}>5 weeks in this stage</span>
        </div>
        <p className="text-xs mb-4" style={{ color: C.slate }}>{stage.meaning}</p>
        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: C.card }}>
          <CheckCircle2 size={14} style={{ color: C.teal, marginTop: 1, flexShrink: 0 }} />
          <div>
            <div className="text-xs font-medium mb-0.5" style={{ color: C.ink }}>What you should do</div>
            <p className="text-xs" style={{ color: C.slate }}>{stage.nextAction}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-xl font-semibold" style={{ color: C.ink }}>4</div>
          <div className="text-[11px] mt-1" style={{ color: C.slate }}>Recruiting partners with your profile</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-xl font-semibold" style={{ color: C.ink }}>{APPLICATIONS.length}</div>
          <div className="text-[11px] mt-1" style={{ color: C.slate }}>Applications submitted so far</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-xl font-semibold" style={{ color: C.ink }}>2</div>
          <div className="text-[11px] mt-1" style={{ color: C.slate }}>Recruiter check-ins this month</div>
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <h3 className="text-sm font-medium mb-6" style={{ color: C.ink }}>Journey timeline</h3>
        <div className="space-y-5">
          {[
            { label: "Resume & profile training", date: "May 22, 2026", duration: "2 days", note: "Completed resume rewrite and initial training modules with your recruiter." },
            { label: "Recruiter assigned", date: "May 24, 2026", duration: "1 day", note: `${RECRUITER.name} assigned as your dedicated recruiter.` },
            { label: "Marketing launched", date: "May 28, 2026", duration: "5 weeks so far", note: "Your profile went live and applications began." },
            { label: "Interviews & assessments", date: "Not started", duration: null, note: "Begins once you have a confirmed first interview." },
          ].map((s, i) => (
            <div key={s.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: i <= CANDIDATE.journeyStage ? C.green : C.border }}
                />
                {i < 3 && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: C.border, minHeight: 30 }} />}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium" style={{ color: C.ink }}>{s.label}</div>
                  {s.duration && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.slateSoft, color: C.slate }}>{s.duration}</span>
                  )}
                </div>
                <div className="text-xs mb-1" style={{ color: C.teal }}>{s.date}</div>
                <div className="text-xs" style={{ color: C.slate }}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <button onClick={() => go && go("messages")} className="text-xs font-medium" style={{ color: C.teal }}>
          Questions about your timeline? Message your recruiter →
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title, note }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <svg width="120" height="96" viewBox="0 0 120 96" className="mb-4">
        <rect x="14" y="30" width="92" height="58" rx="8" fill={C.navySoft} />
        <rect x="14" y="30" width="92" height="16" rx="8" fill={C.navy} opacity="0.15" />
        <circle cx="60" cy="60" r="16" fill={C.card} stroke={C.border} strokeWidth="2" />
        <path d="M60 52v16M52 60h16" stroke={C.slate} strokeWidth="2" strokeLinecap="round" />
        <circle cx="94" cy="18" r="6" fill={C.tealSoft} />
        <circle cx="20" cy="14" r="4" fill={C.amberSoft} />
      </svg>
      <div className="text-sm font-medium mb-1" style={{ color: C.ink }}>{title}</div>
      <p className="text-xs max-w-xs" style={{ color: C.slate }}>{note}</p>
    </div>
  );
}

const APPLICATIONS_HELP = "Comments are saved notes visible to both you and your recruiter — not a live chat.";

function ApplicationsPage() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState(() => Object.fromEntries(APPLICATIONS.map(a => [a.id, a.comment])));
  const [savedId, setSavedId] = useState(null);

  const saveComment = (id) => {
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
  };

  const filtered = APPLICATIONS
    .filter(a => filter === "all" || a.status === filter)
    .filter(a => a.company.toLowerCase().includes(query.toLowerCase()) || a.role.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center flex-1 px-3 py-2 rounded-lg" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <Search size={14} style={{ color: C.slate }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company or role"
            className="ml-2 flex-1 bg-transparent text-xs outline-none"
            style={{ color: C.ink }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg outline-none flex-shrink-0"
          style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.card }}
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <p className="text-xs mb-3" style={{ color: C.slate }}>{filtered.length} of {APPLICATIONS.length} applications</p>

      {filtered.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <EmptyState
            title="No applications match"
            note="Try a different search term or filter. Once your recruiter moves an application here, it will show up automatically."
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 780 }}>
              <thead>
                <tr style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
                  <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>App No.</th>
                  <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Company / role</th>
                  <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Date applied</th>
                  <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Status</th>
                  <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Comments</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr key={app.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none", verticalAlign: "top" }}>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: C.slate }}>{app.appNo}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-semibold" style={{ backgroundColor: companyBadge(app.company).bg, color: companyBadge(app.company).color }}>
                          {companyBadge(app.company).initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{app.company}</div>
                          <div className="text-[11px] truncate" style={{ color: C.slate }}>{app.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: C.slate }}>{app.date}</td>
                    <td className="px-4 py-3.5"><StatusPill status={app.status} /></td>
                    <td className="px-4 py-3.5" style={{ minWidth: 220 }}>
                      <textarea
                        value={drafts[app.id]}
                        onChange={(e) => setDrafts(prev => ({ ...prev, [app.id]: e.target.value }))}
                        onBlur={() => saveComment(app.id)}
                        placeholder="Add a note..."
                        rows={2}
                        className="w-full text-[11px] px-2.5 py-2 rounded-lg outline-none resize-none"
                        style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.surface }}
                      />
                      {savedId === app.id && (
                        <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: C.green }}>
                          <CheckCircle2 size={10} /> Saved
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-[11px] mt-3" style={{ color: C.slate }}>{APPLICATIONS_HELP}</p>
    </div>
  );
}


function InterviewsPage() {
  const upcoming = APPLICATIONS
    .filter(a => a.upcoming)
    .sort((a, b) => new Date(a.upcoming.when) - new Date(b.upcoming.when));

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: C.slate }}>
        Everything currently scheduled, across all your applications, in date order.
      </p>
      {upcoming.length === 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <EmptyState title="Nothing scheduled right now" note="Once your recruiter books an interview or HR call, it will appear here automatically." />
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((app) => {
            const badge = companyBadge(app.company);
            return (
              <div key={app.id} className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {badge.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{app.company}</div>
                      <div className="text-xs truncate" style={{ color: C.slate }}>{app.upcoming.label}</div>
                    </div>
                  </div>
                  <StatusPill status={app.status} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs mt-3" style={{ color: C.slate }}>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {app.upcoming.when}</span>
                  <span className="flex items-center gap-1.5"><Users size={13} /> {app.upcoming.withPerson}</span>
                </div>
                <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: C.surface, color: C.slate }}>
                  {app.upcoming.prep}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrainingsPage() {
  const upcoming = TRAININGS.filter(t => t.status === "upcoming");
  const completed = TRAININGS.filter(t => t.status === "completed");
  const Row = ({ t }) => (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.tealSoft }}>
          {t.type === "video" ? <Play size={14} style={{ color: C.teal }} /> : <FileText size={14} style={{ color: C.teal }} />}
        </div>
        <div className="text-sm font-medium" style={{ color: C.ink }}>{t.title}</div>
      </div>
      <button className="text-xs font-medium flex items-center gap-1" style={{ color: C.navy }}>
        {t.type === "video" ? <><Eye size={13} /> View</> : <><Download size={13} /> Download</>}
      </button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: C.ink }}>Upcoming</h3>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          {upcoming.map((t, i) => <Row key={t.id} t={t} />)}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: C.ink }}>Completed</h3>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          {completed.map((t, i) => <Row key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

function DocumentsPage() {
  const Doc = ({ name, sub }) => (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.navySoft }}>
          <FileText size={14} style={{ color: C.navy }} />
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: C.ink }}>{name}</div>
          <div className="text-xs" style={{ color: C.slate }}>{sub}</div>
        </div>
      </div>
      <button className="text-xs font-medium flex items-center gap-1" style={{ color: C.navy }}>
        <Download size={13} /> Download
      </button>
    </div>
  );
  return (
    <div>
      <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <Doc name="Signed NDA" sub="Signed Jun 20, 2026" />
        <Doc name="Resume — Backend focus" sub="Updated Jun 15, 2026" />
        <Doc name="Company handbook" sub="PDF" />
      </div>

      {CANDIDATE.optType === "STEM_OPT" && (
        <>
          <h3 className="text-sm font-medium mb-2" style={{ color: C.ink }}>STEM compliance</h3>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
            <Doc name="STEM OPT guidelines" sub="Reference document" />
            <Doc name="Compliance checklist" sub="Reference document" />
          </div>
        </>
      )}
      <ComplianceFooter />
    </div>
  );
}

function AnnouncementsPage() {
  return (
    <div className="space-y-3">
      {ANNOUNCEMENTS.map((a) => (
        <div
          key={a.id}
          className="rounded-xl p-5 relative"
          style={{ backgroundColor: a.read ? C.card : C.tealSoft, border: `1px solid ${a.read ? C.border : "#BEE0DE"}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {!a.read && <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, backgroundColor: C.teal }} aria-hidden="true" />}
            <Megaphone size={14} style={{ color: C.teal }} aria-hidden="true" />
            <span className="text-xs" style={{ color: C.slate }}>{a.date}</span>
            {!a.read && <span className="text-[10px] font-medium ml-auto px-2 py-0.5 rounded-full" style={{ backgroundColor: C.teal, color: "#fff" }}>New</span>}
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: C.ink }}>{a.title}</div>
          <p className="text-xs" style={{ color: C.slate }}>{a.body}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsPage() {
  const [phone, setPhone] = useState("(555) 019-4432");
  const [saved, setSaved] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [lastChanged, setLastChanged] = useState("Jun 20, 2026 · forced reset on first login");

  const Field = ({ label, value, editable, onChange }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>{label}</label>
      <input
        value={value}
        disabled={!editable}
        onChange={onChange}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ border: `1px solid ${C.border}`, color: editable ? C.ink : C.slate, backgroundColor: editable ? C.card : C.surface }}
      />
    </div>
  );

  const submitPassword = (e) => {
    e.preventDefault();
    if (!pwCurrent || !pw1 || !pw2) return setPwError("Fill in all three fields.");
    if (pw1.length < 8) return setPwError("New password must be at least 8 characters.");
    if (pw1 !== pw2) return setPwError("New passwords don't match.");
    setPwError("");
    setPwCurrent(""); setPw1(""); setPw2("");
    setLastChanged("Just now · self-service change");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <Field label="Full name" value={CANDIDATE.name} editable={false} />
        <Field label="Email" value={CANDIDATE.email} editable={false} />
        <Field label="Phone" value={phone} editable onChange={(e) => setPhone(e.target.value)} />
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: C.navy, color: "#fff", boxShadow: "0 1px 2px rgba(11,59,96,0.25)" }}
        >
          Save changes
        </button>
        {saved && <p className="text-xs" role="status" aria-live="polite" style={{ color: C.green }}>Saved.</p>}
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium" style={{ color: C.ink }}>Password</h3>
        </div>
        <p className="text-[11px] mb-4 flex items-center gap-1.5" style={{ color: C.slate }}>
          <ShieldCheck size={12} /> Last changed: {lastChanged}
        </p>
        <form onSubmit={submitPassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Current password</label>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>New password</label>
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Confirm new password</label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          {pwError && <p className="text-xs" style={{ color: C.red }}>{pwError}</p>}
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: C.navy, color: "#fff", boxShadow: "0 1px 2px rgba(11,59,96,0.25)" }}
          >
            Update password
          </button>
          {pwSaved && <p className="text-xs" role="status" aria-live="polite" style={{ color: C.green }}>Password updated. Your recruiter's admin console will log this change.</p>}
        </form>
      </div>
    </div>
  );
}

function MessagesPage() {
  const [draft, setDraft] = useState("");
  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)", height: 560 }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <img src="https://i.pravatar.cc/72?img=47" alt={RECRUITER.name} className="w-9 h-9 rounded-full object-cover" style={{ border: `2px solid ${C.tealSoft}` }} />
        <div>
          <div className="text-sm font-medium" style={{ color: C.ink }}>{RECRUITER.name}</div>
          <div className="text-[11px] flex items-center gap-1.5" style={{ color: C.green }}>
            <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: C.green }} />
            Usually replies within a few hours
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ backgroundColor: C.surface }}>
        {MESSAGES.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "candidate" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[75%]">
              <div
                className="px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
                style={{
                  backgroundColor: m.sender === "candidate" ? C.navy : C.card,
                  color: m.sender === "candidate" ? "#fff" : C.ink,
                  border: m.sender === "candidate" ? "none" : `1px solid ${C.border}`,
                  borderBottomRightRadius: m.sender === "candidate" ? 4 : 12,
                  borderBottomLeftRadius: m.sender === "candidate" ? 12 : 4,
                }}
              >
                {m.text}
              </div>
              <div className={`text-[10px] mt-1 ${m.sender === "candidate" ? "text-right" : ""}`} style={{ color: C.slate }}>
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <button className="flex-shrink-0" style={{ color: C.slate }}>
          <Paperclip size={17} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message to your recruiter..."
          className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
          style={{ border: `1px solid ${C.border}`, color: C.ink }}
        />
        <button
          disabled={!draft}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: draft ? C.navy : C.slateSoft, color: draft ? "#fff" : C.slate }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function HelpPage({ go }) {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <div>
      <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        {FAQS.map((f, i) => (
          <div key={f.q} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium pr-4" style={{ color: C.ink }}>{f.q}</span>
              {openFaq === i ? <ChevronUp size={15} style={{ color: C.slate, flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: C.slate, flexShrink: 0 }} />}
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 text-xs leading-relaxed" style={{ color: C.slate }}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6 flex items-center justify-between flex-wrap gap-4" style={{ backgroundColor: C.navySoft }}>
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: C.ink }}>Still need help?</div>
          <p className="text-xs" style={{ color: C.slate }}>Message your assigned recruiter directly — they can answer anything specific to your search.</p>
        </div>
        <button onClick={() => go && go("messages")} className="px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 flex-shrink-0" style={{ backgroundColor: C.navy, color: "#fff" }}>
          <MessageCircle size={13} /> Message recruiter
        </button>
      </div>
    </div>
  );
}

const PAGE_TITLES = {
  home: "Dashboard", progress: "My progress", applications: "Applications",
  interviews: "Upcoming", trainings: "Trainings",
  documents: "Documents", announcements: "Announcements", messages: "Messages",
  help: "Help & support", settings: "Account settings",
};

function PortalFooter({ go }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.slate }}>
      <span>© 2026 the tech path. All rights reserved.</span>
      <div className="flex items-center gap-4">
        <button onClick={() => go("help")} className="hover:underline" style={{ color: C.slate }}>Help & support</button>
        <button onClick={() => go("messages")} className="hover:underline" style={{ color: C.slate }}>Contact recruiter</button>
        <span>Privacy policy</span>
      </div>
    </div>
  );
}

function Portal({ onLogout }) {
  const [page, setPage] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "home": return <DashboardHome go={setPage} />;
      case "progress": return <ProgressPage go={setPage} />;
      case "applications": return <ApplicationsPage />;
      case "interviews": return <InterviewsPage />;
      case "trainings": return <TrainingsPage />;
      case "documents": return <DocumentsPage />;
      case "announcements": return <AnnouncementsPage />;
      case "messages": return <MessagesPage />;
      case "help": return <HelpPage go={setPage} />;
      case "settings": return <SettingsPage />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.surface }}>
      <GlobalFocusStyles />
      <Sidebar page={page} setPage={setPage} onLogout={onLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0">
        <Topbar title={PAGE_TITLES[page]} setMobileOpen={setMobileOpen} go={setPage} />
        <main className="px-5 sm:px-8 py-6 max-w-5xl">
          {renderPage()}
          <PortalFooter go={setPage} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");

  if (screen === "login") return <LoginPage onLogin={() => setScreen("reset")} />;
  if (screen === "reset") return <ResetPasswordPage onDone={() => setScreen("portal")} />;
  return <Portal onLogout={() => setScreen("login")} />;
}
