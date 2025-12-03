import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Trash2 } from "lucide-react";
import { useDocumentStore } from "../store/document.store";
import { useWorkspaces } from "../store/workspace.store";
// import { useAuthUser } from "../store/auth.store";

const DocumentEditorPage: React.FC = () => {
  const { workspaceId, documentId } = useParams<{
    workspaceId: string;
    documentId: string;
  }>();
  const navigate = useNavigate();

  //   const user = useAuthUser();
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
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const workspace = workspaces.find((w) => w.id === workspaceId);
  const canEdit =
    workspace?.currentUserRole === "Owner" ||
    workspace?.currentUserRole === "Admin";

  useEffect(() => {
    if (workspaceId && documentId) {
      fetchOne(workspaceId, documentId);
    }
  }, [workspaceId, documentId, fetchOne]);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    }
  }, [document]);

  const handleSave = async () => {
    if (!workspaceId || !documentId || !title.trim()) return;

    setIsSaving(true);
    try {
      await update(workspaceId, documentId, { title, content });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    if (!workspaceId || !documentId) return;

    await remove(workspaceId, documentId);
    navigate(`/workspace/${workspaceId}/documents`);
  };

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
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground p-8">
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
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 p-2 rounded-lg hover:bg-primary/5"
          >
            <ChevronLeft className="h-4 w-4" />
            Documents
          </button>
          <div>
            <h1 className="text-2xl font-semibold">{workspace?.name}</h1>
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
                {isSaving ? "Saving..." : "Save"}
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
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
          className="w-full px-8 py-6 text-3xl font-bold bg-transparent border-b border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          disabled={!canEdit}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your document..."
          className="flex-1 w-full px-8 py-6 text-foreground bg-transparent resize-none focus:outline-none document-editor-textarea"
          disabled={!canEdit}
        />
      </div>
    </div>
  );
};

export default DocumentEditorPage;
