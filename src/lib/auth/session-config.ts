import type { SessionOptions } from "iron-session";
import type { AccountState } from "@/lib/db/schema";

export type UserRole = "candidate" | "recruiter" | "admin";
export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  candidateId?: string;
  firstLogin?: boolean;
  accountState?: AccountState;
  sessionVersion?: number;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: "",
  email: "",
  role: "candidate",
  isLoggedIn: false,
  firstLogin: false,
  accountState: "active",
  sessionVersion: 0,
};

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password) {
    throw new Error("SESSION_SECRET is required and must be at least 32 characters");
  }
  if (password.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
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
