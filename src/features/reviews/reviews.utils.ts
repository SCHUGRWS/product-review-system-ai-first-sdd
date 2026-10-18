import { formatCount, formatShortDate } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { T } from "@/i18n/message";

// 1 -> "1 review"; 1234 -> "1,234 reviews" / "1.234 avaliações"
export function reviewCountLabel(t: T, locale: Locale, count: number) {
  return t(count === 1 ? "reviews.count.one" : "reviews.count.other", {
    count: formatCount(locale, count),
  });
}

// 1 -> "1 star"; 5 -> "5 stars"
export function starsLabel(t: T, count: number) {
  return t(count === 1 ? "reviews.stars.one" : "reviews.stars.other", {
    count,
  });
}

// "AI summary of 3 reviews, updated Oct 18, 2026"
export function summaryFooter(
  t: T,
  locale: Locale,
  reviewCount: number,
  generatedAt: Date,
) {
  return t(
    reviewCount === 1
      ? "reviews.summary.footer.one"
      : "reviews.summary.footer.other",
    {
      count: formatCount(locale, reviewCount),
      date: formatShortDate(locale, generatedAt),
    },
  );
}

/** Share of all reviews, 0..100, for a distribution bar */
export function barPercent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}
