import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/auth/session-config";
import { getPortalFromHost } from "@/lib/portal";

const CANDIDATE_PUBLIC = ["/login"];
const ADMIN_PUBLIC = ["/admin/login"];

function isPublicPath(pathname: string, portal: "candidate" | "admin") {
  if (portal === "admin") {
    return ADMIN_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return CANDIDATE_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function rewriteForPortal(request: NextRequest, portal: "candidate" | "admin") {
  const { pathname } = request.nextUrl;

  if (portal === "admin") {
    if (pathname.startsWith("/admin")) return null;
    const url = request.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/admin/dashboard";
    } else {
      url.pathname = `/admin${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const portal = getPortalFromHost(host, pathname);

  const rewrite = rewriteForPortal(request, portal);
  const response = rewrite ?? NextResponse.next();

  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  const isLoggedIn = session.isLoggedIn === true;

  const authPath = portal === "admin" ? pathname : pathname;
  const publicPath = isPublicPath(authPath, portal);

  if (!isLoggedIn && !publicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = portal === "admin" ? "/admin/login" : "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn) {
    if (portal === "candidate" && session.role !== "candidate") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      session.destroy();
      return NextResponse.redirect(loginUrl);
    }

    if (portal === "admin" && session.role !== "recruiter" && session.role !== "admin") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      session.destroy();
      return NextResponse.redirect(loginUrl);
    }

    if (portal === "candidate" && publicPath) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/dashboard";
      return NextResponse.redirect(dest);
    }

    if (portal === "admin" && pathname === "/admin/login") {
      const dest = request.nextUrl.clone();
      dest.pathname = "/admin/dashboard";
      return NextResponse.redirect(dest);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
