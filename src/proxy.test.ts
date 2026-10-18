import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, isLocalizable, proxy } from "./proxy";

function request(
  path: string,
  { cookie, language }: { cookie?: string; language?: string } = {},
) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (language) headers.set("accept-language", language);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

const location = (response: Response) => response.headers.get("location");
const passesThrough = (response: Response) =>
  response.headers.get("x-middleware-next") === "1";

describe("proxy", () => {
  it("redirects a URL without a locale to the cookie's locale", () => {
    const response = proxy(
      request("/home", { cookie: "prs_locale=pt-BR", language: "en-US" }),
    );
    expect(response.status).toBe(307);
    expect(location(response)).toBe("http://localhost:3000/pt-BR/home");
  });

  it("uses Accept-Language without a cookie, then English", () => {
    expect(
      location(proxy(request("/me", { language: "pt-BR,pt;q=0.9" }))),
    ).toBe("http://localhost:3000/pt-BR/me");
    expect(location(proxy(request("/me", { language: "fr" })))).toBe(
      "http://localhost:3000/en/me",
    );
    expect(location(proxy(request("/")))).toBe("http://localhost:3000/en");
  });

  it("keeps the query string", () => {
    expect(
      location(proxy(request("/home?q=smart+tv&page=2", { language: "pt" }))),
    ).toBe("http://localhost:3000/pt-BR/home?q=smart+tv&page=2");
  });

  it("lets localized URLs through", () => {
    expect(passesThrough(proxy(request("/en/home")))).toBe(true);
    expect(passesThrough(proxy(request("/pt-BR")))).toBe(true);
    expect(
      passesThrough(
        proxy(request("/pt-BR/products/abc", { cookie: "prs_locale=en" })),
      ),
    ).toBe(true);
  });

  it.each([
    "/api/v1/sign-in",
    "/api/trpc/auth.signIn",
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
    "/robots.txt",
    "/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/a",
  ])("never touches %s", (path) => {
    expect(isLocalizable(path)).toBe(false);
    expect(passesThrough(proxy(request(path, { language: "pt-BR" })))).toBe(
      true,
    );
  });

  it("is not even matched for API routes, Next.js internals and files", () => {
    const [matcher] = config.matcher;
    // Next.js compiles the matcher the same way: anchored, as a regular expression
    const pattern = new RegExp(`^${matcher}$`);
    for (const path of [
      "/api/v1/sign-in",
      "/_next/static/a.js",
      "/favicon.ico",
    ]) {
      expect(pattern.test(path), path).toBe(false);
    }
    for (const path of ["/", "/home", "/en/me", "/products/abc/feedback"]) {
      expect(pattern.test(path), path).toBe(true);
    }
  });
});
