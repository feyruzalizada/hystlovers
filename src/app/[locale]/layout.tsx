import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { getShop, getSiteTexts } from "@/lib/cms";
import { buildTranslator, isLocale, locales } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import { ShopProvider } from "@/components/ShopProvider";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = buildTranslator(await getSiteTexts(locale));
  return {
    title: { default: "Hystlovers", template: "%s — Hystlovers" },
    description: t("home.meta_description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [shop, messages] = await Promise.all([getShop(locale), getSiteTexts(locale)]);

  return (
    <html lang={locale} className="h-full">
      <head>
        <meta name="theme-color" content="#1c1c1c" />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink antialiased">
        <I18nProvider locale={locale} messages={messages}>
          <ShopProvider shop={shop}>
            <CartProvider
              shipping={{
                freeShippingThreshold: shop.freeShippingThreshold,
                shippingFee: shop.shippingFee,
              }}
            >
              <Header navigation={shop.navigation} />
              <main className="flex-1">{children}</main>
              <Footer groups={shop.footer} />
              <CartDrawer />
            </CartProvider>
          </ShopProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
