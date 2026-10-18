import { formatMonthYear } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { T } from "@/i18n/message";
import type { SessionUser } from "@/server/auth/types";

export function greeting(t: T, user: Pick<SessionUser, "firstName">) {
  return t("me.greeting", { name: user.firstName.trim() });
}

// "Member since October 2026" / "Membro desde outubro de 2026" (month in UTC)
export function memberSince(t: T, locale: Locale, createdAt: Date) {
  return t("me.memberSince", { date: formatMonthYear(locale, createdAt) });
}
