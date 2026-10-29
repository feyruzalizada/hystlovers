import type { Payload, Where } from "payload";
import { CONTACT_SUBJECTS, ORDER_STATUSES, PAYMENT_METHODS } from "@/collections/Commerce";
import { FOOTER_GROUPS } from "@/collections/Content";

export type FilterOption = { label: string; where: Where };
export type Filter = { label: string; options: FilterOption[] };
type FilterSource = { label: string; options: FilterOption[] | ((payload: Payload) => Promise<FilterOption[]>) };

const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");

const yesNo = (name: string, field: string): FilterSource => ({
  label: name,
  options: [
    { label: "Yes", where: { [field]: { equals: true } } },
    { label: "No", where: { [field]: { equals: false } } },
  ],
});

const choice = (name: string, field: string, values: readonly string[]): FilterSource => ({
  label: name,
  options: values.map((value) => ({ label: label(value), where: { [field]: { equals: value } } })),
});

const distinct = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));

/** The table filters the source panel offered, per collection. */
const FILTERS: Record<string, FilterSource[]> = {
  orders: [choice("Status", "status", ORDER_STATUSES), choice("Payment", "paymentMethod", PAYMENT_METHODS)],
  customers: [
    yesNo("Panel access", "panelAccess"),
    {
      label: "Has ordered",
      options: [
        { label: "Yes", where: { ordersCount: { greater_than: 0 } } },
        { label: "No", where: { ordersCount: { equals: 0 } } },
      ],
    },
  ],
  products: [
    {
      label: "Category",
      options: async (payload) => {
        const { docs } = await payload.find({ collection: "categories", limit: 0, pagination: false, depth: 1, locale: "en" });
        return docs
          .map((category) => {
            const parent = typeof category.parent === "object" ? category.parent : null;
            return { label: parent ? `${parent.name} › ${category.name}` : category.name, where: { category: { equals: category.id } } };
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      },
    },
    {
      label: "Series",
      options: async (payload) => {
        const { docs } = await payload.find({ collection: "products", limit: 0, pagination: false, depth: 0, select: { series: true } });
        return distinct(docs.map((product) => product.series)).map((series) => ({ label: series, where: { series: { equals: series } } }));
      },
    },
    yesNo("On sale", "inStock"),
    yesNo("Pre-order", "isPreorder"),
    yesNo("New in", "isNew"),
    yesNo("Active", "isActive"),
  ],
  categories: [
    {
      label: "Parent",
      options: async (payload) => {
        const { docs } = await payload.find({
          collection: "categories",
          where: { parent: { exists: false } },
          limit: 0,
          pagination: false,
          depth: 0,
          locale: "en",
        });
        return docs.map((category) => ({ label: category.name, where: { parent: { equals: category.id } } }));
      },
    },
    yesNo("Active", "isActive"),
  ],
  colors: [yesNo("Show in filter", "showInFilter")],
  fabrics: [yesNo("Show in filter", "showInFilter")],
  slides: [yesNo("Active", "isActive")],
  "home-sections": [yesNo("Active", "isActive")],
  pages: [
    { label: "Footer group", options: FOOTER_GROUPS.map((group) => ({ label: group.label, where: { footerGroup: { equals: group.value } } })) },
    yesNo("Active", "isActive"),
  ],
  posts: [yesNo("Active", "isActive")],
  "site-texts": [
    {
      label: "Section",
      options: async (payload) => {
        const { docs } = await payload.find({ collection: "site-texts", limit: 0, pagination: false, depth: 0, select: { group: true } });
        return distinct(docs.map((text) => text.group)).map((group) => ({ label: label(group), where: { group: { equals: group } } }));
      },
    },
    {
      label: "Translation",
      options: [
        {
          label: "Missing",
          where: {
            or: [
              { en: { exists: false } },
              { en: { equals: "" } },
              { ru: { exists: false } },
              { ru: { equals: "" } },
            ],
          },
        },
      ],
    },
  ],
  "contact-messages": [
    {
      label: "Read",
      options: [
        { label: "Read", where: { readAt: { exists: true } } },
        { label: "New", where: { readAt: { exists: false } } },
      ],
    },
    choice("Subject", "subject", CONTACT_SUBJECTS),
  ],
  "stock-notifications": [yesNo("Product in stock", "product.inStock")],
};

/** Collections whose list offers a CSV of what it currently shows. */
export const EXPORTS: Record<string, string> = { orders: "/api/orders/export" };

export async function loadFilters(collection: string, payload: Payload): Promise<Filter[]> {
  return Promise.all(
    (FILTERS[collection] ?? []).map(async (filter) => ({
      label: filter.label,
      options: typeof filter.options === "function" ? await filter.options(payload) : filter.options,
    })),
  );
}
