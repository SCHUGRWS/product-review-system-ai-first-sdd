import "server-only";
import { Mastra } from "@mastra/core";
import { feedbackSummaryAgent } from "./agents/feedback-summary-agent";

// Mastra instance for the server. Only src/server/reviews/summary.ts uses it,
// and it loads this module lazily, when a summary has to be generated.
export const mastra = new Mastra({
  agents: { feedbackSummaryAgent },
});
