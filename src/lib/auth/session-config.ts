import type { SessionOptions } from "iron-session";

export type UserRole = "candidate" | "recruiter" | "admin";

export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  candidateId?: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: "",
  email: "",
  role: "candidate",
  isLoggedIn: false,
};

export function getSessionOptions(): SessionOptions {
  const password =
    process.env.SESSION_SECRET ??
    "dev-only-session-secret-change-before-production-32chars";
  if (password.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }

  return {
    password,
    cookieName: "techpath_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  };
}
