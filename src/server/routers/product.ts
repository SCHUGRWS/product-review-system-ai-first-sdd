import { z } from "zod";
import {
  getProductById,
  MIN_SEARCH_LENGTH,
  searchProducts,
} from "@/server/products/queries";
import { protectedProcedure, router } from "@/server/trpc";

// Catalog reads for signed-in users (specs/product.md).
export const productRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        q: z
          .string()
          .trim()
          .min(
            MIN_SEARCH_LENGTH,
            `Type at least ${MIN_SEARCH_LENGTH} characters`,
          )
          .max(100),
        page: z.number().int().min(1).max(1000).default(1),
      }),
    )
    .query(({ input }) => searchProducts(input.q, { page: input.page })),

  byId: protectedProcedure
    .input(z.object({ id: z.string().trim().min(1).max(64) }))
    .query(({ input }) => getProductById(input.id)),
});
