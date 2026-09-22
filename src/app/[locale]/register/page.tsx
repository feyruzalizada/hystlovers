import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getCustomer } from "@/lib/auth";
import { isLocale, localePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/lib/server-i18n";
import { localeAlternates } from "@/lib/alternates";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("auth.register.title"), alternates: localeAlternates("/register") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCustomer()) redirect(localePath(locale, "/account"));
  return <RegisterForm />;
}
