// English UI copy (default locale). Keys are grouped by feature: "reviews.title".
// Placeholders use {name}. pt-BR must have exactly the same keys (specs/i18n.md).
export const en = {
  // Product reviews page (specs/product-reviews.md)
  "reviews.metaTitle": "Reviews | Product Review System",
  "reviews.seeFeedback": "See feedback",
  "reviews.seeAllReviews": "See all reviews",
  "reviews.ofProduct": "of {title}",
  "reviews.opensAmazon": "(opens Amazon)",
  "reviews.currentPrice": "Current price",
  "reviews.amazonRating": "{rating} on Amazon ({count})",
  "reviews.amazonRatingNoCount": "{rating} on Amazon",
  "reviews.giveFeedback": "Give feedback",
  "reviews.alreadyReviewed": "You reviewed this product",
  "reviews.loading": "Loading the product",
  "reviews.count.one": "{count} review",
  "reviews.count.other": "{count} reviews",
  "reviews.stars.one": "{count} star",
  "reviews.stars.other": "{count} stars",
  "reviews.stats.title": "Community rating",
  "reviews.stats.outOf": "out of 5",
  "reviews.stats.averageLabel": "Average rating {average} out of 5",
  "reviews.stats.noAverage": "No ratings yet",
  "reviews.stats.distribution": "Ratings by stars",
  "reviews.list.title": "Community reviews",
  "reviews.list.reviewBy": "Review by",
  "reviews.list.formerMember": "a former member",
  "reviews.list.loadFailed":
    "Could not load the reviews. Refresh the page to try again.",
  "reviews.empty.title": "No reviews yet",
  "reviews.empty.body":
    "Used this product? Your review is the first thing the next buyer reads.",
  "reviews.empty.cta": "Be the first to review",
  "reviews.pastEnd.body": "There are no reviews on this page.",
  "reviews.pastEnd.cta": "Go to the newest reviews",
  "reviews.summary.label": "AI summary",
  "reviews.summary.verdict.positive": "Mostly positive",
  "reviews.summary.verdict.mixed": "Mixed opinions",
  "reviews.summary.verdict.negative": "Mostly negative",
  "reviews.summary.pros": "What people like",
  "reviews.summary.cons": "What people dislike",
  "reviews.summary.footer.one": "AI summary of {count} review, updated {date}",
  "reviews.summary.footer.other":
    "AI summary of {count} reviews, updated {date}",
  "reviews.summary.tooFew": "The summary appears after 3 reviews",
  "reviews.summary.tooFewBody":
    "Once three people review this product, an AI summary of what they think shows up here.",
  "reviews.summary.unavailable": "Summary unavailable right now",
  "reviews.summary.unavailableBody":
    "The reviews below are all here. The summary will be back on a later visit.",
  "reviews.summary.loading": "Writing the AI summary",

  // Product card (specs/product.md): the app's reviews first, Amazon's second
  "products.card.reviewsHere.one": "{count} review here",
  "products.card.reviewsHere.other": "{count} reviews here",
  "products.card.noReviews": "No reviews yet",
  "products.card.seeReviews.one": "See {count} review",
  "products.card.seeReviews.other": "See {count} reviews",
} satisfies Record<string, string>;

export type MessageKey = keyof typeof en;
