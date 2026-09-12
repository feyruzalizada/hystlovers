import Link from "next/link";
import { createTranslator, defaultLocale, localePath } from "@/lib/i18n";

export default function NotFound() {
  const t = createTranslator(defaultLocale);

  return (
    <div className="mx-auto max-w-[600px] px-4 py-32 text-center md:px-8">
      <h1 className="heading-brand text-xl">{t("error.404.title")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{t("error.404.body")}</p>
      <Link href={localePath(defaultLocale, "/")} className="btn-secondary mt-8">
        {t("error.404.cta")}
      </Link>
    </div>
  );
}
