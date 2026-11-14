import { sanitizeRichText } from "@/lib/rich-text";

interface RichTextContentProps {
  content?: string | null;
  className?: string;
}

export default function RichTextContent({
  content,
  className = "rich-text-content",
}: RichTextContentProps) {
  const html = sanitizeRichText(content);
  if (!html) return null;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
