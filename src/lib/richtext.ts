import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

const WRAPPER_OPEN = '<div class="payload-richtext">';

/**
 * CMS rich text as HTML for the `.page-body` renderer. Payload wraps its
 * output in a div the source shop never had, so it is peeled off.
 */
export function renderRichText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const html = convertLexicalToHTML({ data: value as SerializedEditorState });
  if (html.startsWith(WRAPPER_OPEN) && html.endsWith("</div>")) {
    return html.slice(WRAPPER_OPEN.length, -"</div>".length);
  }
  return html;
}
