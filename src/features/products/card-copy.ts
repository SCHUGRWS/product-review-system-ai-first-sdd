import { formatAverage } from "@/features/reviews/reviews.utils";
import { t } from "@/i18n/t";
import { formatCount, formatReviewCount } from "./format";
import type { Product, ProductCommunity } from "./product.types";

// Copy of the product card's review lines (specs/product.md, requirement 7):
// the app's own reviews come first, Amazon's rating second and labelled.

export type CommunityCopy =
  | { kind: "none"; label: string }
  | { kind: "reviews"; label: string; average: string; stars: number };

/**
 * "3 reviews here" with the average ("4.3", stars rounded to 4), or "No
 * reviews yet". Null when the numbers were not loaded: nothing is shown rather
 * than a wrong "No reviews yet".
 */
export function communityCopy(
  community: ProductCommunity | undefined,
): CommunityCopy | null {
  if (!community) return null;
  if (community.count === 0 || community.average === null) {
    return { kind: "none", label: t("products.card.noReviews") };
  }
  return {
    kind: "reviews",
    label: t(
      community.count === 1
        ? "products.card.reviewsHere.one"
        : "products.card.reviewsHere.other",
      { count: formatCount(community.count) },
    ),
    average: formatAverage(community.average),
    stars: Math.round(community.average),
  };
}

/** "4.6 on Amazon (1,234 reviews)", "4.6 on Amazon", or null without a rating */
export function amazonRatingCopy(
  product: Pick<Product, "rating" | "reviewCount">,
): string | null {
  if (product.rating === null) return null;
  const rating = product.rating.toFixed(1);
  return product.reviewCount !== null
    ? t("reviews.amazonRating", {
        rating,
        count: formatReviewCount(product.reviewCount),
      })
    : t("reviews.amazonRatingNoCount", { rating });
}

/** "See 3 reviews" when the product has reviews here, else "See feedback" */
export function reviewsLinkCopy(community: ProductCommunity | undefined) {
  const count = community?.count ?? 0;
  if (count === 0) return t("reviews.seeFeedback");
  return t(
    count === 1
      ? "products.card.seeReviews.one"
      : "products.card.seeReviews.other",
    { count: formatCount(count) },
  );
}
