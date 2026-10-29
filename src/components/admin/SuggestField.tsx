"use client";

import { TextInput, useField, useLocale } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";
import { useEffect, useId, useRef, useState } from "react";

type Source = { collection: string; field: string };

/**
 * A text input that offers earlier values, like the source panel's datalist:
 * a fixed list, or every distinct value already used in a collection field.
 */
const SuggestField: TextFieldClientComponent = (props) => {
  const { field, path } = props;
  const { suggestions = [], from } = props as typeof props & { suggestions?: string[]; from?: Source };
  const { value, setValue, showError } = useField<string>({ path });
  const { code: locale } = useLocale();
  const [used, setUsed] = useState<string[]>([]);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    input.current?.setAttribute("list", listId);
  }, [listId]);

  const collection = from?.collection;
  const name = from?.field;
  useEffect(() => {
    if (!collection || !name) return;
    fetch(`/api/${collection}?limit=0&depth=0&locale=${locale}&select[${name}]=true`, { credentials: "include" })
      .then((response) => response.json())
      .then(({ docs }: { docs: Record<string, unknown>[] }) =>
        setUsed(docs.map((doc) => doc[name]).filter((item): item is string => typeof item === "string" && item !== "")),
      )
      .catch(() => setUsed([]));
  }, [collection, name, locale]);

  const options = [...new Set([...suggestions, ...used])].sort((a, b) => a.localeCompare(b));

  return (
    <TextInput
      path={path}
      inputRef={input}
      label={field.label}
      localized={field.localized}
      required={field.required}
      description={field.admin?.description}
      placeholder={field.admin?.placeholder}
      readOnly={field.admin?.readOnly}
      style={{
        ...(field.admin?.width ? { "--field-width": field.admin.width } : { flex: "1 1 auto" }),
      } as React.CSSProperties}
      showError={showError}
      value={value ?? ""}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
      AfterInput={
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      }
    />
  );
};

export default SuggestField;
