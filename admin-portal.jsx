import React, { useState } from "react";
import {
  LayoutDashboard, Inbox, Users, GraduationCap, Megaphone, BarChart3,
  ShieldCheck, Settings, LogOut, Lock, ArrowRight, Eye, EyeOff, X,
  Bell, Search, Clock, MessageCircle, TrendingUp, UserPlus, ChevronRight,
  Check, Mail, Phone, RefreshCw, Send, CheckCircle2, ChevronLeft,
  Building2, FileText, Download, Play, Upload, Plus, ChevronDown,
} from "lucide-react";

// Design tokens — kept identical to the candidate portal so both products
// read as one brand, not two separately-designed systems.
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

function Logo({ dark }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center font-semibold text-sm"
        style={{ backgroundColor: C.navy, color: "#fff" }}
      >
        TP
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold" style={{ color: dark ? "#fff" : C.ink }}>
          the tech path
        </div>
        <div className="text-[11px]" style={{ color: dark ? "#B9C6D6" : C.slate }}>
          Admin console
        </div>
      </div>
    </div>
  );
}

const LEAD_STATUS_META = {
  new: { label: "New", color: C.slate, bg: C.slateSoft },
  contacted: { label: "Contacted", color: C.teal, bg: C.tealSoft },
  qualified: { label: "Qualified", color: C.green, bg: C.greenSoft },
  rejected: { label: "Rejected", color: C.red, bg: C.redSoft },
  converted: { label: "Converted", color: C.navy, bg: C.navySoft },
};

const LEADS = [
  { id: 1, name: "Jordan Smith", email: "jordan.smith@example.com", phone: "(555) 442-9910", optType: "STEM_OPT", source: "Enquiry form", date: "Jul 3, 2026", status: "new", notes: "" },
  { id: 2, name: "Amara Chen", email: "amara.chen@example.com", phone: "(555) 221-7743", optType: "OPT", source: "Consultation booked", date: "Jul 3, 2026", status: "new", notes: "Consultation call scheduled for Jul 6, 2pm." },
  { id: 3, name: "Wei Lin", email: "wei.lin@example.com", phone: "(555) 887-2201", optType: "STEM_OPT", source: "Enquiry form", date: "Jul 1, 2026", status: "contacted", notes: "Left voicemail, followed up by email Jul 2." },
  { id: 4, name: "Priya Desai", email: "priya.desai@example.com", phone: "(555) 330-6642", optType: "OPT", source: "Consultation booked", date: "Jun 29, 2026", status: "qualified", notes: "Strong fit for backend roles. Ready to create portal access." },
  { id: 5, name: "Marcus Bell", email: "marcus.bell@example.com", phone: "(555) 774-1102", optType: "OPT", source: "Enquiry form", date: "Jun 24, 2026", status: "rejected", notes: "Not currently eligible — work authorization expires in under 3 months." },
];

// Fixed nav structure for the admin console. Every future admin page reuses
// exactly this — grouped the same way the candidate sidebar is grouped, so
// the two products feel like one system.
const ADMIN_NAV_SECTIONS = [
  { label: "Overview", items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Recruiting",
    items: [
      { key: "leads", label: "Leads Inbox", icon: Inbox, badge: LEADS.filter(l => l.status === "new").length },
      { key: "candidates", label: "Candidates", icon: Users },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "trainings", label: "Trainings Library", icon: GraduationCap },
      { key: "announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  { label: "Insights", items: [{ key: "reports", label: "Reports", icon: BarChart3 }] },
  {
    label: "Admin",
    items: [
      { key: "team", label: "Team & Permissions", icon: ShieldCheck },
      { key: "settings", label: "Account Settings", icon: Settings },
    ],
  },
];

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
          Internal access only
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10 relative">
        {children}
      </main>
    </div>
  );
}

function AdminLoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter both your work email and password to continue.");
      return;
    }
    if (!email.endsWith("@thetechpath.com")) {
      setError("Use your thetechpath.com work email to sign in.");
      return;
    }
    setError("");
    onLogin();
  };

  return (
    <AuthShell>
      <div className="w-full max-w-sm rounded-xl p-8" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <h1 className="text-xl font-medium mb-1" style={{ color: C.ink }}>Sign in to the admin console</h1>
        <p className="text-sm mb-6" style={{ color: C.slate }}>
          For recruiters and staff at the tech path. Candidates should use the candidate portal instead.
        </p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Work email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@thetechpath.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${C.border}`, color: C.ink }}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium mb-1.5" style={{ color: C.slate }}>Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${C.border}`, color: C.ink }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: C.slate }}
              >
                {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs" role="alert" style={{ color: C.red }}>{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
            style={{ backgroundColor: C.navy, color: "#fff", boxShadow: "0 1px 2px rgba(11,59,96,0.25)" }}
          >
            Sign in <ArrowRight size={15} aria-hidden="true" />
          </button>
          <div className="text-center">
            <a href="#" className="text-xs font-medium" style={{ color: C.teal }} onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>
        </form>
        <div className="mt-6 pt-4 flex items-center gap-2 text-[11px]" style={{ borderTop: `1px solid ${C.border}`, color: C.slate }}>
          <Lock size={12} aria-hidden="true" />
          Every sign-in and permission change on this console is logged.
        </div>
      </div>
    </AuthShell>
  );
}

// The signed-in admin — Sarah Mitchell is the same recruiter the candidate
// portal shows as Ravi's assigned recruiter, so the two products connect.
const ADMIN_USER = { name: "Sarah Mitchell", role: "Senior Marketing Recruiter", initials: "SM" };

const JOURNEY_STEPS = ["Resume & profile training", "Recruiter assigned", "Marketing launched", "Interviews & assessments"];

const CANDIDATE_STATUS_META = {
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

// This record mirrors candidate-portal.jsx exactly — same applications, same
// statuses, same comments, same messages. Editing this record here is meant
// to be indistinguishable from what Ravi sees on his own dashboard.
const CANDIDATES = [
  {
    id: 1, name: "Ravi Kumar", email: "ravi.kumar@example.com", phone: "(555) 019-4432",
    optType: "STEM_OPT", recruiter: "Sarah Mitchell", journeyStage: 2,
    passwordLastChanged: "Jun 20, 2026 · forced reset on first login",
    passwordLog: [
      { when: "Jun 20, 2026, 9:02 AM", method: "Forced reset on first login" },
    ],
    lastActivity: "Sent a message · 2 hours ago",
    applications: [
      { id: 1, appNo: "APP-001", company: "Nimbus Data Systems", role: "Backend Engineer", date: "Jun 12, 2026", status: "interview_r2", comment: "David confirmed Round 2 for Jul 8, 10am. Sending the caching walkthrough doc separately." },
      { id: 2, appNo: "APP-002", company: "Alden Financial Group", role: "Full Stack Developer", date: "Jun 18, 2026", status: "assessment", comment: "Take-home challenge due Jul 5th. Recruiter says they're usually flexible on the deadline for strong candidates." },
      { id: 3, appNo: "APP-003", company: "Beacon Health Analytics", role: "Software Engineer", date: "Jun 20, 2026", status: "applied", comment: "" },
      { id: 4, appNo: "APP-004", company: "Cartwright Logistics", role: "Java Developer", date: "May 29, 2026", status: "rejected", comment: "Feedback: strong fundamentals, but they went with someone with more direct logistics-domain experience." },
      { id: 5, appNo: "APP-005", company: "Fieldstone Tech", role: "Backend Engineer", date: "May 22, 2026", status: "decision_pending", comment: "Passed the final panel. HR wants to discuss comp expectations — call scheduled for next week." },
    ],
    documents: [
      { name: "Resume — Backend focus", sub: "Updated Jun 15, 2026" },
      { name: "Company handbook", sub: "PDF" },
      { name: "STEM OPT guidelines", sub: "Reference document" },
    ],
    trainings: [
      { title: "Resume & profile positioning", status: "completed" },
      { title: "Interview preparation fundamentals", status: "completed" },
      { title: "Workplace policies handbook", status: "completed" },
      { title: "Technical mock interview prep", status: "upcoming" },
      { title: "Salary negotiation basics", status: "upcoming" },
    ],
    messages: [
      { id: 1, sender: "admin", text: "Hi Ravi, quick update — Nimbus Data confirmed your round 2 for July 8th at 10am. I'll send prep notes shortly.", time: "Jun 25, 9:14 AM" },
      { id: 2, sender: "candidate", text: "Great, thank you! Should I prepare anything specific for the system design portion?", time: "Jun 25, 9:20 AM" },
      { id: 3, sender: "admin", text: "Review the caching walkthrough doc I shared, and be ready to whiteboard a rate limiter.", time: "Jun 25, 9:26 AM" },
      { id: 4, sender: "admin", text: "Also, I uploaded an updated resume tailored for backend roles. Take a look under Documents when you get a chance.", time: "Jun 15, 4:02 PM" },
    ],
  },
  {
    id: 2, name: "Meera Iyer", email: "meera.iyer@example.com", phone: "(555) 208-7743",
    optType: "OPT", recruiter: "Sarah Mitchell", journeyStage: 3,
    passwordLastChanged: "Jun 10, 2026, 8:15 AM · forced reset on first login",
    passwordLog: [{ when: "Jun 10, 2026, 8:15 AM", method: "Forced reset on first login" }],
    lastActivity: "Application updated · 1 day ago",
    applications: [
      { id: 1, appNo: "APP-001", company: "Alden Financial Group", role: "Data Analyst", date: "Jun 5, 2026", status: "interview_r1", comment: "First round confirmed for next week." },
      { id: 2, appNo: "APP-002", company: "Beacon Health Analytics", role: "Data Engineer", date: "May 30, 2026", status: "final_round", comment: "" },
      { id: 3, appNo: "APP-003", company: "Nimbus Data Systems", role: "Analytics Engineer", date: "May 20, 2026", status: "rejected", comment: "Went with an internal candidate." },
    ],
    documents: [{ name: "Resume — Data focus", sub: "Updated Jun 1, 2026" }],
    trainings: [
      { title: "Resume & profile positioning", status: "completed" },
      { title: "Interview preparation fundamentals", status: "completed" },
    ],
    messages: [],
  },
  {
    id: 3, name: "Daniel Osei", email: "daniel.osei@example.com", phone: "(555) 660-1120",
    optType: "OPT", recruiter: "Tom Reyes", journeyStage: 1,
    passwordLastChanged: "Jun 28, 2026, 3:40 PM · forced reset on first login",
    passwordLog: [{ when: "Jun 28, 2026, 3:40 PM", method: "Forced reset on first login" }],
    lastActivity: "Profile created · 3 days ago",
    applications: [],
    documents: [],
    trainings: [{ title: "Resume & profile positioning", status: "upcoming" }],
    messages: [],
  },
];

const RECRUITER_WORKLOAD = [
  { name: "Sarah Mitchell", count: 6 },
  { name: "Tom Reyes", count: 4 },
  { name: "Priya Nair", count: 2 },
];

const ACTIVITY_FEED = [
  { id: 1, text: "Ravi Kumar sent a new message about Nimbus Data Systems", when: "2 hours ago", icon: MessageCircle },
  { id: 2, text: "New enquiry submitted by Jordan Smith", when: "2 hours ago", icon: UserPlus },
  { id: 3, text: "Application status updated: Nimbus Data Systems → Interview Round 2 (Ravi Kumar)", when: "Yesterday", icon: TrendingUp },
  { id: 4, text: "Password changed for Ravi Kumar (self-service)", when: "Jun 20", icon: Lock },
];

const PIPELINE_FUNNEL = [
  { label: "Enquiries", value: 18, color: C.slate, bg: C.slateSoft },
  { label: "Consultations booked", value: 10, color: C.teal, bg: C.tealSoft },
  { label: "Active candidates", value: 12, color: C.navy, bg: C.navySoft },
  { label: "Placed", value: 3, color: C.green, bg: C.greenSoft },
];

function AdminSidebar({ page, setPage, onLogout, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ backgroundColor: "rgba(8,42,71,0.4)" }} onClick={() => setMobileOpen(false)} />
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
          {ADMIN_NAV_SECTIONS.map((section, si) => (
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
                      style={{ backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent", color: active ? "#fff" : "#AEBBCB" }}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={17} aria-hidden="true" />
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-semibold rounded-full flex items-center justify-center" style={{ backgroundColor: C.teal, color: "#fff", width: 16, height: 16 }}>
                          {item.badge}
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
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "#AEBBCB" }}>
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminTopbar({ title, setMobileOpen }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 gap-4" style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}` }}>
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
        <label htmlFor="admin-search" className="sr-only">Search candidates</label>
        <input id="admin-search" placeholder="Search candidates..." className="ml-2 flex-1 bg-transparent text-xs outline-none" style={{ color: C.ink }} />
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button aria-label="Notifications, 4 unread" className="relative">
          <Bell size={18} style={{ color: C.slate }} aria-hidden="true" />
          <span className="absolute rounded-full flex items-center justify-center text-white font-semibold" style={{ minWidth: 14, height: 14, fontSize: 9, backgroundColor: C.red, top: -4, right: -5, border: `1.5px solid ${C.card}`, padding: "0 3px" }}>4</span>
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: C.navySoft, color: C.navy }}>
          {ADMIN_USER.initials}
        </div>
      </div>
    </header>
  );
}

function AdminStatCard({ label, value, icon: Icon, color, bg, onClick }) {
  return (
    <button onClick={onClick} className="text-left p-5 rounded-xl flex-1 min-w-[150px]" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
        <Icon size={17} style={{ color }} aria-hidden="true" />
      </div>
      <div className="text-2xl font-semibold" style={{ color: C.ink }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: C.slate }}>{label}</div>
    </button>
  );
}

function LeadStatusPill({ status }) {
  const m = LEAD_STATUS_META[status];
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ backgroundColor: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function CreateAccountPanel({ lead, onSent }) {
  const [tempPassword, setTempPassword] = useState(generateTempPassword());
  const [sent, setSent] = useState(false);

  return (
    <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: C.navySoft }}>
      <div className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: C.ink }}>
        <UserPlus size={13} aria-hidden="true" /> Create candidate portal account for {lead.name}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: C.slate }}>Login email</label>
          <input value={lead.email} disabled className="w-full px-2.5 py-2 rounded-lg text-xs" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card, color: C.slate }} />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: C.slate }}>Temporary password</label>
          <div className="flex gap-1.5">
            <input value={tempPassword} readOnly className="w-full px-2.5 py-2 rounded-lg text-xs font-mono" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card, color: C.ink }} />
            <button type="button" onClick={() => setTempPassword(generateTempPassword())} aria-label="Generate new temporary password" className="px-2 rounded-lg flex-shrink-0" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}>
              <RefreshCw size={13} style={{ color: C.slate }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {!sent ? (
        <button
          onClick={() => { setSent(true); onSent && onSent(); }}
          className="text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5"
          style={{ backgroundColor: C.navy, color: "#fff" }}
        >
          <Send size={13} aria-hidden="true" /> Send registration email
        </button>
      ) : (
        <p className="text-xs flex items-center gap-1.5" role="status" aria-live="polite" style={{ color: C.green }}>
          <CheckCircle2 size={13} aria-hidden="true" /> Registration link sent to {lead.email}. This lead is now a candidate.
        </p>
      )}
    </div>
  );
}

function LeadsPage() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState(LEADS);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(LEADS.map(l => [l.id, l.notes])));
  const [expandedApprove, setExpandedApprove] = useState(null);

  const updateStatus = (id, status) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status } : l)));
    if (status === "qualified" || status === "converted") setExpandedApprove(id);
  };

  const filtered = leads
    .filter(l => filter === "all" || l.status === filter)
    .filter(l => l.name.toLowerCase().includes(query.toLowerCase()) || l.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center flex-1 px-3 py-2 rounded-lg" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <Search size={14} style={{ color: C.slate }} aria-hidden="true" />
          <label htmlFor="lead-search" className="sr-only">Search leads by name or email</label>
          <input id="lead-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" className="ml-2 flex-1 bg-transparent text-xs outline-none" style={{ color: C.ink }} />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-xs px-3 py-2 rounded-lg outline-none flex-shrink-0" style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.card }}>
          <option value="all">All statuses</option>
          {Object.entries(LEAD_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <p className="text-xs mb-3" style={{ color: C.slate }}>{filtered.length} of {leads.length} leads</p>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        {filtered.map((lead, i) => (
          <div key={lead.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: C.ink }}>{lead.name}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mt-1" style={{ color: C.slate }}>
                    <span className="flex items-center gap-1"><Mail size={11} aria-hidden="true" /> {lead.email}</span>
                    <span className="flex items-center gap-1"><Phone size={11} aria-hidden="true" /> {lead.phone}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] mt-1" style={{ color: C.slate }}>
                    <span>{lead.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}</span>
                    <span>{lead.source}</span>
                    <span>{lead.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <LeadStatusPill status={lead.status} />
                  {lead.status !== "rejected" && lead.status !== "converted" && (
                    <>
                      <button
                        onClick={() => updateStatus(lead.id, lead.status === "new" ? "contacted" : "qualified")}
                        aria-label={`Approve ${lead.name} to next stage`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: C.greenSoft, color: C.green }}
                      >
                        <Check size={14} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => updateStatus(lead.id, "rejected")}
                        aria-label={`Reject ${lead.name}`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: C.redSoft, color: C.red }}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <label htmlFor={`lead-notes-${lead.id}`} className="sr-only">Internal notes for {lead.name}</label>
              <textarea
                id={`lead-notes-${lead.id}`}
                value={drafts[lead.id]}
                onChange={(e) => setDrafts(prev => ({ ...prev, [lead.id]: e.target.value }))}
                placeholder="Add an internal note..."
                rows={2}
                className="w-full text-xs px-2.5 py-2 rounded-lg outline-none resize-none"
                style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.surface }}
              />

              {(lead.status === "qualified" || expandedApprove === lead.id) && lead.status !== "converted" && lead.status !== "rejected" && (
                <CreateAccountPanel lead={lead} onSent={() => updateStatus(lead.id, "converted")} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function CandidateStatusPill({ status }) {
  const m = CANDIDATE_STATUS_META[status];
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap" style={{ backgroundColor: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function CandidatesPage({ onOpenCandidate }) {
  const [query, setQuery] = useState("");
  const filtered = CANDIDATES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center flex-1 max-w-sm px-3 py-2 rounded-lg" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <Search size={14} style={{ color: C.slate }} aria-hidden="true" />
          <label htmlFor="candidate-search" className="sr-only">Search candidates by name</label>
          <input id="candidate-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidates..." className="ml-2 flex-1 bg-transparent text-xs outline-none" style={{ color: C.ink }} />
        </div>
        <span className="text-xs" style={{ color: C.slate }}>{filtered.length} of {CANDIDATES.length} candidates</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 720 }}>
            <thead>
              <tr style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
                <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Candidate</th>
                <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Recruiter</th>
                <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Journey stage</th>
                <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Applications</th>
                <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Last activity</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => onOpenCandidate(c.id)}
                  className="cursor-pointer"
                  style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0" style={{ backgroundColor: C.navySoft, color: C.navy }}>
                        {c.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: C.ink }}>{c.name}</div>
                        <div className="text-[11px]" style={{ color: C.slate }}>{c.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: C.slate }}>{c.recruiter}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: C.ink }}>{JOURNEY_STEPS[c.journeyStage]}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: C.ink }}>{c.applications.length}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: C.slate }}>{c.lastActivity}</td>
                  <td className="px-4 py-3.5"><ChevronRight size={15} style={{ color: C.slate }} aria-hidden="true" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const CANDIDATE_TABS = ["Profile", "Applications", "Documents", "Trainings", "Messages", "Account & Security"];

function CandidateDetailPage({ candidateId, onBack }) {
  const [tab, setTab] = useState("Applications");
  const candidate = CANDIDATES.find(c => c.id === candidateId);
  if (!candidate) return null;

  return (
    <div>
      <button onClick={onBack} className="text-xs font-medium flex items-center gap-1 mb-4" style={{ color: C.teal }}>
        <ChevronLeft size={14} aria-hidden="true" /> All candidates
      </button>

      <div className="rounded-xl p-5 mb-5 flex items-start justify-between flex-wrap gap-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ backgroundColor: C.navySoft, color: C.navy }}>
            {candidate.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <div className="text-base font-medium" style={{ color: C.ink }}>{candidate.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mt-1" style={{ color: C.slate }}>
              <span className="flex items-center gap-1"><Mail size={11} aria-hidden="true" /> {candidate.email}</span>
              <span className="flex items-center gap-1"><Phone size={11} aria-hidden="true" /> {candidate.phone}</span>
              <span>{candidate.optType === "STEM_OPT" ? "STEM OPT" : "OPT"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label htmlFor="recruiter-select" className="block text-[11px] font-medium mb-1" style={{ color: C.slate }}>Recruiter</label>
            <select id="recruiter-select" defaultValue={candidate.recruiter} className="text-xs px-2.5 py-2 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.card }}>
              {RECRUITER_WORKLOAD.map(r => <option key={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="stage-select" className="block text-[11px] font-medium mb-1" style={{ color: C.slate }}>Journey stage</label>
            <select id="stage-select" defaultValue={candidate.journeyStage} className="text-xs px-2.5 py-2 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.card }}>
              {JOURNEY_STEPS.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 overflow-x-auto" role="tablist" aria-label="Candidate sections">
        {CANDIDATE_TABS.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="text-xs font-medium px-3.5 py-2 rounded-lg whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: tab === t ? C.navy : C.card, color: tab === t ? "#fff" : C.slate, border: `1px solid ${tab === t ? C.navy : C.border}` }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Journey</h3>
          <div className="flex items-center mb-2">
            {JOURNEY_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: i < candidate.journeyStage ? C.green : i === candidate.journeyStage ? C.navy : C.slateSoft, color: i <= candidate.journeyStage ? "#fff" : C.slate }}
                >
                  {i < candidate.journeyStage ? <Check size={13} aria-hidden="true" /> : i + 1}
                </div>
                {i < JOURNEY_STEPS.length - 1 && <div className="h-0.5 flex-1 mx-1" style={{ backgroundColor: i < candidate.journeyStage ? C.green : C.border }} />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs mt-6" style={{ color: C.slate }}>
            This is the exact stepper {candidate.name} sees on their own dashboard. Changing the "Journey stage" dropdown above updates it immediately.
          </p>
        </div>
      )}

      {tab === "Applications" && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <div className="flex justify-end p-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <button className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.navy, color: "#fff" }}>
              <Plus size={13} aria-hidden="true" /> Add application
            </button>
          </div>
          {candidate.applications.length === 0 ? (
            <p className="text-xs p-6 text-center" style={{ color: C.slate }}>No applications yet for {candidate.name}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 760 }}>
                <thead>
                  <tr style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
                    <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>App No.</th>
                    <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Company / role</th>
                    <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Date</th>
                    <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Status</th>
                    <th className="px-4 py-3 text-[11px] font-medium" style={{ color: C.slate }}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {candidate.applications.map((app, i) => {
                    const badge = companyBadge(app.company);
                    return (
                      <tr key={app.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none", verticalAlign: "top" }}>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: C.slate }}>{app.appNo}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.initials}</div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{app.company}</div>
                              <div className="text-[11px] truncate" style={{ color: C.slate }}>{app.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: C.slate }}>{app.date}</td>
                        <td className="px-4 py-3.5">
                          <select defaultValue={app.status} className="text-[11px] px-2 py-1.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card, color: C.ink }}>
                            {Object.entries(CANDIDATE_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3.5" style={{ minWidth: 200 }}>
                          <textarea defaultValue={app.comment} rows={2} placeholder="Add a note..." className="w-full text-[11px] px-2.5 py-2 rounded-lg outline-none resize-none" style={{ border: `1px solid ${C.border}`, color: C.ink, backgroundColor: C.surface }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Documents" && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <div className="flex justify-end p-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <button className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.navy, color: "#fff" }}>
              <Upload size={13} aria-hidden="true" /> Upload document
            </button>
          </div>
          {candidate.documents.length === 0 ? (
            <p className="text-xs p-6 text-center" style={{ color: C.slate }}>No documents uploaded yet.</p>
          ) : candidate.documents.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between px-5 py-4" style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.navySoft }}>
                  <FileText size={14} style={{ color: C.navy }} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: C.ink }}>{d.name}</div>
                  <div className="text-xs" style={{ color: C.slate }}>{d.sub}</div>
                </div>
              </div>
              <button className="text-xs font-medium flex items-center gap-1" style={{ color: C.navy }}><Download size={13} aria-hidden="true" /> Download</button>
            </div>
          ))}
        </div>
      )}

      {tab === "Trainings" && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          {candidate.trainings.length === 0 ? (
            <p className="text-xs p-6 text-center" style={{ color: C.slate }}>No trainings assigned yet.</p>
          ) : candidate.trainings.map((t, i) => (
            <div key={t.title} className="flex items-center justify-between px-5 py-4" style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.tealSoft }}>
                  <Play size={14} style={{ color: C.teal }} aria-hidden="true" />
                </div>
                <div className="text-sm font-medium" style={{ color: C.ink }}>{t.title}</div>
              </div>
              <select defaultValue={t.status} className="text-[11px] px-2 py-1.5 rounded-lg outline-none" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card, color: C.ink }}>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "Messages" && (
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)", height: 420 }}>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ backgroundColor: C.surface }}>
            {candidate.messages.length === 0 ? (
              <p className="text-xs text-center pt-8" style={{ color: C.slate }}>No messages yet with {candidate.name}.</p>
            ) : candidate.messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  <div className="px-3.5 py-2.5 rounded-xl text-xs leading-relaxed" style={{ backgroundColor: m.sender === "admin" ? C.navy : C.card, color: m.sender === "admin" ? "#fff" : C.ink, border: m.sender === "admin" ? "none" : `1px solid ${C.border}` }}>
                    {m.text}
                  </div>
                  <div className={`text-[10px] mt-1 ${m.sender === "admin" ? "text-right" : ""}`} style={{ color: C.slate }}>{m.sender === "admin" ? "You" : candidate.name} · {m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <label htmlFor="reply-input" className="sr-only">Reply to {candidate.name}</label>
            <input id="reply-input" placeholder={`Reply to ${candidate.name}...`} className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ border: `1px solid ${C.border}`, color: C.ink }} />
            <button className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.navy, color: "#fff" }} aria-label="Send reply">
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {tab === "Account & Security" && (
        <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <h3 className="text-sm font-medium mb-1" style={{ color: C.ink }}>Password</h3>
          <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: C.slate }}>
            <ShieldCheck size={12} aria-hidden="true" /> Last changed: {candidate.passwordLastChanged}
          </p>
          <button className="text-xs font-medium px-3.5 py-2 rounded-lg mb-6" style={{ backgroundColor: C.redSoft, color: C.red }}>
            Force password reset on next login
          </button>
          <h3 className="text-sm font-medium mb-2" style={{ color: C.ink }}>Change history</h3>
          <div className="space-y-2">
            {candidate.passwordLog.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: C.surface }}>
                <span className="text-xs" style={{ color: C.ink }}>{entry.method}</span>
                <span className="text-[11px]" style={{ color: C.slate }}>{entry.when}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboardHome({ go }) {
  const maxFunnel = Math.max(...PIPELINE_FUNNEL.map(f => f.value));
  return (
    <div>
      <div className="relative rounded-xl p-6 mb-6 overflow-hidden" style={{ backgroundColor: C.navy }}>
        <div className="absolute rounded-full" style={{ width: 160, height: 160, right: -40, top: -50, backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div className="relative">
          <div className="text-xs font-medium mb-1.5" style={{ color: "#9FC0DD" }}>Welcome back</div>
          <h2 className="text-xl font-medium text-white mb-1.5">{ADMIN_USER.name}</h2>
          <p className="text-sm max-w-md" style={{ color: "#C7D4E1" }}>
            {LEADS.filter(l => l.status === "new").length} new leads and 3 candidate messages are waiting on a response today.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <AdminStatCard label="New leads" value={LEADS.filter(l => l.status === "new").length} icon={Inbox} color={C.navy} bg={C.navySoft} onClick={() => go("leads")} />
        <AdminStatCard label="Active candidates" value={12} icon={Users} color={C.teal} bg={C.tealSoft} onClick={() => go("candidates")} />
        <AdminStatCard label="Interviews this week" value={3} icon={Clock} color={C.amber} bg={C.amberSoft} onClick={() => go("candidates")} />
        <AdminStatCard label="Unread candidate messages" value={3} icon={MessageCircle} color={C.green} bg={C.greenSoft} onClick={() => go("candidates")} />
      </div>

      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: C.ink }}>Pipeline, last 90 days</h3>
          <button onClick={() => go("reports")} className="text-xs font-medium flex items-center gap-1" style={{ color: C.teal }}>
            Full report <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2.5">
          {PIPELINE_FUNNEL.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="text-xs w-40 flex-shrink-0" style={{ color: C.slate }}>{f.label}</div>
              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: C.slateSoft }}>
                <div className="h-6 rounded-md flex items-center justify-end px-2" style={{ width: `${(f.value / maxFunnel) * 100}%`, backgroundColor: f.color }}>
                  <span className="text-xs font-medium" style={{ color: "#fff" }}>{f.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Recruiter workload</h3>
          <div className="space-y-3">
            {RECRUITER_WORKLOAD.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: C.ink }}>{r.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: C.navySoft, color: C.navy }}>{r.count} candidates</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(11,59,96,0.06)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Recent activity</h3>
          <div className="space-y-3">
            {ACTIVITY_FEED.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex items-start gap-2.5">
                  <Icon size={13} style={{ color: C.slate, marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                  <div>
                    <div className="text-xs" style={{ color: C.ink }}>{a.text}</div>
                    <div className="text-[11px]" style={{ color: C.slate }}>{a.when}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const ADMIN_PAGE_TITLES = {
  dashboard: "Dashboard", leads: "Leads Inbox", candidates: "Candidates",
  trainings: "Trainings Library", announcements: "Announcements",
  reports: "Reports", team: "Team & Permissions", settings: "Account Settings",
};

function AdminConsole({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const goToPage = (key) => {
    setSelectedCandidateId(null);
    setPage(key);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <AdminDashboardHome go={goToPage} />;
      case "leads": return <LeadsPage />;
      case "candidates":
        return selectedCandidateId
          ? <CandidateDetailPage candidateId={selectedCandidateId} onBack={() => setSelectedCandidateId(null)} />
          : <CandidatesPage onOpenCandidate={setSelectedCandidateId} />;
      default: return <p style={{ color: C.slate }}>This page is coming next.</p>;
    }
  };

  const title = page === "candidates" && selectedCandidateId
    ? CANDIDATES.find(c => c.id === selectedCandidateId)?.name
    : ADMIN_PAGE_TITLES[page];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.surface }}>
      <GlobalFocusStyles />
      <AdminSidebar page={page} setPage={goToPage} onLogout={onLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 min-w-0">
        <AdminTopbar title={title} setMobileOpen={setMobileOpen} />
        <main className="px-5 sm:px-8 py-6 max-w-5xl">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  if (screen === "login") return <AdminLoginPage onLogin={() => setScreen("console")} />;
  return <AdminConsole onLogout={() => setScreen("login")} />;
}
