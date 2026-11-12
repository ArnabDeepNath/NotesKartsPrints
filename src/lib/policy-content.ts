const HTML_BLOCK_PATTERN = /<(h[1-6]|p|div|section|ul|ol|blockquote|table|pre|hr)\b/i;
const STRUCTURED_CONTENT_PATTERN = /<(h[1-6]|ul|ol|blockquote|table|pre)\b/i;

const ENTITY_PREFIX = String.fromCharCode(38);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, `${ENTITY_PREFIX}amp;`)
    .replace(/</g, `${ENTITY_PREFIX}lt;`)
    .replace(/>/g, `${ENTITY_PREFIX}gt;`)
    .replace(/"/g, `${ENTITY_PREFIX}quot;`)
    .replace(/'/g, `${ENTITY_PREFIX}#39;`);
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    nbsp: " ",
    amp: ENTITY_PREFIX,
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
  };

  return value
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/gi, (entity) => {
      const normalized = entity.slice(1, -1).toLowerCase();
      return namedEntities[normalized] ?? entity;
    })
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|section|h[1-6]|li)>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  );
}

function removeDuplicateStarterText(value: string, starterHtml?: string): string {
  if (!starterHtml) return value;

  const normalizedValue = value.replace(/\s+/g, " ").trim();
  const normalizedStarter = htmlToPlainText(starterHtml).replace(/\s+/g, " ").trim();
  if (!normalizedValue || !normalizedStarter || normalizedValue === normalizedStarter) {
    return value;
  }

  const exactIndex = normalizedValue.indexOf(normalizedStarter);
  if (exactIndex > 0) {
    return normalizedValue.slice(0, exactIndex).trim();
  }

  // Pasting can alter the final words or tags of the starter. Match its
  // label and stable opening sentence as a fallback when it is appended.
  const labelMatch = starterHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
  const label = labelMatch
    ? decodeHtmlEntities(labelMatch[1].replace(/<[^>]*>/g, "")).trim()
    : "";
  const body = normalizedStarter.slice(label.length).trim();
  const bodyWords = body.split(" ");
  const stableOpening = bodyWords.slice(0, Math.max(0, bodyWords.length - 2)).join(" ");
  const marker = `${label} ${stableOpening}`.trim();
  const markerIndex = marker.length > 20 ? normalizedValue.indexOf(marker) : -1;

  return markerIndex > 0
    ? normalizedValue.slice(0, markerIndex).trim()
    : value;
}

function textToPolicyHtml(value: string): string {
  const lines = value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter(Boolean);

  const flattened = lines.join(" ").replace(/\s+/g, " ").trim();
  if (!flattened) return "";

  const numberedSections = flattened.match(/\b\d{1,2}\.\s+/g) || [];
  if (numberedSections.length >= 2) {
    return flattened
      .split(/(?=\b\d{1,2}\.\s+)/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const numbered = part.match(/^(\d{1,2}\.)\s*([\s\S]+)$/);
        if (numbered) {
          return `<section class="policy-section"><p><strong>${numbered[1]}</strong> ${escapeHtml(numbered[2])}</p></section>`;
        }
        return `<p>${escapeHtml(part)}</p>`;
      })
      .join("");
  }

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

/**
 * Cleans content pasted into the policy rich-text editor without changing the
 * saved settings. Existing structured rich text is preserved; unstructured
 * numbered policies are rebuilt as readable, separate sections.
 */
export function formatPolicyContent(
  input: string,
  defaultStarterContent?: string,
): string {
  let content = String(input || "").trim();

  // A previous editor flow could leave the starter policy after the pasted
  // policy. Remove only that exact duplicate, never the page's real content.
  if (
    defaultStarterContent &&
    content !== defaultStarterContent.trim() &&
    content.includes(defaultStarterContent)
  ) {
    content = content.replace(defaultStarterContent, "").trim();
  }

  content = content
    .replace(/<(p|div|section)[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, "")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br />")
    .replace(/^\s*(?:<br\s*\/?>\s*)+/i, "")
    .replace(/(?:\s*<br\s*\/?>)+\s*$/i, "")
    .trim();

  if (!content) return "";

  const plainText = htmlToPlainText(content);
  const cleanedPlainText = removeDuplicateStarterText(
    plainText,
    defaultStarterContent,
  );
  const numberedSections = cleanedPlainText.match(/\b\d{1,2}\.\s+/g) || [];

  if (
    !STRUCTURED_CONTENT_PATTERN.test(content) &&
    numberedSections.length >= 2
  ) {
    return textToPolicyHtml(cleanedPlainText);
  }

  if (!HTML_BLOCK_PATTERN.test(content)) {
    return textToPolicyHtml(cleanedPlainText);
  }

  return content;
}
