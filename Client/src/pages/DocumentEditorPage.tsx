import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Strikethrough,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import { useDocumentStore } from "../store/document.store";
import { useWorkspaces } from "../store/workspace.store";

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
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const html = editor.getHTML();
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(Boolean).length);

      saveTimeoutRef.current = setTimeout(async () => {
        if (canEdit && workspaceId && documentId && title.trim()) {
          setIsAutoSaving(true);
          try {
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

  useEffect(() => {
    if (workspaceId && documentId) {
      fetchOne(workspaceId, documentId);
    }
  }, [workspaceId, documentId, fetchOne]);

  useEffect(() => {
    if (document && editor && !editor.isDestroyed) {
      setTitle(document.title);
      if (document.content !== editor.getHTML()) {
        editor.commands.setContent(document.content);
      }
    }
  }, [document, editor]);

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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      editor?.destroy();
    };
  }, [editor]);

  const handleDelete = async () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    if (!workspaceId || !documentId) return;

    await remove(workspaceId, documentId);
    navigate(`/workspace/${workspaceId}/documents`);
  };

  interface ToolbarButtonProps {
    onClick: () => void;
    active: boolean;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }

  const ToolbarButton = ({
    onClick,
    active,
    icon: Icon,
    title,
  }: ToolbarButtonProps) => (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center group ${
        active
          ? "bg-linear-to-r from-primary to-accent text-primary-foreground shadow-lg scale-110"
          : "hover:bg-secondary/50 hover:scale-110 active:scale-95"
      }`}
      title={title}
      type="button"
    >
      <Icon className={`h-4 w-4 ${active ? "" : "group-hover:text-primary"}`} />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground animate-fade-in">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <p className="mt-4 text-sm font-semibold">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-destructive/10 backdrop-blur-sm p-8 text-sm text-destructive-foreground shadow-soft animate-slide-up">
        {error}
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
          className="mt-4 px-6 py-3 bg-linear-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105 active:scale-95"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground text-center animate-fade-in">
        <p className="text-xl font-bold mb-3">Document not found</p>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
          className="px-8 py-3 bg-linear-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105 active:scale-95"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 p-2 -ml-1 rounded-xl hover:bg-primary/5 transition-all hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
            Documents
          </button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">
              {workspace?.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isAutoSaving ? (
                <span className="text-primary animate-pulse">
                  Auto-saving...
                </span>
              ) : (
                <span className="text-emerald-500">All changes saved</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/25 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-destructive text-destructive-foreground hover:shadow-lg hover:shadow-destructive/25 font-semibold text-sm transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-card/40 backdrop-blur-xl rounded-3xl shadow-soft overflow-hidden">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
          className="w-full px-8 py-6 text-3xl font-bold bg-transparent focus:outline-none focus:bg-secondary/10 transition-colors resize-none"
          disabled={!canEdit}
          maxLength={255}
        />

        {/* Toolbar */}
        {canEdit && editor && (
          <div className="px-6 py-3 bg-background/50 backdrop-blur-sm flex items-center gap-2 flex-wrap shadow-sm">
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                icon={Bold}
                title="Bold"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                icon={Italic}
                title="Italic"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                icon={Underline}
                title="Underline"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive("strike")}
                icon={Strikethrough}
                title="Strikethrough"
              />
            </div>

            <div className="w-px h-6 bg-border mx-1"></div>

            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                icon={List}
                title="Bullet list"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                icon={ListOrdered}
                title="Numbered list"
              />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                active={editor.isActive("heading", { level: 1 })}
                icon={Heading1}
                title="Heading 1"
              />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                active={editor.isActive("heading", { level: 2 })}
                icon={Heading2}
                title="Heading 2"
              />
            </div>

            <div className="w-px h-6 bg-border mx-1"></div>

            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
                icon={Quote}
                title="Blockquote"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive("codeBlock")}
                icon={Code}
                title="Code block"
              />
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 min-h-[600px] p-8 overflow-auto">
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      {/* Word count & Status */}
      {(wordCount > 0 || isAutoSaving) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground bg-card/30 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-soft">
          <span className="font-semibold">{wordCount} words</span>
          <span className="font-semibold">
            {isAutoSaving ? (
              <span className="text-primary">Auto-saving...</span>
            ) : (
              <span className="text-emerald-500">All changes saved</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentEditorPage;
