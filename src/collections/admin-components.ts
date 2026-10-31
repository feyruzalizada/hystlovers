import type { UIField } from "payload";
import type { RowAction } from "@/components/admin/RowActions";

export const LIST_FILTERS = "/components/admin/ListFilters#default";
export const TOGGLE_CELL = "/components/admin/ToggleCell#default";

/** A list cell with another field of the row underneath, as the source table's column descriptions. */
export const noteCell = (
  note: string | undefined,
  extra: {
    notePrefix?: string;
    labels?: boolean;
    badge?: boolean | "primary";
    value?: string;
    prefix?: string;
    append?: string;
  } = {},
) => ({
  path: "/components/admin/NoteCell#default",
  clientProps: { note, ...extra },
});

export const listCell = (
  name:
    | "ThumbnailCell"
    | "ImageCell"
    | "PriceCell"
    | "StockCell"
    | "CategoryBadgeCell"
    | "CategoryPathBadgeCell"
    | "BooleanIconCell"
    | "CountCell"
    | "ScheduleCell"
    | "SectionTitleCell"
    | "ReadStatusCell"
    | "StockProductCell"
    | "TranslatedCell",
) =>
  `/components/admin/ListCells#${name}`;

/** The source table's row actions column (Edit / View / Replicate / Delete). */
export const rowActions = (actions: RowAction[]): UIField => ({
  name: "rowActions",
  type: "ui",
  label: " ",
  admin: {
    components: { Cell: { path: "/components/admin/RowActions#default", clientProps: { actions } } },
  },
});
