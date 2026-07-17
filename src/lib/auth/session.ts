import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { defaultSession, getSessionOptions, type SessionData } from "./session-config";

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
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
  session.isLoggedIn = true;
  await session.save();
}

export async function clearSession() {
  const session = await getSession();
  Object.assign(session, defaultSession);
  await session.save();
}
