import type { CollapsibleFieldLabelServerComponent } from "payload";

/** A form section's heading with its description underneath, as the source panel's section header. */
const SectionLabel: CollapsibleFieldLabelServerComponent = (props) => {
  const { field } = props;
  const { description } = props as unknown as { description?: string };
  const label = typeof field.label === "string" ? field.label : "";

  return (
    <span className="section-label">
      <span className="section-label__title">{label}</span>
      {description && <span className="section-label__description">{description}</span>}
    </span>
  );
};

export default SectionLabel;
