# Execution plan: sign-in, home, feedback

Three specs are built at the same time by three sub-agents in the same working tree:
| Spec | Plan |
|---|---|
| [`specs/sign-in.md`](../../specs/sign-in.md) | [`plans/01-sign-in-home-feedback/sign-in.md`](sign-in.md) |
| [`specs/home.md`](../../specs/home.md) | [`plans/01-sign-in-home-feedback/home.md`](home.md) |
| [`specs/feedback.md`](../../specs/feedback.md) | [`plans/01-sign-in-home-feedback/feedback.md`](feedback.md) |

`home` and `feedback` depend on the session from `sign-in`, and `home` renders a component from `feedback`. To run them in parallel, the orchestrator first writes the shared contract (Phase 0): types, signatures and placeholders. Each agent then fills in only the files it owns.

## Phase 0: shared contract (orchestrator, before the agents start)

### Session types and signatures (bodies are stubs, implemented by sign-in)
```ts
// src/server/auth/types.ts
export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
};
export const SESSION_COOKIE = "prs_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// src/server/auth/session.ts
export function generateSessionToken(): string;
export function hashSessionToken(token: string): string;
export async function createSession(accountId: string): Promise<{ token: string; expiresAt: Date }>;
export async function getSessionUser(token: string): Promise<SessionUser | null>;
export async function deleteSession(token: string): Promise<void>;

// src/server/auth/cookie.ts
export function serializeSessionCookie(token: string, expiresAt: Date): string;
export function serializeClearedSessionCookie(): string;
export function readSessionToken(cookieHeader: string | null): string | null;

// src/server/auth/current-user.ts (Server Components only)
export async function getCurrentUser(): Promise<SessionUser | null>;
export async function requireUser(): Promise<SessionUser>; // redirect("/auth/sign-in") when null
```

### tRPC context and procedures
- `src/server/context.ts`: `createContext({ req, resHeaders })` → `{ user: SessionUser | null; sessionToken: string | null; resHeaders: Headers }` (reads the cookie, calls `getSessionUser`)
- `src/server/trpc.ts`: `initTRPC.context<Context>()`, add `protectedProcedure` (UNAUTHORIZED "Sign in to continue" when `ctx.user` is null; narrows `ctx.user` to non-null)
- `src/app/api/trpc/[trpc]/route.ts`: pass `createContext`
- `src/server/routers/auth.ts`: add a `signOut` stub with its final output type (`{ ok: true }`), so `home` can call `trpc.auth.signOut`; `signIn` is added by the sign-in agent
- `src/server/routers/feedback.ts`: empty `feedbackRouter` registered in `_app.ts`; the feedback agent adds `create` / `listMine` (no other feature calls them)
- `src/server/routers/auth.test.ts` and `src/app/api/v1/sign-up/route.ts`: updated to the new context shape (`createCaller({ user: null, sessionToken: null, resHeaders: new Headers() })`)
- `src/server/test-utils.ts`: `makeContext({ user? })` helper for router tests

### Placeholder used by home
- `src/features/feedback/recent-feedback.tsx`: `export async function RecentFeedback({ userId }: { userId: string })` returning an empty state

### E2E setup
- dev dependency `@playwright/test` (1.56.1, matching the Chromium already installed), `playwright.config.ts` (web server `pnpm build && pnpm start`, base URL `http://localhost:3000`, Chromium)
- `e2e/helpers.ts`: `createAccount()` (unique email, `POST /api/v1/sign-up`), `signIn(page, account)`
- scripts: `test:e2e` → `playwright test`
- `vitest.config.mts` keeps `src/**/*.test.ts`, so Vitest and Playwright do not pick each other's files

Phase 0 ends with `pnpm lint`, `pnpm typecheck` and `pnpm test` green.

## Phase 1: parallel implementation (3 sub-agents)

| Agent | Spec | Owns |
|---|---|---|
| sign-in | `specs/sign-in.md` + `plans/01-sign-in-home-feedback/sign-in.md` | "Files owned" in the plan |
| home | `specs/home.md` + `plans/01-sign-in-home-feedback/home.md` | "Files owned" in the plan |
| feedback | `specs/feedback.md` + `plans/01-sign-in-home-feedback/feedback.md` | "Files owned" in the plan |

Rules for every agent:
- Read `AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before writing code (Next.js 16, Cache Components)
- Edit only owned files. A needed change in a contract file is reported to the orchestrator, not made directly
- Follow the existing code style (Biome, comment density, `sign-up` patterns); UI follows the approved "review slip" direction
- Unit tests for everything in the spec's test table; mock the database and other features' modules
- Before finishing: `pnpm lint`, `pnpm typecheck`, `pnpm vitest run <own test files>` green. Errors in files owned by another agent are reported, not fixed
- Do not run `pnpm dev`, `next build`, Playwright or database commands (shared port and `.next` folder). Write E2E specs; the orchestrator runs them
- No git commits

## Phase 2: integration and verification (orchestrator)
1. Review each agent's diff against its spec and acceptance criteria
2. Apply migrations to the local database without wiping data: `supabase migration up`
3. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
4. `pnpm test:e2e` (all three E2E files)
5. Fix anything red (send back to the agent or fix directly); nothing is reported as done with a failing check
6. Update the documentation: `README.md` (implemented features, REST API tables with 201 for sign-up and feedback, `test:e2e`, sessions), `docs/ARCHITECTURE.md` (sessions, Playwright), and each spec's "Results" if the delivery differs from the spec

## Approved decisions (2026-10-17)
1. **Session**: own `sessions` table + opaque random token in an `HttpOnly` cookie (revocable on sign-out, no new dependency)
2. **Feedback = product review** written by the signed-in user (product name, 1–5 stars, comment)
3. **Home at `/home`**, the landing `/` stays public
4. **201 Created** for feedback creation and for sign-up (sign-up changes from 200; done by the sign-in agent, who already refactors that route)
5. **Playwright** added as a dev dependency for E2E tests
6. Specs live in `specs/`, plans in `plans/`

## Execution log (2026-10-17)
All three agents delivered their specs. Final state: `pnpm lint`, `pnpm typecheck`, `pnpm build` green; Vitest 18 files / 109 tests; Playwright 14/14.

Changes made during integration (Phase 2):
- **`server-only` in Vitest**: aliased to an empty module in `vitest.config.mts` (`src/test/server-only.ts`) instead of a `vi.mock` in every test file. It fixed `src/app/home/page.test.ts`, which broke once the real `RecentFeedback` imported the database module
- **Context keeps the raw session token** even when the session is invalid, so sign-out also deletes expired rows (`src/server/context.test.ts`)
- **`connection()` before the session lookup** in `getCurrentUser()`: the expiry check uses the current time, which Cache Components rejects during a runtime prerender (`/home` and `/feedback/new` logged "unstable value `new Date()`"). Covered by `src/server/auth/current-user.test.ts`
- **E2E against a production build** instead of `pnpm dev`: on the dev server, the on-demand compile of `/home` under 14 parallel tests exceeded the 5 s navigation timeout
- **Duplicates removed**: `shortName`/`fullName` moved to `src/lib/user-name.ts` (home and feedback each had one); the feedback REST route uses the shared `src/app/api/v1/_lib/to-response.ts`; `STAR_PATH` is exported from `review-slip.tsx` instead of copied
- **Visual fixes**: spacing under "Your recent feedback"; no double period after "posted as Ada L."

Deviations accepted from the agents:
- home: `HomeContent` lives in `src/features/home/home-content.tsx` (Next page files reject extra exports); `AppHeader` receives only `{ firstName, lastName }`
- feedback: `src/features/feedback/feedback.utils.ts` (`postedAgo`) and a shared test stub `src/server/feedback/fake-db.ts`; empty-state link reads "Post your first feedback" to avoid two links named "Write feedback" on `/home`
- sign-in: `getCurrentUser()` does not use `'use cache: private'` (the check is time-dependent)

Local E2E note: this WSL machine lacks Chromium's system libraries (`libnspr4`, `libnss3`, `libasound2`). Install them with `sudo pnpm exec playwright install-deps chromium`, or point `LD_LIBRARY_PATH` at extracted copies.

