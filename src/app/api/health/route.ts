import { NextResponse } from "next/server";
import { getOrCreateRequestId } from "@/lib/observability/request-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request.headers);
  return NextResponse.json(
    {
      status: "ok",
      service: "techpath-portal",
      environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? process.env.npm_package_version ?? "unknown",
      timestamp: new Date().toISOString(),
      requestId,
    },
    { headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
