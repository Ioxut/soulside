"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useEffect, useCallback } from "react";

function plainTextToHtml(text: string): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({ active, onClick, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "32px", height: "32px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "6px",
        border: "1px solid",
        borderColor: active ? "rgba(139,92,246,0.6)" : "var(--border)",
        background: active ? "rgba(139,92,246,0.18)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: "13px",
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = "var(--glass-hover)"; }}
      onMouseLeave={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: "1px", height: "20px", background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
        bulletList: {},
        orderedList: {},
        blockquote: false,
        code: false,
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: plainTextToHtml(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: [
          "min-height: 320px",
          "padding: 16px 20px",
          "outline: none",
          "font-size: 15px",
          "line-height: 1.8",
          "color: var(--text-primary)",
          "font-family: inherit",
        ].join(";"),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = plainTextToHtml(value);
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL link:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      background: "var(--glass-1)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center",
        gap: "4px", padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--glass-2)",
      }}>
        <ToolbarButton active={active("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton active={active("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <em style={{ fontStyle: "italic" }}>I</em>
        </ToolbarButton>
        <ToolbarButton active={active("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={active("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          H1
        </ToolbarButton>
        <ToolbarButton active={active("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton active={active("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          H3
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={active("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="3" cy="5" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="10" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="15" r="1.2" fill="currentColor" stroke="none"/>
            <path d="M7 5h11M7 10h11M7 15h11"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton active={active("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M7 5h11M7 10h11M7 15h11"/>
            <text x="1" y="6.5" fontSize="5" fill="currentColor" stroke="none" fontFamily="monospace">1</text>
            <text x="1" y="11.5" fontSize="5" fill="currentColor" stroke="none" fontFamily="monospace">2</text>
            <text x="1" y="16.5" fontSize="5" fill="currentColor" stroke="none" fontFamily="monospace">3</text>
          </svg>
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={active("link")} onClick={setLink} title="Adaugă link">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 11a4 4 0 006 0l2-2a4 4 0 00-6-6L9 4"/>
            <path d="M12 9a4 4 0 00-6 0L4 11a4 4 0 006 6l1-1"/>
          </svg>
        </ToolbarButton>

        <Divider />

        <ToolbarButton active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linie orizontală">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 10h14"/>
          </svg>
        </ToolbarButton>

        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          <ToolbarButton disabled={!editor.can().undo()} active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 8h9a5 5 0 010 10H7"/>
              <path d="M3 8l4-4M3 8l4 4"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton disabled={!editor.can().redo()} active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 8H8a5 5 0 000 10h5"/>
              <path d="M17 8l-4-4M17 8l-4 4"/>
            </svg>
          </ToolbarButton>
        </div>
      </div>

      <div
        style={{ position: "relative" }}
        data-placeholder={!editor.getText() ? (placeholder ?? "Scrie conținutul articolului...") : undefined}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
