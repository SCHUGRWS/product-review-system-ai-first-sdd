// Message prefixes client components use ("use client" files with useT()).
// Only these reach the browser; src/i18n/client-messages.test.ts checks that
// every key a client component asks for is covered.
export const CLIENT_MESSAGE_PREFIXES = [
  "common.",
  "nav.",
  "auth.",
  "validation.",
  "errors.",
  "catalog.search.",
  "catalog.row.",
  "feedback.form.",
  "me.language.",
  "disclaimer.",
  "reviews.stars.",
  "reviews.seeAllReviews",
] as const;
