"use client";

import { TextField, useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";
import { useEffect, useRef } from "react";
import { slugify } from "@/lib/slug";

/**
 * While creating, the slug follows its source fields until it is typed by
 * hand; clearing it resumes. Saved records keep their slug so links stay put.
 */
const SlugField: TextFieldClientComponent = (props) => {
  const { sources, prefix } = props as typeof props & { sources: string[]; prefix?: string };
  const { id } = useDocumentInfo();
  const { value, setValue } = useField<string>({ path: props.path });
  const source = useFormFields(([fields]) => sources.map((name) => fields[name]?.value ?? "").join(" "));
  const auto = useRef("");

  useEffect(() => {
    if (id || (value && value !== auto.current)) return;
    auto.current = slugify(String(source));
    if (auto.current !== (value ?? "")) setValue(auto.current);
  }, [id, source, value, setValue]);

  if (!prefix) return <TextField {...props} />;
  return (
    <div className="slug-field" style={{ "--prefix-width": `${prefix.length + 3}ch` } as React.CSSProperties}>
      <span className="slug-field__prefix">{prefix}</span>
      <TextField {...props} />
    </div>
  );
};

export default SlugField;
