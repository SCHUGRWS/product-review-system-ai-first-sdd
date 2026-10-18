# Implementation plan: Home

Spec: [`specs/home.md`](../../specs/home.md)

Prerequisite: Phase 0 of `plans/01-sign-in-home-feedback/execution.md` is done. Until the sign-in agent finishes, `requireUser()` and `auth.signOut` are stubs; this feature codes against their fixed signatures and mocks them in tests.

## 1. Display helpers
- `src/features/home/home.utils.ts`
  - `shortName(user)` → "Ada L."
  - `greeting(user)` → "Welcome back, Ada"
  - `memberSince(createdAt)` → "Member since October 2026" (date-fns `format`, UTC-safe)

## 2. Shared header
- `src/components/app-header.tsx` (server component): product name → `/home`, `shortName(user)`, `<SignOutButton />`
- `src/features/home/sign-out-button.tsx` (client): `useMutation(trpc.auth.signOut.mutationOptions)`; on success `router.replace("/auth/sign-in")` + `router.refresh()`; on error toast; spinner while pending

## 3. Page
- `src/app/home/page.tsx`: metadata "Home | Product Review System"; static shell (layout, headings that do not depend on the user, skeletons); session-dependent parts inside `<Suspense>`:
  - `<HomeContent />` (server): `const user = await requireUser()` → header, greeting, CTA, account summary
  - inside it, `<Suspense fallback={<RecentFeedbackSkeleton />}><RecentFeedback userId={user.id} /></Suspense>`
- `src/features/home/*`: page sections (`account-summary.tsx`, `recent-feedback-skeleton.tsx`)
- Design via the repo's `frontend-design` skill + the approved "review slip" direction; reuse tokens from `globals.css`, no new fonts or accent colors

## 4. Tests (Vitest)
| File | Cases |
|---|---|
| `src/features/home/home.utils.test.ts` | `shortName` with normal, accented and single-letter last names; trims spaces; `greeting` uses the first name; `memberSince` formats month/year and does not shift month at UTC boundaries (e.g. `2026-10-01T00:30:00Z`) |
| `src/app/home/page.test.ts` | with `requireUser` mocked to throw Next's redirect, `HomeContent` propagates the redirect to `/auth/sign-in`; with a mocked user, the returned tree contains the greeting and the email, and never the password/salt fields (the `SessionUser` type has none) |

## 5. E2E (Playwright, `e2e/home.spec.ts`)
- signed-in user sees greeting, full name, email, member since, and the recent feedback area
- "Write feedback" navigates to `/feedback/new`
- "Sign out" → `/auth/sign-in`; visiting `/home` again redirects to `/auth/sign-in`
- anonymous visit to `/home` redirects to `/auth/sign-in`
- mobile viewport (390×844): no horizontal scroll

## 6. Files owned by this feature
`src/app/home/**`, `src/features/home/**`, `src/components/app-header.tsx`, `e2e/home.spec.ts`
