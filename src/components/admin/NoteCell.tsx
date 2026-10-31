import type { DefaultServerCellComponentProps } from "payload";
import { adminLabel } from "@/collections/Commerce";

type Props = DefaultServerCellComponentProps & {
  /** Row field shown in small type under the value, as the source table's column descriptions. */
  note?: string;
  notePrefix?: string;
  /** Select values are shown by their panel wording. */
  labels?: boolean;
  /** The value sits in a badge, as the source's badge columns: gray, or the Amber primary. */
  badge?: boolean | "primary";
  /** Read this row field instead of the column's own value (for display-only columns). */
  value?: string;
  /** Text put before the value, e.g. "/pages/". */
  prefix?: string;
  /** Another row field joined after the value, e.g. series + item. */
  append?: string;
};

export default function NoteCell({
  cellData: own,
  rowData,
  note,
  notePrefix = "",
  labels,
  badge,
  value,
  prefix = "",
  append,
}: Props) {
  const cellData = value ? rowData?.[value] : own;
  const show = (raw: unknown) => (labels ? adminLabel(String(raw ?? "")) : String(raw ?? ""));
  const empty = cellData === null || cellData === undefined || cellData === "";
  const text = empty ? "—" : prefix + [show(cellData), append ? rowData?.[append] : ""].filter(Boolean).join(" ");
  const sub = note ? rowData?.[note] : undefined;
  const subText = sub ? notePrefix + show(sub) : "";
  return (
    <span className="note-cell">
      {badge && !empty ? <span className={`fi-badge${badge === "primary" ? " fi-badge--primary" : ""}`}>{text}</span> : text}
      {subText && subText !== text ? <small>{subText}</small> : null}
    </span>
  );
}
