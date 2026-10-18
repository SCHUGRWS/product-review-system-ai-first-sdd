import Link from "next/link";
import { ReviewSlip } from "@/components/review-slip";
import { SplitLayout } from "@/components/split-layout";
import { buttonVariants } from "@/components/ui/button";
import { HOME_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

// Shown when /products/<id>/feedback names a product that is not in the catalog.
export default function ProductNotFound() {
  return (
    <SplitLayout
      panel={
        <ReviewSlip
          product="No product here"
          rating={0}
          author="nobody yet"
          className="max-w-[18rem] -rotate-2 sm:max-w-sm"
        >
          <div className="space-y-3 py-1">
            <div className="h-2.5 w-full rounded-full bg-mist" />
            <div className="h-2.5 w-2/3 rounded-full bg-mist" />
          </div>
        </ReviewSlip>
      }
    >
      <div className="w-full max-w-md">
        <h1 className="text-[1.953rem] leading-tight font-extrabold tracking-[-0.03em] text-ink">
          Product not found
        </h1>
        <p className="mt-2 text-[1rem] text-slate">
          This link does not match a product in the catalog. Search the catalog
          to find the one you want to review.
        </p>
        <Link
          href={HOME_PATH}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 h-12 w-fit px-6 text-[1rem] font-semibold hover:bg-cobalt-deep",
          )}
        >
          Go to the catalog
        </Link>
      </div>
    </SplitLayout>
  );
}
