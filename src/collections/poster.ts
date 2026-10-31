import type { Field, UploadField } from "payload";

/**
 * A banner in four screen sizes. The desktop file keeps the field's plain name
 * (`image`, `allProducts`, …) so banners set before the other sizes existed
 * stay where they are; the others add a suffix.
 */
export const POSTER_SIZES = [
  { suffix: "", label: "Desktop", range: "1024–1919 px wide", file: "3840 × 352" },
  { suffix: "Wide", label: "Large screens", range: "1920 px and wider", file: "5120 × 352" },
  { suffix: "Tablet", label: "Tablet", range: "640–1023 px wide", file: "2048 × 352" },
  { suffix: "Mobile", label: "Phone", range: "up to 639 px wide", file: "860 × 280" },
] as const;

const upload = (name: string, label: string, description: string, required = false): UploadField => ({
  name,
  type: "upload",
  relationTo: "media",
  label,
  required,
  admin: { width: "50%", description },
});

/** The four uploads of one banner, two to a row. Only the desktop file can be required. */
export function posterFields(base: string, { required = false } = {}): Field[] {
  const [desktop, wide, tablet, mobile] = POSTER_SIZES.map((size) =>
    upload(
      `${base}${size.suffix}`,
      size.label,
      `For screens ${size.range}. File ${size.file} px.`,
      required && size.suffix === "",
    ),
  );
  return [
    { type: "row", fields: [desktop, wide] },
    { type: "row", fields: [tablet, mobile] },
  ];
}

export const POSTER_HINT =
  "Shown behind the page title. A size left empty takes the nearest one that is set; without any, the plain grey band stays.";
