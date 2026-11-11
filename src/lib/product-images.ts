export function parseProductImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value
      .filter((image): image is string => typeof image === "string")
      .map((image) => image.trim())
      .filter(Boolean))];
  }

  if (typeof value !== "string" || !value.trim()) return [];

  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseProductImages(parsed);
    } catch {
      // Support legacy values even if they contain malformed JSON.
    }
  }

  return parseProductImages(trimmed.split(/[\r\n,]+/));
}

export function getProductGalleryImages(product: {
  coverImage?: string | null;
  images?: unknown;
}): string[] {
  return parseProductImages([product.coverImage || "", ...parseProductImages(product.images)]);
}
