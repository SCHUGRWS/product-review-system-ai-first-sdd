import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "@/i18n/locales";
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

// The UI language for URLs without a locale (read by src/proxy.ts). Set when
// the user picks a language on /me and at sign-in from the account; kept on
// sign-out, so the sign-in page stays in that language.
export function serializeLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Max-Age=${LOCALE_COOKIE_MAX_AGE}; ${attributes()}`;
}
