import { db } from "../lib/db";
import { messages } from "../lib/db/schema";

async function main() {
  console.log("=== MESSAGES ===");
  const allMessages = await db.select().from(messages);
  console.log(allMessages);
}

main().catch(console.error);
