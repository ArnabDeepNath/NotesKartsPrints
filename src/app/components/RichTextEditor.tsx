"use client";

import { useRef, useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_BUTTONS = [
  { command: "bold", label: "B", title: "Bold", style: "font-bold" },
  { command: "italic", label: "I", title: "Italic", style: "italic" },
  { command: "underline", label: "U", title: "Underline", style: "underline" },
  { command: "strikeThrough", label: "S", title: "Strikethrough", style: "line-through" },
  { type: "separator" as const },
  { command: "formatBlock", arg: "H1", label: "H1", title: "Heading 1" },
  { command: "formatBlock", arg: "H2", label: "H2", title: "Heading 2" },
  { command: "formatBlock", arg: "H3", label: "H3", title: "Heading 3" },
  { type: "separator" as const },
  { command: "insertUnorderedList", label: "• List", title: "Bullet List" },
  { command: "insertOrderedList", label: "1. List", title: "Numbered List" },
  { type: "separator" as const },
  { command: "justifyLeft", label: "⇤", title: "Align Left" },
  { command: "justifyCenter", label: "⇔", title: "Align Center" },
  { command: "justifyRight", label: "⇥", title: "Align Right" },
  { type: "separator" as const },
  { command: "createLink", label: "🔗", title: "Insert Link" },
  { command: "removeFormat", label: "⌫", title: "Clear Formatting" },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlValue, setHtmlValue] = useState(value);

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || `<p>${placeholder || ""}</p>`;
    }
    setHtmlValue(value);
  }, [value, placeholder]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateActiveCommands();
    }
  };

  const updateActiveCommands = () => {
    const active = new Set<string>();
    [
      "bold",
      "italic",
      "underline",
      "strikeThrough",
      "insertUnorderedList",
      "insertOrderedList",
      "justifyLeft",
      "justifyCenter",
      "justifyRight",
    ].forEach((cmd) => {
      try {
        if (document.queryCommandState(cmd)) {
          active.add(cmd);
        }
      } catch {
        // ignore
      }
    });
    setActiveCommands(active);
  };

  const exec = (command: string, arg?: string) => {
    if (mode !== "visual") return;
    if (command === "createLink") {
      const url = window.prompt("Enter link URL:", "https://");
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === "formatBlock") {
      document.execCommand(command, false, arg);
    } else {
      document.execCommand(command, false, arg);
    }
    handleInput();
    editorRef.current?.focus();
  };

  const handleHtmlChange = (newHtml: string) => {
    setHtmlValue(newHtml);
    onChange(newHtml);
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1 mr-2">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={`px-2 py-1 text-xs rounded ${mode === "visual" ? "bg-[#232f3e] text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={`px-2 py-1 text-xs rounded ${mode === "html" ? "bg-[#232f3e] text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            HTML
          </button>
        </div>
        {mode === "visual" && (
          <>
            {TOOLBAR_BUTTONS.map((btn, i) =>
              btn.type === "separator" ? (
                <div key={`sep-${i}`} className="w-px h-5 bg-gray-300 mx-1" />
              ) : (
                <button
                  key={btn.command + (btn.arg || "")}
                  type="button"
                  title={btn.title}
                  onClick={() => exec(btn.command!, btn.arg)}
                  className={`px-2 py-1 text-xs rounded min-w-[28px] transition-colors ${
                    activeCommands.has(btn.command!)
                      ? "bg-[#e47911] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-200"
                  } ${btn.style || ""}`}
                >
                  {btn.label}
                </button>
              ),
            )}
          </>
        )}
      </div>

      {/* Editor Area */}
      {mode === "visual" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateActiveCommands}
          onMouseUp={updateActiveCommands}
          onFocus={updateActiveCommands}
          className="w-full p-3 text-sm text-gray-800 outline-none"
          style={{ minHeight }}
          dir="ltr"
          dangerouslySetInnerHTML={{ __html: value || `<p>${placeholder || "Start typing..."}</p>` }}
        />
      ) : (
        <textarea
          value={htmlValue}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="w-full p-3 text-xs text-gray-800 outline-none font-mono bg-gray-50"
          style={{ minHeight }}
          spellCheck={false}
        />
      )}
    </div>
  );
}
