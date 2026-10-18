import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/product.types";
import type {
  ProductReviewPage,
  ProductReviewStats,
} from "@/features/reviews/reviews.schema";
import { createT } from "@/i18n/t";
import type { SessionUser } from "@/server/auth/types";
import { collectTree } from "@/test/collect-tree";
import { setTestLang } from "@/test/root-params";

const requireUser = vi.hoisted(() => vi.fn<() => Promise<SessionUser>>());
vi.mock("@/server/auth/current-user", () => ({ requireUser }));

const getProductById = vi.hoisted(() =>
  vi.fn<(id: string) => Promise<Product | null>>(),
);
vi.mock("@/server/products/queries", () => ({ getProductById }));

const hasFeedbackForProduct = vi.hoisted(() =>
  vi.fn<(accountId: string, productId: string) => Promise<boolean>>(),
);
vi.mock("@/server/feedback/queries", () => ({ hasFeedbackForProduct }));

const getProductReviewStats = vi.hoisted(() =>
  vi.fn<(productId: string) => Promise<ProductReviewStats>>(),
);
const listProductReviews = vi.hoisted(() =>
  vi.fn<(productId: string, page?: number) => Promise<ProductReviewPage>>(),
);
vi.mock("@/server/reviews/queries", () => ({
  getProductReviewStats,
  listProductReviews,
}));

// The summary has its own tests; the page must never wait for it
const getOrCreateSummary = vi.hoisted(() => vi.fn());
vi.mock("@/server/reviews/summary", () => ({ getOrCreateSummary }));

const { redirect } = await import("next/navigation");
const { ProductReviews, ProductReviewsSkeleton } = await import(
  "@/features/reviews/product-reviews"
);
const { AiSummary, SummaryPanel } = await import(
  "@/features/reviews/ai-summary"
);
const { ReviewList } = await import("@/features/reviews/review-list");
const { default: ProductReviewsPage } = await import("./page");
const { default: ProductNotFound } = await import("./not-found");

const user: SessionUser = {
  id: "acc_123",
  firstName: "Grace",
  lastName: "Hopper",
  email: "grace@example.com",
  createdAt: new Date("2026-10-17T12:00:00Z"),
  locale: "en",
};

const product: Product = {
  id: "V1StGXR8_Z5jdHi6B-myT",
  asin: "B0KETTLE01",
  title: "Chaleira Elétrica Inox 1,7L",
  url: "https://www.amazon.com.br/dp/B0KETTLE01",
  imageUrl: "https://m.media-amazon.com/images/I/kettle.jpg",
  priceCents: 9990,
  listPriceCents: 12990,
  discountPercent: 23,
  currency: "BRL",
  rating: 4.5,
  reviewCount: 120,
  category: { slug: "deals-collection-kitchen", name: "Kitchen" },
  lastSeenAt: new Date("2026-10-17T00:00:00Z"),
};

const stats: ProductReviewStats = {
  count: 3,
  average: 11 / 3,
  distribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 1 },
};

const reviews: ProductReviewPage = {
  items: [
    {
      id: "fb_1",
      rating: 5,
      comment: "Boils fast and the lid does not drip.",
      author: "Ada L.",
      createdAt: new Date("2026-10-18T10:00:00Z"),
    },
  ],
  total: 3,
  page: 1,
  pageSize: 20,
};

const params = (productId: string) => Promise.resolve({ productId });
const searchParams = (page?: string) =>
  Promise.resolve(page ? { page } : ({} as Record<string, string>));

const EN = { t: createT("en"), locale: "en" } as const;

const collect = (node: unknown) => collectTree(node, { skip: [AiSummary] });

function digestOf(error: unknown) {
  return (error as { digest?: string }).digest;
}

const render = (productId = product.id, page?: string) =>
  ProductReviews({
    params: params(productId),
    searchParams: searchParams(page),
  });

describe("/products/[productId]", () => {
  beforeEach(() => {
    requireUser.mockReset();
    requireUser.mockResolvedValue(user);
    getProductById.mockReset();
    getProductById.mockResolvedValue(product);
    hasFeedbackForProduct.mockReset();
    hasFeedbackForProduct.mockResolvedValue(false);
    getProductReviewStats.mockReset();
    getProductReviewStats.mockResolvedValue(stats);
    listProductReviews.mockReset();
    listProductReviews.mockResolvedValue(reviews);
    getOrCreateSummary.mockReset();
  });

  it("propagates the redirect to /auth/sign-in when there is no session", async () => {
    requireUser.mockImplementation(async () => redirect("/auth/sign-in"));

    const error = await render().catch((e: unknown) => e);

    expect(digestOf(error)).toMatch(/^NEXT_REDIRECT;[a-z]+;\/auth\/sign-in;/);
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("calls notFound() for an unknown product", async () => {
    getProductById.mockResolvedValue(null);

    const error = await render().catch((e: unknown) => e);

    expect(digestOf(error)).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(getProductById).toHaveBeenCalledWith(product.id);
    expect(listProductReviews).not.toHaveBeenCalled();
  });

  it("calls notFound() for an id that cannot be a product, without a lookup", async () => {
    const error = await render("unknown").catch((e: unknown) => e);

    expect(digestOf(error)).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("shows the product, the Give feedback button and the reviews", async () => {
    const { elements, strings, text } = await collect(await render());

    expect(hasFeedbackForProduct).toHaveBeenCalledWith("acc_123", product.id);
    expect(strings).toContain(product.title);
    const amazon = elements.find((el) => el.props.href === product.url);
    expect(amazon?.props).toMatchObject({
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    });
    expect(
      elements.some(
        (el) => el.props.href === `/en/products/${product.id}/feedback`,
      ),
    ).toBe(true);
    expect(strings).toContain("Give feedback");
    expect(text).not.toContain("You reviewed this product");
    // Numbers, reviews list
    expect(strings).toContain("3.7");
    expect(strings).toContain("3 reviews");
    expect(strings).toContain("Ada L.");
    expect(strings).toContain(reviews.items[0].comment);
  });

  it("says the user reviewed the product instead of the button", async () => {
    hasFeedbackForProduct.mockResolvedValue(true);

    const { elements, strings } = await collect(await render());

    expect(strings).toContain("You reviewed this product");
    expect(strings).not.toContain("Give feedback");
    expect(
      elements.some(
        (el) => el.props.href === `/en/products/${product.id}/feedback`,
      ),
    ).toBe(false);
  });

  it("renders the AI summary in its own Suspense boundary", async () => {
    const { elements } = await collect(await render());

    // The summary reads the viewer's language itself (the [lang] root param)
    const summary = elements.find((el) => el.type === AiSummary);
    expect(summary?.props).toEqual({
      product: { id: product.id, title: product.title },
      stats: { count: 3, average: 11 / 3 },
    });
    const boundary = elements.find(
      (el) =>
        el.type === Suspense &&
        (el.props.children as { type?: unknown })?.type === AiSummary,
    );
    expect(boundary).toBeDefined();
    // Rendering the page did not call the model
    expect(getOrCreateSummary).not.toHaveBeenCalled();
  });

  it("reads the page from ?page", async () => {
    await render(product.id, "2");
    expect(listProductReviews).toHaveBeenCalledWith(product.id, 2);
  });

  it("still shows the product when the reviews fail to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    listProductReviews.mockRejectedValue(new Error("db down"));

    const { strings, elements } = await collect(await render());

    expect(strings).toContain(product.title);
    expect(strings).toContain(
      "Could not load the reviews. Refresh the page to try again.",
    );
    expect(elements.some((el) => el.type === AiSummary)).toBe(false);
  });

  it("wraps the session-dependent content in a Suspense boundary", async () => {
    const p = params(product.id);
    const sp = searchParams();
    const { elements } = await collect(
      ProductReviewsPage({ params: p, searchParams: sp } as never),
    );
    const boundary = elements.find((el) => el.type === Suspense);
    const child = boundary?.props.children as {
      type: unknown;
      props: unknown;
    };
    expect(child.type).toBe(ProductReviews);
    expect(child.props).toEqual({ params: p, searchParams: sp });
    expect((boundary?.props.fallback as { type?: unknown }).type).toBe(
      ProductReviewsSkeleton,
    );
  });

  it("the 404 page links back to /<locale>/home", async () => {
    const { elements, strings } = await collect(ProductNotFound());
    expect(strings).toContain("Product not found");
    expect(elements.some((el) => el.props.href === "/en/home")).toBe(true);
  });
});

describe("ReviewList", () => {
  it("shows the empty state with a link to the feedback page", async () => {
    const { elements, strings } = await collect(
      ReviewList({
        productId: product.id,
        reviews: { items: [], total: 0, page: 1, pageSize: 20 },
      }),
    );
    expect(strings).toContain("Be the first to review");
    expect(
      elements.some(
        (el) => el.props.href === `/en/products/${product.id}/feedback`,
      ),
    ).toBe(true);
  });

  it("renders comments as text", async () => {
    const comment = "<b>bold</b> claims";
    const { strings } = await collect(
      ReviewList({
        productId: product.id,
        reviews: {
          ...reviews,
          items: [{ ...reviews.items[0], comment }],
        },
      }),
    );
    expect(strings).toContain(comment);
  });
});

describe("SummaryPanel", () => {
  it("says the summary appears after 3 reviews", async () => {
    const { strings } = await collect(
      SummaryPanel({
        result: { status: "too-few", reviewCount: 2 },
        ...EN,
      }),
    );
    expect(strings).toContain("The summary appears after 3 reviews");
  });

  it("says the summary is unavailable", async () => {
    const { strings } = await collect(
      SummaryPanel({ result: { status: "unavailable" }, ...EN }),
    );
    expect(strings).toContain("Summary unavailable right now");
  });

  it("shows the verdict, headline, pros, cons and the footer", async () => {
    const { strings } = await collect(
      SummaryPanel({
        ...EN,
        result: {
          status: "ready",
          reviewCount: 50,
          generatedAt: new Date("2026-10-18T12:00:00Z"),
          summary: {
            verdict: "mixed",
            headline: "Fast, but the lid divides people",
            summary: "Most like the speed.",
            pros: ["Boils fast"],
            cons: ["Stiff lid"],
          },
        },
      }),
    );
    expect(strings).toEqual(
      expect.arrayContaining([
        "AI summary",
        "Mixed opinions",
        "Fast, but the lid divides people",
        "Most like the speed.",
        "Boils fast",
        "Stiff lid",
        "AI summary of 50 reviews, updated Oct 18, 2026",
      ]),
    );
  });
});

describe("AiSummary", () => {
  it("falls back to unavailable when the summary throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getOrCreateSummary.mockRejectedValue(new Error("boom"));

    const element = await AiSummary({
      product: { id: product.id, title: product.title },
      stats: { count: 3, average: 4 },
    });

    expect((await collect(element)).strings).toContain(
      "Summary unavailable right now",
    );
  });

  it("asks for the summary in the viewer's language", async () => {
    getOrCreateSummary.mockResolvedValue({ status: "unavailable" });
    setTestLang("pt-BR");
    try {
      const element = await AiSummary({
        product: { id: product.id, title: product.title },
        stats: { count: 3, average: 4 },
      });
      expect(getOrCreateSummary).toHaveBeenCalledWith(
        { id: product.id, title: product.title },
        "pt-BR",
        { count: 3, average: 4 },
      );
      expect((await collect(element)).strings).toContain(
        "Resumo indisponível no momento",
      );
    } finally {
      setTestLang("en");
    }
  });
});
