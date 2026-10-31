import type { CollectionConfig, Field, GlobalConfig, PayloadComponent, UIField } from "payload";
import type { RowAction } from "@/components/admin/RowActions";
import { listCell, noteCell, rowActions } from "./admin-components";

const SECTION_LABEL = "/components/admin/SectionLabel#default";
const COLUMN_LABEL = "/components/admin/ColumnLabel#default";
const FORM_ACTIONS = "/components/admin/FormActions#default";

type Column = { label?: string; Cell?: PayloadComponent };

/** How the source panel showed a resource: its page titles, table and row actions. */
type PanelSpec = {
  /** Page title of the list, e.g. "Homepage Sections" (the sidebar keeps its own label). */
  title: string;
  /** Used for "New …", "Create …". */
  singular: string;
  columns?: string[];
  cells?: Record<string, Column>;
  /** List-only columns. */
  extra?: UIField[];
  actions?: RowAction[];
  /** The source's date column for the record's creation. */
  createdAt?: { label: string; dateOnly?: boolean };
  /** Records open on a read-only view page, as the source's View action. */
  viewPage?: boolean;
};

const PANEL: Record<string, PanelSpec> = {
  orders: {
    title: "Orders",
    singular: "Order",
    columns: ["number", "customerName", "itemsCount", "total", "paymentMethod", "status", "createdAt"],
    actions: ["view"],
    createdAt: { label: "Placed" },
    viewPage: true,
  },
  customers: {
    title: "Customers",
    singular: "Customer",
    columns: ["name", "email", "ordersCount", "spent", "panelAccess", "createdAt"],
    cells: { panelAccess: { label: "Admin" } },
    actions: ["view"],
    createdAt: { label: "Registered", dateOnly: true },
    viewPage: true,
  },
  products: {
    title: "Products",
    singular: "Product",
    cells: { price: { label: "Price" }, isPreorder: { label: "Pre-order" }, isNew: { label: "New" } },
    actions: ["edit", "replicate"],
  },
  categories: {
    title: "Categories",
    singular: "Category",
    columns: ["name", "slug", "childrenCount", "isActive", "missingTranslations"],
    cells: {
      name: { Cell: noteCell("pathName") },
      slug: { Cell: noteCell(undefined, { badge: true, prefix: "/" }) },
      childrenCount: { Cell: listCell("CountCell") },
    },
    actions: ["edit"],
  },
  colors: { title: "Colors", singular: "Color", actions: ["edit"] },
  fabrics: { title: "Fabrics", singular: "Fabric", actions: ["edit"] },
  slides: {
    title: "Slides",
    singular: "Slide",
    columns: ["image", "title", "ctaLabel", "isActive", "schedule", "missingTranslations"],
    cells: { image: { label: "Image" }, ctaLabel: { label: "Button" } },
    extra: [
      { name: "schedule", type: "ui", label: "Schedule", admin: { components: { Cell: listCell("ScheduleCell") } } },
    ],
    actions: ["edit"],
  },
  "home-sections": {
    title: "Homepage Sections",
    singular: "Homepage Section",
    columns: ["sectionTitle", "category", "productLimit", "isActive", "missingTranslations"],
    cells: {
      category: { Cell: listCell("CategoryPathBadgeCell") },
      productLimit: { label: "Products", Cell: listCell("CountCell") },
    },
    extra: [
      { name: "sectionTitle", type: "ui", label: "Title", admin: { components: { Cell: listCell("SectionTitleCell") } } },
    ],
    actions: ["edit"],
  },
  pages: {
    title: "Pages",
    singular: "Page",
    columns: ["title", "slug", "footerGroup", "isActive", "missingTranslations"],
    cells: {
      slug: { Cell: noteCell(undefined, { badge: true, prefix: "/pages/" }) },
      footerGroup: { Cell: noteCell(undefined, { badge: "primary", labels: true }) },
    },
    actions: ["edit"],
  },
  posts: {
    title: "Posts",
    singular: "Post",
    columns: ["coverImage", "title", "missingTranslations", "isActive", "publishedAt"],
    cells: {
      coverImage: { label: "Cover" },
      missingTranslations: { label: "Translated", Cell: listCell("TranslatedCell") },
      publishedAt: { label: "Published" },
    },
    actions: ["edit", "delete"],
  },
  "site-texts": {
    title: "Site Texts",
    singular: "Site Text",
    columns: ["key", "az", "en", "ru"],
    cells: { key: { Cell: noteCell("hint") }, az: { label: "AZ" }, en: { label: "EN" }, ru: { label: "RU" } },
    actions: ["edit"],
  },
  "contact-messages": {
    title: "Contact Messages",
    singular: "Contact Message",
    columns: ["name", "subject", "message", "readAt", "createdAt"],
    cells: {
      subject: { Cell: noteCell(undefined, { badge: true, labels: true }) },
      readAt: { label: "Status", Cell: listCell("ReadStatusCell") },
    },
    actions: ["view"],
    createdAt: { label: "Received" },
    viewPage: true,
  },
  "newsletter-subscribers": {
    title: "Newsletter Subscribers",
    singular: "Newsletter Subscriber",
    columns: ["email", "createdAt"],
    createdAt: { label: "Subscribed" },
  },
  "stock-notifications": {
    title: "Stock Notifications",
    singular: "Stock Notification",
    columns: ["product", "email", "createdAt"],
    cells: { product: { Cell: listCell("StockProductCell") } },
    createdAt: { label: "Requested" },
  },
  media: { title: "Media", singular: "Media" },
  users: { title: "Users", singular: "User" },
};

/** The section description moves into the section header, where the source panel showed it. */
function sectionHeader(field: Extract<Field, { type: "collapsible" }>): Field {
  const { description, ...admin } = field.admin ?? {};
  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...admin.components,
        Label: {
          path: SECTION_LABEL,
          clientProps: { description: typeof description === "string" ? description : undefined },
        },
      },
    },
  };
}

function column(field: Field, spec: Column): Field {
  if (!("name" in field)) return field;
  const admin = (("admin" in field && field.admin) || {}) as { components?: Record<string, unknown> };
  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...admin.components,
        ...(spec.Cell ? { Cell: spec.Cell } : {}),
        ...(spec.label ? { Label: { path: COLUMN_LABEL, clientProps: { listLabel: spec.label } } } : {}),
      },
    },
  } as Field;
}

/** Section headers everywhere, and the source table's columns for the named fields. */
export function withSourceLayout(fields: Field[], cells: Record<string, Column> = {}): Field[] {
  return fields.map((field) => {
    if (field.type === "collapsible") {
      return { ...sectionHeader(field), fields: withSourceLayout(field.fields, cells) } as Field;
    }
    if (field.type === "row" || field.type === "group") {
      return { ...field, fields: withSourceLayout(field.fields, cells) } as Field;
    }
    if ("name" in field && cells[field.name]) return column(field, cells[field.name]);
    return field;
  });
}

const formActions: UIField = {
  name: "formActions",
  type: "ui",
  admin: { disableListColumn: true, components: { Field: FORM_ACTIONS } },
};

export function withPanelLayout(collection: CollectionConfig): CollectionConfig {
  const spec = PANEL[collection.slug];
  if (!spec) return collection;
  const fields = withSourceLayout(collection.fields, spec.cells);
  const columns = spec.columns ?? collection.admin?.defaultColumns ?? [];
  const createdAt: Field[] = spec.createdAt
    ? [
        {
          name: "createdAt",
          type: "date",
          label: spec.createdAt.label,
          index: true,
          admin: {
            hidden: true,
            disableBulkEdit: true,
            ...(spec.createdAt.dateOnly ? { date: { displayFormat: "MMM d, yyyy" } } : {}),
          },
        },
      ]
    : [];
  return {
    ...collection,
    admin: {
      ...collection.admin,
      defaultColumns: [...columns, ...(spec.actions ? ["rowActions"] : [])],
      custom: { ...collection.admin?.custom, panel: { title: spec.title, singular: spec.singular, viewPage: spec.viewPage } },
      components: {
        ...collection.admin?.components,
        beforeList: ["/components/admin/ListHeading#default"],
        edit: {
          ...collection.admin?.components?.edit,
          beforeDocumentControls: ["/components/admin/DocHeading#default"],
        },
        ...(spec.viewPage
          ? {
              // None of these collections has views of its own to keep.
              views: {
                edit: {
                  view: { path: "/view", Component: `/components/admin/RecordView#${collection.slug.replace(/-/g, "_")}` },
                },
              },
            }
          : {}),
      },
    },
    fields: [
      ...fields,
      ...(spec.extra ?? []),
      ...createdAt,
      ...(spec.actions ? [rowActions(spec.actions)] : []),
      formActions,
    ],
  };
}

export const withGlobalPanelLayout = (global: GlobalConfig): GlobalConfig => ({
  ...global,
  admin: {
    ...global.admin,
    components: {
      ...global.admin?.components,
      elements: {
        ...global.admin?.components?.elements,
        beforeDocumentControls: ["/components/admin/DocHeading#default"],
      },
    },
  },
  fields: [...withSourceLayout(global.fields), formActions],
});
