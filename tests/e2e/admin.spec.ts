import { expect, test } from "@playwright/test";

test("admin panel: login, dashboard stats and collections", async ({ page }) => {
  await page.goto("/admin");
  await page.locator('input[name="email"]').fill("admin@hystlovers.com");
  await page.locator('input[name="password"]').fill("hystlovers123");
  await page.getByRole("button", { name: /login|log in|daxil/i }).click();
  await page.waitForURL(/\/admin(\/.*)?$/, { timeout: 60000 });
  await page.waitForLoadState("networkidle");

  await expect(page.locator("body")).toContainText("Revenue (month)");
  await expect(page.locator("body")).toContainText("Out of stock");

  const nav = await page.locator("nav").first().innerText();
  console.log("NAV:", nav.replace(/\n+/g, " | "));

  await page.goto("/admin/collections/products");
  await page.waitForLoadState("networkidle");
  // The list shows the source panel's columns: series, category, price and the flags.
  await expect(page.locator("body")).toContainText("LOVE");
  await expect(page.getByRole("link", { name: /create new/i })).toHaveCount(1);

  // Orders, customers and site texts only ever arrive from the storefront or
  // the seed, so the panel must not offer a create button for them.
  for (const collection of ["orders", "customers", "site-texts", "contact-messages"]) {
    await page.goto(`/admin/collections/${collection}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /create new/i })).toHaveCount(0);
  }
});
