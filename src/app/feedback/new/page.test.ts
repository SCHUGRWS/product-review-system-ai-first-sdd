import { describe, expect, it } from "vitest";

const { default: NewFeedbackPage } = await import("./page");

describe("/feedback/new", () => {
  it("redirects to the catalog at /home", () => {
    let error: unknown;
    try {
      NewFeedbackPage();
    } catch (e) {
      error = e;
    }
    expect((error as { digest?: string }).digest).toMatch(
      /^NEXT_REDIRECT;[a-z]+;\/home;/,
    );
  });
});
