import type { Locale } from "@/i18n/locales";

// Shared session contract (plans/execution.md, Phase 0).
// The fields the app may know about the signed-in user. Never add password, salt or token.
export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  /** UI language saved on the account (specs/i18n.md) */
  locale: Locale;
};

export const SESSION_COOKIE = "prs_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
