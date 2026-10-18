import "server-only";
import type { SummaryLocale } from "@/features/reviews/summary.schema";
import { getDb } from "@/server/db";
import {
  MIN_REVIEWS_FOR_SUMMARY,
  needsRegeneration,
  refreshSummary,
} from "./summary";

// Warm-up for the AI summaries (specs/product-reviews.md, 4): fills missing or
// stale summaries in one protected run, after a seed or an import, so the
// first visitors read them from the cache. Products are done one at a time,
// so a run never sends more than one model call at once.

export const WARM_DEFAULT_LIMIT = 50;
export const WARM_MAX_LIMIT = 200;
/** Upper bound on the products looked at in one run */
const MAX_CANDIDATES = 10_000;
/** Ids per cache lookup (keeps the PostgREST URL short) */
const CHUNK = 200;

export type WarmResult = {
  /** Available products with at least MIN_REVIEWS_FOR_SUMMARY reviews */
  checked: number;
  generated: number;
  /** Already up to date (or no longer due when its turn came) */
  skipped: number;
  failed: number;
  /** Still due: over the limit, or left when the run stopped early */
  remaining: number;
  /** Why the run stopped before the limit, if it did */
  stopped: "ai-off" | "no-key" | "time" | null;
};

export type WarmOptions = {
  limit: number;
  locale: SummaryLocale;
  /** Epoch ms after which no new product is started */
  deadline?: number;
};

type Candidate = { productId: string; count: number };

async function listCandidates(): Promise<Candidate[]> {
  const { data, error } = await getDb().rpc("most_reviewed_products", {
    max_count: MAX_CANDIDATES,
  });
  if (error || !data) {
    throw new Error("Failed to list products for the summary warm-up", {
      cause: error,
    });
  }
  return data
    .map((row) => ({
      productId: row.product_id,
      count: Number(row.review_count),
    }))
    .filter((row) => row.count >= MIN_REVIEWS_FOR_SUMMARY);
}

/** Review count of each cached summary in the locale, by product id */
async function cachedCounts(ids: string[], locale: SummaryLocale) {
  const counts = new Map<string, number>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await getDb()
      .from("product_feedback_summaries")
      .select("product_id, review_count")
      .eq("locale", locale)
      .in("product_id", ids.slice(i, i + CHUNK));
    if (error || !data) {
      throw new Error("Failed to read cached summaries", { cause: error });
    }
    for (const row of data) counts.set(row.product_id, row.review_count);
  }
  return counts;
}

/**
 * Generates up to `limit` missing or stale summaries (same 10% rule as the
 * page), most reviewed products first. Stops early when the AI breaker is
 * open or trips, when there is no OPENAI_API_KEY, or at the deadline.
 * checked = generated + skipped + failed + remaining.
 */
export async function warmSummaries(options: WarmOptions): Promise<WarmResult> {
  const candidates = await listCandidates();
  const cached = await cachedCounts(
    candidates.map((c) => c.productId),
    options.locale,
  );
  const due = candidates.filter((c) => {
    const count = cached.get(c.productId);
    return count === undefined || needsRegeneration(count, c.count);
  });

  const result: WarmResult = {
    checked: candidates.length,
    generated: 0,
    skipped: candidates.length - due.length,
    failed: 0,
    remaining: due.length,
    stopped: null,
  };

  for (const { productId } of due.slice(0, options.limit)) {
    if (options.deadline !== undefined && Date.now() >= options.deadline) {
      result.stopped = "time";
      break;
    }
    const outcome = await refreshSummary(productId, options.locale);
    if (outcome === "ai-off" || outcome === "no-key") {
      // Nothing was attempted: the product stays due
      result.stopped = outcome;
      break;
    }
    result.remaining--;
    if (outcome === "generated") result.generated++;
    else if (outcome === "failed" || outcome === "tripped") result.failed++;
    else result.skipped++;
    if (outcome === "tripped") {
      result.stopped = "ai-off";
      break;
    }
  }
  return result;
}
