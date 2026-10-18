import { expect, test } from "./base";
import {
  createAccount,
  findProductCard,
  importOwnProduct,
  path,
} from "./helpers";

// Translation (specs/i18n.md): locale in the URL, browser language for
// visitors, the account's language for signed-in users.

test.describe("a visitor whose browser prefers Portuguese", () => {
  test.use({ locale: "pt-BR" });

  test("/ redirects to /pt-BR and the landing page is in Portuguese", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(path("/", "pt-BR"));
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Avaliações de quem realmente comprou.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Criar uma conta" }),
    ).toHaveAttribute("href", path("/auth/sign-up", "pt-BR"));
  });

  test("old links keep their query string and land in Portuguese", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in?from=old-link");
    await expect(page).toHaveURL(path("/auth/sign-in?from=old-link", "pt-BR"));
    await expect(
      page.getByRole("heading", { name: "Que bom ver você de novo" }),
    ).toBeVisible();
  });
});

test("English is the default and pages without a route get a localized 404", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(path("/"));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.goto(path("/no-such-page", "pt-BR"));
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
  await page.goto("/no-such-page");
  await expect(page).toHaveURL(path("/no-such-page"));
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("the profile language switch follows the account across sign-ins", async ({
  page,
  context,
  request,
}) => {
  const account = await createAccount(request);
  const own = await importOwnProduct(request, "Chaleira i18n");

  // Sign in (English) and post one review, so /me lists it with its date
  await page.goto(path("/auth/sign-in"));
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(path("/home"));
  const card = await findProductCard(page, {
    query: own.word,
    title: own.title,
  });
  const feedbackHref = await card
    .getByRole("link", { name: "Give feedback" })
    .getAttribute("href");
  const productId = feedbackHref?.split("/")[3];
  const posted = await page.request.post("/api/v1/feedback", {
    data: { productId, rating: 4, comment: "Ferve rápido e não pinga." },
  });
  expect(posted.status()).toBe(201);

  // Switch to Português on /me: the same page reloads in Portuguese
  await page.goto(path("/me"));
  await page.getByLabel("Language").selectOption("pt-BR");
  await expect(page).toHaveURL(path("/me", "pt-BR"));
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(
    page.getByRole("heading", { name: "Suas avaliações recentes" }),
  ).toBeVisible();
  await expect(page.getByLabel("Idioma")).toHaveValue("pt-BR");
  // Dates in Portuguese; the product title and the review stay as written
  await expect(page.getByText(/^Membro desde \p{L}+ de \d{4}$/u)).toBeVisible();
  const review = page.getByRole("article", { name: own.title });
  await expect(review).toContainText(/Publicada (agora mesmo|há \d+ minutos?)/);
  await expect(review).toContainText("Ferve rápido e não pinga.");

  // URLs without a locale now open in Portuguese, lists included
  await page.goto("/home");
  await expect(page).toHaveURL(path("/home", "pt-BR"));
  await expect(
    page.getByRole("heading", { level: 2, name: "Maiores descontos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Produtos", exact: true }),
  ).toHaveAttribute("href", path("/home", "pt-BR"));

  // Sign out, forget this device's cookies, sign in from the English page:
  // the account's language wins
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(path("/auth/sign-in", "pt-BR"));
  await context.clearCookies();
  await page.goto(path("/auth/sign-in"));
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(path("/home", "pt-BR"));
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

  // And back to English
  await page.goto(path("/me", "pt-BR"));
  await page.getByLabel("Idioma").selectOption("en");
  await expect(page).toHaveURL(path("/me"));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Your recent feedback" }),
  ).toBeVisible();
  await expect(page.getByRole("article", { name: own.title })).toContainText(
    "Posted just now",
  );
  await page.goto("/home");
  await expect(page).toHaveURL(path("/home"));
});
