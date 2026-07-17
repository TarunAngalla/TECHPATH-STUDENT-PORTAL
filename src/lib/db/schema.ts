import {
  boolean,
  date,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["candidate", "recruiter", "admin"] }).notNull(),
  firstLogin: boolean("first_login").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    optType: text("opt_type", { enum: ["OPT", "STEM_OPT"] }).notNull(),
    journeyStage: smallint("journey_stage").notNull().default(0),
    recruiterId: uuid("recruiter_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_candidates_recruiter").on(table.recruiterId)],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    optType: text("opt_type", { enum: ["OPT", "STEM_OPT"] }),
    source: text("source", { enum: ["enquiry_form", "consultation_booked"] }).notNull(),
    status: text("status", {
      enum: ["new", "contacted", "qualified", "rejected", "converted"],
    })
      .notNull()
      .default("new"),
    notes: text("notes").notNull().default(""),
    convertedCandidateId: uuid("converted_candidate_id").references(() => candidates.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_leads_status").on(table.status)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    appNo: text("app_no").notNull(),
    companyName: text("company_name").notNull(),
    roleTitle: text("role_title").notNull(),
    dateApplied: date("date_applied").notNull(),
    status: text("status", {
      enum: [
        "applied",
        "assessment",
        "interview_r1",
        "interview_r2",
        "interview_r3",
        "hr_round",
        "final_round",
        "decision_pending",
        "offer",
        "rejected",
      ],
    }).notNull(),
    comment: text("comment").notNull().default(""),
    upcomingLabel: text("upcoming_label"),
    upcomingWhen: timestamp("upcoming_when", { withTimezone: true }),
    upcomingWithPerson: text("upcoming_with_person"),
    upcomingPrep: text("upcoming_prep"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_applications_candidate").on(table.candidateId),
    index("idx_applications_upcoming").on(table.upcomingWhen),
  ],
);

export const trainings = pgTable("trainings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: text("type", { enum: ["video", "pdf"] }).notNull(),
  contentUrl: text("content_url"),
});

export const candidateTrainings = pgTable("candidate_trainings", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  trainingId: uuid("training_id")
    .notNull()
    .references(() => trainings.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["upcoming", "completed"] }).notNull().default("upcoming"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const documentCategories = [
  "resume",
  "handbook",
  "stem_compliance",
  "offer_letter",
  "payslip",
  "timesheet",
  "onboarding",
  "other",
] as const;

export type DocumentCategory = (typeof documentCategories)[number];

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category", { enum: [...documentCategories] }).notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  targetCandidateId: uuid("target_candidate_id").references(() => candidates.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcementReads = pgTable(
  "announcement_reads",
  {
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.announcementId, table.candidateId] })],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    senderRole: text("sender_role", { enum: ["candidate", "recruiter"] }).notNull(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_messages_candidate").on(table.candidateId, table.sentAt)],
);

export const messageReads = pgTable(
  "message_reads",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    index("idx_message_reads_user").on(table.userId, table.candidateId),
  ],
);

export const passwordChangeLog = pgTable("password_change_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  method: text("method", {
    enum: ["forced_first_login", "self_service", "admin_reset"],
  }).notNull(),
  changedByUserId: uuid("changed_by_user_id")
    .notNull()
    .references(() => users.id),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  targetTable: text("target_table"),
  targetId: uuid("target_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Application = typeof applications.$inferSelect;
