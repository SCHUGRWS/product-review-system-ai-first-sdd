import { ProductCardSkeleton } from "@/features/products/product-card-skeleton";
import { cn } from "@/lib/utils";
import { CONTAINER, ROW_ITEM } from "./layout";

// Placeholder for one list. The title is passed when it is known up front
// ("Biggest discounts"), so the heading does not move when products arrive.
export function ProductRowSkeleton({ title }: { title?: string }) {
  return (
    <div className="py-6 sm:py-8">
      <output className="sr-only">
        {title ? `Loading ${title}` : "Loading products"}
      </output>
      <div className={CONTAINER} aria-hidden="true">
        {title ? (
          <p className="text-[1.563rem] leading-tight font-extrabold tracking-[-0.025em] text-ink">
            {title}
          </p>
        ) : (
          <div className="h-7 w-48 rounded-full bg-mist" />
        )}
      </div>
      <div className="overflow-hidden">
        <div className={cn(CONTAINER, "flex gap-4 pt-2 pb-6 sm:gap-5")}>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={ROW_ITEM}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListsSkeleton() {
  return (
    <>
      <ProductRowSkeleton title="Biggest discounts" />
      <ProductRowSkeleton title="Top rated" />
      <ProductRowSkeleton />
    </>
  );
}
