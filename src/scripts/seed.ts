import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function resetDatabase() {
  await db.execute(sql`
    TRUNCATE TABLE
      message_reads,
      announcement_reads,
      messages,
      announcements,
      documents,
      candidate_trainings,
      applications,
      password_change_log,
      audit_log,
      leads,
      candidates,
      trainings,
      users
    RESTART IDENTITY CASCADE
  `);
  console.log("Database cleared.");
}

async function seed() {
  const force = process.argv.includes("--force") || process.env.SEED_FORCE === "1";

  if (force) {
    await resetDatabase();
  } else {
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (existing.length > 0) {
      console.log("Admin already exists — skipping. Re-run with: npm run db:reset");
      console.log("Admin login: admin@thetechpath.com / admin123");
      return;
    }
  }

  const adminHash = await hashPassword("admin123");

  await db.insert(users).values({
    email: "admin@thetechpath.com",
    passwordHash: adminHash,
    role: "admin",
    firstLogin: false,
  });

  console.log("Seed complete — admin only.");
  console.log("Admin login: admin@thetechpath.com / admin123");
  console.log("Create recruiters under Team, then leads → candidates from the admin console.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
