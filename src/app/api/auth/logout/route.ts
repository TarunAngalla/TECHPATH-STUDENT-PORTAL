import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/auth/session-config";

/** Clears the session cookie (safe in Route Handlers). */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/login";
  const response = NextResponse.redirect(new URL(next, request.url));
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  session.destroy();
  return response;
}
