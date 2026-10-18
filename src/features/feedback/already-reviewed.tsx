import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import type { ReviewedProduct } from "@/features/feedback/feedback.schema";
import { shortTitle } from "@/features/feedback/feedback.utils";
import { ProductSummary } from "@/features/feedback/product-summary";
import { HOME_PATH, ME_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

// One review per product: shown instead of the form, pointing to /me.
export function AlreadyReviewed({
  product,
  author,
}: {
  product: ReviewedProduct;
  author: string;
}) {
  return (
    <SplitLayout
      panel={
        <ReviewSlip
          product={shortTitle(product.title)}
          rating={0}
          author={author}
          className="max-w-[18rem] -rotate-2 sm:max-w-sm"
        >
          {/* The written review lives on /me; the slip only marks it as done */}
          <div className="space-y-3 py-1">
            <div className="h-2.5 w-full rounded-full bg-mist" />
            <div className="h-2.5 w-11/12 rounded-full bg-mist" />
            <div className="h-2.5 w-2/3 rounded-full bg-mist" />
          </div>
          <div className="animate-stamp-land absolute top-1/2 left-1/2 -mt-16 -ml-20 grid size-40 place-items-center rounded-full border-[3px] border-cobalt text-center text-[1.05rem] leading-tight font-extrabold tracking-[-0.01em] text-cobalt mix-blend-multiply">
            <span className="rounded-full border border-cobalt/60 p-5">
              Already
              <br />
              reviewed
            </span>
          </div>
        </ReviewSlip>
      }
    >
      <div className="w-full max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          You already reviewed this product
        </h1>
        <p className="mt-2 text-[1rem] text-slate">
          Each product takes one review per person. Yours is on your page.
        </p>

        <ProductSummary product={product} className="mt-6" />

        <div className="mt-8 flex flex-col-reverse items-center gap-3 sm:flex-row">
          <Link
            href={HOME_PATH}
            className="rounded-sm px-2 py-1 text-[1rem] font-medium text-slate underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            Back to the catalog
          </Link>
          <Link
            href={ME_PATH}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full px-8 text-[1rem] font-semibold hover:bg-cobalt-deep sm:ml-auto sm:w-auto",
            )}
          >
            See your reviews
          </Link>
        </div>
      </div>
    </SplitLayout>
  );
}
