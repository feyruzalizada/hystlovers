import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

/**
 * Storefront pages are prerendered, so an edit in the panel has to invalidate
 * them. Content is shared across every route, so the whole layout is dropped.
 */
async function revalidateAll() {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidateAll();
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidateAll();
  return doc;
};

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = async ({ doc }) => {
  await revalidateAll();
  return doc;
};

export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
};
