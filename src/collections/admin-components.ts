export const LIST_FILTERS = "/components/admin/ListFilters#default";
export const TOGGLE_CELL = "/components/admin/ToggleCell#default";

/** A list cell with another field of the row underneath, as the source table's column descriptions. */
export const noteCell = (note: string, extra: { notePrefix?: string; labels?: boolean } = {}) => ({
  path: "/components/admin/NoteCell#default",
  clientProps: { note, ...extra },
});
