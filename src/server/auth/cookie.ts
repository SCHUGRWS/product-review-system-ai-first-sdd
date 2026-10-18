import { SESSION_COOKIE } from "./types";

// Attributes shared by the session cookie and the cookie that clears it.
function attributes(): string {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function serializeSessionCookie(token: string, expiresAt: Date): string {
  const maxAge = Math.max(
    0,
    Math.round((expiresAt.getTime() - Date.now()) / 1000),
  );
  return `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Expires=${expiresAt.toUTCString()}; ${attributes()}`;
}

export function serializeClearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; Expires=${new Date(0).toUTCString()}; ${attributes()}`;
}

// Reads the session token from a raw `Cookie` request header.
export function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    if (pair.slice(0, index).trim() !== SESSION_COOKIE) continue;
    const value = pair.slice(index + 1).trim();
    return value || null;
  }
  return null;
}
