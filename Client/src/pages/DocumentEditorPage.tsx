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
  Users,
  ChevronDown,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import { useDocumentStore } from "../store/document.store";
import { useWorkspaceStore } from "../store/workspace.store";
import { useDocumentSocket } from "../hooks/useDocumentSocket";

const DocumentEditorPage: React.FC = () => {
  const { workspaceId, documentId } = useParams<{
    workspaceId: string;
    documentId: string;
  }>();
  const navigate = useNavigate();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const getWorkspacePermission = useWorkspaceStore(
    (state) => state.getWorkspacePermission
  );

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
  const [userRole, setUserRole] = useState<"Owner" | "Editor" | "Viewer">(
    "Viewer"
  );

  const isRemoteUpdate = useRef(false);

  // Get current workspace
  const workspace = workspaces.find((w) => w.id === workspaceId);

  // Get user role
  useEffect(() => {
    if (workspaceId) {
      getWorkspacePermission(workspaceId).then((role) => {
        if (role) setUserRole(role);
      });
    }
  }, [workspaceId, getWorkspacePermission]);

  const canEdit = userRole === "Owner" || userRole === "Editor";

  // Initialize socket
  const {
    onlineUsers,
    isConnected,
    sendDocumentUpdate,
    joinDocument,
    leaveDocument,
  } = useDocumentSocket({
    workspaceId,
    documentId,
    onContentChange: ({ content, userId }) => {
      if (!editor || !userId) return;
      isRemoteUpdate.current = true;
      try {
        if (content !== editor.getHTML()) {
          editor.commands.setContent(content);
        }
      } finally {
        isRemoteUpdate.current = false;
      }
    },
  });

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
      if (!canEdit) return;

      // Only emit when the update was caused by local user
      if (!isRemoteUpdate.current) {
        // Send to socket
        sendDocumentUpdate?.(editor.getHTML());
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

  // Join/leave document room
  useEffect(() => {
    if (workspaceId && documentId && joinDocument) {
      joinDocument(documentId, workspaceId);
    }

    return () => {
      if (documentId && leaveDocument) {
        leaveDocument(documentId);
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      editor?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, documentId, joinDocument, leaveDocument]);

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
    if (
      !window.confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    )
      return;
    if (!workspaceId || !documentId) return;

    try {
      await remove(workspaceId, documentId);
      navigate(`/workspace/${workspaceId}/documents`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    }
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
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? "bg-blue-100 text-blue-600" : "text-gray-600"
      }`}
      title={title}
      type="button"
      disabled={!canEdit}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
        <p className="mt-4 text-sm text-gray-600">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Document not found
          </h3>
          <p className="text-gray-600 mb-6">
            The document you're looking for doesn't exist or you don't have
            access.
          </p>
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/workspace/${workspaceId}/documents`)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors p-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="flex-1 min-w-0">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled document"
                  className="w-full text-xl sm:text-2xl font-semibold bg-transparent focus:outline-none placeholder:text-gray-400"
                  disabled={!canEdit}
                  maxLength={255}
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{workspace?.name}</span>
                  <span>•</span>
                  <span
                    className={`font-medium ${
                      userRole === "Owner"
                        ? "text-purple-600"
                        : userRole === "Editor"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {userRole}
                  </span>
                  <span>•</span>
                  <span>
                    {isAutoSaving ? (
                      <span className="text-blue-600">Saving...</span>
                    ) : (
                      <span className="text-green-600">Saved</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Online Presence */}
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div className="relative group">
                  <button className="flex items-center gap-1 text-sm text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>{onlineUsers.length}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg p-2 hidden group-hover:block z-10">
                    <h4 className="font-semibold text-sm mb-2 px-2">
                      Online Users
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {onlineUsers.length > 0 ? (
                        onlineUsers.map((userId, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="truncate">{userId}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No other users online
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {canEdit && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
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
        </div>
      </div>

      {/* Editor Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Toolbar */}
          {canEdit && editor && (
            <div className="border-b bg-gray-50 p-2">
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
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
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
                    onClick={() =>
                      editor.chain().focus().toggleCodeBlock().run()
                    }
                    active={editor.isActive("codeBlock")}
                    icon={Code}
                    title="Code block"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Editor Content */}
          <div className="min-h-[500px]">
            {editor ? (
              <EditorContent editor={editor} />
            ) : !canEdit ? (
              <div className="p-8 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  View Only
                </h3>
                <p className="text-gray-600">
                  You have view-only access to this document.
                </p>
              </div>
            ) : null}
          </div>

          {/* Status Bar */}
          <div className="border-t px-4 py-2 flex items-center justify-between text-sm text-gray-500 bg-gray-50">
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
                <span className="text-blue-600">Auto-saving...</span>
              ) : (
                <span className="text-green-600">All changes saved</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorPage;
