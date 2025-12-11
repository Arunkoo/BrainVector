// src/pages/DocumentEditorPage.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Save,
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
  Eye,
  MoreVertical,
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
import { useDocumentSocket } from "../hooks/useDocumentSocket";

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
  const [showMenu, setShowMenu] = useState(false);

  const isRemoteUpdate = useRef(false);

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
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      // Only emit when the update was caused by local user (avoid echo)
      if (!isRemoteUpdate.current) {
        // send to socket (throttled inside hook)
        sendDocumentUpdate(editor.getHTML());
        // send cursor as well (lightweight)
        sendCursorUpdate(editor.state.selection.from);
      }

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
      }, 1000);
    },
  });

  // Use our hook: get functions and presence
  const { sendDocumentUpdate, sendCursorUpdate, onlineUsers, safeDisconnect } =
    useDocumentSocket({
      workspaceId,
      documentId,
      onRemoteContent: ({ content }) => {
        if (!editor) return;
        isRemoteUpdate.current = true;
        try {
          if (content !== editor.getHTML()) {
            editor.commands.setContent(content);
          }
        } finally {
          isRemoteUpdate.current = false;
        }
      },
      onRemoteCursor: () => {
        // For now no cursor UI; later you can draw decorations
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

  // disconnect socket on unmount to be explicit (and clear presence)
  useEffect(() => {
    return () => {
      safeDisconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      editor?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleDelete = async () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    if (!workspaceId || !documentId) return;

    await remove(workspaceId, documentId);
    navigate(`/workspace/${workspaceId}/documents`);
  };

  const ToolbarButton = ({
    onClick,
    active,
    icon: Icon,
    title,
  }: {
    onClick: () => void;
    active: boolean;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-muted transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground"
      }`}
      title={title}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Loading document...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground">
        {error}
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
          className="mt-3 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-fade-in">
        <p className="text-lg font-semibold mb-2">Document not found</p>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled document"
              className="w-full text-xl sm:text-2xl font-semibold bg-transparent focus:outline-none placeholder:text-muted-foreground"
              disabled={!canEdit}
              maxLength={255}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{workspace?.name}</span>
              <span>•</span>
              <span>
                {isAutoSaving ? (
                  <span className="text-primary">Saving...</span>
                ) : (
                  <span className="text-emerald-500">Saved</span>
                )}
              </span>
              <span>•</span>
              {/* Presence: display count and simple list */}
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-[140px]">
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      Delete document
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Simple presence list UI (list of userIds) */}
      <div className="flex gap-2 items-center px-4">
        {onlineUsers.slice(0, 6).map((uid) => (
          <div
            key={uid}
            className="px-2 py-1 text-xs bg-primary/10 rounded-md text-primary font-medium"
            title={uid}
          >
            {uid}
          </div>
        ))}
        {onlineUsers.length > 6 && (
          <div className="px-2 py-1 text-xs bg-muted/10 rounded-md text-muted-foreground">
            +{onlineUsers.length - 6} more
          </div>
        )}
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        {/* Toolbar */}
        {canEdit && editor && (
          <div className="border-b p-2 bg-muted/50">
            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex items-center border-r pr-2 mr-2">
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

              <div className="flex items-center border-r pr-2 mr-2">
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  active={editor.isActive("bulletList")}
                  icon={List}
                  title="Bullet list"
                />
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  active={editor.isActive("orderedList")}
                  icon={ListOrdered}
                  title="Numbered list"
                />
              </div>

              <div className="flex items-center border-r pr-2 mr-2">
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

              <div className="flex items-center">
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
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
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 p-4 overflow-auto">
          {editor && <EditorContent editor={editor} />}
        </div>

        {/* Status Bar */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            {!canEdit && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                View only
              </span>
            )}
          </div>
          <div>
            {isAutoSaving ? (
              <span className="text-primary">Auto-saving...</span>
            ) : (
              <span className="text-emerald-500">All changes saved</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorPage;
