import type { DefaultServerCellComponentProps } from "payload";
import { adminLabel } from "@/collections/Commerce";

type Props = DefaultServerCellComponentProps & {
  /** Row field shown in small type under the value, as the source table's column descriptions. */
  note: string;
  notePrefix?: string;
  /** Select values are shown by their panel wording. */
  labels?: boolean;
};

export default function NoteCell({ cellData, rowData, note, notePrefix = "", labels }: Props) {
  const show = (value: unknown) => (labels ? adminLabel(String(value ?? "")) : String(value ?? ""));
  const sub = rowData?.[note];
  return (
    <span className="note-cell">
      {cellData === null || cellData === undefined || cellData === "" ? "—" : show(cellData)}
      {sub ? <small>{notePrefix + show(sub)}</small> : null}
    </span>
  );
}
