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
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground animate-fade-in">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <p className="mt-4 text-sm font-semibold">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-all p-2 -ml-1 rounded-xl hover:bg-primary/5 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              {workspace.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your role:{" "}
              <span className="font-semibold capitalize text-foreground">
                {workspace.currentUserRole}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Create Document Form */}
      {canEdit && (
        <form onSubmit={handleCreateDoc} className="flex gap-3">
          <input
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            placeholder="New document title..."
            className="flex-1 px-5 py-4 rounded-2xl bg-background/50 backdrop-blur-sm shadow-soft text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:shadow-md transition-all"
            disabled={isDocsLoading}
            maxLength={255}
          />
          <button
            type="submit"
            disabled={isDocsLoading || !newDocTitle.trim()}
            className="px-8 py-4 rounded-2xl bg-linear-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/25 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create
          </button>
        </form>
      )}

      {/* Error */}
      {docsError && (
        <div className="rounded-2xl bg-destructive/10 backdrop-blur-sm px-5 py-4 text-sm text-destructive-foreground shadow-soft animate-slide-up">
          {docsError}
        </div>
      )}

      {/* Documents Grid */}
      {isDocsLoading && !documents.length ? (
        <div className="flex flex-col items-center justify-center h-96 rounded-3xl bg-card/20 backdrop-blur-sm shadow-soft">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
          </div>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Loading documents...
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 rounded-3xl bg-card/20 backdrop-blur-sm text-center shadow-soft">
          <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-muted-foreground mb-2">
            No documents yet
          </h3>
          {canEdit ? (
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Create your first document above to start writing.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground max-w-md">
              No documents in this workspace.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex flex-col p-6 rounded-3xl bg-card/40 backdrop-blur-sm shadow-soft hover:shadow-xl hover:scale-[1.02] hover:cursor-pointer transition-all duration-300 h-full relative overflow-hidden"
              onClick={() => handleOpenDoc(doc.id)}
              role="button"
              tabIndex={0}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10">
                <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors mb-3">
                  {doc.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-auto line-clamp-3 leading-relaxed">
                  {doc.content.substring(0, 120) || "No content yet..."}...
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between relative z-10">
                <span className="text-xs text-muted-foreground font-medium">
                  Created recently
                </span>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 hover:bg-secondary/50 rounded-xl transition-all hover:scale-110 active:scale-95"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc.id);
                      }}
                      className="p-2 hover:bg-destructive/10 rounded-xl transition-all hover:scale-110 active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
