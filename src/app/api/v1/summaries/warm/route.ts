import { z } from "zod";
import { toErrorResponse } from "@/app/api/v1/_lib/to-response";
import { SUMMARY_LOCALES } from "@/features/reviews/summary.schema";
import { isAuthorizedImport } from "@/server/products/import-auth";
import {
  WARM_DEFAULT_LIMIT,
  WARM_MAX_LIMIT,
  warmSummaries,
} from "@/server/reviews/warm";

// Fills missing or stale AI summaries (specs/product-reviews.md, 4); run with
// `pnpm summaries:warm` after a seed or an import. Same Bearer token as the
// product import, not a user session.

export const maxDuration = 300;
/** Stop starting products this long before maxDuration (one call is <= 20 s) */
const SAFETY_MS = 30_000;

const warmSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(WARM_MAX_LIMIT)
    .default(WARM_DEFAULT_LIMIT),
  locale: z.enum(SUMMARY_LOCALES).default("en"),
});

export async function POST(req: Request) {
  if (!isAuthorizedImport(req.headers.get("authorization"))) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // The body is optional: an empty one means the defaults
  let body: unknown = {};
  const text = await req.text();
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }
  }
  const options = warmSchema.safeParse(body);
  if (!options.success) {
    return Response.json(
      {
        error: "Invalid warm-up options",
        fields: z.flattenError(options.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    return Response.json(
      await warmSummaries({
        ...options.data,
        deadline: Date.now() + maxDuration * 1000 - SAFETY_MS,
      }),
    );
  } catch (error) {
    return toErrorResponse(error, "api/v1/summaries/warm");
  }
}
