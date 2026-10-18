import { TRPCError } from "@trpc/server";
import {
  createFeedbackSchema,
  hasReviewedSchema,
  listFeedbackSchema,
} from "@/features/feedback/feedback.schema";
import type { Product } from "@/features/products/product.types";
import {
  FeedbackAlreadyExistsError,
  hasFeedbackForProduct,
  insertFeedback,
  listFeedbackByAccount,
} from "@/server/feedback/queries";
import { getProductById } from "@/server/products/queries";
import { protectedProcedure, router } from "@/server/trpc";

export const ALREADY_REVIEWED_MESSAGE = "You already reviewed this product";
export const PRODUCT_NOT_FOUND_MESSAGE = "Product not found";

const POST_FAILED_MESSAGE =
  "Could not post the feedback. Please try again later.";

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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: POST_FAILED_MESSAGE,
        });
      }
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: PRODUCT_NOT_FOUND_MESSAGE,
        });
      }

      try {
        return await insertFeedback(ctx.user.id, product, input);
      } catch (error) {
        // The unique (account_id, product_id) index decides, so two parallel
        // posts cannot both succeed
        if (error instanceof FeedbackAlreadyExistsError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: ALREADY_REVIEWED_MESSAGE,
          });
        }
        console.error("[feedback.create] failed to insert feedback", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: POST_FAILED_MESSAGE,
        });
      }
    }),

  listMine: protectedProcedure
    .input(listFeedbackSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await listFeedbackByAccount(ctx.user.id, input.limit);
      } catch (error) {
        console.error("[feedback.listMine] failed to list feedback", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not load your feedback. Please try again later.",
        });
      }
    }),

  hasReviewed: protectedProcedure
    .input(hasReviewedSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await hasFeedbackForProduct(ctx.user.id, input.productId);
      } catch (error) {
        console.error("[feedback.hasReviewed] failed to check feedback", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not check your feedback. Please try again later.",
        });
      }
    }),
});
