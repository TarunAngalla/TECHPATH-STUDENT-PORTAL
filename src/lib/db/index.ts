import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const databaseUrl: string = connectionString;

type DbClient = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  techpathSql?: DbClient;
  techpathDb?: Db;
};

function createClient() {
  return postgres(databaseUrl, {
    // Keep the pool small — Next/Turbopack can otherwise leak many idle clients in dev.
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    prepare: false,
  });
}

const client = globalForDb.techpathSql ?? createClient();
const db = globalForDb.techpathDb ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.techpathSql = client;
  globalForDb.techpathDb = db;
}

export { db };
