import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const password = "parol12345";

const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;

async function adminHeaders(request: APIRequestContext) {
  const login = await request.post("/api/users/login", {
    data: { email: "admin@hystlovers.com", password: "hystlovers123" },
  });
  return { Authorization: `JWT ${(await login.json()).token}` };
}

async function adminLogin(page: Page) {
  // The shopper's session from the storefront would otherwise stand in for an admin.
  await page.context().clearCookies();
  await page.goto("/admin");
  await page.locator('input[name="email"]').fill("admin@hystlovers.com");
  await page.locator('input[name="password"]').fill("hystlovers123");
  await page.getByRole("button", { name: /login|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), { timeout: 60000 });
}

async function buyOne(page: Page, email: string) {
  await page.goto("/az/register");
  await page.getByRole("textbox").nth(0).fill("E2E Alıcı");
  await page.getByRole("textbox").nth(1).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="password_confirmation"]').fill(password);
  await page.getByRole("button", { name: /hesab yarat|qeydiyyat/i }).click();
  await page.waitForURL("**/az/account");

  await page.goto("/az/products/t-shirt-brown");
  await page.getByRole("button", { name: "XS/S", exact: true }).click();
  await page.getByRole("button", { name: /səbətə/i }).click();
  await page.getByRole("link", { name: /sifarişi rəsmiləşdir|ödənişə keç|checkout/i }).click();
  await page.waitForURL("**/az/checkout");
  await page.locator('input[name="phone"]').fill("+994 50 123 45 67");
  await page.locator('input[name="city"]').fill("Bakı");
  await page.locator('textarea[name="address"]').fill("Nizami küçəsi 1");
  await page.getByRole("button", { name: /sifarişi təsdiqlə/i }).click();
  await page.waitForURL(/\/az\/account\/orders\/HL/);
  return page.url().match(/HL\d{6}-\d{4}/)?.[0] ?? "";
}

test("a duplicated product gets a free slug and stays hidden", async ({ request }) => {
  const headers = await adminHeaders(request);
  const found = await (await request.get("/api/products?where[slug][equals]=t-shirt-brown&depth=0")).json();
  const id = found.docs[0].id;
  const copies: (number | string)[] = [];

  try {
    for (const expected of ["t-shirt-brown-copy", "t-shirt-brown-copy-2"]) {
      const response = await request.post(`/api/products/${id}/duplicate`, { headers });
      expect(response.ok()).toBeTruthy();
      const { doc } = await response.json();
      copies.push(doc.id);
      expect(doc.slug).toBe(expected);
      expect(doc.isActive).toBe(false);
    }
  } finally {
    for (const copy of copies) await request.delete(`/api/products/${copy}`, { headers });
  }
});

test("orders: payment status, list filters, status column, export and customer count", async ({ page, request }) => {
  // Buys through the storefront, then walks the panel, which dev compiles on first visit.
  test.setTimeout(180_000);
  const email = uniqueEmail();
  const number = await buyOne(page, email);
  const headers = await adminHeaders(request);

  const customer = (await (await request.get(`/api/customers?where[email][equals]=${email}&depth=0`, { headers })).json()).docs[0];
  expect(customer.ordersCount).toBe(1);

  const order = (await (await request.get(`/api/orders?where[number][equals]=${number}&depth=0`, { headers })).json()).docs[0];
  const paid = await request.patch(`/api/orders/${order.id}`, { headers, data: { paymentStatus: "paid" } });
  expect((await paid.json()).doc.paymentStatus).toBe("paid");

  const badges = await (await request.get("/api/nav-badges", { headers })).json();
  expect(badges.orders).toBeGreaterThan(0);

  const csv = await request.get(`/api/orders/export?search=${number}`, { headers });
  const text = await csv.text();
  expect(csv.headers()["content-disposition"]).toContain("orders-");
  expect(text.charCodeAt(0)).toBe(0xfeff);
  const lines = text.trim().split("\r\n");
  expect(lines).toHaveLength(2);
  expect(lines[1]).toContain(`${number},`);
  expect(lines[1]).toContain("Pending,Cash on delivery,Paid");

  await adminLogin(page);
  await expect(page.locator("#nav-orders")).toHaveAttribute("data-badge", /\d+/);

  await page.goto(`/admin/collections/orders?search=${number}`);
  const row = page.locator("tbody tr", { hasText: number });
  await row.locator("select.order-status-cell").selectOption("confirmed");
  await expect
    .poll(async () => (await (await request.get(`/api/orders/${order.id}?depth=0`, { headers })).json()).status)
    .toBe("confirmed");

  await page.goto("/admin/collections/orders");
  await page.locator(".list-filters__item", { hasText: "Status" }).locator("select").selectOption({ label: "Confirmed" });
  await expect(page).toHaveURL(/where/);
  await expect(page.locator("tbody tr", { hasText: number })).toBeVisible();
  await page.locator(".list-filters__item", { hasText: "Status" }).locator("select").selectOption({ label: "Delivered" });
  await expect(page.locator("tbody tr", { hasText: number })).toHaveCount(0);

  await page.goto(`/admin/collections/customers/${customer.id}`);
  await expect(page.locator("body")).toContainText(number);
});

test("granting panel access lets a customer sign in to the panel, revoking removes it", async ({ page, request }) => {
  const email = uniqueEmail();
  await buyOne(page, email);
  const headers = await adminHeaders(request);
  const customer = (await (await request.get(`/api/customers?where[email][equals]=${email}&depth=0`, { headers })).json()).docs[0];

  try {
    await request.patch(`/api/customers/${customer.id}`, { headers, data: { panelAccess: true } });
    const login = await request.post("/api/users/login", { data: { email, password } });
    expect(login.ok()).toBeTruthy();

    const filtered = await (await request.get("/api/customers?where[panelAccess][equals]=true&depth=0&limit=100", { headers })).json();
    expect(filtered.docs.map((doc: { email: string }) => doc.email)).toContain(email);
  } finally {
    await request.patch(`/api/customers/${customer.id}`, { headers, data: { panelAccess: false } });
  }

  const users = await (await request.get(`/api/users?where[email][equals]=${email}`, { headers })).json();
  expect(users.totalDocs).toBe(0);
});

test("filter colours follow the palette: switched off, recoloured, renamed", async ({ page, request }) => {
  const headers = await adminHeaders(request);
  const { docs } = await (await request.get("/api/colors?where[slug][equals]=qehveyi&depth=0&locale=az", { headers })).json();
  const color = docs[0];
  const swatches = page.locator("aside, [role=dialog], body").locator("button[aria-pressed]");

  try {
    await request.patch(`/api/colors/${color.id}?locale=az`, { headers, data: { hex: "#123456", name: "Şokolad" } });
    await page.goto("/az/collections/all-products");
    const renamed = swatches.and(page.getByTitle("Şokolad", { exact: true }));
    await expect(renamed).toHaveCount(1);
    await expect(renamed).toHaveCSS("background-color", "rgb(18, 52, 86)");

    await request.patch(`/api/colors/${color.id}`, { headers, data: { showInFilter: false } });
    await page.reload();
    await expect(swatches.first()).toBeAttached();
    await expect(page.getByTitle("Şokolad", { exact: true })).toHaveCount(0);
  } finally {
    await request.patch(`/api/colors/${color.id}?locale=az`, {
      headers,
      data: { hex: color.hex, name: color.name, showInFilter: true },
    });
  }
});

test("filter fabrics follow the panel: switched off, renamed", async ({ page, request }) => {
  const headers = await adminHeaders(request);
  const { docs } = await (await request.get("/api/fabrics?where[slug][equals]=pambiq&depth=0&locale=az", { headers })).json();
  const fabric = docs[0];
  const option = (name: string) => page.locator("label", { has: page.locator('input[type="checkbox"]') }).filter({ hasText: new RegExp(`^${name}$`) });

  try {
    await request.patch(`/api/fabrics/${fabric.id}?locale=az`, { headers, data: { name: "Təbii pambıq" } });
    await page.goto("/az/collections/all-products");
    await expect(option("Təbii pambıq").first()).toBeAttached();
    await option("Təbii pambıq").first().click();
    await expect(page.locator("main")).toContainText(/pambıq/i);

    await request.patch(`/api/fabrics/${fabric.id}`, { headers, data: { showInFilter: false } });
    await page.reload();
    await expect(option("Modal").first()).toBeAttached();
    await expect(option("Təbii pambıq")).toHaveCount(0);
  } finally {
    await request.patch(`/api/fabrics/${fabric.id}?locale=az`, { headers, data: { name: fabric.name, showInFilter: true } });
  }
});

test("a category poster fills the top of its page; without one the grey band stays", async ({ page, request }) => {
  const headers = await adminHeaders(request);
  const category = (await (await request.get("/api/categories?where[isActive][equals]=true&depth=0&limit=1", { headers })).json()).docs[0];
  const media = (await (await request.get("/api/media?depth=0&limit=1", { headers })).json()).docs[0];
  const poster = page.locator("main header img");

  try {
    await request.patch(`/api/categories/${category.id}`, { headers, data: { image: media.id } });
    await page.goto(`/az/collections/${category.slug}`);
    await expect(poster).toBeVisible();
    await expect(page.locator("main header")).toHaveClass(/bg-ink/);

    await request.patch(`/api/categories/${category.id}`, { headers, data: { image: null } });
    await page.reload();
    await expect(poster).toHaveCount(0);
  } finally {
    await request.patch(`/api/categories/${category.id}`, { headers, data: { image: category.image ?? null } });
  }
});

test("a new category's slug follows its name until typed by hand; built-in slugs are refused", async ({ page, request }) => {
  test.setTimeout(180_000);
  const headers = await adminHeaders(request);
  const reserved = await request.post("/api/categories", { headers, data: { name: "Hamısı", slug: "new-in" } });
  expect(reserved.status()).toBe(400);

  await adminLogin(page);
  await page.goto("/admin/collections/categories/create");
  const slug = page.locator('input[name="slug"]');
  await page.locator('input[name="name"]').fill("Yay şəhəri");
  await expect(slug).toHaveValue("yay-seheri");
  await slug.fill("yay");
  await page.locator('input[name="name"]').fill("Payız");
  await expect(slug).toHaveValue("yay");
});

test("the panel refuses what the source forms refused", async ({ request }) => {
  const headers = await adminHeaders(request);
  const product = (await (await request.get("/api/products?where[slug][equals]=t-shirt-brown&depth=0", { headers })).json()).docs[0];
  const cheaper = await request.patch(`/api/products/${product.id}`, { headers, data: { compareAtPrice: product.price } });
  expect(cheaper.status()).toBe(400);

  const slide = (await (await request.get("/api/slides?limit=1&depth=0", { headers })).json()).docs[0];
  const script = await request.patch(`/api/slides/${slide.id}`, { headers, data: { ctaLabel: "Bax", ctaUrl: "javascript:alert(1)" } });
  expect(script.status()).toBe(400);

  const { docs: categories } = await (await request.get("/api/categories?limit=0&depth=0&locale=az", { headers })).json();
  const child = categories.find((category: { parent: unknown }) => category.parent);
  expect(child.pathName).toContain(" › ");
  const loop = await request.patch(`/api/categories/${child.parent}`, { headers, data: { parent: child.id } });
  expect(loop.status()).toBe(400);
});

test("contact details live on their own panel page and reach the contact page", async ({ page, request }) => {
  const headers = await adminHeaders(request);
  const before = await (await request.get("/api/globals/contact-details?depth=0", { headers })).json();
  try {
    await request.post("/api/globals/contact-details", { headers, data: { contactEmail: "salam@hystlovers.com" } });
    await page.goto("/az/contact");
    await expect(page.locator("main")).toContainText("salam@hystlovers.com");
  } finally {
    await request.post("/api/globals/contact-details", { headers, data: { contactEmail: before.contactEmail } });
  }
});

test("list switches save straight from the table; category selects show the full path", async ({ page, request }) => {
  test.setTimeout(180_000);
  const headers = await adminHeaders(request);
  const product = (await (await request.get("/api/products?where[slug][equals]=t-shirt-brown&depth=0", { headers })).json()).docs[0];
  await adminLogin(page);
  try {
    await page.goto("/admin/collections/products?limit=100");
    const row = page.locator("tbody tr", { has: page.locator(`a[href$="/products/${product.id}"]`) });
    await row.getByRole("switch", { name: "New in" }).click();
    await expect
      .poll(async () => (await (await request.get(`/api/products/${product.id}?depth=0`, { headers })).json()).isNew)
      .toBe(!product.isNew);

    await page.goto(`/admin/collections/products/${product.id}`);
    await page.locator("#field-category").click();
    await expect(page.getByText(/ › /).first()).toBeVisible();
  } finally {
    await request.patch(`/api/products/${product.id}`, { headers, data: { isNew: product.isNew } });
  }
});

test("the panel wears the source layout: sidebar, welcome card, section headers, replicate", async ({ page, request }) => {
  test.setTimeout(180_000);
  const headers = await adminHeaders(request);
  const product = (await (await request.get("/api/products?where[slug][equals]=t-shirt-brown&depth=0", { headers })).json()).docs[0];
  await adminLogin(page);

  await page.goto("/admin");
  await expect(page.locator(".nav-brand")).toHaveText("Hystlovers");
  await expect(page.locator("#nav-dashboard")).toHaveClass(/nav__link--active/);
  await expect(page.locator(".dashboard-welcome")).toContainText("Welcome");
  await expect(page.locator(".nav")).toBeVisible();

  await page.goto(`/admin/collections/products/${product.id}`);
  await expect(page.locator(".section-label__description").first()).toContainText("colorways of one garment");

  const copies = () => request.get("/api/products?where[slug][like]=t-shirt-brown-copy&depth=0", { headers });
  try {
    await page.goto("/admin/collections/products?limit=100");
    const row = page.locator("tbody tr", { has: page.locator(`a[href$="/products/${product.id}"]`) });
    await expect(row.locator(".product-thumb")).toBeVisible();
    await row.getByRole("button", { name: "Replicate" }).click();
    await expect.poll(async () => (await (await copies()).json()).totalDocs).toBe(1);
    const copy = (await (await copies()).json()).docs[0];
    expect(copy.isActive).toBe(false);
  } finally {
    for (const doc of (await (await copies()).json()).docs) {
      await request.delete(`/api/products/${doc.id}`, { headers });
    }
  }
});
