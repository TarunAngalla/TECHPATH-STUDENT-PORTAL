CREATE TABLE IF NOT EXISTS "candidate_section_views" (
	"candidate_id" uuid NOT NULL,
	"section" text NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_section_views_candidate_id_section_pk" PRIMARY KEY("candidate_id","section")
);
--> statement-breakpoint
ALTER TABLE "candidate_section_views" ADD CONSTRAINT "candidate_section_views_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
