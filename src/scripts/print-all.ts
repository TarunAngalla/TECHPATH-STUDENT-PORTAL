import { db } from "../lib/db";
import { users, candidates } from "../lib/db/schema";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("=== ALL USERS ===");
  console.log(allUsers);

  const allCandidates = await db.select().from(candidates);
  console.log("=== ALL CANDIDATES ===");
  console.log(allCandidates);
}

main().catch(console.error);
