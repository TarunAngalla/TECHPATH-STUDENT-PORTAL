import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import {
  announcements,
  applications,
  candidateTrainings,
  candidates,
  documents,
  leads,
  messages,
  passwordChangeLog,
  trainings,
  users,
} from "../lib/db/schema";

async function seed() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded — skipping insert.");
    console.log("Admin login: admin@thetechpath.com / admin123");
    console.log("Recruiter login: sarah.mitchell@thetechpath.com / recruiter123");
    console.log("Candidate login: ravi.kumar@example.com / temp-password-123");
    console.log("(Candidate passwords are admin-controlled — no self-service change)");
    return;
  }

  const recruiterHash = await hashPassword("recruiter123");
  const adminHash = await hashPassword("admin123");
  const candidateHash = await hashPassword("temp-password-123");

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@thetechpath.com",
      passwordHash: adminHash,
      role: "admin",
      firstLogin: false,
    })
    .returning();

  const [recruiter] = await db
    .insert(users)
    .values({
      email: "sarah.mitchell@thetechpath.com",
      passwordHash: recruiterHash,
      role: "recruiter",
      firstLogin: false,
    })
    .returning();

  const [candidateUser] = await db
    .insert(users)
    .values({
      email: "ravi.kumar@example.com",
      passwordHash: candidateHash,
      role: "candidate",
      firstLogin: false,
    })
    .returning();

  await db.insert(passwordChangeLog).values({
    userId: candidateUser.id,
    method: "admin_reset",
    changedByUserId: recruiter.id,
  });

  const [candidate] = await db
    .insert(candidates)
    .values({
      userId: candidateUser.id,
      fullName: "Ravi Kumar",
      phone: "(555) 442-9910",
      optType: "STEM_OPT",
      journeyStage: 2,
      recruiterId: recruiter.id,
    })
    .returning();

  await db.insert(leads).values([
    {
      name: "Jordan Smith",
      email: "jordan.smith@example.com",
      phone: "(555) 442-9910",
      optType: "STEM_OPT",
      source: "enquiry_form",
      status: "new",
    },
    {
      name: "Amara Chen",
      email: "amara.chen@example.com",
      phone: "(555) 221-7743",
      optType: "OPT",
      source: "consultation_booked",
      status: "new",
    },
    {
      name: "Priya Desai",
      email: "priya.desai@example.com",
      phone: "(555) 330-6642",
      optType: "OPT",
      source: "consultation_booked",
      status: "qualified",
      notes: "Strong fit for backend roles. Ready to create portal access.",
    },
    {
      name: "Marcus Bell",
      email: "marcus.bell@example.com",
      phone: "(555) 774-1102",
      optType: "OPT",
      source: "enquiry_form",
      status: "rejected",
      notes: "Not currently eligible — work authorization expires in under 3 months.",
    },
  ]);

  await db.insert(applications).values([
    {
      candidateId: candidate.id,
      appNo: "APP-001",
      companyName: "Nimbus Data Systems",
      roleTitle: "Backend Engineer",
      dateApplied: "2026-06-12",
      status: "interview_r2",
      comment:
        "David confirmed Round 2 for Jul 8, 10am. Sending the caching walkthrough doc separately.",
      upcomingLabel: "Round 2 — Technical",
      upcomingWhen: new Date("2026-07-08T10:00:00-04:00"),
      upcomingWithPerson: "David Cho, Eng Manager",
      upcomingPrep:
        "Review the caching walkthrough doc; be ready to whiteboard a rate limiter.",
    },
    {
      candidateId: candidate.id,
      appNo: "APP-002",
      companyName: "Alden Financial Group",
      roleTitle: "Full Stack Developer",
      dateApplied: "2026-06-18",
      status: "assessment",
      comment:
        "Take-home challenge due Jul 5th. Recruiter says they're usually flexible on the deadline for strong candidates.",
    },
    {
      candidateId: candidate.id,
      appNo: "APP-003",
      companyName: "Beacon Health Analytics",
      roleTitle: "Software Engineer",
      dateApplied: "2026-06-20",
      status: "applied",
      comment: "",
    },
    {
      candidateId: candidate.id,
      appNo: "APP-004",
      companyName: "Cartwright Logistics",
      roleTitle: "Java Developer",
      dateApplied: "2026-05-29",
      status: "rejected",
      comment:
        "Feedback: strong fundamentals, but they went with someone with more direct logistics-domain experience.",
    },
    {
      candidateId: candidate.id,
      appNo: "APP-005",
      companyName: "Fieldstone Tech",
      roleTitle: "Backend Engineer",
      dateApplied: "2026-05-22",
      status: "decision_pending",
      comment:
        "Passed the final panel. HR wants to discuss comp expectations — call scheduled for next week.",
      upcomingLabel: "HR — Compensation discussion",
      upcomingWhen: new Date("2026-07-10T15:00:00-04:00"),
      upcomingWithPerson: "Sarah Mitchell (recruiter facilitated)",
      upcomingPrep: "Have your target compensation range ready to discuss.",
    },
  ]);

  const [t1, t2, t3, t4] = await db
    .insert(trainings)
    .values([
      { title: "Resume & profile positioning", type: "video", contentUrl: "#" },
      { title: "Interview preparation fundamentals", type: "video", contentUrl: "#" },
      { title: "Workplace policies handbook", type: "pdf", contentUrl: "#" },
      { title: "Technical mock interview prep", type: "video", contentUrl: "#" },
    ])
    .returning();

  await db.insert(candidateTrainings).values([
    { candidateId: candidate.id, trainingId: t1.id, status: "completed", completedAt: new Date() },
    { candidateId: candidate.id, trainingId: t2.id, status: "completed", completedAt: new Date() },
    { candidateId: candidate.id, trainingId: t3.id, status: "completed", completedAt: new Date() },
    { candidateId: candidate.id, trainingId: t4.id, status: "upcoming" },
  ]);

  await db.insert(documents).values([
    {
      candidateId: candidate.id,
      name: "Resume — Backend focus",
      category: "resume",
      fileUrl: "https://example.com/resume.pdf",
    },
    {
      candidateId: candidate.id,
      name: "Company handbook",
      category: "handbook",
      fileUrl: "https://example.com/handbook.pdf",
    },
    {
      candidateId: candidate.id,
      name: "STEM OPT guidelines",
      category: "stem_compliance",
      fileUrl: "https://example.com/stem.pdf",
    },
  ]);

  const [ann1, ann2] = await db
    .insert(announcements)
    .values([
      {
        title: "New recruiter partner added to your pipeline",
        body: "We've added a new staffing partner focused on fintech roles. Your profile has been shared with their team.",
        createdBy: recruiter.id,
      },
      {
        title: "Interview scheduled with Nimbus Data Systems",
        body: "Round 2 has been confirmed. Check Upcoming for full details and prep notes.",
        createdBy: recruiter.id,
      },
    ])
    .returning();

  await db.insert(messages).values([
    {
      candidateId: candidate.id,
      senderRole: "recruiter",
      senderId: recruiter.id,
      body: "Hi Ravi, quick update — Nimbus Data confirmed your round 2 for July 8th at 10am. I'll send prep notes shortly.",
    },
    {
      candidateId: candidate.id,
      senderRole: "candidate",
      senderId: candidateUser.id,
      body: "Great, thank you! Should I prepare anything specific for the system design portion?",
    },
  ]);

  console.log("Seed complete.");
  console.log("Admin login: admin@thetechpath.com / admin123");
  console.log("Recruiter login: sarah.mitchell@thetechpath.com / recruiter123");
  console.log("Candidate login: ravi.kumar@example.com / temp-password-123");
  console.log("(Candidate passwords are admin-controlled — no self-service change)");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
