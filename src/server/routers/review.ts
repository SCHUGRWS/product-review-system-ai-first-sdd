import type { Product } from "@/features/products/product.types";
import { listByProductSchema } from "@/features/reviews/reviews.schema";
import { appError } from "@/server/errors";
import { getProductById } from "@/server/products/queries";
import { listProductReviews } from "@/server/reviews/queries";
import { protectedProcedure, router } from "@/server/trpc";

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
        throw appError("INTERNAL_SERVER_ERROR", "errors.reviewsFailed");
      }
      if (!product) {
        throw appError("NOT_FOUND", "errors.productNotFound");
      }

      try {
        return await listProductReviews(product.id, input.page);
      } catch (error) {
        console.error("[review.listByProduct] failed to list reviews", error);
        throw appError("INTERNAL_SERVER_ERROR", "errors.reviewsFailed");
      }
    }),
});
