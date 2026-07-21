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
      await sql.unsafe(source);
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

    for (const table of [
      "candidate_invites",
      "nda_templates",
      "candidate_nda_agreements",
      "candidate_recruiter_assignments",
      "candidate_journey_events",
      "application_events",
      "public_request_rate_limits",
      "email_delivery_logs",
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
