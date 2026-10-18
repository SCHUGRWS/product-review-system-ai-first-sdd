import { t } from "@/i18n/t";

const average = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// 3.6667 -> "3.7"
export function formatAverage(value: number) {
  return average.format(value);
}

// 1 -> "1 review"; 3 -> "3 reviews"
export function reviewCountLabel(count: number) {
  return t(count === 1 ? "reviews.count.one" : "reviews.count.other", {
    count,
  });
}

// 1 -> "1 star"; 5 -> "5 stars"
export function starsLabel(count: number) {
  return t(count === 1 ? "reviews.stars.one" : "reviews.stars.other", {
    count,
  });
}

const summaryDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// "AI summary of 3 reviews, updated Oct 18, 2026"
export function summaryFooter(reviewCount: number, generatedAt: Date) {
  return t(
    reviewCount === 1
      ? "reviews.summary.footer.one"
      : "reviews.summary.footer.other",
    { count: reviewCount, date: summaryDate.format(generatedAt) },
  );
}

/** Share of all reviews, 0..100, for a distribution bar */
export function barPercent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}
