import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ChevronLeft, Trash2, Edit3, FileText } from "lucide-react";
import { useDocumentStore } from "../store/document.store";
import { useWorkspaces, useWorkspaceLoading } from "../store/workspace.store";
import { useAuthUser } from "../store/auth.store";

const DocumentsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const user = useAuthUser();
  const workspaces = useWorkspaces();
  const isWorkspaceLoading = useWorkspaceLoading();

  const {
    list: documents,
    isLoading: isDocsLoading,
    error: docsError,
    fetchAll,
    create,
    remove,
  } = useDocumentStore();

  const [newDocTitle, setNewDocTitle] = useState("");

  const workspace = workspaces.find((w) => w.id === workspaceId);
  const canEdit =
    workspace?.currentUserRole === "Owner" ||
    workspace?.currentUserRole === "Admin";

  useEffect(() => {
    if (workspaceId) {
      fetchAll(workspaceId);
    }
  }, [workspaceId, fetchAll]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !workspaceId || !user?.id) return;

    await create(workspaceId, {
      title: newDocTitle.trim(),
      content: "Start writing your document...",
    });

    setNewDocTitle("");
  };

  const handleOpenDoc = (docId: string) => {
    navigate(`/workspace/${workspaceId}/document/${docId}`);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    if (!workspaceId) return;
    await remove(workspaceId, docId);
  };

  if (isWorkspaceLoading || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-3 text-sm">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors p-2 -ml-1 rounded-lg hover:bg-primary/5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-semibold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">
              Your role:{" "}
              <span className="font-medium capitalize">
                {workspace.currentUserRole}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Create Document Form */}
      {canEdit && (
        <form onSubmit={handleCreateDoc} className="flex gap-2">
          <input
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            placeholder="New document title..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-card shadow-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isDocsLoading}
            maxLength={255}
          />
          <button
            type="submit"
            disabled={isDocsLoading || !newDocTitle.trim()}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="h-4 w-4 mr-1 inline" />
            Create
          </button>
        </form>
      )}

      {/* Error */}
      {docsError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {docsError}
        </div>
      )}

      {/* Documents Grid */}
      {isDocsLoading && !documents.length ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-border bg-card">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading documents...
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-border bg-card text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-1">
            No documents yet
          </h3>
          {canEdit ? (
            <p className="text-sm text-muted-foreground mb-4">
              Create your first document above.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No documents in this workspace.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex flex-col p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 hover:cursor-pointer transition-all duration-200 h-full"
              onClick={() => handleOpenDoc(doc.id)}
              role="button"
              tabIndex={0}
            >
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
                {doc.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-auto line-clamp-2">
                {doc.content.substring(0, 100) || "No content yet..."}...
              </p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Created recently
                </span>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1.5 hover:bg-muted rounded-lg"
                      title="Edit"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc.id);
                      }}
                      className="p-1.5 hover:bg-muted rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
