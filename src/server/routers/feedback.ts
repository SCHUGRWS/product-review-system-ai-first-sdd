import {
  createFeedbackSchema,
  hasReviewedSchema,
  listFeedbackSchema,
} from "@/features/feedback/feedback.schema";
import type { Product } from "@/features/products/product.types";
import { runInBackground } from "@/server/background";
import { appError } from "@/server/errors";
import {
  FeedbackAlreadyExistsError,
  hasFeedbackForProduct,
  insertFeedback,
  listFeedbackByAccount,
} from "@/server/feedback/queries";
import { getProductById } from "@/server/products/queries";
import { listSummaryLocales, refreshSummary } from "@/server/reviews/summary";
import { protectedProcedure, router } from "@/server/trpc";

export const feedbackRouter = router({
  // The author is ctx.user and the product name is the catalog title; any
  // accountId or productName in the input is stripped by the schema.
  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      let product: Product | null;
      try {
        product = await getProductById(input.productId);
      } catch (error) {
        console.error("[feedback.create] failed to load the product", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.postFailed");
      }
      if (!product) {
        throw appError("NOT_FOUND", "errors.productNotFound");
      }

      let feedback: Awaited<ReturnType<typeof insertFeedback>>;
      try {
        feedback = await insertFeedback(ctx.user.id, product, input);
      } catch (error) {
        // The unique (account_id, product_id) index decides, so two parallel
        // posts cannot both succeed
        if (error instanceof FeedbackAlreadyExistsError) {
          throw appError("CONFLICT", "errors.alreadyReviewed");
        }
        console.error("[feedback.create] failed to insert feedback", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.postFailed");
      }

      // The AI summary is regenerated outside the request when the reviews
      // grew 10% (specs/product-reviews.md, 4), so no visitor waits for it.
      // Only in the author's language and in the languages that already have a
      // cached summary for the product, so the cost stays tiny (specs/i18n.md).
      const productId = product.id;
      const authorLocale = ctx.user.locale;
      runInBackground("summary refresh", async () => {
        const cached = await listSummaryLocales(productId);
        for (const locale of new Set([authorLocale, ...cached])) {
          await refreshSummary(productId, locale);
        }
      });
      return feedback;
    }),

  listMine: protectedProcedure
    .input(listFeedbackSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await listFeedbackByAccount(ctx.user.id, input.limit);
      } catch (error) {
        console.error("[feedback.listMine] failed to list feedback", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.listMineFailed");
      }
    }),

  hasReviewed: protectedProcedure
    .input(hasReviewedSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await hasFeedbackForProduct(ctx.user.id, input.productId);
      } catch (error) {
        console.error("[feedback.hasReviewed] failed to check feedback", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.hasReviewedFailed");
      }
    }),
});
