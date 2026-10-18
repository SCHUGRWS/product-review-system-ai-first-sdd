import { test as base } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

// 1x1 transparent PNG
const PLACEHOLDER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

// Every spec imports `test` from here (not from @playwright/test). Product images load straight from
// Amazon's CDN in the browser (specs/product.md); in E2E they are answered
// locally, so the "load" event (page.goto, page.reload) never waits on the
// network outside this machine. Card and hero images have fixed width and
// height, so the layout is the same with the placeholder.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route("https://m.media-amazon.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/png",
        body: PLACEHOLDER,
      }),
    );
    await use(context);
  },
});
