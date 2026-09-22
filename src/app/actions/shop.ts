"use server";

import { headers } from "next/headers";
import { payloadClient } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { availableIn, hit, tooManyAttempts } from "@/lib/rate-limit";
import { isLocale, defaultLocale } from "@/lib/i18n";
import { CONTACT_SUBJECTS } from "@/collections/Commerce";

export type ActionResult = { ok: true } | { ok: false; message: string };

async function clientIp(): Promise<string> {
  const store = await headers();
  return (
    store.get("x-forwarded-for")?.split(",")[0].trim() ?? store.get("x-real-ip") ?? "unknown"
  );
}

function localeOf(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");
  return isLocale(raw) ? raw : defaultLocale;
}

export async function submitContact(formData: FormData): Promise<ActionResult> {
  const locale = localeOf(formData.get("locale"));
  const t = await getTranslator(locale);
  const ip = await clientIp();

  // Attempt cap before validation, so invalid payloads cannot be spammed cheaply.
  if (tooManyAttempts(`contact-attempt:${ip}`, 10)) {
    return { ok: false, message: t("contact.rate_limited", { seconds: availableIn(`contact-attempt:${ip}`) }) };
  }
  hit(`contact-attempt:${ip}`, 60);

  // Honeypot: a field real visitors never see, let alone fill in.
  if (String(formData.get("website") ?? "").trim() !== "") return { ok: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "") as (typeof CONTACT_SUBJECTS)[number];
  const message = String(formData.get("message") ?? "").trim();

  // Same ceilings the PHP rules enforced: 255 on the short fields, 5000 on the body.
  if (
    !name ||
    !email ||
    !message ||
    !CONTACT_SUBJECTS.includes(subject) ||
    name.length > 255 ||
    email.length > 255 ||
    message.length > 5000
  ) {
    return { ok: false, message: t("form.error.invalid") };
  }

  const key = `contact-form:${ip}`;
  if (tooManyAttempts(key, 2)) {
    return { ok: false, message: t("contact.rate_limited", { seconds: availableIn(key) }) };
  }
  hit(key, 60);

  const payload = await payloadClient();
  await payload.create({
    collection: "contact-messages",
    data: { name, email, subject, message },
    overrideAccess: true,
  });

  return { ok: true };
}

export async function subscribeNewsletter(formData: FormData): Promise<ActionResult> {
  const locale = localeOf(formData.get("locale"));
  const t = await getTranslator(locale);
  const ip = await clientIp();
  const key = `newsletter:${ip}`;

  if (tooManyAttempts(key, 5)) {
    return { ok: false, message: t("contact.rate_limited", { seconds: availableIn(key) }) };
  }
  hit(key, 60);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) return { ok: false, message: t("form.error.invalid") };

  const payload = await payloadClient();
  const existing = await payload.find({
    collection: "newsletter-subscribers",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: "newsletter-subscribers",
      data: { email },
      overrideAccess: true,
    });
  }

  return { ok: true };
}

export async function notifyWhenInStock(formData: FormData): Promise<ActionResult> {
  const locale = localeOf(formData.get("locale"));
  const t = await getTranslator(locale);
  const ip = await clientIp();
  const key = `stock-notify:${ip}`;

  if (tooManyAttempts(key, 5)) {
    return { ok: false, message: t("contact.rate_limited", { seconds: availableIn(key) }) };
  }
  hit(key, 60);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const slug = String(formData.get("slug") ?? "");
  if (!email.includes("@") || !slug) return { ok: false, message: t("form.error.invalid") };

  const payload = await payloadClient();
  const product = await payload.find({
    collection: "products",
    where: { slug: { equals: slug }, isActive: { equals: true } },
    limit: 1,
    overrideAccess: true,
  });

  const doc = product.docs[0];
  if (!doc) return { ok: false, message: t("form.error.invalid") };

  const existing = await payload.find({
    collection: "stock-notifications",
    where: { email: { equals: email }, product: { equals: doc.id } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: "stock-notifications",
      data: { email, product: doc.id },
      overrideAccess: true,
    });
  }

  return { ok: true };
}
