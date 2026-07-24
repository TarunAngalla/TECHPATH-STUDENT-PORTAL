import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function resetDatabase() {
  if (process.env.NODE_ENV === "production") throw new Error("Database reset is disabled in production");
  await db.execute(sql`
    TRUNCATE TABLE
      message_reads,
      announcement_reads,
      messages,
      announcements,
      documents,
      candidate_trainings,
      application_events,
      applications,
      candidate_journey_events,
      candidate_recruiter_assignments,
      candidate_nda_agreements,
      nda_templates,
      candidate_invites,
      email_delivery_logs,
      public_request_rate_limits,
      password_change_log,
      audit_log,
      leads,
      candidates,
      staff_profiles,
      trainings,
      users
    RESTART IDENTITY CASCADE
  `);
  console.info("Database cleared for local development seed.");
}

function seedCredentials() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("SEED_ADMIN_EMAIL is required and must be valid");
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD is required and must be at least 12 characters");
  return { email, password };
}

async function seed() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed is disabled in production");
  const force = process.argv.includes("--force") || process.env.SEED_FORCE === "1";
  if (force) await resetDatabase();

  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.info("Database already contains users; seed skipped.");
    return;
  }

  const credentials = seedCredentials();
  await db.insert(users).values({
    email: credentials.email,
    passwordHash: await hashPassword(credentials.password),
    role: "admin",
    firstLogin: false,
    accountState: "active",
  });

  console.info(`Seed complete. Admin account created for ${credentials.email}.`);
  console.info("The seed password was not printed. Retrieve it from your local environment or password manager.");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
