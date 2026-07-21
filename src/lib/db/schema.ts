import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoles = ["candidate", "recruiter", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const accountStates = ["pending_setup", "nda_pending", "active", "suspended"] as const;
export type AccountState = (typeof accountStates)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: [...userRoles] }).notNull(),
  firstLogin: boolean("first_login").notNull().default(true),
  accountState: text("account_state", { enum: [...accountStates] }).notNull().default("active"),
  sessionVersion: integer("session_version").notNull().default(1),
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
  (table) => [
    index("idx_candidates_recruiter").on(table.recruiterId),
    unique("candidates_user_unique").on(table.userId),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    optType: text("opt_type", { enum: ["OPT", "STEM_OPT"] }),
    roleInterest: text("role_interest"),
    experienceSummary: text("experience_summary"),
    additionalInformation: text("additional_information"),
    consultationStatus: text("consultation_status", {
      enum: ["not_scheduled", "scheduled", "completed", "cancelled", "no_show"],
    })
      .notNull()
      .default("not_scheduled"),
    consultationScheduledAt: timestamp("consultation_scheduled_at", { withTimezone: true }),
    consultationCompletedAt: timestamp("consultation_completed_at", { withTimezone: true }),
    consultationNotes: text("consultation_notes").notNull().default(""),
    source: text("source", { enum: ["enquiry_form", "consultation_booked"] }).notNull(),
    status: text("status", {
      enum: ["new", "contacted", "qualified", "rejected", "converted"],
    })
      .notNull()
      .default("new"),
    notes: text("notes").notNull().default(""),
    rejectionReason: text("rejection_reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    convertedCandidateId: uuid("converted_candidate_id").references(() => candidates.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_leads_status").on(table.status),
    index("idx_leads_email").on(table.email),
    index("idx_leads_consultation").on(table.consultationStatus, table.consultationScheduledAt),
  ],
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
    unique("applications_candidate_app_no_unique").on(table.candidateId, table.appNo),
    index("idx_applications_candidate").on(table.candidateId),
    index("idx_applications_upcoming").on(table.upcomingWhen),
  ],
);

export const applicationEventTypes = [
  "application_submitted",
  "status_change",
  "interview",
  "assessment",
  "note",
] as const;

export const applicationEventStatuses = [
  "pending",
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
  "passed",
  "failed",
] as const;

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    eventType: text("event_type", { enum: [...applicationEventTypes] }).notNull(),
    title: text("title").notNull(),
    status: text("status", { enum: [...applicationEventStatuses] }).notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    result: text("result"),
    withPerson: text("with_person"),
    meetingLink: text("meeting_link"),
    preparationNotes: text("preparation_notes"),
    internalNotes: text("internal_notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_application_events_application").on(table.applicationId, table.createdAt),
    index("idx_application_events_candidate").on(table.candidateId, table.eventType, table.status),
    index("idx_application_events_schedule").on(table.scheduledAt),
  ],
);

export const trainings = pgTable("trainings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: text("type", { enum: ["video", "pdf"] }).notNull(),
  contentUrl: text("content_url"),
});

export const candidateTrainings = pgTable(
  "candidate_trainings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["upcoming", "completed"] }).notNull().default("upcoming"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [unique("candidate_trainings_candidate_training_unique").on(table.candidateId, table.trainingId)],
);

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

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category", { enum: [...documentCategories] }).notNull(),
    fileUrl: text("file_url"),
    storagePath: text("storage_path"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_documents_candidate").on(table.candidateId, table.uploadedAt)],
);

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
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_messages_sender_receiver").on(table.senderId, table.receiverId, table.sentAt)],
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
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    index("idx_message_reads_user").on(table.userId),
  ],
);

export const candidateInvites = pgTable(
  "candidate_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_candidate_invites_candidate").on(table.candidateId, table.createdAt)],
);

export const ndaTemplates = pgTable(
  "nda_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: text("version").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    documentHash: text("document_hash").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_nda_templates_active").on(table.isActive, table.effectiveFrom)],
);

export const candidateNdaAgreements = pgTable(
  "candidate_nda_agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => ndaTemplates.id),
    status: text("status", { enum: ["pending", "signed", "revoked"] }).notNull().default("pending"),
    presentedAt: timestamp("presented_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    signerName: text("signer_name"),
    signerIp: text("signer_ip"),
    signerUserAgent: text("signer_user_agent"),
    consentText: text("consent_text"),
    signedDocumentPath: text("signed_document_path"),
    signedDocumentHash: text("signed_document_hash"),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("candidate_nda_candidate_template_unique").on(table.candidateId, table.templateId),
    index("idx_candidate_nda_status").on(table.candidateId, table.status),
  ],
);

export const candidateRecruiterAssignments = pgTable(
  "candidate_recruiter_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    recruiterId: uuid("recruiter_id")
      .notNull()
      .references(() => users.id),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id),
    status: text("status", { enum: ["active", "ended"] }).notNull().default("active"),
    reason: text("reason"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_candidate_recruiter_assignments_candidate").on(table.candidateId, table.assignedAt),
    index("idx_candidate_recruiter_assignments_recruiter").on(table.recruiterId, table.status),
  ],
);

export const candidateJourneyEvents = pgTable(
  "candidate_journey_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    stage: smallint("stage").notNull(),
    eventType: text("event_type", { enum: ["stage_reached", "stage_reopened", "note"] })
      .notNull()
      .default("stage_reached"),
    note: text("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [index("idx_candidate_journey_events").on(table.candidateId, table.occurredAt)],
);

export const publicRequestRateLimits = pgTable("public_request_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  requestCount: integer("request_count").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailDeliveryTypes = [
  "enquiry_acknowledgement",
  "new_enquiry_admin",
  "lead_rejection",
  "candidate_invite",
  "candidate_invite_resend",
] as const;

export const emailDeliveryStatuses = ["queued", "sent", "logged", "failed"] as const;

export const emailDeliveryLogs = pgTable(
  "email_delivery_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailType: text("email_type", { enum: [...emailDeliveryTypes] }).notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    status: text("status", { enum: [...emailDeliveryStatuses] }).notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    relatedLeadId: uuid("related_lead_id").references(() => leads.id, { onDelete: "set null" }),
    relatedCandidateId: uuid("related_candidate_id").references(() => candidates.id, { onDelete: "set null" }),
    relatedInviteId: uuid("related_invite_id").references(() => candidateInvites.id, { onDelete: "set null" }),
    attemptCount: integer("attempt_count").notNull().default(1),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_email_delivery_logs_recipient").on(table.recipient, table.createdAt),
    index("idx_email_delivery_logs_lead").on(table.relatedLeadId, table.createdAt),
    index("idx_email_delivery_logs_candidate").on(table.relatedCandidateId, table.createdAt),
    index("idx_email_delivery_logs_invite").on(table.relatedInviteId, table.createdAt),
  ],
);

export const passwordChangeLog = pgTable("password_change_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  method: text("method", { enum: ["forced_first_login", "self_service", "admin_reset", "secure_invite"] }).notNull(),
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
export type ApplicationEvent = typeof applicationEvents.$inferSelect;
