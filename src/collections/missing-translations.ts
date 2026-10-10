import type { CollectionSlug, Field } from "payload";

const LOCALES = ["az", "en", "ru"] as const;

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  const root = (value as { root?: { children?: { children?: unknown[] }[] } }).root;
  if (root) return !root.children?.some((node) => (node.children ?? []).length > 0);
  return false;
};

/**
 * A list column naming the languages a record still lacks: a localized field
 * filled in one language but empty in another, which the storefront would
 * otherwise cover silently with the Azerbaijani fallback.
 */
export function missingTranslations(collection: CollectionSlug, fields: string[]): Field {
  return {
    name: "missingTranslations",
    type: "text",
    virtual: true,
    label: "Missing translations",
    admin: { readOnly: true },
    hooks: {
      afterRead: [
        async ({ data, req }) => {
          // Only the panel needs it. The lookup below runs without a user, so it
          // skips this hook itself, as do storefront reads.
          if (req.user?.collection !== "users" || !data?.id) return undefined;
          const doc = (await req.payload.findByID({ collection, id: data.id, locale: "all", depth: 0 })) as unknown as Record<
            string,
            Record<string, unknown> | undefined
          >;

          const missing = LOCALES.filter((locale) =>
            fields.some((field) => {
              const values = doc[field] ?? {};
              return isEmpty(values[locale]) && LOCALES.some((other) => !isEmpty(values[other]));
            }),
          );
          return missing.length > 0 ? missing.map((locale) => locale.toUpperCase()).join(", ") : "—";
        },
      ],
    },
  };
}
