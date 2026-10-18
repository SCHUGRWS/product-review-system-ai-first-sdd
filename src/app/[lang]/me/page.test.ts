import { isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/server/auth/types";

const requireUser = vi.fn<() => Promise<SessionUser>>();
vi.mock("@/server/auth/current-user", () => ({ requireUser }));

const { redirect } = await import("next/navigation");
const { MeContent } = await import("@/features/me/me-content");
const { default: MePage } = await import("./page");
const { MeLayout } = await import("@/features/me/me-layout");
const { default: Link } = await import("next/link");

const user: SessionUser = {
  id: "acc_123",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  createdAt: new Date("2026-10-17T12:00:00Z"),
  locale: "en",
};

// Walks the element tree returned by a Server Component without rendering it,
// collecting every element and every string value found in props.
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
      for (const [key, prop] of Object.entries(props)) {
        strings.push(key);
        visit(prop, depth + 1);
      }
    } else if (value instanceof Date) {
      strings.push(value.toISOString());
    } else if (typeof value === "object") {
      for (const [key, prop] of Object.entries(value)) {
        strings.push(key);
        visit(prop, depth + 1);
      }
    }
  };
  visit(node, 0);
  return { elements, strings, text: strings.join("\n") };
}

describe("/me", () => {
  beforeEach(() => {
    requireUser.mockReset();
  });

  it("propagates the redirect to /auth/sign-in when there is no session", async () => {
    requireUser.mockImplementation(async () => redirect("/auth/sign-in"));

    const error = await MeContent().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as { digest?: string }).digest).toMatch(
      /^NEXT_REDIRECT;[a-z]+;\/auth\/sign-in;/,
    );
  });

  it("renders the greeting, account summary and recent feedback for the user", async () => {
    requireUser.mockResolvedValue(user);

    const { elements, strings } = collect(await MeContent());

    expect(strings).toContain("Welcome back, Ada");
    expect(strings).toContain("ada@example.com");
    expect(strings).toContain("Ada Lovelace");
    expect(strings).toContain("Member since October 2026");

    const { RecentFeedback } = await import(
      "@/features/feedback/recent-feedback"
    );
    const recent = elements.find((el) => el.type === RecentFeedback);
    expect(recent?.props).toEqual({ userId: "acc_123" });
  });

  it("never passes password, salt or token fields down the tree", async () => {
    // Simulate a DAL that leaked extra columns: they must not reach any prop.
    requireUser.mockResolvedValue({
      ...user,
      password: "hash-value",
      salt: "salt-value",
      token: "token-value",
    } as SessionUser);

    const { text } = collect(await MeContent());

    for (const secret of [
      "password",
      "salt",
      "token",
      "hash-value",
      "salt-value",
      "token-value",
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it('links "Write feedback" to the catalog with the search focused', async () => {
    requireUser.mockResolvedValue(user);

    const layout = collect(await MeContent()).elements.find(
      (el) => el.type === MeLayout,
    );
    expect(layout).toBeDefined();
    const rendered = await MeLayout(
      layout?.props as Parameters<typeof MeLayout>[0],
    );
    const link = collect(rendered).elements.find(
      (el) => el.type === Link && el.props.children === "Write feedback",
    );
    expect(link?.props.href).toBe("/en/home?focus=search");
  });

  it("wraps the session-dependent content in a Suspense boundary", () => {
    const { elements } = collect(MePage());
    const boundary = elements.find(
      (el) => "fallback" in el.props && "children" in el.props,
    );
    expect(boundary).toBeDefined();
    expect(isValidElement(boundary?.props.children as ReactNode)).toBe(true);
    expect((boundary?.props.children as { type: unknown }).type).toBe(
      MeContent,
    );
  });
});
