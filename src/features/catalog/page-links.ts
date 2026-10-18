export type PageLink =
  | { type: "page"; page: number; current: boolean }
  | { type: "gap"; key: string };

// Page numbers to show: always the first and last page plus a window around
// the current one, with gaps between. A single page needs no pagination.
export function pageLinks(
  total: number,
  page: number,
  pageSize: number,
  window = 1,
): PageLink[] {
  const pageCount = Math.max(Math.ceil(total / pageSize), 0);
  if (pageCount <= 1) return [];
  const current = Math.min(Math.max(page, 1), pageCount);

  const pages = new Set<number>([1, pageCount]);
  for (let n = current - window; n <= current + window; n++) {
    if (n >= 1 && n <= pageCount) pages.add(n);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  const links: PageLink[] = [];
  let previous = 0;
  for (const n of sorted) {
    if (n - previous === 2) {
      // A gap of exactly one page shows that page instead of an ellipsis
      links.push({ type: "page", page: n - 1, current: false });
    } else if (n - previous > 2) {
      links.push({ type: "gap", key: `gap-${previous}` });
    }
    links.push({ type: "page", page: n, current: n === current });
    previous = n;
  }
  return links;
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(Math.ceil(total / pageSize), 1);
}
