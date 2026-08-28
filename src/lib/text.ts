const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&apos;": "'",
  "&#39;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&nbsp;": " ",
  "&quot;": '"',
};

export function toPlainText(value: string | null): string {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(amp|apos|#39|gt|lt|nbsp|quot);/gi,
      (entity) => HTML_ENTITIES[entity.toLowerCase()] || entity
    )
    .replace(/\s+/g, " ")
    .trim();
}
