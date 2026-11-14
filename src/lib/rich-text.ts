import sanitizeHtml from "sanitize-html";

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const ENTITY_PREFIX = String.fromCharCode(38);

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, `${ENTITY_PREFIX}amp;`)
    .replace(/</g, `${ENTITY_PREFIX}lt;`)
    .replace(/>/g, `${ENTITY_PREFIX}gt;`)
    .replace(/"/g, `${ENTITY_PREFIX}quot;`)
    .replace(/'/g, `${ENTITY_PREFIX}#39;`);

/** Convert legacy plain-text content to paragraphs without changing its wording. */
export const normalizeRichText = (value?: string | null) => {
  const content = String(value || "").trim();
  if (!content) return "";
  if (HTML_TAG_PATTERN.test(content)) return content;

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
};

export const sanitizeRichText = (value?: string | null) =>
  sanitizeHtml(normalizeRichText(value), {
    allowedTags: [
      "p",
      "br",
      "div",
      "span",
      "section",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "a",
      "hr",
      "img",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "colgroup",
      "col",
    ],
    allowedAttributes: {
      "*": ["style", "class"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      col: ["span", "width"],
      colgroup: ["span", "width"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(?:left|right|center|justify)$/],
        width: [/^\d+(?:\.\d+)?(?:px|%)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank"
            ? { rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  });

export const hasRichTextContent = (value?: string | null) =>
  sanitizeHtml(value || "", {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;

export const richTextToPlainText = (value?: string | null) =>
  sanitizeHtml(
    String(value || "").replace(
      /<\/(?:p|div|section|h[1-6]|li|blockquote|tr)>/gi,
      "$& ",
    ),
    {
      allowedTags: [],
      allowedAttributes: {},
    },
  )
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
