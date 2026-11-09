/**
 * Kapital Bank e-commerce API: an order on their side, the shopper pays on the
 * bank's hosted page, and its status is always read back from the API.
 */
const apiUrl = (process.env.KAPITAL_API_URL?.trim() || "https://txpgtst.kapitalbank.az/api").replace(/\/+$/, "");
const username = process.env.KAPITAL_USERNAME?.trim() ?? "";
const password = process.env.KAPITAL_PASSWORD ?? "";

export const kapitalEnabled = Boolean(username && password);

export type KapitalOrder = {
  id: number;
  status: string;
  amount: number;
  currency: string;
  description?: string;
};

class KapitalError extends Error {}

async function call<T>(path: string, body?: unknown): Promise<T> {
  if (!kapitalEnabled) throw new KapitalError("Kapital Bank credentials are not set");

  const response = await fetch(`${apiUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  // Declines and unknown orders come back as { errorCode, errorDescription }.
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.errorCode) {
    throw new KapitalError(
      `Kapital Bank ${path}: ${data?.errorCode ?? response.status}${data?.errorDescription ? ` ${data.errorDescription}` : ""}`,
    );
  }
  return data as T;
}

const amountOf = (value: number) => value.toFixed(2);

/** A purchase order; returns the hosted payment page to send the shopper to. */
export async function createPurchase(input: {
  amount: number;
  currency: string;
  language: string;
  title: string;
  description: string;
  redirectUrl: string;
}): Promise<{ id: number; paymentUrl: string }> {
  const { order } = await call<{ order: { id: number; hppUrl: string; password: string } }>("/order", {
    order: {
      typeRid: "Order_SMS",
      amount: amountOf(input.amount),
      currency: input.currency,
      language: input.language,
      title: input.title,
      description: input.description,
      hppRedirectUrl: input.redirectUrl,
    },
  });
  const query = new URLSearchParams({ id: String(order.id), password: order.password });
  return { id: order.id, paymentUrl: `${order.hppUrl}?${query}` };
}

export async function getOrder(id: number): Promise<KapitalOrder> {
  const { order } = await call<{ order: KapitalOrder }>(`/order/${id}?orderDetailLevel=2`);
  return order;
}

export async function refund(id: number, amount: number): Promise<void> {
  await call(`/order/${id}/exec-tran`, { tran: { phase: "Single", amount: amountOf(amount), type: "Refund" } });
}
