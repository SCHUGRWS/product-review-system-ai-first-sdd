# Implementation plan: Feedback

Spec: [`specs/feedback.md`](../../specs/feedback.md)

Prerequisite: Phase 0 of `plans/01-sign-in-home-feedback/execution.md` is done (`protectedProcedure`, `feedback` router registered, `RecentFeedback` placeholder, `requireUser()` stub).

## 1. Database
- `supabase/migrations/20261017130000_create_feedbacks.sql`
  - table `public.feedbacks` as in requirement 3, with `check (rating between 1 and 5)` and length checks matching the schema
  - index `feedbacks_account_created_idx on (account_id, created_at desc)`
  - RLS enabled, no policies

## 2. Server
- `src/features/feedback/feedback.schema.ts`: `createFeedbackSchema`, `listFeedbackSchema`, types
- `src/server/feedback/queries.ts` (`server-only`): `insertFeedback(accountId, data)`, `listFeedbackByAccount(accountId, limit)`; map snake_case rows to `{ id, productName, rating, comment, createdAt }`
- `src/server/routers/feedback.ts` (replace Phase 0 placeholder): `create` and `listMine` on `protectedProcedure`, using `ctx.user.id`; DB error → log + INTERNAL_SERVER_ERROR
- `src/app/api/v1/feedback/route.ts`: same structure as sign-up route, context built from the request cookies; 401 when not signed in

## 3. Frontend
- `src/components/ui/textarea.tsx` (shadcn textarea, styled like `Input`)
- `src/features/feedback/star-rating-input.tsx`: radio group of 5 stars (reuses the star path from `ReviewSlip`), arrow-key support, `aria-invalid`
- `src/features/feedback/feedback-form.tsx` (client): react-hook-form + zodResolver; `useMutation(trpc.feedback.create.mutationOptions)`; field errors from `zodError`; success → invalidate `feedback.listMine`, toast, `router.push("/home")`, reset form on hide (same Activity pattern as sign-up)
- Live preview: `ReviewSlip` fed by `useWatch` (product, rating, comment, `author` passed from the server)
- `src/app/feedback/new/page.tsx`: `SplitLayout` with the form on paper and the live slip on the cobalt panel; `<Suspense>` + `requireUser()` to get the author's short name
- `src/features/feedback/recent-feedback.tsx` (replace placeholder, keep signature `RecentFeedback({ userId }: { userId: string })`): server component, latest 5 as compact review slips (product, stars, comment clamp, relative date with date-fns); empty state "No feedback yet" with a link to `/feedback/new`

## 4. Tests (Vitest)
| File | Cases |
|---|---|
| `src/features/feedback/feedback.schema.test.ts` | accepts valid data and trims; product name < 2 or > 120; rating 0, 6, 3.5 and string; comment < 10 or > 2000 (after trim); missing fields; extra `accountId` is stripped |
| `src/server/routers/feedback.test.ts` | create inserts with `ctx.user.id` (ignores client `accountId`), nanoid id, returns camelCase; no user → UNAUTHORIZED without DB access; invalid input → BAD_REQUEST without DB access; DB error → INTERNAL_SERVER_ERROR and logged; listMine filters by the current user, orders newest first, applies default 10 and max 50 |
| `src/server/feedback/queries.test.ts` | row mapping snake_case → camelCase; query uses `account_id` filter, `created_at desc`, limit |
| `src/app/api/v1/feedback/route.test.ts` | 201; 400 invalid JSON / invalid fields with `fields`; 401 without cookie; 500 |

## 5. E2E (Playwright, `e2e/feedback.spec.ts`)
- anonymous visit to `/feedback/new` → `/auth/sign-in`
- signed-in user fills the form; the slip preview shows product, stars and their name while typing
- submit → toast, lands on `/home`, the new feedback is first in "Your recent feedback"
- empty submit shows the three field errors; rating can be chosen with the keyboard
- comment with `<script>` text is shown literally

## 6. Files owned by this feature
`supabase/migrations/20261017130000_create_feedbacks.sql`, `src/features/feedback/**`, `src/server/feedback/**`, `src/server/routers/feedback.ts`, `src/server/routers/feedback.test.ts`, `src/app/feedback/**`, `src/app/api/v1/feedback/**`, `src/components/ui/textarea.tsx`, `e2e/feedback.spec.ts`
