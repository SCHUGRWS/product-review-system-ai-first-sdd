import { isValidElement, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { ptBR } from "@/i18n/dictionaries/pt-BR";

// The footer reads the UI language from <I18nProvider>; here the hook is a
// plain translator, so the components can be expanded without React DOM.
const locale = vi.hoisted(() => ({ current: "en" as "en" | "pt-BR" }));
vi.mock("@/i18n/client", async () => {
  const { createT } = await import("@/i18n/t");
  return { useT: () => createT(locale.current) };
});

const { GITHUB_ISSUES_URL, SiteFooter, StudyNotice } = await import(
  "./site-footer"
);

type Props = { children?: unknown; [key: string]: unknown };

// Expands the (hook-free) components into host elements, without React DOM.
function expand(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(expand);
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<Props>;
  if (typeof el.type === "function") {
    return expand((el.type as (p: Props) => unknown)(el.props));
  }
  return {
    type: el.type,
    props: { ...el.props, children: expand(el.props.children) },
  };
}

function walk(
  node: unknown,
  visit: (el: { type: string; props: Props }) => void,
) {
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit);
    return;
  }
  if (node && typeof node === "object" && "type" in node) {
    const el = node as { type: string; props: Props };
    visit(el);
    walk(el.props.children, visit);
  }
}

function textOf(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: Props }).props.children);
  }
  return "";
}

function links(node: unknown) {
  const found: Props[] = [];
  walk(node, (el) => {
    if (el.type === "a") found.push(el.props);
  });
  return found;
}

describe("study-project disclaimer copy", () => {
  it("says it is a non-profit study project that keeps data and sends no emails", () => {
    expect(en["disclaimer.title"]).toBe("A study project");
    expect(en["disclaimer.body"]).toMatch(
      /non-profit study and portfolio project/,
    );
    expect(en["disclaimer.body"]).toMatch(
      /never shared, sold or used for anything else/,
    );
    expect(en["disclaimer.body"]).toMatch(/never receive emails/);
    expect(en["disclaimer.body"]).toMatch(/re-enabled for testing/);
    expect(en["disclaimer.footer"]).toMatch(/^Study project, non-profit\./);
    expect(en["disclaimer.footer"]).toMatch(/never get emails/);
    expect(en["disclaimer.contact"]).toBe("Contact on GitHub");
  });
});

describe("StudyNotice", () => {
  const tree = expand(StudyNotice({}));

  it("shows the title, the full text and the GitHub link in a new tab", () => {
    const text = textOf(tree);
    expect(text).toContain(en["disclaimer.title"]);
    expect(text).toContain(en["disclaimer.body"]);
    const [link, ...rest] = links(tree);
    expect(rest).toHaveLength(0);
    expect(link).toMatchObject({
      href: GITHUB_ISSUES_URL,
      target: "_blank",
      rel: "noopener noreferrer",
    });
    expect(textOf(link.children)).toBe(
      `${en["disclaimer.contact"]} ${en["disclaimer.opensNewTab"]}`,
    );
  });
});

describe("SiteFooter", () => {
  it.each([
    "page",
    "column",
  ] as const)("%s: a footer landmark with the short text and link", (variant) => {
    const tree = expand(SiteFooter({ variant }));
    expect((tree as { type: string }).type).toBe("footer");
    expect(textOf(tree)).toContain(en["disclaimer.footer"]);
    expect(textOf(tree)).not.toContain(en["disclaimer.body"]);
    expect(links(tree).map((l) => l.href)).toEqual([GITHUB_ISSUES_URL]);
  });
});

describe("in Portuguese", () => {
  it("shows the Portuguese footer", () => {
    locale.current = "pt-BR";
    const tree = expand(SiteFooter({}));
    expect(textOf(tree)).toContain(ptBR["disclaimer.footer"]);
    expect(textOf(tree)).toContain(ptBR["disclaimer.contact"]);
    locale.current = "en";
  });
});
