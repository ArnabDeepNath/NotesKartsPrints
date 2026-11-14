"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { normalizeRichText } from "@/lib/rich-text";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
}

interface ToolbarButtonProps {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

function ToolbarButton({
  label,
  title,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-w-8 rounded px-2 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-[#e47911] text-white"
          : "bg-white text-gray-700 hover:bg-gray-200"
      } ${className}`}
    >
      {label}
    </button>
  );
}

const headingLevel = (editor: Editor): 1 | 2 | 3 | 4 | null => {
  for (const level of [1, 2, 3, 4] as const) {
    if (editor.isActive("heading", { level })) return level;
  }
  return null;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = 240,
  label = "Rich text content",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-[#146eb4] underline",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizeRichText(value),
    editorProps: {
      attributes: {
        "aria-label": label,
        class: "rich-text-content rich-text-editor-content outline-none px-4 py-3 text-sm text-gray-800",
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const nextContent = normalizeRichText(value);
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className="animate-pulse rounded-md border border-gray-200 bg-gray-50"
        style={{ minHeight }}
      />
    );
  }

  const setLink = () => {
    const previousUrl = String(editor.getAttributes("link").href || "");
    const input = window.prompt("Enter link URL", previousUrl || "https://");
    if (input === null) return;

    const url = input.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const href = /^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(url)
      ? url
      : `https://${url}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href })
      .run();
  };

  const addImage = () => {
    const input = window.prompt("Enter an image URL", "https://");
    const src = input?.trim();
    if (!src) return;
    if (!/^(?:https?:\/\/|\/(?!\/))/i.test(src)) {
      window.alert("Use an http(s) image URL or a site-relative path.");
      return;
    }
    editor.chain().focus().setImage({ src }).run();
  };

  const currentHeading = headingLevel(editor);
  const inTable = editor.isActive("table");

  return (
    <div className="rich-text-editor overflow-hidden rounded-md border border-gray-300 bg-white focus-within:border-[#e47911]">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
        <select
          aria-label="Text style"
          value={currentHeading ? `heading-${currentHeading}` : "paragraph"}
          onChange={(event) => {
            const selected = event.target.value;
            if (selected === "paragraph") {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = Number(selected.replace("heading-", "")) as 1 | 2 | 3 | 4;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          className="mr-1 h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 outline-none"
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading-1">Heading 1</option>
          <option value="heading-2">Heading 2</option>
          <option value="heading-3">Heading 3</option>
          <option value="heading-4">Heading 4</option>
        </select>

        <ToolbarButton label="B" title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} className="font-bold" />
        <ToolbarButton label="I" title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} className="italic" />
        <ToolbarButton label="U" title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} className="underline" />
        <ToolbarButton label="S" title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} className="line-through" />
        <span className="mx-1 h-5 w-px bg-gray-300" />

        <ToolbarButton label="• List" title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="1. List" title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="❝" title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <span className="mx-1 h-5 w-px bg-gray-300" />

        <ToolbarButton label="⇤" title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <ToolbarButton label="⇔" title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <ToolbarButton label="⇥" title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <ToolbarButton label="☰" title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
        <span className="mx-1 h-5 w-px bg-gray-300" />

        <ToolbarButton label="Link" title="Insert or edit link" active={editor.isActive("link")} onClick={setLink} />
        <ToolbarButton label="Unlink" title="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} />
        <ToolbarButton label="Image" title="Insert image from URL" onClick={addImage} />
        <ToolbarButton label="Table" title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        <ToolbarButton label="—" title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      </div>

      {inTable && (
        <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-[#fff7ef] p-2">
          <ToolbarButton label="+ Row" title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()} />
          <ToolbarButton label="+ Column" title="Add column after" onClick={() => editor.chain().focus().addColumnAfter().run()} />
          <ToolbarButton label="Delete row" title="Delete current row" onClick={() => editor.chain().focus().deleteRow().run()} />
          <ToolbarButton label="Delete column" title="Delete current column" onClick={() => editor.chain().focus().deleteColumn().run()} />
          <ToolbarButton label="Delete table" title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()} />
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 p-2">
        <div className="flex gap-1">
          <ToolbarButton label="↶ Undo" title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
          <ToolbarButton label="↷ Redo" title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
          <ToolbarButton label="Clear formatting" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
        </div>
        <span className="px-1 text-[11px] text-gray-400">
          Existing content is preserved when you edit it.
        </span>
      </div>
    </div>
  );
}
