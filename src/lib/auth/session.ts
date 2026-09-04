import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Session } from "@/lib/api/types";
import { getSessionStore } from "@/lib/api/mock/store";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export function createSessionId(): string {
  return randomBytes(32).toString("hex");
}

export function hashUserAgent(userAgent: string | null): string {
  return createHash("sha256")
    .update(userAgent ?? "unknown")
    .digest("hex");
}

export function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex").slice(0, 12);
}

export function isSessionExpired(session: Session, now = Date.now()): boolean {
  if (now - session.lastSeenAt > IDLE_TIMEOUT_MS) {
    return true;
  }
  if (now - session.createdAt > ABSOLUTE_TIMEOUT_MS) {
    return true;
  }
  return false;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_TIMEOUT_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return null;
  }

  const sessions = getSessionStore();
  const session = sessions.get(sessionId);
  if (!session || isSessionExpired(session)) {
    if (session) {
      sessions.delete(sessionId);
    }
    return null;
  }

  session.lastSeenAt = Date.now();
  return session.userId;
}
