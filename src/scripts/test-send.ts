import { db } from "../lib/db";
import { messages, users, candidates } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@thetechpath.com")).limit(1);
  const [candidate] = await db.select().from(candidates).where(eq(candidates.fullName, "Ravi Kumar")).limit(1);

  if (!adminUser || !candidate?.userId) {
    console.error("Admin or Candidate not found");
    return;
  }

  console.log("Inserting test recruiter message...");
  const [inserted] = await db.insert(messages).values({
    senderId: adminUser.id,
    receiverId: candidate.userId,
    body: "Test reply from recruiter",
  }).returning();

  console.log("Inserted message:", inserted);
}

main().catch(console.error);
