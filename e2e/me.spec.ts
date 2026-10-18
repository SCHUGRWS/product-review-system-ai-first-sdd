import { format } from "date-fns";
import { expect, test } from "./base";
import { createAccount, signIn } from "./helpers";

// Same rule as memberSince(): month and year of the creation date in UTC.
function expectedMemberSince() {
  const now = new Date();
  const month = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  return `Member since ${format(month, "MMMM yyyy")}`;
}

test.describe("/me", () => {
  test("shows the greeting, account and recent feedback", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request, {
      firstName: "Ada",
      lastName: "Lovelace",
    });
    await signIn(page, account);
    await page.goto("/en/me");

    await expect(page).toHaveTitle("My page | Product Review System");
    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome back, Ada" }),
    ).toBeVisible();

    const header = page.getByRole("banner");
    await expect(header.getByText("Ada L.", { exact: true })).toBeVisible();
    await expect(
      header.getByRole("link", { name: "Product Review System" }),
    ).toHaveAttribute("href", "/en/home");

    const accountSection = page.getByRole("region", { name: "Your account" });
    await expect(accountSection.getByText("Ada Lovelace")).toBeVisible();
    await expect(accountSection.getByText(account.email)).toBeVisible();
    await expect(accountSection.getByText(expectedMemberSince())).toBeVisible();

    await expect(
      page.getByRole("heading", { level: 2, name: "Your recent feedback" }),
    ).toBeVisible();
  });

  test("the header nav marks the current page", async ({ page, request }) => {
    await signIn(page, await createAccount(request));

    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "My page" }).click();
    await expect(page).toHaveURL("/en/me");
    await expect(nav.getByRole("link", { name: "My page" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      nav.getByRole("link", { name: "Products" }),
    ).not.toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL("/en/home");
    await expect(nav.getByRole("link", { name: "Products" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test('"Write feedback" opens the catalog with the search focused', async ({
    page,
    request,
  }) => {
    await signIn(page, await createAccount(request));
    await page.goto("/en/me");

    await page.getByRole("link", { name: "Write feedback" }).click();
    await expect(page).toHaveURL("/en/home?focus=search");
    await expect(page.getByLabel("Search products")).toBeFocused();
  });

  test('"Sign out" ends the session', async ({ page, request }) => {
    await signIn(page, await createAccount(request));
    await page.goto("/en/me");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/en/auth/sign-in");

    await page.goto("/en/me");
    await expect(page).toHaveURL("/en/auth/sign-in");
  });

  test("redirects anonymous visitors to /auth/sign-in", async ({ page }) => {
    await page.goto("/en/me");
    await expect(page).toHaveURL("/en/auth/sign-in");
  });

  test("fits a phone screen without horizontal scroll", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, await createAccount(request));
    await page.goto("/en/me");

    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome back, Ada" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
