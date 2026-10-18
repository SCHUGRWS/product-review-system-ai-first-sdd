import type { Locale } from "@/i18n/locales";
import { homeHref } from "@/lib/routes";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 10_000;
// Category slugs come from the import (e.g. "deals-collection-tvs")
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CatalogParams = {
  view: "lists" | "category" | "search";
  /** Trimmed search text as typed (kept in the field even when too short) */
  q: string;
  category: string | null;
  page: number;
  focusSearch: boolean;
  /** Why the request fell back to the lists, shown above them */
  hint: "query-too-short" | null;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value.trim())) return 1;
  const page = Number.parseInt(value, 10);
  return Math.min(Math.max(page, 1), MAX_PAGE);
}

// Validates the URL state of /home. The search wins over the category, and
// anything malformed degrades to a sensible view instead of an error.
export function parseCatalogParams(
  searchParams: RawSearchParams,
): CatalogParams {
  const q = (first(searchParams.q) ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_QUERY_LENGTH);
  const rawCategory = first(searchParams.category)?.trim().toLowerCase() ?? "";
  const category = rawCategory ? rawCategory : null;
  const page = parsePage(first(searchParams.page));
  const focusSearch = first(searchParams.focus) === "search";

  if (q.length >= MIN_QUERY_LENGTH) {
    return { view: "search", q, category: null, page, focusSearch, hint: null };
  }
  const hint = q.length > 0 ? "query-too-short" : null;
  if (category) {
    return { view: "category", q, category, page, focusSearch, hint };
  }
  return { view: "lists", q, category: null, page: 1, focusSearch, hint };
}

export function isValidSlug(slug: string) {
  return slug.length <= 120 && SLUG.test(slug);
}

// Builds a /<locale>/home URL for a view; page 1 is left out so links stay canonical.
export function catalogHref(
  locale: Locale,
  {
    q,
    category,
    page,
  }: {
    q?: string | null;
    category?: string | null;
    page?: number;
  },
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  else if (category) params.set("category", category);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  const home = homeHref(locale);
  return query ? `${home}?${query}` : home;
}
