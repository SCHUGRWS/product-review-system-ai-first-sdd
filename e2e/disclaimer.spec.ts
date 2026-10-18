import { expect, type Page, test } from "./base";
import { createAccount, signIn } from "./helpers";

// Study-project disclaimer (specs/home.md): the full notice on the landing
// page, the short footer on every other page, both with the GitHub link.
const ISSUES =
  "https://github.com/SCHUGRWS/product-review-system-ai-first-sdd/issues";
const FOOTER =
  /Study project, non-profit\. Your data is not used for anything else and you will never get emails\./;

async function expectGitHubLink(scope: ReturnType<Page["locator"]>) {
  const link = scope.getByRole("link", { name: /Contact on GitHub/ });
  await expect(link).toHaveAttribute("href", ISSUES);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
}

async function expectFooter(page: Page) {
  const footer = page.getByRole("contentinfo");
  await expect(footer).toHaveCount(1);
  await expect(footer).toContainText(FOOTER);
  await expectGitHubLink(footer);
}

test("the landing page shows the study notice instead of the footer", async ({
  page,
}) => {
  await page.goto("/en");
  const notice = page.getByRole("region", { name: "A study project" });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText(/never receive emails/);
  await expectGitHubLink(notice);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

for (const path of ["/en/auth/sign-in", "/en/auth/sign-up"]) {
  test(`${path} ends with the disclaimer footer`, async ({ page }) => {
    await page.goto(path);
    await expectFooter(page);
  });
}

test("signed-in pages end with the disclaimer footer", async ({
  page,
  request,
}) => {
  await signIn(page, await createAccount(request));
  await page.goto("/en/home");
  await expectFooter(page);
  await page.goto("/en/me");
  await expectFooter(page);
});

test("the product 404 page ends with the disclaimer footer", async ({
  page,
  request,
}) => {
  await signIn(page, await createAccount(request));
  await page.goto("/en/products/00000000-0000-0000-0000-000000000000/feedback");
  await expect(
    page.getByRole("heading", { name: "Product not found" }),
  ).toBeVisible();
  await expectFooter(page);
});
