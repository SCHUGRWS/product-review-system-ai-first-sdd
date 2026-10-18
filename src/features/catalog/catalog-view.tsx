import Link from "next/link";
import { Suspense } from "react";
import type {
  ProductCategory,
  ProductPage,
} from "@/features/products/product.types";
import { cn } from "@/lib/utils";
import {
  listCategories,
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

const LOAD_ERROR =
  "Could not load these products. Refresh the page to try again.";

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

function QueryHint({ params }: { params: CatalogParams }) {
  if (params.hint !== "query-too-short") return null;
  return (
    <div className={cn(CONTAINER, "pt-8")}>
      <output className="block text-[1rem] text-slate">
        Type at least {MIN_QUERY_LENGTH} characters to search.
      </output>
    </div>
  );
}

// Default view: deals by discount, by rating, then one list per category.
// Each list streams in on its own, so a slow query does not hold the rest.
export async function ListsView() {
  let categories: ProductCategory[];
  try {
    categories = await listCategories();
  } catch (error) {
    console.error("[ListsView] failed to list categories", error);
    return <LoadError />;
  }
  if (categories.length === 0) return <EmptyCatalog />;

  // Start every query now, in parallel; each row awaits its own
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
      <Suspense fallback={<ProductRowSkeleton title="Biggest discounts" />}>
        <LoadedRow
          id="discounts"
          title="Biggest discounts"
          description="The deepest price cuts in today's deals"
          page={discounts}
        />
      </Suspense>
      <Suspense fallback={<ProductRowSkeleton title="Top rated" />}>
        <LoadedRow
          id="top-rated"
          title="Top rated"
          description={`Best Amazon ratings, from at least ${TOP_RATED_MIN_REVIEWS} reviews`}
          page={topRated}
        />
      </Suspense>
      {perCategory.map(({ category, products }) => {
        const label = categoryLabel(category);
        return (
          <Suspense
            key={category.slug}
            fallback={<ProductRowSkeleton title={label} />}
          >
            <LoadedRow
              id={`category-${category.slug}`}
              title={label}
              page={products}
              seeAllHref={catalogHref({ category: category.slug })}
            />
          </Suspense>
        );
      })}
    </div>
  );
}

export async function LoadedRow({
  page,
  ...row
}: {
  id: string;
  title: string;
  description?: string;
  seeAllHref?: string;
  page: Promise<ProductPage>;
}) {
  let result: ProductPage;
  try {
    result = await page;
  } catch (error) {
    console.error(`[LoadedRow] failed to load "${row.title}"`, error);
    return (
      <section aria-label={row.title} className="py-6 sm:py-8">
        <RowHeading title={row.title} />
        <div className={cn(CONTAINER, "mt-4")}>
          <p role="alert" className="text-[1rem] text-destructive">
            {LOAD_ERROR}
          </p>
        </div>
      </section>
    );
  }
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
  const label = categoryLabel(category);

  return (
    <section
      aria-labelledby="catalog-category"
      className={cn(CONTAINER, "py-10 sm:py-12")}
    >
      <Link
        href={catalogHref({})}
        className={cn(TEXT_LINK, "text-[0.9375rem]")}
      >
        All products
      </Link>
      <h2 id="catalog-category" className={cn(SECTION_TITLE, "mt-3")}>
        {label}
      </h2>
      <p className="mt-1 text-[0.9375rem] text-slate">
        {countLabel(result.total)}, biggest discounts first
      </p>
      <GridOrPastEnd
        result={result}
        label={label}
        firstPageHref={catalogHref({ category: slug })}
      />
      <Pagination
        total={result.total}
        page={page}
        pageSize={GRID_PAGE_SIZE}
        href={(n) => catalogHref({ category: slug, page: n })}
      />
    </section>
  );
}

// /home?q=<text>: full-text search over the titles.
export async function SearchView({ q, page }: { q: string; page: number }) {
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
        Search results
      </h2>
      <output
        aria-live="polite"
        className="mt-1 block text-[0.9375rem] text-slate"
      >
        {result.total === 1
          ? `1 result for ${quoted}`
          : `${result.total} results for ${quoted}`}
      </output>
      {result.total === 0 ? (
        <div className="mt-8">
          <Notice
            title={`No products match ${quoted}`}
            action={{ href: catalogHref({}), label: "Clear search" }}
            headingLevel={3}
          >
            Check the spelling, try fewer words, or clear the search to browse
            the lists.
          </Notice>
        </div>
      ) : (
        <>
          <GridOrPastEnd
            result={result}
            label={`Results for ${quoted}`}
            firstPageHref={catalogHref({ q })}
          />
          <Pagination
            total={result.total}
            page={page}
            pageSize={GRID_PAGE_SIZE}
            href={(n) => catalogHref({ q, page: n })}
          />
        </>
      )}
    </section>
  );
}

function GridOrPastEnd({
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
  if (result.total === 0) {
    return (
      <p className="mt-8 text-[1rem] text-slate">
        No products here right now. New deals come in every night.
      </p>
    );
  }
  return (
    <div className="mt-8">
      <Notice
        title="This page is past the last one"
        action={{ href: firstPageHref, label: "Go to the first page" }}
        headingLevel={3}
      />
    </div>
  );
}

function UnknownCategory() {
  return (
    <div className={cn(CONTAINER, "py-10 sm:py-12")}>
      <Notice
        title="We could not find that category"
        action={{ href: catalogHref({}), label: "Browse all products" }}
      >
        It may have no deals right now. The lists show every category that does.
      </Notice>
    </div>
  );
}

function LoadError() {
  return (
    <div className={cn(CONTAINER, "py-10 sm:py-12")}>
      <Notice title="Could not load the catalog" tone="error">
        {LOAD_ERROR}
      </Notice>
    </div>
  );
}

function countLabel(total: number) {
  return total === 1 ? "1 product" : `${total} products`;
}
