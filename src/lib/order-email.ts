import type { Payload } from "payload";
import type { Order, Product } from "@/payload-types";
import { defaultLocale, isLocale, type Translator } from "./i18n";
import { formatMoney } from "./money";
import { productName } from "./product-name";
import { translator } from "./reset-email";
import type { Locale } from "./types";

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");


/**
 * The order confirmation, rebuilt from the Blade template: every string comes
 * from site texts in the language the order was placed in.
 */
export function renderOrderEmail({
  order,
  t,
  locale,
  currencySymbol,
  bankDetails,
}: {
  order: Order;
  t: Translator;
  locale: Locale;
  currencySymbol: string;
  bankDetails: string | null;
}): string {
  const money = (value: number, symbol: string) => formatMoney(value, locale, symbol);
  const items = (order.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
          ${escape(item.name)}
          ${
            item.isPreorder
              ? `<span style="background:#1c1c1c;color:#fff;font-size:10px;padding:1px 6px;">${escape(
                  t("product.preorder.badge"),
                )}</span>`
              : ""
          }
          <br />
          <span style="color: #777; font-size: 12px;">${escape(item.colorName)} · ${escape(
            item.size,
          )} · ${item.qty}</span>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5; text-align: right; white-space: nowrap;">
          ${money(item.lineTotal, currencySymbol)}
        </td>
      </tr>`,
    )
    .join("");

  const hasPreorder = (order.items ?? []).some((item) => item.isPreorder);

  return `<!DOCTYPE html>
<html lang="${escape(locale)}">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #1c1c1c; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 18px; letter-spacing: .14em; text-transform: uppercase;">Hystlovers</h1>

  <p>${escape(t("mail.order.greeting", { name: order.customerName }))}</p>
  <p>${escape(t("mail.order.intro", { number: order.number }))}</p>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    ${items}
    <tr>
      <td style="padding: 8px 0;">${escape(t("checkout.shipping"))}</td>
      <td style="padding: 8px 0; text-align: right;">${
        order.shippingTotal > 0
          ? money(order.shippingTotal, currencySymbol)
          : escape(t("checkout.shipping_free"))
      }</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold;">${escape(t("checkout.total"))}</td>
      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${money(
        order.total,
        currencySymbol,
      )}</td>
    </tr>
  </table>

  <p>
    ${escape(t("checkout.payment_method"))}:
    <strong>${escape(t(`checkout.payment.${order.paymentMethod}`))}</strong>
  </p>

  ${
    hasPreorder
      ? `<p style="background: #f6f2e9; padding: 12px;">${escape(t("mail.order.preorder_note"))}</p>`
      : ""
  }

  ${
    bankDetails
      ? `<p style="background: #efefef; padding: 12px;">
          ${escape(t("mail.order.bank_intro"))}<br />
          ${escape(bankDetails).replace(/\n/g, "<br />")}<br />
          ${escape(t("mail.order.bank_reference", { number: order.number }))}
        </p>`
      : ""
  }

  <p style="color: #777; font-size: 12px;">${escape(t("mail.order.automated"))}</p>
</body>
</html>`;
}

/**
 * Sends the confirmation in the language the order was placed in. Card orders
 * get it once the bank confirms the payment, the others right at checkout.
 */
export async function sendOrderEmail(payload: Payload, order: Order): Promise<void> {
  const locale: Locale = isLocale(order.locale) ? order.locale : defaultLocale;
  const t = await translator(payload, locale);
  const settings = await payload.findGlobal({ slug: "settings", locale });

  // The order keeps the shop's default language; the shopper reads their own.
  const items = await Promise.all(
    (order.items ?? []).map(async (line) => {
      const id = typeof line.product === "object" ? line.product?.id : line.product;
      const doc: Product | null = id
        ? await payload.findByID({ collection: "products", id, locale, depth: 0, overrideAccess: true, disableErrors: true })
        : null;
      return doc ? { ...line, name: productName(doc, locale), colorName: doc.colorName } : line;
    }),
  );

  // The order stands even if the confirmation email cannot be delivered.
  try {
    await payload.sendEmail({
      to: order.customerEmail,
      subject: t("mail.order.subject", { number: order.number }),
      html: renderOrderEmail({
        order: { ...order, items },
        t,
        locale,
        currencySymbol: settings.currencySymbol ?? "",
        bankDetails: order.paymentMethod === "bank_transfer" ? (settings.bankTransferDetails ?? null) : null,
      }),
    });
  } catch {
    // logged by Payload's email adapter
  }
}
