import type { CollectionSlug, TextField } from "payload";
import { text } from "payload/shared";
import { copySlug } from "./duplicate";

const TRANSLIT_HINT = "Special characters are converted (ş→s, ç→c, ı→i…).";

/** The source panel's slug input: filled from `sources` while creating, unique, copy-safe. */
export function slugField(
  collection: CollectionSlug,
  sources: string[],
  { description, reserved = [] }: { description: string; reserved?: string[] },
): TextField {
  return {
    name: "slug",
    type: "text",
    required: true,
    unique: true,
    index: true,
    validate: (value, args) =>
      typeof value === "string" && reserved.includes(value)
        ? "This slug is reserved for a built-in collection."
        : text(value, args),
    hooks: { beforeDuplicate: [copySlug(collection)] },
    admin: {
      description: `${description} ${TRANSLIT_HINT}`,
      components: { Field: { path: "/components/admin/SlugField#default", clientProps: { sources } } },
    },
  };
}
