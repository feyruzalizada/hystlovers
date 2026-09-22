import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localeAlternates } from "@/lib/alternates";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}): Promise<Metadata> {
  const { locale, rest } = await params;
  if (!isLocale(locale)) return {};
  return { alternates: localeAlternates(`/${rest.join("/")}`) };
}

/**
 * Unknown paths under a language fall through to the storefront's own 404 so it
 * keeps the header and footer, as the source shop's fallback route did.
 */
export default function CatchAllPage() {
  notFound();
}
