import { TRPCError } from "@trpc/server";
import type { Product } from "@/features/products/product.types";
import { listByProductSchema } from "@/features/reviews/reviews.schema";
import { getProductById } from "@/server/products/queries";
import { listProductReviews } from "@/server/reviews/queries";
import { protectedProcedure, router } from "@/server/trpc";
import { PRODUCT_NOT_FOUND_MESSAGE } from "./feedback";

const LIST_FAILED_MESSAGE =
  "Could not load the reviews. Please try again later.";

// Reviews of a catalog product (specs/product-reviews.md). The AI summary is
// server-rendered only and has no procedure, so it cannot be called in a loop.
export const reviewRouter = router({
  listByProduct: protectedProcedure
    .input(listByProductSchema)
    .query(async ({ input }) => {
      let product: Product | null;
      try {
        product = await getProductById(input.productId);
      } catch (error) {
        console.error(
          "[review.listByProduct] failed to load the product",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: LIST_FAILED_MESSAGE,
        });
      }
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: PRODUCT_NOT_FOUND_MESSAGE,
        });
      }

      try {
        return await listProductReviews(product.id, input.page);
      } catch (error) {
        console.error("[review.listByProduct] failed to list reviews", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: LIST_FAILED_MESSAGE,
        });
      }
    }),
});
