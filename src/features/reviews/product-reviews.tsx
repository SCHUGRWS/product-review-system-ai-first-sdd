import { Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppHeader, AppHeaderSkeleton } from "@/components/app-header";
import { Stars } from "@/components/review-slip";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT_ID_PATTERN } from "@/features/feedback/feedback.schema";
import { amazonRatingCopy } from "@/features/products/card-copy";

import type { Product } from "@/features/products/product.types";
import { ProductImage } from "@/features/products/product-image";
import { formatPrice } from "@/i18n/format";
import { getLocale, getT } from "@/i18n/server";
import { PAGE_CONTAINER } from "@/lib/layout";
import { productFeedbackHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/current-user";
import { hasFeedbackForProduct } from "@/server/feedback/queries";
import { getProductById } from "@/server/products/queries";
import {
  getProductReviewStats,
  listProductReviews,
} from "@/server/reviews/queries";
import { AiSummary, AiSummarySkeleton } from "./ai-summary";
import { ReviewList } from "./review-list";
import { ReviewStats } from "./review-stats";
import {
  type ProductReviewPage,
  type ProductReviewStats,
  parseReviewsPage,
} from "./reviews.schema";

type Params = Promise<{ productId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Content of /products/<id> (Server Component). It reads the session, so the
// page renders it behind <Suspense>. Without a session requireUser() redirects
// to /auth/sign-in; an unknown product is a 404.
export async function ProductReviews({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { productId } = await params;
  const user = await requireUser();
  const t = await getT();

  // Ids that cannot be a product skip the database
  if (!PRODUCT_ID_PATTERN.test(productId)) notFound();
  const page = parseReviewsPage((await searchParams).page);

  const [product, reviewed] = await Promise.all([
    getProductById(productId),
    hasFeedbackForProduct(user.id, productId),
  ]);
  if (!product) notFound();

  let data: { stats: ProductReviewStats; reviews: ProductReviewPage } | null;
  try {
    const [stats, reviews] = await Promise.all([
      getProductReviewStats(product.id),
      listProductReviews(product.id, page),
    ]);
    data = { stats, reviews };
  } catch (error) {
    console.error("[ProductReviews] failed to load the reviews", error);
    data = null;
  }

  return (
    <ProductReviewsLayout
      header={
        <AppHeader
          user={{ firstName: user.firstName, lastName: user.lastName }}
        />
      }
      hero={<ProductHero product={product} reviewed={reviewed} />}
      stats={data && <ReviewStats stats={data.stats} />}
      summary={
        data && (
          <Suspense fallback={<AiSummarySkeleton />}>
            {/* In the viewer's language (the [lang] segment) */}
            <AiSummary
              product={{ id: product.id, title: product.title }}
              stats={{ count: data.stats.count, average: data.stats.average }}
            />
          </Suspense>
        )
      }
      reviews={
        data ? (
          <ReviewList productId={product.id} reviews={data.reviews} />
        ) : (
          <p role="alert" className="text-[1rem] text-destructive">
            {t("reviews.list.loadFailed")}
          </p>
        )
      }
    />
  );
}

// Page frame shared by the content and its skeleton, so the swap keeps the
// headings in place. Mobile: hero, numbers, summary, reviews. From lg the
// numbers sit in a narrow column on the right.
async function ProductReviewsLayout({
  header,
  hero,
  stats,
  summary,
  reviews,
}: {
  header: React.ReactNode;
  hero: React.ReactNode;
  stats: React.ReactNode;
  summary: React.ReactNode;
  reviews: React.ReactNode;
}) {
  const t = await getT();
  return (
    <>
      {header}
      <main className="flex-1">
        <section
          aria-labelledby="product-title"
          className="halftone-field overflow-hidden"
        >
          <div className={cn(PAGE_CONTAINER, "py-10 sm:py-14")}>{hero}</div>
        </section>

        <div
          className={cn(
            PAGE_CONTAINER,
            "grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16",
          )}
        >
          {stats && (
            <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start">
              {stats}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-12 lg:col-start-1 lg:row-start-1">
            {summary}
            <section aria-labelledby="reviews-title" className="max-w-2xl">
              <h2
                id="reviews-title"
                className="text-[1.563rem] leading-tight font-extrabold tracking-[-0.025em] text-ink"
              >
                {t("reviews.list.title")}
              </h2>
              <div className="mt-6">{reviews}</div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

const HERO_GRID =
  "grid items-center gap-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[11rem_minmax(0,1fr)_auto]";

async function ProductHero({
  product,
  reviewed,
}: {
  product: Product;
  reviewed: boolean;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <div className={HERO_GRID}>
      <div className="size-28 overflow-hidden rounded-md bg-paper shadow-[0_14px_28px_-12px_rgb(14_24_110/0.55)] sm:size-36 lg:size-44">
        <ProductImage
          src={product.imageUrl}
          width={176}
          height={176}
          loading="eager"
          className="size-full object-contain p-3"
        />
      </div>

      <div className="min-w-0">
        <h1
          id="product-title"
          className="text-[clamp(1.563rem,3.4vw,2.441rem)] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-paper"
        >
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="line-clamp-3 rounded-sm underline-offset-[6px] [overflow-wrap:anywhere] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          >
            {product.title}
            <span className="sr-only"> {t("common.opensAmazon")}</span>
          </a>
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-paper/85">
          <span className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-paper tabular-nums">
            <span className="sr-only">{t("common.currentPrice")} </span>
            {formatPrice(product.priceCents)}
          </span>
          {product.rating !== null && (
            <span className="flex items-center gap-2 text-[0.9375rem]">
              <span aria-hidden="true">
                <Stars
                  rating={Math.round(product.rating)}
                  className="gap-0.5 text-paper [&_svg]:size-4"
                />
              </span>
              {amazonRatingCopy(t, locale, product)}
            </span>
          )}
        </div>
      </div>

      <div className="sm:col-start-2 lg:col-start-3">
        {reviewed ? (
          <p
            data-testid="already-reviewed"
            className="flex w-fit items-center gap-2 rounded-lg bg-paper/12 px-4 py-3 text-[1rem] font-semibold text-paper"
          >
            <Check aria-hidden="true" className="size-5" />
            {t("reviews.alreadyReviewed")}
          </p>
        ) : (
          <Link
            href={productFeedbackHref(locale, product.id)}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-fit bg-paper px-6 text-[1rem] font-semibold text-cobalt shadow-[0_10px_24px_rgb(14_24_110/0.35)] hover:bg-mist focus-visible:ring-paper/60",
            )}
          >
            {t("reviews.giveFeedback")}
          </Link>
        )}
      </div>
    </div>
  );
}

// Static stand-in for the whole page while the session and product load.
export async function ProductReviewsSkeleton() {
  const t = await getT();
  return (
    <ProductReviewsLayout
      header={<AppHeaderSkeleton />}
      hero={
        <div className={HERO_GRID} aria-busy="true">
          <div className="size-28 rounded-md bg-paper/15 sm:size-36 lg:size-44" />
          <div className="min-w-0">
            <h1 id="product-title" className="sr-only">
              {t("reviews.loading")}
            </h1>
            <div
              aria-hidden="true"
              className="h-8 w-11/12 rounded-sm bg-paper/15"
            />
            <div
              aria-hidden="true"
              className="mt-3 h-8 w-2/3 rounded-sm bg-paper/15"
            />
            <div
              aria-hidden="true"
              className="mt-5 h-6 w-40 rounded-sm bg-paper/15"
            />
          </div>
          <div className="h-12 w-40 rounded-lg bg-paper/15 sm:col-start-2 lg:col-start-3" />
        </div>
      }
      stats={
        <div
          aria-hidden="true"
          className="h-80 rounded-md border border-rule motion-safe:animate-pulse"
        />
      }
      summary={<AiSummarySkeleton />}
      reviews={
        <div aria-hidden="true" className="flex flex-col gap-7">
          <div className="review-slip h-44 bg-mist" />
          <div className="review-slip h-44 bg-mist" />
        </div>
      }
    />
  );
}
