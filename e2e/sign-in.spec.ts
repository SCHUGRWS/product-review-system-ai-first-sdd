import { expect, test } from "./base";
import { createAccount, signIn } from "./helpers";

test.describe("sign-in", () => {
  test("signs in through the form and sets an HttpOnly session cookie", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request);

    await signIn(page, account);

    const cookies = await page.context().cookies();
    const session = cookies.find((cookie) => cookie.name === "prs_session");
    expect(session).toBeDefined();
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
    expect(session?.path).toBe("/");
  });

  test("shows a generic error for a wrong password", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request);

    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Invalid email or password",
    );
    await expect(page).toHaveURL("/auth/sign-in");
    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "prs_session")).toBe(false);
  });

  test("redirects a signed-in user away from the sign-in page", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request);
    await signIn(page, account);

    await page.goto("/auth/sign-in");

    await expect(page).toHaveURL("/home");
  });

  test("shows field errors on an empty submit without calling the API", async ({
    page,
  }) => {
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/")) apiCalls.push(req.url());
    });

    await page.goto("/auth/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    expect(apiCalls).toEqual([]);
  });

  test("signs out through the REST endpoint and clears the cookie", async ({
    page,
    request,
  }) => {
    const account = await createAccount(request);
    await signIn(page, account);

    const response = await page.request.post("/api/v1/sign-out");
    expect(response.status()).toBe(200);

    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "prs_session")).toBe(false);
    await page.goto("/auth/sign-in");
    await expect(page).toHaveURL("/auth/sign-in");
  });
});
