# Implementation plan: Home (catalog) and personal page

Spec: [`specs/home.md`](../../specs/home.md)

Prerequisite: Phase 0 of [`execution.md`](execution.md) is done. Product queries and `ProductCard` are stubs until the product agent finishes; code against their signatures and mock them in tests.

## 1. Move the current home to `/me`
- `src/app/me/page.tsx`: the current `/home` page content (greeting, account, recent feedback); metadata "My page | Product Review System"
- `src/features/home/*` → `src/features/me/*` (`home-content` → `me-content`, `home-layout` → `me-layout`, etc.); tests move with them
- "Write feedback" now links to `/home?focus=search` (the search field gets `autoFocus` when `focus=search`)
- `src/app/home/page.test.ts` → `src/app/me/page.test.ts` (same cases)

## 2. Header
- `src/components/app-header.tsx`: add the nav ("Products" → `/home`, "My page" → `/me`) with `aria-current="page"`
  - a small client component `src/components/app-nav.tsx` uses `usePathname()`
  - on mobile: name and sign-out on the first row, nav on the second; no wrapping surprises

## 3. Catalog page `/home`
- `src/app/home/page.tsx`: reads `searchParams` (`q`, `category`, `page`, `focus`) and renders one of three views inside `<Suspense>` (the static shell is the header skeleton, the search field and the list skeletons)
  - **Lists** (no `q`, no `category`):
    - `listProducts({ sort: "discount", pageSize: 20 })` → "Biggest discounts"
    - `listProducts({ sort: "rating", minReviews: 50, pageSize: 20 })` → "Top rated"
    - `listCategories()` → one `listProducts({ category, sort: "discount", pageSize: 20 })` per category, each in its own `<Suspense>` so slow lists don't block the rest
  - **Category** (`category`): grid + pagination, title = category label, link "All products"
  - **Search** (`q`): `searchProducts(q, { page, pageSize: 24 })`, grid + pagination, "N results for "…"", empty state
  - Invalid params (unknown category, q < 2): clear message, never a crash
- `src/features/catalog/search-form.tsx` (client): `<form role="search">` with a label, GET to `/home?q=`, clear button, keeps the text in the field from the URL
- `src/features/catalog/product-row.tsx`:
  - `<section aria-labelledby>` with the title and "See all"
  - horizontal list (`overflow-x-auto`, `snap-x`, `scroll-padding`), focusable items
  - previous/next buttons on desktop (client, `scrollBy`)
- `src/features/catalog/product-grid.tsx`, `pagination.tsx` (links with `?page=`, `aria-current`), `catalog-skeletons.tsx`, `empty-catalog.tsx`
- `src/features/catalog/catalog-params.ts`: `parseCatalogParams(searchParams)` → `{ view: "lists" | "category" | "search", q, category, page, focusSearch }` (validates, trims, clamps page ≥ 1)
- Design via the `frontend-design` skill and the approved direction:
  - paper background, section titles weight 800
  - the cobalt band only at the top with the search (the page's one bold moment)
  - cards stay quiet; one motion moment (list items fade up once, off with reduced motion)

## 4. Tests (Vitest)
| File | Cases |
|---|---|
| `src/features/catalog/catalog-params.test.ts` | no params → lists; `q` trimmed, `q` < 2 → lists with a hint; `category` → category view; `q` wins over `category`; `page` NaN / 0 / negative → 1; `focus=search` |
| `src/app/home/page.test.ts` | lists view calls `listProducts` with discount / rating(minReviews 50) / one per category; category view passes slug and page; search view passes q and page 24; redirect propagates without a session (with `requireUser` and the queries mocked) |
| `src/features/catalog/pagination.test.ts` (pure helper `pageLinks(total, page, pageSize)`) | first/last pages, window around the current page, single page → no pagination |
| `src/app/me/page.test.ts` | moved from home: greeting, account, `RecentFeedback({ userId })`, no secret fields, redirect |
| `src/features/me/me.utils.test.ts` | moved from home utils |

## 5. E2E (Playwright, products seeded through `seedProducts`)
- `e2e/home.spec.ts` (rewritten):
  - lists "Biggest discounts", "Top rated" and the seeded categories are visible
  - search "smart tv" shows only matching cards and the count; clearing returns to the lists
  - "See all" opens the category grid; pagination works
  - a product title link has the Amazon URL, `target="_blank"` and `rel` with `noopener`
  - "Give feedback" goes to `/products/<id>/feedback`
  - anonymous → `/auth/sign-in`
  - 390×844: no page-level horizontal scroll (rows scroll inside themselves)
- `e2e/me.spec.ts`: greeting, account, recent feedback; "Write feedback" → `/home` with the search focused; header nav marks the current page; sign out

## 6. Files owned
`src/app/home/**`, `src/app/me/**`, `src/features/home/**` (removed), `src/features/me/**`, `src/features/catalog/**`, `src/components/app-header.tsx`, `src/components/app-nav.tsx`, `e2e/home.spec.ts`, `e2e/me.spec.ts`
