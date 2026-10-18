import Link from "next/link";
import { Stars } from "@/components/review-slip";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/i18n/format";
import { getLocale, getT } from "@/i18n/server";
import { productFeedbackHref, productReviewsHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { amazonRatingCopy, communityCopy, reviewsLinkCopy } from "./card-copy";
import type { Product } from "./product.types";
import { ProductImage } from "./product-image";

// Quiet paper card for one Amazon deal (specs/product.md, requirement 7).
// Boldness stays with the review slip; the card only adds the cobalt discount tag.
// Review numbers: the app's own first (cobalt stars, ink), Amazon's rating
// second, smaller, slate and labelled "on Amazon".
export async function ProductCard({ product }: { product: Product }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const hasDiscount =
    product.discountPercent !== null && product.discountPercent > 0;
  const community = communityCopy(t, locale, product.community);
  const amazon = amazonRatingCopy(t, locale, product);

  return (
    <article className="group/card relative flex h-full flex-col rounded-lg border border-rule/70 bg-paper p-3 text-ink transition-shadow duration-200 hover:shadow-[0_14px_28px_-16px_rgb(14_24_110/0.45)] motion-reduce:transition-none">
      <div className="relative aspect-square overflow-hidden rounded-md bg-mist">
        <ProductImage
          src={product.imageUrl}
          width={226}
          height={226}
          // White studio backgrounds melt into the mist panel
          className="size-full object-contain p-4 mix-blend-multiply"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 rounded-sm bg-cobalt px-1.5 py-0.5 text-[0.8125rem] font-bold tracking-[-0.01em] text-paper">
            {t("products.card.discount", {
              percent: product.discountPercent ?? 0,
            })}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-[0.9375rem] leading-snug font-medium">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={product.title}
          className="line-clamp-2 rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {product.title}
          <span className="sr-only"> {t("common.opensAmazon")}</span>
        </a>
      </h3>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[1.125rem] font-extrabold tracking-[-0.02em]">
          {formatPrice(product.priceCents)}
        </span>
        {product.listPriceCents !== null && (
          <s className="text-[0.8125rem] text-slate">
            <span className="sr-only">{t("products.card.was")} </span>
            {formatPrice(product.listPriceCents)}
          </s>
        )}
      </p>

      <div className="mt-1.5 flex flex-col gap-0.5">
        {community?.kind === "reviews" && (
          <div
            data-testid="community-reviews"
            data-count={product.community?.count ?? 0}
            className="flex flex-wrap items-center gap-x-1.5 text-[0.875rem] text-ink"
          >
            <span aria-hidden="true">
              <Stars
                rating={community.stars}
                className="gap-0.5 [&_svg]:size-3.5"
              />
            </span>
            <span className="font-bold tabular-nums">
              <span className="sr-only">
                {t("reviews.stats.averageLabel", {
                  average: community.average,
                })}
              </span>
              <span aria-hidden="true">{community.average}</span>
            </span>
            <span className="text-slate">{community.label}</span>
          </div>
        )}
        {community?.kind === "none" && (
          <p
            data-testid="community-reviews"
            className="text-[0.875rem] text-slate"
          >
            {community.label}
          </p>
        )}
        {amazon && (
          <p data-testid="amazon-rating" className="text-[0.75rem] text-slate">
            {amazon}
          </p>
        )}
      </div>

      {/* mt-auto keeps the buttons aligned across a row of cards */}
      <div className="mt-auto flex flex-col gap-1.5 pt-3">
        <Link
          href={productFeedbackHref(locale, product.id)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full border-cobalt/40 text-cobalt hover:border-cobalt hover:bg-cobalt hover:text-paper",
          )}
        >
          {t("reviews.giveFeedback")}
        </Link>
        <Link
          href={productReviewsHref(locale, product.id)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full text-slate hover:bg-mist hover:text-ink",
          )}
        >
          {reviewsLinkCopy(t, locale, product.community)}
        </Link>
      </div>
    </article>
  );
}
