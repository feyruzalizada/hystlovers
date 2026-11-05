import type { BeforeListTableServerProps } from "payload";
import { loadFilters } from "./list-filters";
import ListToolbarClient, { type Toolbar } from "./ListToolbarClient";

/** The source table's header row: reorder, bulk actions, search, filters and columns. */
export default async function ListToolbar({ collectionSlug, collectionConfig, payload }: BeforeListTableServerProps) {
  const panel = (collectionConfig.admin.custom?.panel ?? {}) as { toolbar?: Toolbar };
  const filters = await loadFilters(collectionSlug, payload);
  return <ListToolbarClient slug={collectionSlug} filters={filters} toolbar={panel.toolbar ?? {}} />;
}
