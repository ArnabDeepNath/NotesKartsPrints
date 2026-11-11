function parseBookImages(value) {
  if (Array.isArray(value)) {
    return [...new Set(value
      .filter((image) => typeof image === "string")
      .map((image) => image.trim())
      .filter(Boolean))];
  }

  if (typeof value !== "string" || !value.trim()) return [];

  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseBookImages(parsed);
    } catch {
      // Treat malformed JSON as a legacy value instead of failing the request.
    }
  }

  return parseBookImages(trimmed.split(/[\r\n,]+/));
}

function serializeBookImages(value) {
  if (value === undefined) return undefined;
  const images = parseBookImages(value);
  return images.length > 0 ? JSON.stringify(images) : null;
}

module.exports = { parseBookImages, serializeBookImages };
