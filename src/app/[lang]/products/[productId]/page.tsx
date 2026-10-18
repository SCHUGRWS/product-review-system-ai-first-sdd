import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import {
  ProductReviews,
  ProductReviewsSkeleton,
} from "@/features/reviews/product-reviews";
import { getT } from "@/i18n/server";
import { pageTitle } from "@/lib/app-name";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: pageTitle(t("meta.reviews")) };
}

// The skeleton is the prerendered static shell; the session, the product and
// its reviews stream in behind the boundary, and the AI summary behind its
// own one (Cache Components).
export default function ProductReviewsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/products/[productId]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<ProductReviewsSkeleton />}>
        <ProductReviews params={params} searchParams={searchParams} />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
