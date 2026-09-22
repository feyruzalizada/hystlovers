import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

const WRAPPER_OPEN = '<div class="payload-richtext">';

/**
 * CMS rich text as HTML for the `.page-body` renderer. Payload wraps its
 * output in a div the source shop never had, so it is peeled off.
 */
export function renderRichText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  let html = convertLexicalToHTML({ data: value as SerializedEditorState });
  if (html.startsWith(WRAPPER_OPEN) && html.endsWith("</div>")) {
    html = html.slice(WRAPPER_OPEN.length, -"</div>".length);
  }
  // Lists come out tagged `list-bullet`/`list-number`; the source shop styled
  // plain <ul> and <ol>, and `.page-body` still does.
  return html.replace(/ class="list-(?:bullet|number)"/g, "");
}
