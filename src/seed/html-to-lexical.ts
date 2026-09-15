/**
 * Minimal HTML → Lexical converter for the tags the migrated CMS content
 * actually uses (p, h2/h3, ul/ol/li, blockquote, a, strong/em, br). It exists
 * only for the one-off import; the panel writes Lexical directly from then on.
 */

type LexicalNode = Record<string, unknown>;

const BLOCK = /<(p|h2|h3|ul|ol|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const LIST_ITEM = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

function decode(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function textNode(text: string, format = 0): LexicalNode {
  return {
    type: "text",
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
    version: 1,
  };
}

/** Splits inline markup into text runs, keeping bold/italic and links. */
function inlineNodes(html: string): LexicalNode[] {
  const nodes: LexicalNode[] = [];
  const pattern = /<(strong|b|em|i|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const before = html.slice(cursor, match.index);
    if (before) nodes.push(...plainRuns(before));

    const [, tag, attrs, inner] = match;
    const children = inlineNodes(inner);

    if (tag.toLowerCase() === "a") {
      const href = /href=["']([^"']+)["']/i.exec(attrs)?.[1] ?? "#";
      nodes.push({
        type: "link",
        version: 3,
        format: "",
        indent: 0,
        direction: "ltr",
        fields: { linkType: "custom", newTab: false, url: href },
        children: children.length ? children : [textNode(decode(inner))],
      });
    } else {
      const format = tag.toLowerCase() === "strong" || tag.toLowerCase() === "b" ? 1 : 2;
      const runs = children.length ? children : [textNode(decode(inner))];
      nodes.push(
        ...runs.map((node) =>
          node.type === "text" ? { ...node, format: (node.format as number) | format } : node,
        ),
      );
    }

    cursor = match.index + match[0].length;
  }

  const rest = html.slice(cursor);
  if (rest) nodes.push(...plainRuns(rest));

  return nodes.length ? nodes : [textNode("")];
}

function plainRuns(html: string): LexicalNode[] {
  const text = decode(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
  return text ? [textNode(text)] : [];
}

function paragraph(children: LexicalNode[], tag?: string): LexicalNode {
  const base = {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
  if (tag) return { ...base, type: "heading", tag };
  return { ...base, type: "paragraph", textFormat: 0, textStyle: "" };
}

function listNode(html: string, ordered: boolean): LexicalNode {
  const items: LexicalNode[] = [];
  let match: RegExpExecArray | null;
  LIST_ITEM.lastIndex = 0;

  while ((match = LIST_ITEM.exec(html)) !== null) {
    const inner = match[1].replace(/<\/?p\b[^>]*>/gi, "");
    items.push({
      type: "listitem",
      children: inlineNodes(inner),
      checked: undefined,
      direction: "ltr",
      format: "",
      indent: 0,
      value: items.length + 1,
      version: 1,
    });
  }

  return {
    type: "list",
    listType: ordered ? "number" : "bullet",
    start: 1,
    tag: ordered ? "ol" : "ul",
    children: items,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

export function htmlToLexical(html: string | null | undefined) {
  const children: LexicalNode[] = [];
  const source = (html ?? "").trim();
  let match: RegExpExecArray | null;
  BLOCK.lastIndex = 0;

  while ((match = BLOCK.exec(source)) !== null) {
    const [, tag, inner] = match;
    switch (tag.toLowerCase()) {
      case "p":
        children.push(paragraph(inlineNodes(inner)));
        break;
      case "h2":
      case "h3":
        children.push(paragraph(inlineNodes(inner), tag.toLowerCase()));
        break;
      case "ul":
        children.push(listNode(inner, false));
        break;
      case "ol":
        children.push(listNode(inner, true));
        break;
      case "blockquote":
        children.push({
          type: "quote",
          children: inlineNodes(inner.replace(/<\/?p\b[^>]*>/gi, "")),
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
        });
        break;
    }
  }

  // Content with no block tags at all still needs to survive the import.
  if (children.length === 0 && source) children.push(paragraph(plainRuns(source)));

  return {
    root: {
      type: "root",
      children: children.length ? children : [paragraph([textNode("")])],
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}
