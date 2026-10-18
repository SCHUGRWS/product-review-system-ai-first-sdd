import { vi } from "vitest";

type Result = {
  data: unknown;
  error: unknown;
  count?: number | null;
};

// Minimal stand-in for the Supabase client used by the product tests. Every
// builder method is a spy that returns the builder; awaiting the builder (or
// calling `.maybeSingle()`) resolves to the next queued result, or to the
// default one. `rpc` resolves the same way.
export function createFakeDb() {
  let fallback: Result = { data: null, error: null, count: null };
  let queue: Result[] = [];
  const next = () => Promise.resolve(queue.shift() ?? fallback);

  type Builder = typeof builder;
  const chain = () => vi.fn((..._args: unknown[]): Builder => builder);
  const builder = {
    select: chain(),
    upsert: chain(),
    eq: chain(),
    gt: chain(),
    gte: chain(),
    textSearch: chain(),
    order: chain(),
    range: chain(),
    limit: chain(),
    maybeSingle: vi.fn(() => next()),
    // biome-ignore lint/suspicious/noThenProperty: mimics the thenable query builder
    then: (
      resolve: (value: Result) => unknown,
      reject?: (e: unknown) => void,
    ) => next().then(resolve, reject),
  };
  const from = vi.fn((_table: string) => builder);
  const rpc = vi.fn((_fn: string, _args?: unknown) => next());

  return {
    client: { from, rpc },
    from,
    rpc,
    builder,
    /** Result for every call until reset */
    resolveWith(result: Result) {
      fallback = result;
    },
    /** Results for the next calls, in order */
    queue(...results: Result[]) {
      queue.push(...results);
    },
    reset() {
      fallback = { data: null, error: null, count: null };
      queue = [];
      from.mockClear();
      rpc.mockClear();
      for (const fn of Object.values(builder)) {
        if (vi.isMockFunction(fn)) fn.mockClear();
      }
    },
  };
}
