import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Product,
  ProductCategory,
  ProductPage,
} from "@/features/products/product.types";
import type { SessionUser } from "@/server/auth/types";

const requireUser = vi.fn<() => Promise<SessionUser>>();
vi.mock("@/server/auth/current-user", () => ({ requireUser }));

const listCategories = vi.fn<() => Promise<ProductCategory[]>>();
const listProducts = vi.fn<(opts: unknown) => Promise<ProductPage>>();
const listMostReviewed = vi.fn<(limit?: number) => Promise<ProductPage>>();
const searchProducts =
  vi.fn<(q: string, opts?: unknown) => Promise<ProductPage>>();
vi.mock("@/server/products/queries", () => ({
  listCategories,
  listMostReviewed,
  listProducts,
  searchProducts,
  getProductById: vi.fn(),
}));

// The real card is built in parallel (specs/product.md); only its props matter here
vi.mock("@/features/products/product-card", () => ({
  ProductCard: function ProductCard() {
    return null;
  },
}));

const { redirect } = await import("next/navigation");
const { default: HomePage } = await import("./page");
const { CatalogHeader, CatalogSearch } = await import(
  "@/features/catalog/catalog-chrome"
);
const { CatalogView, ListsView, CategoryView, SearchView, LoadedRow } =
  await import("@/features/catalog/catalog-view");
const { ProductRow } = await import("@/features/catalog/product-row");
const { ProductGrid } = await import("@/features/catalog/product-grid");
const { EmptyCatalog } = await import("@/features/catalog/empty-catalog");
const { SearchForm } = await import("@/features/catalog/search-form");
const { Pagination } = await import("@/features/catalog/pagination");
const { RowScroller } = await import("@/features/catalog/row-scroller");
const { AppNav } = await import("@/components/app-nav");
const { SignOutButton } = await import("@/features/me/sign-out-button");
const { default: Link } = await import("next/link");

// Client components use hooks, so they stay unrendered elements
const CLIENT: unknown[] = [
  SearchForm,
  RowScroller,
  AppNav,
  SignOutButton,
  Link,
];

const user: SessionUser = {
  id: "acc_123",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  createdAt: new Date("2026-10-17T12:00:00Z"),
};

function product(id: string, category = "deals-collection-tvs"): Product {
  return {
    id,
    asin: `E2E${id}`,
    title: `Product ${id}`,
    url: `https://www.amazon.com.br/dp/E2E${id}`,
    imageUrl: "https://m.media-amazon.com/images/I/x.jpg",
    priceCents: 19990,
    listPriceCents: 29990,
    discountPercent: 33,
    currency: "BRL",
    rating: 4.5,
    reviewCount: 120,
    category: { slug: category, name: "TVs" },
    lastSeenAt: new Date("2026-10-17T00:00:00Z"),
  };
}

function page(items: Product[], total = items.length, n = 1): ProductPage {
  return { items, total, page: n, pageSize: 24 };
}

const categories: ProductCategory[] = [
  { slug: "deals-collection-books", name: "Livros", count: 3 },
  { slug: "deals-collection-tvs", name: "TVs", count: 8 },
];

type Found = { type: unknown; props: Record<string, unknown> };

// Renders a Server Component tree without React: server components are
// called (and awaited), client components and host elements are kept as
// elements whose props are walked. Collects elements and strings on the way.
async function render(node: unknown) {
  const elements: Found[] = [];
  const strings: string[] = [];
  const visit = async (value: unknown, depth: number): Promise<void> => {
    if (depth > 80 || value == null || typeof value === "boolean") return;
    if (typeof value === "string" || typeof value === "number") {
      strings.push(String(value));
    } else if (Array.isArray(value)) {
      for (const item of value) await visit(item, depth + 1);
    } else if (value instanceof Promise) {
      await visit(await value, depth + 1);
    } else if (isValidElement(value)) {
      const props = value.props as Record<string, unknown>;
      elements.push({ type: value.type, props });
      if (typeof value.type === "function" && !CLIENT.includes(value.type)) {
        const component = value.type as (p: unknown) => unknown;
        await visit(await component(props), depth + 1);
        return;
      }
      for (const prop of Object.values(props)) await visit(prop, depth + 1);
    }
  };
  await visit(node, 0);
  return {
    elements,
    strings,
    find: (type: unknown) => elements.filter((el) => el.type === type),
  };
}

const params = (value: Record<string, string>) => Promise.resolve(value);

describe("/home", () => {
  beforeEach(() => {
    requireUser.mockReset().mockResolvedValue(user);
    listCategories.mockReset().mockResolvedValue(categories);
    listProducts.mockReset().mockResolvedValue(page([product("1")]));
    listMostReviewed.mockReset().mockResolvedValue(page([product("9")]));
    searchProducts.mockReset().mockResolvedValue(page([]));
  });

  it("puts the header, the search and the catalog behind Suspense", async () => {
    const searchParams = params({});
    const tree = HomePage({ searchParams } as never);
    const { elements } = await renderShallow(tree);
    const boundaries = elements.filter(
      (el) => "fallback" in el.props && "children" in el.props,
    );
    const children = boundaries.map(
      (el) => (el.props.children as { type: unknown }).type,
    );
    expect(children).toEqual([CatalogHeader, CatalogSearch, CatalogView]);
  });

  it("propagates the redirect to /auth/sign-in when there is no session", async () => {
    requireUser.mockImplementation(async () => redirect("/auth/sign-in"));

    for (const component of [
      () => CatalogHeader(),
      () => CatalogView({ searchParams: params({}) }),
    ]) {
      const error = await component().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Error);
      expect((error as { digest?: string }).digest).toMatch(
        /^NEXT_REDIRECT;[a-z]+;\/auth\/sign-in;/,
      );
    }
    expect(listCategories).not.toHaveBeenCalled();
    expect(listProducts).not.toHaveBeenCalled();
  });

  it("shows the user's short name in the header and nothing else", async () => {
    requireUser.mockResolvedValue({
      ...user,
      password: "hash-value",
    } as SessionUser);
    const { elements } = await render(CatalogHeader());
    const header = elements[0];
    expect(header.props).toEqual({
      user: { firstName: "Ada", lastName: "Lovelace" },
    });
  });

  describe("lists view", () => {
    it("loads discounts, top rated (50+ reviews) and one list per category", async () => {
      const { find } = await render(CatalogView({ searchParams: params({}) }));

      expect(find(ListsView)).toHaveLength(1);
      expect(listMostReviewed).toHaveBeenCalledWith(20);
      expect(listProducts).toHaveBeenCalledWith({
        sort: "discount",
        pageSize: 20,
      });
      expect(listProducts).toHaveBeenCalledWith({
        sort: "rating",
        minReviews: 50,
        pageSize: 20,
      });
      expect(listProducts).toHaveBeenCalledWith({
        category: "deals-collection-tvs",
        sort: "discount",
        pageSize: 20,
      });
      expect(listProducts).toHaveBeenCalledWith({
        category: "deals-collection-books",
        sort: "discount",
        pageSize: 20,
      });
      expect(listProducts).toHaveBeenCalledTimes(4);
      expect(searchProducts).not.toHaveBeenCalled();
    });

    it("renders the rows in order, categories by product count, with See all", async () => {
      const { find } = await render(ListsView());
      const rows = find(ProductRow).map((el) => ({
        title: el.props.title,
        seeAllHref: el.props.seeAllHref,
      }));
      expect(rows).toEqual([
        { title: "Most reviewed here", seeAllHref: undefined },
        { title: "Biggest discounts", seeAllHref: undefined },
        { title: "Top rated", seeAllHref: undefined },
        { title: "TVs", seeAllHref: "/home?category=deals-collection-tvs" },
        // English label for the slug, not the imported name
        { title: "Books", seeAllHref: "/home?category=deals-collection-books" },
      ]);
      expect(find(ProductRow)[0].props.products).toEqual([product("9")]);
      expect(find(ProductRow)[1].props.products).toEqual([product("1")]);
    });

    it("explains an empty catalog before the first import", async () => {
      listCategories.mockResolvedValue([]);
      const { find, strings } = await render(ListsView());
      expect(find(EmptyCatalog)).toHaveLength(1);
      expect(listProducts).not.toHaveBeenCalled();
      const rendered = await render(EmptyCatalog());
      expect(rendered.strings.join(" ")).toMatch(/after the nightly import/);
      expect(strings).not.toContain("Biggest discounts");
    });

    it("keeps the other rows when one list fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      listProducts.mockImplementation(async (opts) =>
        (opts as { sort: string }).sort === "rating"
          ? Promise.reject(new Error("db down"))
          : page([product("1")]),
      );
      const { find, strings } = await render(ListsView());
      // most reviewed, discounts and 2 categories; top rated shows the error
      expect(find(ProductRow)).toHaveLength(4);
      expect(strings).toContain(
        "Could not load these products. Refresh the page to try again.",
      );
    });

    it("hints that the search text is too short", async () => {
      const { strings } = await render(
        CatalogView({ searchParams: params({ q: "a" }) }),
      );
      expect(strings.join("")).toContain("Type at least 2 characters");
      expect(searchProducts).not.toHaveBeenCalled();
    });
  });

  describe("category view", () => {
    it("passes the slug and the page, and paginates", async () => {
      listProducts.mockResolvedValue(page([product("1")], 30, 2));
      const { find, strings } = await render(
        CatalogView({
          searchParams: params({ category: "deals-collection-tvs", page: "2" }),
        }),
      );
      expect(find(CategoryView)[0].props).toEqual({
        slug: "deals-collection-tvs",
        page: 2,
      });
      expect(listProducts).toHaveBeenCalledWith({
        category: "deals-collection-tvs",
        sort: "discount",
        page: 2,
        pageSize: 24,
      });
      expect(strings).toContain("TVs");
      expect(strings).toContain("All products");
      expect(find(ProductGrid)[0].props.products).toEqual([product("1")]);
      const pagination = find(Pagination)[0].props as {
        total: number;
        page: number;
        href: (n: number) => string;
      };
      expect(pagination.total).toBe(30);
      expect(pagination.page).toBe(2);
      expect(pagination.href(3)).toBe(
        "/home?category=deals-collection-tvs&page=3",
      );
    });

    it("shows a clear message for an unknown category", async () => {
      const { strings, find } = await render(
        CategoryView({ slug: "deals-collection-nope", page: 1 }),
      );
      expect(strings).toContain("We could not find that category");
      expect(find(ProductGrid)).toHaveLength(0);
    });

    it("does not query a malformed slug", async () => {
      const { strings } = await render(
        CategoryView({ slug: "../../etc", page: 1 }),
      );
      expect(strings).toContain("We could not find that category");
      expect(listProducts).not.toHaveBeenCalled();
    });
  });

  describe("search view", () => {
    it("passes q and the page with 24 per page, and shows the count", async () => {
      searchProducts.mockResolvedValue(page([product("1"), product("2")], 26));
      const { find, strings } = await render(
        CatalogView({ searchParams: params({ q: " smart tv ", page: "2" }) }),
      );
      expect(find(SearchView)[0].props).toEqual({ q: "smart tv", page: 2 });
      expect(searchProducts).toHaveBeenCalledWith("smart tv", {
        page: 2,
        pageSize: 24,
      });
      expect(listProducts).not.toHaveBeenCalled();
      expect(strings).toContain("26 results for “smart tv”");
      expect(find(ProductGrid)[0].props.products).toHaveLength(2);
    });

    it("shows the empty state with a way to clear the search", async () => {
      const { strings, elements } = await render(
        SearchView({ q: "zzz", page: 1 }),
      );
      expect(strings).toContain("0 results for “zzz”");
      const notice = elements.find(
        (el) => el.props.title === "No products match “zzz”",
      );
      expect(notice?.props.action).toEqual({
        href: "/home",
        label: "Clear search",
      });
    });
  });

  describe("search field", () => {
    it("is filled from the URL and focused when coming from /me", async () => {
      const { find } = await render(
        CatalogSearch({ searchParams: params({ q: "duna", focus: "search" }) }),
      );
      expect(find(SearchForm)[0].props).toEqual({
        defaultValue: "duna",
        autoFocus: true,
      });
    });
  });

  describe("most reviewed row", () => {
    it("renders nothing while nobody has reviewed a product", async () => {
      const row = await LoadedRow({
        id: "most-reviewed",
        title: "Most reviewed here",
        page: Promise.resolve(page([])),
        hideWhenEmpty: true,
      });
      expect(row).toBeNull();
    });

    it("renders the row when there are reviewed products", async () => {
      const row = await LoadedRow({
        id: "most-reviewed",
        title: "Most reviewed here",
        page: Promise.resolve(page([product("1")])),
        hideWhenEmpty: true,
      });
      expect(isValidElement(row)).toBe(true);
    });
  });
});

// The page itself is sync: walk it without running the streamed components.
async function renderShallow(node: unknown) {
  const elements: Found[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 50 || value == null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
    } else if (isValidElement(value)) {
      const props = value.props as Record<string, unknown>;
      elements.push({ type: value.type, props });
      for (const prop of Object.values(props)) visit(prop, depth + 1);
    }
  };
  visit(node, 0);
  return { elements };
}
