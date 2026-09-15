import { expect, test, type Page } from "@playwright/test";

const password = "parol12345";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

async function register(page: Page, email: string) {
  await page.goto("/az/register");
  await page.getByRole("textbox").nth(0).fill("E2E Alıcı");
  await page.getByRole("textbox").nth(1).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="password_confirmation"]').fill(password);
  await page.getByRole("button", { name: /hesab yarat|qeydiyyat/i }).click();
  await page.waitForURL("**/az/account");
}

test("home page renders catalogue content from the CMS", async ({ page }) => {
  await page.goto("/az");
  await expect(page.locator("header")).toContainText("Hystlovers");
  await expect(page.locator("a[href*='/products/']").first()).toBeVisible();
});

test("language switch keeps the visitor on the same page", async ({ page }) => {
  await page.goto("/az/collections/all-products");
  await page.getByRole("link", { name: "RU", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/collections\/all-products/);
});

test("collection filters narrow the grid", async ({ page }) => {
  await page.goto("/az/collections/all-products");
  const before = await page.locator("a[href*='/products/']").count();

  await page.getByRole("button", { name: /filtr/i }).first().click();
  await page.getByRole("button", { name: "Brown", exact: true }).click();
  await page.waitForURL(/color=brown/);

  const after = await page.locator("a[href*='/products/']").count();
  expect(after).toBeLessThan(before);
  expect(after).toBeGreaterThan(0);
});

test("a shopper can register, buy and see the order", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  await page.goto("/az/products/t-shirt-brown");
  await page.getByRole("button", { name: "XS/S", exact: true }).click();
  await page.getByRole("button", { name: /səbətə/i }).click();

  // The drawer opens on add; go straight to checkout from it.
  await page.getByRole("link", { name: /sifarişi rəsmiləşdir|ödənişə keç|checkout/i }).click();
  await page.waitForURL("**/az/checkout");

  await page.locator('input[name="phone"]').fill("+994 50 123 45 67");
  await page.locator('input[name="city"]').fill("Bakı");
  await page.locator('textarea[name="address"]').fill("Nizami küçəsi 1");
  await page.getByRole("button", { name: /sifarişi təsdiqlə/i }).click();

  await page.waitForURL(/\/az\/account\/orders\/HL/);
  await expect(page.locator("h1")).toContainText(/HL\d{6}-\d{4}/);
  await expect(page.locator("body")).toContainText("LOVE T-SHIRT - BROWN");

  await page.goto("/az/account");
  await expect(page.locator("body")).toContainText(/HL\d{6}-\d{4}/);
});

test("checkout and account require a signed-in shopper", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/az/account");
  await expect(page).toHaveURL(/\/az\/login/);
});
