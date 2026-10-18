import "server-only";
import { after } from "next/server";

// Work that runs after the response is sent (Next's after(); on Vercel the
// function stays alive for it up to the route's maxDuration). Kept in its own
// module so tests can mock it: after() only works inside a Next.js request.
// The task's errors are logged, never thrown back.
export function runInBackground(label: string, task: () => Promise<unknown>) {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error(`[background] ${label} failed`, error);
    }
  });
}
