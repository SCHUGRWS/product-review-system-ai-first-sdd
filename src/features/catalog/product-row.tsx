import Link from "next/link";
import type { Product } from "@/features/products/product.types";
import { ProductCard } from "@/features/products/product-card";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import {
  ARRIVE,
  arriveDelay,
  CONTAINER,
  ROW_ITEM,
  SECTION_TITLE,
  TEXT_LINK,
} from "./layout";
import { RowScroller } from "./row-scroller";

// One labelled horizontal list on /home ("Biggest discounts", a category, ...).
export async function ProductRow({
  id,
  title,
  description,
  products,
  seeAllHref,
}: {
  id: string;
  title: string;
  description?: string;
  products: Product[];
  seeAllHref?: string;
}) {
  const t = await getT();
  const headingId = `row-${id}`;
  return (
    <section aria-labelledby={headingId} className="py-6 sm:py-8">
      <RowHeading
        id={headingId}
        title={title}
        description={description}
        seeAllHref={seeAllHref}
      />
      {products.length === 0 ? (
        <p className={cn(CONTAINER, "mt-4 text-[1rem] text-slate")}>
          {t("catalog.row.emptyHere")}
        </p>
      ) : (
        <RowScroller label={title}>
          {products.map((product, index) => (
            <li
              key={product.id}
              className={cn(ROW_ITEM, ARRIVE)}
              style={arriveDelay(index)}
            >
              <ProductCard product={product} />
            </li>
          ))}
        </RowScroller>
      )}
    </section>
  );
}

export async function RowHeading({
  id,
  title,
  description,
  seeAllHref,
}: {
  id?: string;
  title: React.ReactNode;
  description?: string;
  seeAllHref?: string;
}) {
  const t = await getT();
  return (
    <div
      className={cn(
        CONTAINER,
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-1",
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className={SECTION_TITLE}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[0.9375rem] text-slate">{description}</p>
        )}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className={cn(TEXT_LINK, "text-[0.9375rem]")}
          aria-label={
            typeof title === "string"
              ? t("catalog.row.seeAllLabel", { title })
              : undefined
          }
        >
          {t("catalog.row.seeAll")}
        </Link>
      )}
    </div>
  );
}
