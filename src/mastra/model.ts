// Model for the AI summary (specs/product-reviews.md). Kept apart from the
// agent so callers can read it without loading Mastra.

export const DEFAULT_SUMMARY_MODEL = "openai/gpt-4.1-nano";

/** "provider/model" from FEEDBACK_SUMMARY_MODEL, or the cheap default */
export function feedbackSummaryModel(
  env: Record<string, string | undefined> = process.env,
) {
  return env.FEEDBACK_SUMMARY_MODEL?.trim() || DEFAULT_SUMMARY_MODEL;
}
