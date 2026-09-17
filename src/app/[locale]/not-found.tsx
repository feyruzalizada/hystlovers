import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslator } from "@/lib/server-i18n";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n";

export default async function NotFound() {
  // A not-found page gets no route params, so the language comes from the
  // cookie the proxy writes on every localized request.
  const remembered = (await cookies()).get("storefront_locale")?.value ?? "";
  const locale = isLocale(remembered) ? remembered : defaultLocale;
  const t = await getTranslator(locale);

  return (
    <div className="mx-auto max-w-[600px] px-4 py-32 text-center md:px-8">
      <h1 className="heading-brand text-xl">{t("error.404.title")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{t("error.404.body")}</p>
      <Link href={localePath(locale, "/")} className="btn-secondary mt-8">
        {t("error.404.cta")}
      </Link>
    </div>
  );
}
