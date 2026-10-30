import type { DefaultServerCellComponentProps } from "payload";
import { adminLabel } from "@/collections/Commerce";

type Props = DefaultServerCellComponentProps & {
  /** Row field shown in small type under the value, as the source table's column descriptions. */
  note: string;
  notePrefix?: string;
  /** Select values are shown by their panel wording. */
  labels?: boolean;
  /** The value sits in a gray badge, as the source's badge columns. */
  badge?: boolean;
  /** Read this row field instead of the column's own value (for display-only columns). */
  value?: string;
  /** Another row field joined after the value, e.g. series + item. */
  append?: string;
};

export default function NoteCell({ cellData: own, rowData, note, notePrefix = "", labels, badge, value, append }: Props) {
  const cellData = value ? rowData?.[value] : own;
  const show = (raw: unknown) => (labels ? adminLabel(String(raw ?? "")) : String(raw ?? ""));
  const sub = rowData?.[note];
  const empty = cellData === null || cellData === undefined || cellData === "";
  const text = empty ? "—" : [show(cellData), append ? rowData?.[append] : ""].filter(Boolean).join(" ");
  return (
    <span className="note-cell">
      {badge && !empty ? <span className="fi-badge">{text}</span> : text}
      {sub ? <small>{notePrefix + show(sub)}</small> : null}
    </span>
  );
}
