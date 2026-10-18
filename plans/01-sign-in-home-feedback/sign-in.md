# Implementation plan: Sign-In

Spec: [`specs/sign-in.md`](../../specs/sign-in.md)

Prerequisite: Phase 0 of `plans/01-sign-in-home-feedback/execution.md` is done (context, `protectedProcedure`, session contract stubs).

## 1. Database
- `supabase/migrations/20261017120000_create_sessions.sql`
  - table `public.sessions` as in requirement 3
  - index on `account_id`
  - RLS enabled, no policies (same rule as `accounts`)

## 2. Server
- `src/features/auth/sign-in.schema.ts`: `signInSchema` (email normalized like sign-up; password required, max 72 bytes), `SignInInput`/`SignInData` types
- `src/server/auth/session.ts` (replace Phase 0 stubs, keep signatures):
  - `generateSessionToken()`: 32 random bytes, base64url
  - `hashSessionToken(token)`: SHA-256 hex
  - `createSession(accountId)` → `{ token, expiresAt }`
  - `getSessionUser(token)` → `SessionUser | null` (one query joining `sessions` + `accounts`, filters expired and inactive)
  - `deleteSession(token)`
- `src/server/auth/cookie.ts` (replace stubs): `serializeSessionCookie(token, expiresAt)`, `serializeClearedSessionCookie()`, `readSessionToken(cookieHeader)`
- `src/server/auth/current-user.ts` (replace stubs): `getCurrentUser()` reads `cookies()` from `next/headers`; `requireUser()` redirects to `/auth/sign-in` when there is no user
- `src/server/routers/auth.ts`: add `signIn` and `signOut` procedures
  - `signIn`: select account by email → bcrypt compare (dummy hash when missing) → reject inactive → `createSession` → `ctx.resHeaders.append("Set-Cookie", ...)` → return `{ id, firstName, lastName, email }`
  - `signOut`: if `ctx.sessionToken`, `deleteSession`; always append the cleared cookie
- `src/app/api/v1/sign-in/route.ts` and `src/app/api/v1/sign-out/route.ts`: same structure as the sign-up route; build the context with `createContext({ req, resHeaders })` and copy `Set-Cookie` to the `Response`. Extract the shared TRPCError → Response mapping from the sign-up route into `src/app/api/v1/_lib/to-response.ts` and use it in sign-up too. Change the sign-up success status from 200 to 201 (`specs/sign-up.md`)

## 3. Frontend
- `src/app/auth/sign-in/page.tsx`: metadata, `<SignInForm />`, and a `<Suspense>`-wrapped `<RedirectIfSignedIn />` (server component: `getCurrentUser()` → `redirect("/home")`)
- `src/features/auth/sign-in-form.tsx`: same patterns as `sign-up-form.tsx` (zodResolver, `useMutation(trpc.auth.signIn.mutationOptions)`, field errors from `zodError`, 401 → root/form error + toast). On success `router.replace("/home")` and `router.refresh()`
- Panel: a `ReviewSlip` with a "Welcome back" tone (no new components, one motion moment)
- Links: "No account yet? Create one" on sign-in; "Already have an account? Sign in" on sign-up; "Sign in" next to "Create an account" on `/`; sign-up success CTA becomes "Sign in"

## 4. Tests (Vitest, `src/**/*.test.ts`)
| File | Cases |
|---|---|
| `src/features/auth/sign-in.schema.test.ts` | normalizes email; requires email/password; rejects invalid email; rejects password > 72 bytes |
| `src/server/auth/session.test.ts` | token is 43 chars base64url and random; hash is deterministic SHA-256 and differs from the token; `createSession` stores the hash (not the token) with `expires_at` ≈ now + 7 days; `getSessionUser` returns null for missing/expired/inactive and maps the row to `SessionUser` |
| `src/server/auth/cookie.test.ts` | cookie has `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`; `Secure` only when `NODE_ENV=production`; cleared cookie has `Max-Age=0`; `readSessionToken` parses multi-cookie headers and returns null when absent |
| `src/server/routers/auth.test.ts` (extend) | signIn success: returns user, creates session, appends `Set-Cookie`; wrong password → UNAUTHORIZED; unknown email → UNAUTHORIZED and bcrypt still runs; inactive → UNAUTHORIZED with the same message; DB error → INTERNAL_SERVER_ERROR; invalid input → BAD_REQUEST without DB access; signOut deletes the session and clears the cookie; signOut without session still succeeds |
| `src/app/api/v1/sign-in/route.test.ts` | 200 with `Set-Cookie`; 400 for invalid JSON and invalid fields (`fields` present); 401; 500 |
| `src/app/api/v1/sign-up/route.test.ts` | 201 with `{ id, email }`; 400; 409; 500 |
| `src/app/api/v1/sign-out/route.test.ts` | 200 and cleared cookie, with and without a session |

Database is mocked like the existing `auth.test.ts`. The `vitest.config.mts` include pattern already covers these paths.

## 5. E2E (Playwright, `e2e/sign-in.spec.ts`)
- create an account through `POST /api/v1/sign-up`, sign in through the UI → lands on `/home`, `prs_session` cookie is `HttpOnly`
- wrong password → "Invalid email or password" visible, still on `/auth/sign-in`
- signed in user visiting `/auth/sign-in` → redirected to `/home`
- empty submit shows client-side field errors and sends no request

## 6. Files owned by this feature
`supabase/migrations/20261017120000_create_sessions.sql`, `src/features/auth/sign-in*`, `src/server/auth/*` (bodies only, signatures are fixed by Phase 0), `src/server/routers/auth.ts`, `src/server/routers/auth.test.ts`, `src/app/api/v1/sign-in/**`, `src/app/api/v1/sign-out/**`, `src/app/api/v1/_lib/**`, `src/app/api/v1/sign-up/**` (refactor + 201 + route test), `src/app/auth/**`, `src/features/auth/sign-up-form.tsx` (link only), `src/app/page.tsx` (link only), `e2e/sign-in.spec.ts`
