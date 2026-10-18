import Link from "next/link";
import { Suspense } from "react";
import type {
  ProductCategory,
  ProductPage,
} from "@/features/products/product.types";
import { formatCount } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { T } from "@/i18n/message";
import { getLocale, getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import {
  listCategories,
  listMostReviewed,
  listProducts,
  searchProducts,
} from "@/server/products/queries";
import {
  type CatalogParams,
  catalogHref,
  isValidSlug,
  MIN_QUERY_LENGTH,
  parseCatalogParams,
  type RawSearchParams,
} from "./catalog-params";
import { ProductRowSkeleton } from "./catalog-skeletons";
import { requireCatalogUser } from "./catalog-user";
import { categoryLabel } from "./category-label";
import { EmptyCatalog, Notice } from "./empty-catalog";
import { CONTAINER, SECTION_TITLE, TEXT_LINK } from "./layout";
import { Pagination } from "./pagination";
import { ProductGrid } from "./product-grid";
import { ProductRow, RowHeading } from "./product-row";

export const ROW_SIZE = 20;
export const GRID_PAGE_SIZE = 24;
export const TOP_RATED_MIN_REVIEWS = 50;

// Everything below the search band. Reads the session and the URL, so the
// page renders it behind <Suspense>; without a session it redirects.
export async function CatalogView({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireCatalogUser();
  const params = parseCatalogParams(await searchParams);

  if (params.view === "search") {
    return <SearchView q={params.q} page={params.page} />;
  }
  if (params.view === "category" && params.category) {
    return (
      <>
        <QueryHint params={params} />
        <CategoryView slug={params.category} page={params.page} />
      </>
    );
  }
  return (
    <>
      <QueryHint params={params} />
      <ListsView />
    </>
  );
}

async function QueryHint({ params }: { params: CatalogParams }) {
  if (params.hint !== "query-too-short") return null;
  const t = await getT();
  return (
    <div className={cn(CONTAINER, "pt-8")}>
      <output className="block text-[1rem] text-slate">
        {t("catalog.queryTooShort", { min: MIN_QUERY_LENGTH })}
      </output>
    </div>
  );
}

// Default view: deals by discount, by rating, then one list per category.
// Each list streams in on its own, so a slow query does not hold the rest.
export async function ListsView() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  let categories: ProductCategory[];
  try {
    categories = await listCategories();
  } catch (error) {
    console.error("[ListsView] failed to list categories", error);
    return <LoadError />;
  }
  if (categories.length === 0) return <EmptyCatalog />;

  // Start every query now, in parallel; each row awaits its own
  const mostReviewed = listMostReviewed(ROW_SIZE);
  const discounts = listProducts({ sort: "discount", pageSize: ROW_SIZE });
  const topRated = listProducts({
    sort: "rating",
    minReviews: TOP_RATED_MIN_REVIEWS,
    pageSize: ROW_SIZE,
  });
  const byCount = [...categories].sort((a, b) => b.count - a.count);
  const perCategory = byCount.map((category) => ({
    category,
    products: listProducts({
      category: category.slug,
      sort: "discount",
      pageSize: ROW_SIZE,
    }),
  }));

  return (
    <div className="py-4 sm:py-6">
      <Suspense
        fallback={
          <ProductRowSkeleton title={t("catalog.mostReviewed.title")} />
        }
      >
        <LoadedRow
          id="most-reviewed"
          title={t("catalog.mostReviewed.title")}
          description={t("catalog.mostReviewed.description")}
          page={mostReviewed}
          hideWhenEmpty
        />
      </Suspense>
      <Suspense
        fallback={<ProductRowSkeleton title={t("catalog.discounts.title")} />}
      >
        <LoadedRow
          id="discounts"
          title={t("catalog.discounts.title")}
          description={t("catalog.discounts.description")}
          page={discounts}
        />
      </Suspense>
      <Suspense
        fallback={<ProductRowSkeleton title={t("catalog.topRated.title")} />}
      >
        <LoadedRow
          id="top-rated"
          title={t("catalog.topRated.title")}
          description={t("catalog.topRated.description", {
            min: TOP_RATED_MIN_REVIEWS,
          })}
          page={topRated}
        />
      </Suspense>
      {perCategory.map(({ category, products }) => {
        const label = categoryLabel(t, category);
        return (
          <Suspense
            key={category.slug}
            fallback={<ProductRowSkeleton title={label} />}
          >
            <LoadedRow
              id={`category-${category.slug}`}
              title={label}
              page={products}
              seeAllHref={catalogHref(locale, { category: category.slug })}
            />
          </Suspense>
        );
      })}
    </div>
  );
}

export async function LoadedRow({
  page,
  hideWhenEmpty = false,
  ...row
}: {
  id: string;
  title: string;
  description?: string;
  seeAllHref?: string;
  page: Promise<ProductPage>;
  /** Render nothing when the list is empty (e.g. no reviews yet) */
  hideWhenEmpty?: boolean;
}) {
  let result: ProductPage;
  try {
    result = await page;
  } catch (error) {
    console.error(`[LoadedRow] failed to load "${row.title}"`, error);
    const t = await getT();
    return (
      <section aria-label={row.title} className="py-6 sm:py-8">
        <RowHeading title={row.title} />
        <div className={cn(CONTAINER, "mt-4")}>
          <p role="alert" className="text-[1rem] text-destructive">
            {t("catalog.loadError")}
          </p>
        </div>
      </section>
    );
  }
  if (hideWhenEmpty && result.items.length === 0) return null;
  return <ProductRow {...row} products={result.items} />;
}

// /home?category=<slug>: every available product of one category.
export async function CategoryView({
  slug,
  page,
}: {
  slug: string;
  page: number;
}) {
  if (!isValidSlug(slug)) return <UnknownCategory />;
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  let categories: ProductCategory[];
  let result: ProductPage;
  try {
    [categories, result] = await Promise.all([
      listCategories(),
      listProducts({
        category: slug,
        sort: "discount",
        page,
        pageSize: GRID_PAGE_SIZE,
      }),
    ]);
  } catch (error) {
    console.error(`[CategoryView] failed to load "${slug}"`, error);
    return <LoadError />;
  }

  const category = categories.find((c) => c.slug === slug);
  if (!category) return <UnknownCategory />;
  const label = categoryLabel(t, category);

  return (
    <section
      aria-labelledby="catalog-category"
      className={cn(CONTAINER, "py-10 sm:py-12")}
    >
      <Link
        href={catalogHref(locale, {})}
        className={cn(TEXT_LINK, "text-[0.9375rem]")}
      >
        {t("catalog.allProducts")}
      </Link>
      <h2 id="catalog-category" className={cn(SECTION_TITLE, "mt-3")}>
        {label}
      </h2>
      <p className="mt-1 text-[0.9375rem] text-slate">
        {t("catalog.categoryCount", {
          count: countLabel(t, locale, result.total),
        })}
      </p>
      <GridOrPastEnd
        result={result}
        label={label}
        firstPageHref={catalogHref(locale, { category: slug })}
      />
      <Pagination
        total={result.total}
        page={page}
        pageSize={GRID_PAGE_SIZE}
        href={(n) => catalogHref(locale, { category: slug, page: n })}
      />
    </section>
  );
}

// /home?q=<text>: full-text search over the titles.
export async function SearchView({ q, page }: { q: string; page: number }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  let result: ProductPage;
  try {
    result = await searchProducts(q, { page, pageSize: GRID_PAGE_SIZE });
  } catch (error) {
    console.error("[SearchView] search failed", error);
    return <LoadError />;
  }

  const quoted = `“${q}”`;
  return (
    <section
      aria-labelledby="catalog-results"
      className={cn(CONTAINER, "py-10 sm:py-12")}
    >
      <h2 id="catalog-results" className={SECTION_TITLE}>
        {t("catalog.results.title")}
      </h2>
      <output
        aria-live="polite"
        className="mt-1 block text-[0.9375rem] text-slate"
      >
        {t(
          result.total === 1
            ? "catalog.results.count.one"
            : "catalog.results.count.other",
          { count: formatCount(locale, result.total), query: quoted },
        )}
      </output>
      {result.total === 0 ? (
        <div className="mt-8">
          <Notice
            title={t("catalog.noMatch.title", { query: quoted })}
            action={{
              href: catalogHref(locale, {}),
              label: t("catalog.search.clear"),
            }}
            headingLevel={3}
          >
            {t("catalog.noMatch.body")}
          </Notice>
        </div>
      ) : (
        <>
          <GridOrPastEnd
            result={result}
            label={t("catalog.results.label", { query: quoted })}
            firstPageHref={catalogHref(locale, { q })}
          />
          <Pagination
            total={result.total}
            page={page}
            pageSize={GRID_PAGE_SIZE}
            href={(n) => catalogHref(locale, { q, page: n })}
          />
        </>
      )}
    </section>
  );
}

async function GridOrPastEnd({
  result,
  label,
  firstPageHref,
}: {
  result: ProductPage;
  label: string;
  firstPageHref: string;
}) {
  if (result.items.length > 0) {
    return <ProductGrid products={result.items} label={label} />;
  }
  const t = await getT();
  if (result.total === 0) {
    return (
      <p className="mt-8 text-[1rem] text-slate">
        {t("catalog.row.emptyHere")}
      </p>
    );
  }
  return (
    <div className="mt-8">
      <Notice
        title={t("catalog.pastEnd.title")}
        action={{ href: firstPageHref, label: t("catalog.pastEnd.cta") }}
        headingLevel={3}
      />
    </div>
  );
}

async function UnknownCategory() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <div className={cn(CONTAINER, "py-10 sm:py-12")}>
      <Notice
        title={t("catalog.unknownCategory.title")}
        action={{
          href: catalogHref(locale, {}),
          label: t("catalog.unknownCategory.cta"),
        }}
      >
        {t("catalog.unknownCategory.body")}
      </Notice>
    </div>
  );
}

async function LoadError() {
  const t = await getT();
  return (
    <div className={cn(CONTAINER, "py-10 sm:py-12")}>
      <Notice title={t("catalog.loadErrorTitle")} tone="error">
        {t("catalog.loadError")}
      </Notice>
    </div>
  );
}

function countLabel(t: T, locale: Locale, total: number) {
  return t(total === 1 ? "products.count.one" : "products.count.other", {
    count: formatCount(locale, total),
  });
}
