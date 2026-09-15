import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

/** CMS rich text as HTML for the `.page-body` renderer. */
export function renderRichText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return convertLexicalToHTML({ data: value as SerializedEditorState });
}
