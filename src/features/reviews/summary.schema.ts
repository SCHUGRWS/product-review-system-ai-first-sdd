import { z } from "zod";

// What the AI summary agent must answer (specs/product-reviews.md, 4.3). The
// same schema validates the model output and the cached jsonb.

export const HEADLINE_MAX = 120;
export const SUMMARY_MAX = 600;
export const POINTS_MAX = 3;

export const SUMMARY_LOCALES = ["en", "pt-BR"] as const;
export type SummaryLocale = (typeof SUMMARY_LOCALES)[number];

export const reviewSummarySchema = z.object({
  verdict: z
    .enum(["positive", "mixed", "negative"])
    .describe("Overall opinion of the reviewers"),
  headline: z
    .string()
    .min(1)
    .max(HEADLINE_MAX)
    .describe(`One line, at most ${HEADLINE_MAX} characters`),
  summary: z
    .string()
    .min(1)
    .max(SUMMARY_MAX)
    .describe(`2 to 4 sentences, at most ${SUMMARY_MAX} characters`),
  pros: z
    .array(z.string().min(1).max(HEADLINE_MAX))
    .max(POINTS_MAX)
    .describe(`Up to ${POINTS_MAX} short points reviewers liked`),
  cons: z
    .array(z.string().min(1).max(HEADLINE_MAX))
    .max(POINTS_MAX)
    .describe(`Up to ${POINTS_MAX} short points reviewers disliked`),
});

export type ReviewSummary = z.infer<typeof reviewSummarySchema>;
export type SummaryVerdict = ReviewSummary["verdict"];

export type SummaryResult =
  | { status: "too-few"; reviewCount: number }
  | { status: "unavailable" }
  | {
      status: "ready";
      summary: ReviewSummary;
      /** Reviews the summary was built from (may trail the current count) */
      reviewCount: number;
      generatedAt: Date;
    };
