import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/auth/session-config";
import { getPortalFromHost } from "@/lib/portal";

const CANDIDATE_PUBLIC = ["/login", "/request-access", "/setup-account"];
const ADMIN_PUBLIC = ["/admin/login"];
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
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
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
function redirectWithDeletedSession(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url);
  response.cookies.delete("techpath_session");
  return response;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const portal = getPortalFromHost(host, pathname);
  const rewrite = rewriteForPortal(request, portal);
  if (rewrite?.headers.get("location")) return rewrite;
  const response = rewrite ?? NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  const isLoggedIn = session.isLoggedIn === true;
  if (!isLoggedIn && !isPublicPath(pathname, portal)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = portal === "admin" ? "/admin/login" : "/login";
    return NextResponse.redirect(loginUrl);
  }
  if (!isLoggedIn) return response;
  if (portal === "candidate" && session.role !== "candidate") return redirectWithDeletedSession(request, "/login");
  if (portal === "admin" && session.role !== "recruiter" && session.role !== "admin") {
    return redirectWithDeletedSession(request, "/admin/login");
  }
  if (portal === "candidate" && session.role === "candidate") {
    const ndaGateEnabled = envFlag("ENABLE_NDA_GATE", false);
    const needsAccountSetup = session.firstLogin || session.accountState === "pending_setup";
    const needsNda = ndaGateEnabled && session.accountState === "nda_pending";
    const suspended = session.accountState === "suspended";
    if (suspended && pathname !== "/account-suspended") {
      const url = request.nextUrl.clone(); url.pathname = "/account-suspended"; return NextResponse.redirect(url);
    }
    if (needsAccountSetup && !["/reset-password", "/setup-account"].includes(pathname)) {
      const url = request.nextUrl.clone(); url.pathname = "/reset-password"; return NextResponse.redirect(url);
    }
    if (!needsAccountSetup && needsNda && pathname !== "/nda") {
      const url = request.nextUrl.clone(); url.pathname = "/nda"; return NextResponse.redirect(url);
    }
    if (!needsAccountSetup && !needsNda && !suspended && ["/login", "/request-access", "/setup-account", "/reset-password", "/nda", "/account-suspended"].includes(pathname)) {
      const url = request.nextUrl.clone(); url.pathname = "/dashboard"; return NextResponse.redirect(url);
    }
  }
  if (portal === "admin" && pathname === "/admin/login") {
    const url = request.nextUrl.clone(); url.pathname = "/admin/dashboard"; return NextResponse.redirect(url);
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"] };
