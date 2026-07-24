import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const schemaName = `migration_smoke_${randomUUID().replaceAll("-", "")}`;
const migrationsDirectory = path.resolve(process.cwd(), "drizzle");
const client = postgres(databaseUrl, { max: 1, prepare: false });

async function assertColumn(
  sql: postgres.ReservedSql,
  tableName: string,
  columnName: string,
) {
  const rows = await sql<{ exists: boolean }[]>`
    select exists (
      select 1
      from information_schema.columns
      where table_schema = ${schemaName}
        and table_name = ${tableName}
        and column_name = ${columnName}
    ) as exists
  `;
  if (!rows[0]?.exists) throw new Error(`Missing ${tableName}.${columnName}`);
}

async function assertTable(sql: postgres.ReservedSql, tableName: string) {
  const rows = await sql<{ exists: boolean }[]>`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = ${schemaName}
        and table_name = ${tableName}
    ) as exists
  `;
  if (!rows[0]?.exists) throw new Error(`Missing table ${tableName}`);
}

async function main() {
  const sql = await client.reserve();
  try {
    await sql.unsafe(`create schema "${schemaName}"`);
    await sql.unsafe(`set search_path to "${schemaName}", public`);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort();
    if (migrationFiles.length === 0) throw new Error("No SQL migrations found");

    for (const file of migrationFiles) {
      const source = await readFile(path.join(migrationsDirectory, file), "utf8");
      // Smoke runs inside an isolated schema via search_path. Drizzle sometimes emits
      // schema-qualified "public"."table" FKs that miss those tables in CI.
      const adapted = source
        .replace(/REFERENCES\s+"public"\."([^"]+)"/gi, 'REFERENCES "$1"')
        .replace(/REFERENCES\s+public\.([a-zA-Z_][\w]*)/gi, "REFERENCES $1");
      await sql.unsafe(adapted);
    }

    await assertColumn(sql, "messages", "sender_id");
    await assertColumn(sql, "messages", "receiver_id");
    await assertColumn(sql, "message_reads", "user_id");
    await assertColumn(sql, "documents", "storage_path");
    await assertColumn(sql, "users", "account_state");
    await assertColumn(sql, "users", "session_version");
    await assertColumn(sql, "leads", "consultation_status");
    await assertColumn(sql, "leads", "consultation_scheduled_at");
    await assertColumn(sql, "leads", "consultation_completed_at");
    await assertColumn(sql, "leads", "consultation_notes");
    await assertColumn(sql, "leads", "consultation_meeting_link");
    await assertColumn(sql, "candidate_nda_agreements", "signing_provider");
    await assertColumn(sql, "candidate_nda_agreements", "provider_envelope_id");
    await assertColumn(sql, "candidate_nda_agreements", "signing_started_at");
    await assertColumn(sql, "email_delivery_logs", "related_nda_agreement_id");
    await assertColumn(sql, "candidates", "marketing_status");
    await assertColumn(sql, "candidates", "marketing_live_at");
    await assertColumn(sql, "candidate_recruiter_assignments", "ended_by");
    await assertColumn(sql, "candidate_recruiter_assignments", "end_reason");
    await assertColumn(sql, "candidate_journey_events", "previous_stage");
    await assertColumn(sql, "candidate_journey_events", "source");
    await assertColumn(sql, "candidate_journey_events", "candidate_visible");
    await assertColumn(sql, "applications", "submitted_by");
    await assertColumn(sql, "applications", "candidate_visible_notes");
    await assertColumn(sql, "applications", "internal_notes");
    await assertColumn(sql, "applications", "next_action_at");
    await assertColumn(sql, "application_events", "activity_type");
    await assertColumn(sql, "application_events", "event_key");
    await assertColumn(sql, "application_events", "scheduled_end_at");
    await assertColumn(sql, "application_events", "timezone");
    await assertColumn(sql, "application_events", "candidate_visible_notes");
    await assertColumn(sql, "application_events", "candidate_visible");
    await assertColumn(sql, "announcements", "source_key");

    for (const table of [
      "candidate_invites",
      "nda_templates",
      "candidate_nda_agreements",
      "candidate_recruiter_assignments",
      "candidate_journey_events",
      "application_events",
      "public_request_rate_limits",
      "email_delivery_logs",
      "staff_profiles",
      "candidate_section_views",
    ]) {
      await assertTable(sql, table);
    }

    const legacyColumns = await sql<{ count: number }[]>`
      select count(*)::int as count
      from information_schema.columns
      where table_schema = ${schemaName}
        and table_name = 'messages'
        and column_name in ('candidate_id', 'sender_role')
    `;
    if ((legacyColumns[0]?.count ?? 0) !== 0) {
      throw new Error("Legacy message columns still exist");
    }



    const [admin] = await sql<{ id: string }[]>`
      insert into users(email, password_hash, role, first_login, account_state)
      values ('nda-admin@example.com', 'hash', 'admin', false, 'active')
      returning id
    `;
    const [candidateUser] = await sql<{ id: string }[]>`
      insert into users(email, password_hash, role, first_login, account_state)
      values ('nda-candidate@example.com', 'hash', 'candidate', false, 'nda_pending')
      returning id
    `;
    const [candidate] = await sql<{ id: string }[]>`
      insert into candidates(user_id, full_name, opt_type)
      values (${candidateUser.id}, 'Migration Smoke Candidate', 'OPT')
      returning id
    `;
    const [template] = await sql<{ id: string }[]>`
      insert into nda_templates(version, title, content, document_hash, effective_from, is_active, created_by)
      values ('smoke-v1', 'Smoke NDA', repeat('Smoke NDA content. ', 10), repeat('a', 64), now(), true, ${admin.id})
      returning id
    `;
    const [agreement] = await sql<{ id: string }[]>`
      insert into candidate_nda_agreements(candidate_id, template_id, status, signing_provider, signing_started_at)
      values (${candidate.id}, ${template.id}, 'signing', 'typed_name_v1', now())
      returning id
    `;
    await sql`
      update candidate_nda_agreements
      set status = 'signed', accepted_at = now(), signer_name = 'Migration Smoke Candidate',
          signed_document_path = 'candidate/nda/smoke.pdf', signed_document_hash = repeat('b', 64),
          consent_text = 'Migration smoke consent', signing_started_at = null
      where id = ${agreement.id}
    `;

    let immutableEvidenceBlocked = false;
    try {
      await sql`
        update candidate_nda_agreements
        set signer_name = 'Tampered Candidate'
        where id = ${agreement.id}
      `;
    } catch {
      immutableEvidenceBlocked = true;
    }
    if (!immutableEvidenceBlocked) throw new Error("Signed NDA evidence mutation was not blocked");

    await sql`
      insert into email_delivery_logs(email_type, recipient, subject, status, related_candidate_id, related_nda_agreement_id)
      values ('nda_signed_candidate', 'nda-candidate@example.com', 'Signed NDA', 'logged', ${candidate.id}, ${agreement.id})
    `;

    const [recruiter] = await sql<{ id: string }[]>`
      insert into users(email, password_hash, role, first_login, account_state)
      values ('phase4-recruiter@example.com', 'hash', 'recruiter', false, 'active')
      returning id
    `;
    await sql`
      insert into staff_profiles(user_id, full_name, max_active_candidates, is_available)
      values (${recruiter.id}, 'Phase Four Recruiter', 5, true)
    `;
    await sql`
      update candidates
      set recruiter_id = ${recruiter.id}, marketing_status = 'ready', marketing_ready_at = now()
      where id = ${candidate.id}
    `;
    await sql`
      insert into candidate_recruiter_assignments(candidate_id, recruiter_id, assigned_by, reason)
      values (${candidate.id}, ${recruiter.id}, ${admin.id}, 'Migration smoke assignment')
    `;
    await sql`
      insert into candidate_journey_events(candidate_id, stage, previous_stage, event_type, source, note, candidate_visible, created_by)
      values (${candidate.id}, 1, 0, 'stage_reached', 'assignment', 'Recruiter assigned', true, ${admin.id})
    `;

    let duplicateActiveAssignmentBlocked = false;
    try {
      await sql`
        insert into candidate_recruiter_assignments(candidate_id, recruiter_id, assigned_by, reason)
        values (${candidate.id}, ${recruiter.id}, ${admin.id}, 'Duplicate should fail')
      `;
    } catch {
      duplicateActiveAssignmentBlocked = true;
    }
    if (!duplicateActiveAssignmentBlocked) {
      throw new Error("Multiple active recruiter assignments were not blocked");
    }


    const [phase5Application] = await sql<{ id: string }[]>`
      insert into applications(candidate_id, app_no, company_name, role_title, date_applied, status, submitted_by, priority)
      values (${candidate.id}, 'APP-P5', 'Phase Five Company', 'Software Engineer', current_date, 'submitted', ${recruiter.id}, 'high')
      returning id
    `;
    await sql`
      insert into application_events(
        application_id, candidate_id, event_type, activity_type, event_key, title, status,
        scheduled_at, scheduled_end_at, timezone, round_number, candidate_visible, created_by
      ) values (
        ${phase5Application.id}, ${candidate.id}, 'interview', 'technical_interview', 'phase5-smoke-event',
        'Technical interview', 'scheduled', now() + interval '1 day', now() + interval '2 days',
        'America/Chicago', 1, true, ${recruiter.id}
      )
    `;

    let duplicateEventBlocked = false;
    try {
      await sql`
        insert into application_events(
          application_id, candidate_id, event_type, activity_type, event_key, title, status, candidate_visible, created_by
        ) values (
          ${phase5Application.id}, ${candidate.id}, 'interview', 'technical_interview', 'phase5-smoke-event',
          'Duplicate interview', 'scheduled', true, ${recruiter.id}
        )
      `;
    } catch {
      duplicateEventBlocked = true;
    }
    if (!duplicateEventBlocked) throw new Error("Duplicate application event key was not blocked");

    await sql`
      insert into application_events(
        application_id, candidate_id, event_type, activity_type, event_key, title, status,
        completed_at, result, score, candidate_visible, created_by
      ) values (
        ${phase5Application.id}, ${candidate.id}, 'assessment', 'coding_test', 'phase5-assessment',
        'Coding assessment', 'result_pending', now(), 'Awaiting final score', '82', true, ${recruiter.id}
      )
    `;

    console.log(`Migration smoke passed: ${migrationFiles.join(", ")}`);
  } finally {
    await sql.unsafe(`drop schema if exists "${schemaName}" cascade`);
    sql.release();
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
