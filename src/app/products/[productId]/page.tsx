import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ProductReviews,
  ProductReviewsSkeleton,
} from "@/features/reviews/product-reviews";
import { t } from "@/i18n/t";

export const metadata: Metadata = {
  title: t("reviews.metaTitle"),
};

// The skeleton is the prerendered static shell; the session, the product and
// its reviews stream in behind the boundary, and the AI summary behind its
// own one (Cache Components).
export default function ProductReviewsPage({
  params,
  searchParams,
}: PageProps<"/products/[productId]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<ProductReviewsSkeleton />}>
        <ProductReviews params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
