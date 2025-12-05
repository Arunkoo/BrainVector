import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ChevronLeft, FileText, MoreVertical, Clock } from "lucide-react";
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
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      content: "# New Document\n\nStart writing here...",
    });

    setNewDocTitle("");
    setShowCreateForm(false);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Loading workspace...
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{workspace.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role:{" "}
              <span className="font-medium capitalize">
                {workspace.currentUserRole}
              </span>
            </p>
          </div>
        </div>

        {canEdit && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Document
          </button>
        )}
      </div>

      {/* Create Document Form */}
      {showCreateForm && canEdit && (
        <div className="rounded-lg border p-4 animate-slide-up">
          <form onSubmit={handleCreateDoc} className="space-y-4">
            <div>
              <label
                htmlFor="doc-title"
                className="text-sm font-medium mb-1 block"
              >
                Document Title
              </label>
              <input
                id="doc-title"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                maxLength={255}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isDocsLoading || !newDocTitle.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create Document
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {docsError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive-foreground">
          {docsError}
        </div>
      )}

      {/* Documents Grid/List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <span className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isDocsLoading && !documents.length ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-dashed">
            <div className="relative h-6 w-6">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Loading documents...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-dashed p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {canEdit
                ? "Create your first document to start collaborating"
                : "No documents in this workspace yet"}
            </p>
            {canEdit && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                onClick={() => handleOpenDoc(doc.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-primary/10 p-2 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">
                      {doc.title || "Untitled"}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(doc.createdAt)}</span>
                      <span>•</span>
                      <span>
                        {doc.content?.split(/\s+/).filter(Boolean).length || 0}{" "}
                        words
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc.id);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
