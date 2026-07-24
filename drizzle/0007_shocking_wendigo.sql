CREATE TABLE "announcement_reads" (
	"announcement_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcement_reads_announcement_id_candidate_id_pk" PRIMARY KEY("announcement_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"target_candidate_id" uuid,
	"source_key" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_source_key_unique" UNIQUE("source_key")
);
--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"activity_type" text,
	"event_key" text,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"occurred_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"result" text,
	"score" text,
	"round_number" integer,
	"round_name" text,
	"with_person" text,
	"company_contact_name" text,
	"company_contact_email" text,
	"meeting_link" text,
	"location" text,
	"external_url" text,
	"preparation_notes" text,
	"candidate_visible_notes" text,
	"internal_notes" text,
	"candidate_visible" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"app_no" text NOT NULL,
	"company_name" text NOT NULL,
	"role_title" text NOT NULL,
	"job_location" text,
	"employment_type" text,
	"application_source" text,
	"job_url" text,
	"external_reference" text,
	"submitted_by" uuid,
	"date_applied" date NOT NULL,
	"status" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"candidate_visible_notes" text,
	"internal_notes" text,
	"next_action" text,
	"next_action_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"upcoming_label" text,
	"upcoming_when" timestamp with time zone,
	"upcoming_with_person" text,
	"upcoming_prep" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_candidate_app_no_unique" UNIQUE("candidate_id","app_no")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_table" text,
	"target_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "candidate_journey_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"stage" smallint NOT NULL,
	"previous_stage" smallint,
	"event_type" text DEFAULT 'stage_reached' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"note" text,
	"candidate_visible" boolean DEFAULT true NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "candidate_nda_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"presented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"signer_name" text,
	"signer_ip" text,
	"signer_user_agent" text,
	"consent_text" text,
	"signing_provider" text,
	"provider_envelope_id" text,
	"signing_started_at" timestamp with time zone,
	"signed_document_path" text,
	"signed_document_hash" text,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_nda_candidate_template_unique" UNIQUE("candidate_id","template_id")
);
--> statement-breakpoint
CREATE TABLE "candidate_recruiter_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"recruiter_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"reason" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by" uuid,
	"end_reason" text
);
--> statement-breakpoint
CREATE TABLE "candidate_trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"training_id" uuid NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "candidate_trainings_candidate_training_unique" UNIQUE("candidate_id","training_id")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"opt_type" text NOT NULL,
	"journey_stage" smallint DEFAULT 0 NOT NULL,
	"recruiter_id" uuid,
	"marketing_status" text DEFAULT 'not_ready' NOT NULL,
	"marketing_ready_at" timestamp with time zone,
	"marketing_live_at" timestamp with time zone,
	"marketing_paused_at" timestamp with time zone,
	"marketing_completed_at" timestamp with time zone,
	"marketing_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"file_url" text,
	"storage_path" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_type" text NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"related_lead_id" uuid,
	"related_candidate_id" uuid,
	"related_invite_id" uuid,
	"related_nda_agreement_id" uuid,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"opt_type" text,
	"role_interest" text,
	"experience_summary" text,
	"additional_information" text,
	"consultation_status" text DEFAULT 'not_scheduled' NOT NULL,
	"consultation_scheduled_at" timestamp with time zone,
	"consultation_completed_at" timestamp with time zone,
	"consultation_notes" text DEFAULT '' NOT NULL,
	"consultation_meeting_link" text,
	"source" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"rejection_reason" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"converted_candidate_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reads" (
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_reads_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nda_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"document_hash" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nda_templates_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "password_change_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text NOT NULL,
	"changed_by_user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_request_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"title" text DEFAULT 'Talent Marketing Specialist' NOT NULL,
	"phone" text,
	"timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"max_active_candidates" integer DEFAULT 20 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"content_url" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"first_login" boolean DEFAULT true NOT NULL,
	"account_state" text DEFAULT 'active' NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_target_candidate_id_candidates_id_fk" FOREIGN KEY ("target_candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_invites" ADD CONSTRAINT "candidate_invites_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_invites" ADD CONSTRAINT "candidate_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_journey_events" ADD CONSTRAINT "candidate_journey_events_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_journey_events" ADD CONSTRAINT "candidate_journey_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_nda_agreements" ADD CONSTRAINT "candidate_nda_agreements_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_nda_agreements" ADD CONSTRAINT "candidate_nda_agreements_template_id_nda_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."nda_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_recruiter_assignments" ADD CONSTRAINT "candidate_recruiter_assignments_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_recruiter_assignments" ADD CONSTRAINT "candidate_recruiter_assignments_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_recruiter_assignments" ADD CONSTRAINT "candidate_recruiter_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_recruiter_assignments" ADD CONSTRAINT "candidate_recruiter_assignments_ended_by_users_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_trainings" ADD CONSTRAINT "candidate_trainings_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_trainings" ADD CONSTRAINT "candidate_trainings_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_related_lead_id_leads_id_fk" FOREIGN KEY ("related_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_related_candidate_id_candidates_id_fk" FOREIGN KEY ("related_candidate_id") REFERENCES "public"."candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_related_invite_id_candidate_invites_id_fk" FOREIGN KEY ("related_invite_id") REFERENCES "public"."candidate_invites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_related_nda_agreement_id_candidate_nda_agreements_id_fk" FOREIGN KEY ("related_nda_agreement_id") REFERENCES "public"."candidate_nda_agreements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_candidate_id_candidates_id_fk" FOREIGN KEY ("converted_candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nda_templates" ADD CONSTRAINT "nda_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_change_log" ADD CONSTRAINT "password_change_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_change_log" ADD CONSTRAINT "password_change_log_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_application_events_application" ON "application_events" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_application_events_candidate" ON "application_events" USING btree ("candidate_id","event_type","status");--> statement-breakpoint
CREATE INDEX "idx_application_events_schedule" ON "application_events" USING btree ("event_type","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "application_events_event_key_unique" ON "application_events" USING btree ("application_id","event_key") WHERE "application_events"."event_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_applications_candidate" ON "applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "applications" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_applications_submitted_by" ON "applications" USING btree ("submitted_by","updated_at");--> statement-breakpoint
CREATE INDEX "idx_applications_next_action" ON "applications" USING btree ("next_action_at");--> statement-breakpoint
CREATE INDEX "idx_applications_upcoming" ON "applications" USING btree ("upcoming_when");--> statement-breakpoint
CREATE INDEX "idx_candidate_invites_candidate" ON "candidate_invites" USING btree ("candidate_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_candidate_journey_events" ON "candidate_journey_events" USING btree ("candidate_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_candidate_nda_status" ON "candidate_nda_agreements" USING btree ("candidate_id","status");--> statement-breakpoint
CREATE INDEX "idx_candidate_recruiter_assignments_candidate" ON "candidate_recruiter_assignments" USING btree ("candidate_id","assigned_at");--> statement-breakpoint
CREATE INDEX "idx_candidate_recruiter_assignments_recruiter" ON "candidate_recruiter_assignments" USING btree ("recruiter_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_recruiter_assignments_one_active" ON "candidate_recruiter_assignments" USING btree ("candidate_id") WHERE "candidate_recruiter_assignments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_candidates_recruiter" ON "candidates" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX "idx_documents_candidate" ON "documents" USING btree ("candidate_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_logs_recipient" ON "email_delivery_logs" USING btree ("recipient","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_logs_lead" ON "email_delivery_logs" USING btree ("related_lead_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_logs_candidate" ON "email_delivery_logs" USING btree ("related_candidate_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_logs_invite" ON "email_delivery_logs" USING btree ("related_invite_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_logs_nda" ON "email_delivery_logs" USING btree ("related_nda_agreement_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leads_email" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_leads_consultation" ON "leads" USING btree ("consultation_status","consultation_scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_message_reads_user" ON "message_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender_receiver" ON "messages" USING btree ("sender_id","receiver_id","sent_at");--> statement-breakpoint
CREATE INDEX "idx_nda_templates_active" ON "nda_templates" USING btree ("is_active","effective_from");