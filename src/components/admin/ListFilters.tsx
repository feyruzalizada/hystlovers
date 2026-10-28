import type { Payload } from "payload";
import { EXPORTS, loadFilters } from "./list-filters";
import ListFiltersClient from "./ListFiltersClient";

/** Ready-made filter dropdowns above a list, like the source panel's table filters. */
export default async function ListFilters({ collectionSlug, payload }: { collectionSlug: string; payload: Payload }) {
  const filters = await loadFilters(collectionSlug, payload);
  const exportPath = EXPORTS[collectionSlug];
  if (filters.length === 0 && !exportPath) return null;
  return <ListFiltersClient filters={filters} exportPath={exportPath} />;
}
