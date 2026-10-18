# Implementation plan: Feedback (updated)

Spec: [`specs/feedback.md`](../../specs/feedback.md)

Prerequisite: Phase 0 of [`execution.md`](execution.md) is done (`Product` type, `getProductById` signature, `formatPrice`, `productFeedbackHref`). `getProductById` is a stub until the product agent finishes; mock it in tests.

## 1. Database
- `supabase/migrations/20261018110000_feedbacks_product.sql`
  - `alter table feedbacks add column product_id text references products (id) on delete restrict`
  - drop the 2..120 length check on `product_name` (Amazon titles are longer), keep `not null` (it holds the title snapshot); new check `char_length(product_name) between 1 and 500`
  - `create unique index feedbacks_account_product_key on feedbacks (account_id, product_id) where product_id is not null`
  - index `feedbacks_product_idx on (product_id)`

## 2. Server
- `src/features/feedback/feedback.schema.ts`:
  - `createFeedbackSchema` = `{ productId: string (nanoid shape), rating, comment }`
  - unknown keys (`accountId`, `productName`) are stripped
  - drop the product name constants
- `src/server/feedback/queries.ts`:
  - `insertFeedback(accountId, product, data)` stores `product_id` + `product_name` = `product.title`; a unique violation (`23505`) throws `FeedbackAlreadyExistsError`
  - `listFeedbackByAccount` joins `products(id, title, image_url, url)`
  - `hasFeedbackForProduct(accountId, productId)`
  - `Feedback` type gains `product: { id, title, imageUrl, url } | null` and `productName`
- `src/server/routers/feedback.ts`:
  - `create`: `getProductById` → NOT_FOUND "Product not found"; already exists → CONFLICT "You already reviewed this product"; then insert
  - `listMine` returns the product
  - `hasReviewed({ productId })` query
- `src/app/api/v1/feedback/route.ts`: 201 body as in the spec; 404 and 409 come from the shared error mapping

## 3. Frontend
- `src/app/products/[productId]/feedback/page.tsx`:
  - `<Suspense>` → `requireUser()` + `getProductById()`
  - `notFound()` when missing; `src/app/products/[productId]/feedback/not-found.tsx` with a link to `/home`
  - already reviewed → message + link to `/me`
  - otherwise `FeedbackForm`
- `src/features/feedback/feedback-form.tsx`:
  - the product name field is removed
  - a product header (image, title linking to Amazon, `formatPrice`)
  - the slip preview prints `product.title` (clamped) with the image thumbnail
  - hidden `productId` in the submitted data
  - success → invalidate `feedback.listMine`, toast, `router.push("/me")`
  - CONFLICT → message on the form + toast
- `src/app/feedback/new/page.tsx` → `redirect("/home")` (no form there anymore)
- `src/features/feedback/recent-feedback.tsx`: each item shows the product thumbnail and title (link to Amazon) or the saved name for old rows; the empty state links to `/home` ("Find a product to review")
- Remove what is no longer used (old product name field logic)

## 4. Tests (Vitest)
| File | Cases |
|---|---|
| `src/features/feedback/feedback.schema.test.ts` (rewritten) | valid `{ productId, rating, comment }`; missing / malformed productId; rating 0, 6, 3.5; comment < 10 / > 2000 after trim; `accountId` and `productName` stripped |
| `src/server/feedback/queries.test.ts` | insert stores `product_id` and the title snapshot; 23505 → `FeedbackAlreadyExistsError`; list maps the joined product and `null` for legacy rows; `hasFeedbackForProduct` |
| `src/server/routers/feedback.test.ts` | create: unknown product → NOT_FOUND without insert; duplicate → CONFLICT; success uses `ctx.user.id` and the server-side title (ignores client `productName`); UNAUTHORIZED; BAD_REQUEST; DB error → 500; `listMine` with product; `hasReviewed` |
| `src/app/api/v1/feedback/route.test.ts` | 201 body shape; 400; 401; 404; 409; 500 |
| `src/app/products/[productId]/feedback/page.test.ts` | unknown product → `notFound()`; already reviewed → no form, link to `/me`; otherwise renders the form with the product; redirect without a session |

## 5. E2E (Playwright, products seeded through `seedProducts`)
- `e2e/feedback.spec.ts` (rewritten):
  - from `/home`, "Give feedback" on a seeded product → `/products/<id>/feedback` shows its title and price
  - the slip preview shows the product title, stars and the user's name while typing
  - submit → toast, lands on `/me`, the review is first with the product title and image
  - opening the same product's feedback page again shows "You already reviewed this product"
  - `/products/unknown/feedback` → 404 page with a link to `/home`
  - `/feedback/new` → `/home`
  - empty submit shows field errors; markup in the comment is shown as text

## 6. Files owned
`supabase/migrations/20261018110000_feedbacks_product.sql`, `src/features/feedback/**`, `src/server/feedback/**`, `src/server/routers/feedback.ts`, `src/server/routers/feedback.test.ts`, `src/app/products/**`, `src/app/feedback/**`, `src/app/api/v1/feedback/**`, `e2e/feedback.spec.ts`
