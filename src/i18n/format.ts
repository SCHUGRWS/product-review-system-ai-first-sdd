import {
  type Locale as DateFnsLocale,
  format,
  formatDistanceStrict,
} from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import type { Locale } from "./locales";

export { formatPrice } from "./price";

// Dates and numbers in the UI language (specs/i18n.md). Prices are always BRL
// ("R$ 1.999,94"), whatever the language: the deals are from Amazon Brazil.

const DATE_FNS: Record<Locale, DateFnsLocale> = { en: enUS, "pt-BR": ptBR };
const INTL: Record<Locale, string> = { en: "en-US", "pt-BR": "pt-BR" };

export function dateFnsLocale(locale: Locale) {
  return DATE_FNS[locale];
}

const counts = new Map<Locale, Intl.NumberFormat>();

/** 1234 -> "1,234" (en) / "1.234" (pt-BR) */
export function formatCount(locale: Locale, value: number) {
  let formatter = counts.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL[locale]);
    counts.set(locale, formatter);
  }
  return formatter.format(value);
}

const averages = new Map<Locale, Intl.NumberFormat>();

/** 3.6667 -> "3.7" (en) / "3,7" (pt-BR) */
export function formatAverage(locale: Locale, value: number) {
  let formatter = averages.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL[locale], {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    averages.set(locale, formatter);
  }
  return formatter.format(value);
}

/** "Oct 18, 2026" / "18 de out. de 2026", in UTC */
export function formatShortDate(locale: Locale, date: Date) {
  return new Intl.DateTimeFormat(INTL[locale], {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Month and year in UTC ("October 2026" / "outubro de 2026"), so an account
 * created on the 1st just after midnight UTC does not show the previous month
 * for users west of Greenwich.
 */
export function formatMonthYear(locale: Locale, date: Date) {
  const utcMonth = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);
  return format(utcMonth, locale === "pt-BR" ? "MMMM 'de' yyyy" : "MMMM yyyy", {
    locale: DATE_FNS[locale],
  });
}

/** "3 days ago" / "há 3 dias" */
export function formatTimeAgo(locale: Locale, date: Date, now: Date) {
  return formatDistanceStrict(date, now, {
    addSuffix: true,
    locale: DATE_FNS[locale],
  });
}
