"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { payloadClient } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { availableIn, clear, hit, tooManyAttempts } from "@/lib/rate-limit";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type AuthResult = { ok: true } | { ok: false; message: string };

function localeOf(value: FormDataEntryValue | null): Locale {
  const raw = String(value ?? "");
  return isLocale(raw) ? raw : defaultLocale;
}

async function clientIp(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0].trim() ?? store.get("x-real-ip") ?? "unknown";
}

export async function register(formData: FormData): Promise<AuthResult> {
  const locale = localeOf(formData.get("locale"));
  const t = await getTranslator(locale);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirmation") ?? "");

  if (!name || !email.includes("@") || password.length < 8 || password !== confirm) {
    return { ok: false, message: t("form.error.invalid") };
  }

  const payload = await payloadClient();
  const existing = await payload.find({
    collection: "customers",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.totalDocs > 0) return { ok: false, message: t("auth.email_taken") };

  await payload.create({
    collection: "customers",
    data: { name, email, password },
    overrideAccess: true,
  });

  const login = await payload.login({ collection: "customers", data: { email, password } });
  if (login.token) await setAuthCookie(login.token);

  redirect(localePath(locale, "/account"));
}

export async function login(formData: FormData): Promise<AuthResult> {
  const locale = localeOf(formData.get("locale"));
  const t = await getTranslator(locale);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Throttled per email + IP, as in the source app.
  const key = `login:${email}|${await clientIp()}`;
  if (tooManyAttempts(key, 5)) {
    return { ok: false, message: t("auth.throttled", { seconds: availableIn(key) }) };
  }

  const payload = await payloadClient();

  try {
    const result = await payload.login({ collection: "customers", data: { email, password } });
    if (!result.token) throw new Error("no token");
    clear(key);
    await setAuthCookie(result.token);
  } catch {
    hit(key, 60);
    return { ok: false, message: t("auth.failed") };
  }

  redirect(localePath(locale, "/account"));
}

export async function logout(formData: FormData): Promise<void> {
  const locale = localeOf(formData.get("locale"));
  await clearAuthCookie();
  redirect(localePath(locale, "/"));
}

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const locale = localeOf(formData.get("locale"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const ip = await clientIp();
  const key = `forgot:${ip}`;
  if (tooManyAttempts(key, 5)) {
    const t = await getTranslator(locale);
    return { ok: false, message: t("auth.throttled", { seconds: availableIn(key) }) };
  }
  hit(key, 60);

  const payload = await payloadClient();
  try {
    await payload.forgotPassword({ collection: "customers", data: { email } });
  } catch {
    // Always report success so the form cannot be used to probe for accounts.
  }

  return { ok: true };
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const locale = localeOf(formData.get("locale"));
  const t = await getTranslator(locale);

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirmation") ?? "");

  if (password.length < 8 || password !== confirm) {
    return { ok: false, message: t("form.error.invalid") };
  }

  const payload = await payloadClient();
  try {
    await payload.resetPassword({
      collection: "customers",
      data: { token, password },
      overrideAccess: true,
    });
  } catch {
    return { ok: false, message: t("auth.reset_invalid") };
  }

  // The source shop signs nobody in here: it returns to the login page with a
  // confirmation so the new password is used once deliberately.
  redirect(localePath(locale, "/login?reset=1"));
}
