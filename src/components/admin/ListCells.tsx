import type { BasePayload, DefaultServerCellComponentProps } from "payload";

// The source panel's table columns: image thumbnails, money with the old
// price underneath, badges, and yes/no icons.

const money = new Intl.NumberFormat("en", { style: "currency", currency: "AZN" });
const plain = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const idOf = (value: unknown) =>
  value && typeof value === "object" && "id" in value ? (value as { id: number }).id : (value as number | undefined);

async function thumbnail(payload: BasePayload, value: unknown) {
  const id = idOf(value);
  if (!id) return null;
  const media = await payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true }).catch(() => null);
  const src = media?.sizes?.card?.url || media?.url;
  // A small panel thumbnail of an already resized file; next/image adds nothing here.
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" className="product-thumb" /> : null;
}

/** The product's first image. */
export async function ThumbnailCell({ rowData, payload }: DefaultServerCellComponentProps) {
  return thumbnail(payload, (rowData?.images as { image?: unknown }[] | undefined)?.[0]?.image);
}

/** A single upload column, e.g. a post's cover or a slide's image. */
export async function ImageCell({ cellData, payload }: DefaultServerCellComponentProps) {
  return thumbnail(payload, cellData);
}

export function PriceCell({ cellData, rowData }: DefaultServerCellComponentProps) {
  if (cellData === null || cellData === undefined) return <>—</>;
  const was = rowData?.compareAtPrice as number | null | undefined;
  return (
    <span className="note-cell">
      {money.format(Number(cellData))}
      {was ? <small>was {plain.format(was)}</small> : null}
    </span>
  );
}

export function StockCell({ cellData, rowData }: DefaultServerCellComponentProps) {
  if (!cellData || cellData === "—") return <>—</>;
  const sizes = (rowData?.sizes ?? []) as { quantity?: number | null }[];
  const tracked = sizes.filter((row) => row.quantity !== null && row.quantity !== undefined);
  const soldOut = tracked.length > 0 && tracked.every((row) => Number(row.quantity) <= 0);
  return <span className={`fi-badge${soldOut ? " fi-badge--danger" : ""}`}>{String(cellData)}</span>;
}

export async function CategoryBadgeCell({ cellData, payload }: DefaultServerCellComponentProps) {
  const id = idOf(cellData);
  if (!id) return <>—</>;
  const category = await payload
    .findByID({ collection: "categories", id, depth: 0, overrideAccess: true })
    .catch(() => null);
  return category ? <span className="fi-badge">{category.name}</span> : <>—</>;
}

/** A green tick or a red cross, as the source's boolean icon columns. */
export function BooleanIconCell({ cellData }: DefaultServerCellComponentProps) {
  const on = Boolean(cellData);
  return (
    <svg
      className={`boolean-icon boolean-icon--${on ? "on" : "off"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width="24"
      height="24"
      aria-label={on ? "Yes" : "No"}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={
          on
            ? "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            : "m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        }
      />
    </svg>
  );
}
