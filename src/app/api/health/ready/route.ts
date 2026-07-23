import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import { getOrCreateRequestId } from "@/lib/observability/request-id";

export const dynamic = "force-dynamic";

async function databaseReady() {
  const timeoutMs = Number(process.env.HEALTH_DB_TIMEOUT_MS ?? 2500);
  await Promise.race([
    db.execute(sql`select 1 as ready`),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Database readiness timeout")), timeoutMs)),
  ]);
}

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request.headers);
  try {
    await databaseReady();
    return NextResponse.json(
      {
        status: "ready",
        checks: {
          database: "ready",
          storageConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
          emailConfigured: Boolean(process.env.RESEND_API_KEY),
        },
        timestamp: new Date().toISOString(),
        requestId,
      },
      { headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  } catch (error) {
    logger.error("health.readiness_failed", error, { requestId });
    return NextResponse.json(
      { status: "not_ready", checks: { database: "unavailable" }, timestamp: new Date().toISOString(), requestId },
      { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  }
}
