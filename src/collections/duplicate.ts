import type { CollectionSlug, FieldHook } from "payload";

/** A copy gets `<slug>-copy`, then `-copy-2`, … so the unique index holds. */
export const copySlug =
  (collection: CollectionSlug): FieldHook =>
  async ({ value, req }) => {
    const base = `${value}-copy`;
    for (let n = 1; ; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const { totalDocs } = await req.payload.count({
        collection,
        where: { slug: { equals: slug } },
        overrideAccess: true,
        req,
      });
      if (totalDocs === 0) return slug;
    }
  };

/** Copies stay off the storefront until edited, as the source panel's replicate did. */
export const hiddenOnCopy: FieldHook = () => false;
