import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/AuthForms";
import { isLocale } from "@/lib/i18n";
import type { Metadata } from "next";
import { getTranslator } from "@/lib/server-i18n";
import { localeAlternates } from "@/lib/alternates";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale, token } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("auth.reset.title"), alternates: localeAlternates(`/reset-password/${token}`) };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  return <ResetPasswordForm token={token} />;
}
