import { describe, expect, it } from "vitest";

const { default: NewFeedbackPage } = await import("./page");

describe("/feedback/new", () => {
  it("redirects to the catalog at /<locale>/home", async () => {
    const error = await NewFeedbackPage().catch((e: unknown) => e);
    expect((error as { digest?: string }).digest).toMatch(
      /^NEXT_REDIRECT;[a-z]+;\/en\/home;/,
    );
  });
});
