import type { TextField } from "payload";

/** Wires a text field to SuggestField: fixed suggestions and/or the values the products already use. */
export function suggest(
  field: TextField,
  placeholder: string | undefined,
  { suggestions, from }: { suggestions?: string[]; from?: string },
  width = "33%",
): TextField {
  return {
    ...field,
    admin: {
      ...field.admin,
      width,
      placeholder,
      components: {
        Field: {
          path: "/components/admin/SuggestField#default",
          clientProps: { suggestions, from: from ? { collection: "products", field: from } : undefined },
        },
      },
    },
  } as TextField;
}
