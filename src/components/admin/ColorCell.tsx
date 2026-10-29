import type { DefaultServerCellComponentProps } from "payload";

/** The swatch itself in the list, as the filter shows it. */
export default function ColorCell({ cellData }: DefaultServerCellComponentProps) {
  const hex = typeof cellData === "string" ? cellData : "";
  return (
    <span className="color-cell">
      <span className="color-cell__swatch" style={{ background: hex }} />
      {hex}
    </span>
  );
}
