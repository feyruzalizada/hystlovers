import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { payloadClient } from "./cms";

export const AUTH_COOKIE = "payload-token";

export type Customer = { id: string | number; name: string; email: string };

/** The signed-in shopper, or null. Admin-panel users are not shoppers. */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const payload = await payloadClient();
  const { user } = await payload.auth({ headers: await headers() });

  if (!user || user.collection !== "customers") return null;
  return { id: user.id, name: (user as { name?: string }).name ?? "", email: user.email ?? "" };
});

export async function setAuthCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(AUTH_COOKIE);
}
