"use client";

import type { ReviewedProduct } from "@/features/feedback/feedback.schema";
import { ProductImage } from "@/features/products/product-image";
import { useT } from "@/i18n/client";
import { formatPrice } from "@/i18n/price";
import { cn } from "@/lib/utils";

// The product being reviewed: photo, title (opens Amazon) and current price.
// Quiet on purpose; the review slip is the page's bold element.
// A client component: the feedback form (client) renders it too.
export function ProductSummary({
  product,
  className,
}: {
  product: ReviewedProduct;
  className?: string;
}) {
  const t = useT();
  return (
    <div
      data-testid="product-summary"
      className={cn(
        "flex items-start gap-4 rounded-lg border border-rule bg-paper p-3",
        className,
      )}
    >
      <ProductImage
        src={product.imageUrl}
        width={72}
        height={72}
        className="size-[4.5rem] shrink-0 rounded-md bg-paper object-contain"
      />
      <div className="min-w-0 py-0.5">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="line-clamp-2 rounded-sm text-[1rem] leading-snug font-semibold text-ink underline-offset-4 [overflow-wrap:anywhere] hover:text-cobalt hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          {product.title}
          <span className="sr-only"> {t("common.opensAmazon")}</span>
        </a>
        <p className="mt-1 text-[0.9375rem] text-slate tabular-nums">
          <span className="sr-only">{t("common.currentPrice")} </span>
          {formatPrice(product.priceCents)}
        </p>
      </div>
    </div>
  );
}
