import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/product.types";
import type { SessionUser } from "@/server/auth/types";

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

const { redirect } = await import("next/navigation");
const { ProductFeedback } = await import(
  "@/features/feedback/product-feedback"
);
const { FeedbackForm } = await import("@/features/feedback/feedback-form");
const { AlreadyReviewed } = await import(
  "@/features/feedback/already-reviewed"
);
const { default: ProductFeedbackPage } = await import("./page");
const { default: ProductNotFound } = await import("./not-found");

const user: SessionUser = {
  id: "acc_123",
  firstName: "Grace",
  lastName: "Hopper",
  email: "grace@example.com",
  createdAt: new Date("2026-10-17T12:00:00Z"),
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

const reviewedProduct = {
  id: product.id,
  title: product.title,
  imageUrl: product.imageUrl,
  url: product.url,
  priceCents: product.priceCents,
};

const params = (productId: string) => Promise.resolve({ productId });

// Walks the element tree returned by a Server Component without rendering it,
// rendering plain function components (not client ones) one level at a time.
function collect(node: unknown) {
  const elements: { type: unknown; props: Record<string, unknown> }[] = [];
  const strings: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 50 || value == null || typeof value === "boolean") return;
    if (typeof value === "string" || typeof value === "number") {
      strings.push(String(value));
    } else if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
    } else if (isValidElement(value)) {
      const props = value.props as Record<string, unknown>;
      elements.push({ type: value.type, props });
      for (const prop of Object.values(props)) visit(prop, depth + 1);
      // Expand server-side function components so their markup is visible
      if (
        typeof value.type === "function" &&
        value.type !== FeedbackForm &&
        value.type.constructor.name !== "AsyncFunction"
      ) {
        try {
          visit((value.type as (p: unknown) => unknown)(props), depth + 1);
        } catch {
          // Components using hooks are left unexpanded
        }
      }
    }
  };
  visit(node, 0);
  return { elements, strings, text: strings.join("\n") };
}

function digestOf(error: unknown) {
  return (error as { digest?: string }).digest;
}

describe("/products/[productId]/feedback", () => {
  beforeEach(() => {
    requireUser.mockReset();
    requireUser.mockResolvedValue(user);
    getProductById.mockReset();
    getProductById.mockResolvedValue(product);
    hasFeedbackForProduct.mockReset();
    hasFeedbackForProduct.mockResolvedValue(false);
  });

  it("propagates the redirect to /auth/sign-in when there is no session", async () => {
    requireUser.mockImplementation(async () => redirect("/auth/sign-in"));

    const error = await ProductFeedback({ params: params(product.id) }).catch(
      (e: unknown) => e,
    );

    expect(digestOf(error)).toMatch(/^NEXT_REDIRECT;[a-z]+;\/auth\/sign-in;/);
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("calls notFound() for an unknown product", async () => {
    getProductById.mockResolvedValue(null);

    const error = await ProductFeedback({ params: params(product.id) }).catch(
      (e: unknown) => e,
    );

    expect(digestOf(error)).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(getProductById).toHaveBeenCalledWith(product.id);
  });

  it("calls notFound() for an id that cannot be a product, without a lookup", async () => {
    const error = await ProductFeedback({ params: params("unknown") }).catch(
      (e: unknown) => e,
    );

    expect(digestOf(error)).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(getProductById).not.toHaveBeenCalled();
    expect(hasFeedbackForProduct).not.toHaveBeenCalled();
  });

  it("renders the form with the product and the author's short name", async () => {
    const { elements } = collect(
      await ProductFeedback({ params: params(product.id) }),
    );

    expect(hasFeedbackForProduct).toHaveBeenCalledWith("acc_123", product.id);
    const form = elements.find((el) => el.type === FeedbackForm);
    // Only the fields the page shows reach the client
    expect(form?.props).toEqual({
      author: "Grace H.",
      product: reviewedProduct,
    });
    expect(elements.some((el) => el.type === AlreadyReviewed)).toBe(false);
  });

  it("shows the already-reviewed message with a link to /me instead of the form", async () => {
    hasFeedbackForProduct.mockResolvedValue(true);

    const { elements, strings } = collect(
      await ProductFeedback({ params: params(product.id) }),
    );

    expect(elements.some((el) => el.type === FeedbackForm)).toBe(false);
    expect(strings).toContain("You already reviewed this product");
    expect(strings).toContain(product.title);
    const meLink = elements.find((el) => el.props.href === "/me");
    expect(meLink).toBeDefined();
  });

  it("wraps the session-dependent content in a Suspense boundary", () => {
    const p = params(product.id);
    const { elements } = collect(ProductFeedbackPage({ params: p }));
    const boundary = elements.find(
      (el) => "fallback" in el.props && "children" in el.props,
    );
    const child = boundary?.props.children as {
      type: unknown;
      props: unknown;
    };
    expect(child.type).toBe(ProductFeedback);
    expect(child.props).toEqual({ params: p });
  });

  it("the 404 page links back to /home", () => {
    const { elements, strings } = collect(ProductNotFound());
    expect(strings).toContain("Product not found");
    expect(elements.some((el) => el.props.href === "/home")).toBe(true);
  });
});
