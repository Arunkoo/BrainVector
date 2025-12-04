import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Trash2,
  Bold,
  Italic,
  Underline, // Lucide Icon
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Strikethrough, // Added
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// ✅ CRITICAL FIX: Renamed Tiptap extension to avoid collision with Lucide Icon
import UnderlineExtension from "@tiptap/extension-underline";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import { useDocumentStore } from "../store/document.store";
import { useWorkspaces } from "../store/workspace.store";

// Assuming types from store
// type DocumentType = { id: string; title: string; content: string };

const DocumentEditorPage: React.FC = () => {
  const { workspaceId, documentId } = useParams<{
    workspaceId: string;
    documentId: string;
  }>();
  const navigate = useNavigate();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const workspaces = useWorkspaces();
  const {
    current: document,
    isLoading,
    error,
    fetchOne,
    update,
    remove,
  } = useDocumentStore();

  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const workspace = workspaces.find((w) => w.id === workspaceId);
  const canEdit =
    workspace?.currentUserRole === "Owner" ||
    workspace?.currentUserRole === "Admin";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions that will be configured separately
        underline: false,
        blockquote: false,
        codeBlock: false,
        heading: false,
      }),
      UnderlineExtension,
      Blockquote,
      CodeBlock,
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({ openOnClick: false }),
    ],
    editable: canEdit,
    content: "", // Start with empty content
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const html = editor.getHTML();
      // Use getText() for a more accurate word count
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(Boolean).length);

      // Debounced autosave
      saveTimeoutRef.current = setTimeout(async () => {
        if (canEdit && workspaceId && documentId && title.trim()) {
          setIsAutoSaving(true);
          try {
            // NOTE: If title state has not updated yet, it will use the old title
            await update(workspaceId, documentId, {
              title,
              content: html,
            });
          } finally {
            setIsAutoSaving(false);
          }
        }
      }, 2000);
    },
  });

  // Fetch document on load
  useEffect(() => {
    if (workspaceId && documentId) {
      fetchOne(workspaceId, documentId);
    }
  }, [workspaceId, documentId, fetchOne]);

  // Update editor content safely when document loads
  useEffect(() => {
    if (document && editor && !editor.isDestroyed) {
      setTitle(document.title);
      // Only set content if it's different to avoid re-rendering issues
      if (document.content !== editor.getHTML()) {
        editor.commands.setContent(document.content);
      }
    }
  }, [document, editor]);

  // Manual save handler
  const handleSave = useCallback(async () => {
    if (
      !workspaceId ||
      !documentId ||
      !title.trim() ||
      !editor ||
      editor.isDestroyed
    )
      return;

    setIsSaving(true);
    try {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      await update(workspaceId, documentId, {
        title,
        content: editor.getHTML(),
      });
    } finally {
      setIsSaving(false);
    }
  }, [workspaceId, documentId, title, editor, update]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      editor?.destroy(); // Clean up Tiptap instance
    };
  }, [editor]);

  const handleDelete = async () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    if (!workspaceId || !documentId) return;

    await remove(workspaceId, documentId);
    navigate(`/workspace/${workspaceId}/documents`);
  };

  // Toolbar command handlers
  const setBold = () => editor?.chain().focus().toggleBold().run();
  const setItalic = () => editor?.chain().focus().toggleItalic().run();
  const setUnderline = () => editor?.chain().focus().toggleUnderline().run();
  // Uses StarterKit's built-in strike extension
  const setStrike = () => editor?.chain().focus().toggleStrike().run();
  const setBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const setOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  const setBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const setCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const setHeading = (level: 1 | 2 | 3) =>
    editor?.chain().focus().toggleHeading({ level }).run();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-3 text-sm">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-sm text-destructive-foreground">
        {error}
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center">
        <p className="text-lg font-semibold mb-2">Document not found</p>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 p-2 -ml-1 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Documents
          </button>
          <div>
            <h1 className="text-2xl font-semibold">{workspace?.name}</h1>
            <p className="text-xs text-muted-foreground">
              {isAutoSaving ? "Auto-saving..." : "All changes auto-saved"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Now"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm font-medium text-sm transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
          className="w-full px-8 py-6 text-3xl font-bold bg-transparent border-b border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          disabled={!canEdit}
          maxLength={255}
        />

        {/* Toolbar */}
        {canEdit && editor && (
          <div className="border-b border-border px-6 py-3 bg-background/80 backdrop-blur-sm flex items-center gap-1 flex-wrap shadow-sm">
            {/* Text formatting */}
            <div className="flex items-center gap-1">
              <button
                onClick={setBold}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("bold")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Bold (⌘+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={setItalic}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("italic")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Italic (⌘+I)"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={setUnderline}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("underline")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Underline (⌘+U)"
              >
                <Underline className="h-4 w-4" />
              </button>
              <button
                onClick={setStrike}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("strike")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </button>
            </div>

            {/* Lists & Blocks */}
            <div className="flex items-center gap-1">
              <button
                onClick={setBulletList}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("bulletList")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Bullet list (⌘+Shift+8)"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={setOrderedList}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("orderedList")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Numbered list (⌘+Shift+7)"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                onClick={() => setHeading(1)}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setHeading(2)}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </button>
            </div>

            {/* Blocks */}
            <div className="flex items-center gap-1">
              <button
                onClick={setBlockquote}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("blockquote")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Blockquote"
              >
                <Quote className="h-4 w-4" />
              </button>
              <button
                onClick={setCodeBlock}
                className={`p-2.5 rounded-xl hover:bg-muted transition-all flex items-center justify-center ${
                  editor.isActive("codeBlock")
                    ? "bg-primary text-primary-foreground shadow-md"
                    : ""
                }`}
                title="Code block"
              >
                <Code className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 min-h-[500px] p-8 overflow-auto prose prose-headings:font-bold prose-headings:tracking-tight max-w-none">
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      {/* Word count & Status */}
      {(wordCount > 0 || isAutoSaving) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span className="font-medium">
            {isAutoSaving ? "Auto-saving..." : "All changes saved"}
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentEditorPage;
