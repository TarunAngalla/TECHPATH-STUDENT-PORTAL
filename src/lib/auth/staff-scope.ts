import type { SessionData, UserRole } from "./session-config";

export type StaffScope = {
  userId: string;
  email: string;
  role: Extract<UserRole, "recruiter" | "admin">;
  /** When set, staff may only access candidates with this recruiter_id */
  recruiterId: string | null;
  seesAllCandidates: boolean;
};

export function getStaffScope(session: Pick<SessionData, "userId" | "email" | "role">): StaffScope {
  if (session.role !== "recruiter" && session.role !== "admin") {
    throw new Error("getStaffScope requires staff role");
  }

  const isAdmin = session.role === "admin";
  return {
    userId: session.userId,
    email: session.email,
    role: session.role,
    recruiterId: isAdmin ? null : session.userId,
    seesAllCandidates: isAdmin,
  };
}

export function staffPortalSubtitle(role: StaffScope["role"]) {
  return role === "admin" ? "Admin portal" : "Recruiter workspace";
}
