import type { SessionUser } from "@/server/auth/types";
import type { Context } from "@/server/context";

export const testUser: SessionUser = {
  id: "acc_test_000000000000",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  createdAt: new Date("2026-10-01T12:00:00Z"),
  locale: "en",
};

// tRPC context for router tests; pass `user: testUser` for a signed-in caller.
export function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    user: null,
    sessionToken: null,
    resHeaders: new Headers(),
    ...overrides,
  };
}
