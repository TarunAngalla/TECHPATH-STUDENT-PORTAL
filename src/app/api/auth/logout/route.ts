import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/auth/session-config";

/** Only allow same-origin relative paths (block open redirects). */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/login";
  }
  try {
    const parsed = new URL(raw, "http://localhost");
    if (parsed.origin !== "http://localhost") return "/login";
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/login";
  }
}

/** Clears the session cookie (safe in Route Handlers). */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.url));
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  session.destroy();
  return response;
}
