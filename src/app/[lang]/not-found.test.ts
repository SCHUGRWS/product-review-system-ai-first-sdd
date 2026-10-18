import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/i18n/client";
import { dictionaries } from "@/i18n/dictionaries";
import { en } from "@/i18n/dictionaries/en";
import { ptBR } from "@/i18n/dictionaries/pt-BR";
import type { Locale } from "@/i18n/locales";
import { setTestLang } from "@/test/root-params";

// A plain anchor: no Next.js router outside a request
vi.mock("next/link", () => ({
  default: ({ href, ...props }: { href: string }) =>
    createElement("a", { href, ...props }),
}));

const { default: NotFound } = await import("./not-found");

// The page is a Server Component (awaited here); its client parts read the
// messages from the provider the root layout puts around every page.
async function render(locale: Locale) {
  setTestLang(locale);
  try {
    const page = await NotFound();
    return renderToStaticMarkup(
      createElement(
        I18nProvider,
        // children come as the third argument
        { locale, messages: dictionaries[locale] } as Parameters<
          typeof I18nProvider
        >[0],
        page,
      ),
    );
  } finally {
    setTestLang("en");
  }
}

describe("localized not-found page", () => {
  it("says the page was not found", async () => {
    const html = await render("en");
    expect(html).toContain(`<h1`);
    expect(html).toContain(en["notFound.title"]);
    expect(html).toContain(en["notFound.body"]);
  });

  it("links to the catalog on /<locale>/home", async () => {
    expect(await render("en")).toMatch(
      new RegExp(`<a href="/en/home"[^>]*>${en["notFound.cta"]}</a>`),
    );
    expect(await render("pt-BR")).toMatch(
      new RegExp(`<a href="/pt-BR/home"[^>]*>${ptBR["notFound.cta"]}</a>`),
    );
  });

  it("ends with the study-project footer", async () => {
    expect(await render("en")).toContain(en["disclaimer.footer"]);
    expect(await render("pt-BR")).toContain(ptBR["disclaimer.footer"]);
  });
});
