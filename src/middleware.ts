import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/auth/session-config";
import { getPortalFromHost } from "@/lib/portal";

const SHARED_PUBLIC = ["/login"];
const CANDIDATE_PUBLIC = [...SHARED_PUBLIC, "/request-access", "/setup-account"];
const ADMIN_PUBLIC = [...SHARED_PUBLIC];

function envFlag(name: string, defaultValue = false) {
  const value = process.env[name];
  return value === undefined ? defaultValue : value === "1" || value.toLowerCase() === "true";
}

function isPublicPath(pathname: string, portal: "candidate" | "admin") {
  const paths = portal === "admin" ? ADMIN_PUBLIC : CANDIDATE_PUBLIC;
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function rewriteForPortal(request: NextRequest, portal: "candidate" | "admin") {
  const { pathname } = request.nextUrl;
  if (portal === "admin") {
    // Single shared login page — never rewrite /login onto an admin-only route.
    if (pathname === "/login") return null;
    if (pathname.startsWith("/admin")) return null;
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/admin/dashboard" : `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }
  if (pathname.startsWith("/admin")) return NextResponse.redirect(new URL("/login", request.url));
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return null;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Server Actions must receive an untouched RSC response. Auth still runs inside each action.
  const isServerAction =
    request.method === "POST" &&
    (request.headers.has("next-action") || request.headers.has("x-action"));
  if (isServerAction) {
    return NextResponse.next();
  }

  // Legacy admin login URL — always use the shared /login page.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return redirectTo(request, "/login");
  }

  const portal = getPortalFromHost(host, pathname);
  const rewrite = rewriteForPortal(request, portal);
  if (rewrite?.headers.get("location")) return rewrite;
  const response = rewrite ?? NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  const isLoggedIn = session.isLoggedIn === true;

  if (!isLoggedIn && !isPublicPath(pathname, portal)) {
    return redirectTo(request, "/login");
  }
  if (!isLoggedIn) return response;

  // Keep the session cookie alive while the user is actively browsing.
  await session.save();

  // Wrong portal for this role: redirect home — do NOT wipe the session.
  // (Previously visiting /login as staff deleted the cookie and felt like random logouts.)
  if (portal === "candidate" && session.role !== "candidate") {
    if (session.role === "admin" || session.role === "recruiter") {
      if (pathname === "/login" || pathname === "/" || pathname === "/request-access") {
        return redirectTo(request, "/admin/dashboard");
      }
      return redirectTo(request, "/admin/dashboard");
    }
    return redirectTo(request, "/login");
  }
  if (portal === "admin" && session.role !== "recruiter" && session.role !== "admin") {
    if (session.role === "candidate") {
      return redirectTo(request, "/dashboard");
    }
    return redirectTo(request, "/login");
  }

  if (portal === "candidate" && session.role === "candidate") {
    const ndaGateEnabled = envFlag("ENABLE_NDA_GATE", false);
    const needsAccountSetup = session.firstLogin || session.accountState === "pending_setup";
    const needsNda = ndaGateEnabled && session.accountState === "nda_pending";
    const suspended = session.accountState === "suspended";
    if (suspended && pathname !== "/account-suspended") {
      return redirectTo(request, "/account-suspended");
    }
    if (needsAccountSetup && !["/reset-password", "/setup-account"].includes(pathname)) {
      return redirectTo(request, "/reset-password");
    }
    if (!needsAccountSetup && needsNda && pathname !== "/nda") {
      return redirectTo(request, "/nda");
    }
    if (
      !needsAccountSetup &&
      !needsNda &&
      !suspended &&
      ["/login", "/request-access", "/setup-account", "/reset-password", "/nda", "/account-suspended"].includes(pathname)
    ) {
      return redirectTo(request, "/dashboard");
    }
  }

  if (portal === "admin" && pathname === "/login") {
    return redirectTo(request, "/admin/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|images/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml)$).*)",
  ],
};
