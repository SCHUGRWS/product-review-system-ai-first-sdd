import { vi } from "vitest";

// Minimal stand-in for the Supabase query builder used by the feedback tests.
// Every builder method is a spy that returns the builder; awaiting the builder
// (or calling `.single()`) resolves to `result`.
export function createFakeDb() {
  let result: { data: unknown; error: unknown } = { data: null, error: null };
  type Builder = typeof builder;
  const chain = () => vi.fn((..._args: unknown[]): Builder => builder);
  const builder = {
    insert: chain(),
    select: chain(),
    eq: chain(),
    order: chain(),
    limit: chain(),
    single: vi.fn(() => Promise.resolve(result)),
    // biome-ignore lint/suspicious/noThenProperty: mimics the thenable query builder
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  const from = vi.fn(() => builder);
  return {
    from,
    builder,
    resolveWith(next: { data: unknown; error: unknown }) {
      result = next;
    },
    reset() {
      result = { data: null, error: null };
      from.mockClear();
      for (const fn of Object.values(builder)) {
        if (vi.isMockFunction(fn)) fn.mockClear();
      }
    },
  };
}
