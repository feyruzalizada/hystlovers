import type { CollectionConfig, Field, GlobalConfig } from "payload";
import type { RowAction } from "@/components/admin/RowActions";
import { rowActions } from "./admin-components";

const SECTION_LABEL = "/components/admin/SectionLabel#default";

/** The source tables' row actions, per collection. */
const ROW_ACTIONS: Record<string, RowAction[]> = {
  orders: ["view"],
  customers: ["view"],
  products: ["edit", "replicate"],
  categories: ["edit"],
  colors: ["edit"],
  fabrics: ["edit"],
  slides: ["edit"],
  "home-sections": ["edit"],
  pages: ["edit"],
  posts: ["edit", "delete"],
  "site-texts": ["edit"],
  "contact-messages": ["view"],
};

/**
 * Moves each form section's description from under the box into its header,
 * where the source panel's sections showed it.
 */
export function withSectionHeaders(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === "collapsible") {
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
        fields: withSectionHeaders(field.fields),
      };
    }
    if (field.type === "row" || field.type === "group") {
      return { ...field, fields: withSectionHeaders(field.fields) } as Field;
    }
    return field;
  });
}

/** Section headers and row actions, the two pieces of the source panel's layout. */
export function withPanelLayout(collection: CollectionConfig): CollectionConfig {
  const actions = ROW_ACTIONS[collection.slug];
  const fields = withSectionHeaders(collection.fields);
  if (!actions) return { ...collection, fields };
  return {
    ...collection,
    admin: {
      ...collection.admin,
      defaultColumns: [...(collection.admin?.defaultColumns ?? []), "rowActions"],
    },
    fields: [...fields, rowActions(actions)],
  };
}

export const withGlobalPanelLayout = (global: GlobalConfig): GlobalConfig => ({
  ...global,
  fields: withSectionHeaders(global.fields),
});
