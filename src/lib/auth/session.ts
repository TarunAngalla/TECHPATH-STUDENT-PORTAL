import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { defaultSession, getSessionOptions, type SessionData } from "./session-config";

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}
export async function getCurrentUser() {
  const session = await getSession();
  return session.isLoggedIn ? session : null;
}
export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
export async function createSession(data: Omit<SessionData, "isLoggedIn">) {
  const session = await getSession();
  session.userId = data.userId;
  session.email = data.email;
  session.role = data.role;
  session.candidateId = data.candidateId;
  session.firstLogin = data.firstLogin ?? false;
  session.accountState = data.accountState ?? "active";
  session.sessionVersion = data.sessionVersion ?? 1;
  session.isLoggedIn = true;
  await session.save();
}
export async function updateCandidateSessionState(data: {
  firstLogin?: boolean;
  accountState?: SessionData["accountState"];
  sessionVersion?: number;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) return;
  if (data.firstLogin !== undefined) session.firstLogin = data.firstLogin;
  if (data.accountState !== undefined) session.accountState = data.accountState;
  if (data.sessionVersion !== undefined) session.sessionVersion = data.sessionVersion;
  await session.save();
}
export async function updateSessionFirstLogin(firstLogin: boolean) {
  await updateCandidateSessionState({ firstLogin });
}
export async function clearSession() {
  const session = await getSession();
  Object.assign(session, defaultSession);
  await session.save();
}
