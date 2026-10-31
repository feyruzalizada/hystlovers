import { FieldLabel } from "@payloadcms/ui";

type Props = {
  /** The heading the source table gave this column. */
  listLabel: string;
  field?: { label?: unknown; localized?: boolean; required?: boolean };
  clientField?: { label?: unknown };
  /** Only set when the label is drawn inside a form. */
  path?: string;
};

/**
 * A field label that reads differently in the list than in the form, as the
 * source panel's columns did (e.g. "Pre-order" over "Sell as pre-order").
 */
export default function ColumnLabel({ listLabel, field, path }: Props) {
  if (!path) return <>{listLabel}</>;
  return (
    <FieldLabel
      label={typeof field?.label === "string" ? field.label : listLabel}
      localized={field?.localized}
      path={path}
      required={field?.required}
    />
  );
}
