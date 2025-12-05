import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../store/auth.store";

import {
  useWorkspaces,
  useWorkspaceLoading,
  useWorkspaceError,
  useFetchWorkspaces,
  useCreateWorkspace,
  useInviteUser,
} from "../store/workspace.store";
import type { WorkspaceRole } from "../api/workspace.api";

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  Owner: "bg-gradient-to-r from-rose-500 to-pink-500",
  Admin: "bg-gradient-to-r from-amber-500 to-orange-500",
  Editor: "bg-gradient-to-r from-emerald-500 to-green-500",
  Viewer: "bg-gradient-to-r from-sky-500 to-blue-500",
};

const ROLE_LABELS: WorkspaceRole[] = ["Owner", "Admin", "Editor", "Viewer"];

const Dashboard: React.FC = () => {
  const user = useAuthUser();
  const userId = user?.id;
  const navigate = useNavigate();

  const workspaces = useWorkspaces();
  const isLoading = useWorkspaceLoading();
  const error = useWorkspaceError();

  const fetchWorkspaces = useFetchWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const inviteUser = useInviteUser();

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (userId && !initialLoadDone) {
      fetchWorkspaces();
      setInitialLoadDone(true);
    }
  }, [userId, initialLoadDone, fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    await createWorkspace({ name: newWorkspaceName.trim() });
    setNewWorkspaceName("");
  };

  const handleInvite = async (workspaceId: string) => {
    const email = prompt("Invite user email");
    if (!email) return;

    await inviteUser(workspaceId, email);
    alert("Invite sent (if email exists).");
  };

  const filteredWorkspaces =
    roleFilter === "all"
      ? workspaces
      : workspaces.filter((w) => w.currentUserRole === roleFilter);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, workspaces.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredWorkspaces.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-full bg-transparent text-foreground">
      <div className="mx-auto max-w-7xl space-y-8 animate-fade-in">
        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">
                {user?.name || user?.email}
              </span>
            </p>
          </div>

          {/* Create workspace */}
          <form
            onSubmit={handleCreate}
            className="flex w-full max-w-md items-stretch rounded-2xl bg-background/50 backdrop-blur-sm shadow-soft overflow-hidden"
          >
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="flex-1 bg-transparent px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={isLoading}
              aria-label="Workspace name"
            />
            <button
              type="submit"
              disabled={isLoading || !newWorkspaceName.trim()}
              className="
                mx-1.5 my-1.5 flex items-center justify-center rounded-xl px-6 text-sm font-semibold
                bg-linear-to-r from-primary to-accent text-primary-foreground
                hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95
                disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100
                transition-all duration-300
              "
              aria-label="Create new workspace"
            >
              Create
            </button>
          </form>
        </header>

        {error && (
          <div className="rounded-2xl bg-destructive/10 backdrop-blur-sm px-5 py-4 text-sm text-destructive-foreground shadow-soft animate-slide-up">
            {error}
          </div>
        )}

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-4 sm:gap-5">
          <div className="rounded-2xl bg-card/30 backdrop-blur-sm px-5 py-4 shadow-soft hover:shadow-md transition-all duration-300 min-h-[90px] flex items-center group">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Workspaces
              </p>
              <p className="text-2xl sm:text-3xl font-bold gradient-text group-hover:scale-110 transition-transform duration-300">
                {workspaces.length}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              className="w-full rounded-2xl bg-card/30 backdrop-blur-sm px-5 py-4 shadow-soft hover:shadow-md transition-all duration-300 flex items-center justify-between min-h-[90px] group"
              onClick={() => setFilterOpen((open) => !open)}
            >
              <div className="space-y-1 text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Filter
                </p>
                <p className="text-sm font-bold capitalize text-foreground group-hover:text-primary transition-colors">
                  {roleFilter === "all" ? "All" : roleFilter}
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${
                  filterOpen
                    ? "rotate-180 text-primary"
                    : "group-hover:text-primary"
                }`}
              />
            </button>

            {filterOpen && (
              <div className="absolute z-40 top-full left-0 mt-2 w-full rounded-2xl bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden animate-scale-in">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-4 py-3 text-left text-sm font-semibold transition-all ${
                      roleFilter === "all"
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    All roles
                  </button>
                  {ROLE_LABELS.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setRoleFilter(role);
                        setFilterOpen(false);
                      }}
                      className={`block w-full px-4 py-3 text-left text-sm font-semibold capitalize transition-all ${
                        roleFilter === role
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card/30 backdrop-blur-sm px-5 py-4 shadow-soft hover:shadow-md transition-all duration-300 min-h-[90px] flex items-center">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </p>
              <p className="text-sm font-bold">
                {isLoading ? (
                  <span className="text-primary animate-pulse">Syncing</span>
                ) : (
                  <span className="text-emerald-500">Ready</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Workspaces + pagination */}
        <section className="space-y-5">
          {isLoading && !workspaces.length && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-card/20 backdrop-blur-sm px-8 py-16 text-center shadow-soft">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                Loading workspaces…
              </p>
            </div>
          )}

          {!isLoading && workspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-card/20 backdrop-blur-sm px-8 py-16 text-center shadow-soft">
              <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-2">
                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-accent opacity-50"></div>
              </div>
              <p className="text-xl font-bold gradient-text">
                No workspaces yet
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                Create your first workspace above to get started with your
                projects.
              </p>
            </div>
          )}

          {filteredWorkspaces.length > 0 && currentItems.length === 0 && (
            <div className="rounded-3xl bg-card/20 backdrop-blur-sm px-6 py-12 text-center text-sm text-muted-foreground shadow-soft">
              No workspaces match this filter.
            </div>
          )}

          {currentItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {currentItems.map((ws) => {
                  const role = ws.currentUserRole;
                  const color =
                    ROLE_COLORS[role] ||
                    "bg-gradient-to-r from-slate-500 to-gray-500";

                  return (
                    <div
                      key={ws.id}
                      className="group flex flex-col rounded-3xl bg-card/40 backdrop-blur-sm p-6 shadow-soft hover:shadow-xl hover:scale-[1.02] hover:cursor-pointer transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div
                        className="flex flex-col h-full relative z-10"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          navigate(`/workspace/${ws.id}/documents`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/workspace/${ws.id}/documents`);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xl font-bold group-hover:text-primary transition-colors">
                              {ws.name || "Untitled workspace"}
                            </h3>
                            <p className="mt-1.5 text-xs text-muted-foreground font-medium">
                              Created{" "}
                              {new Date(ws.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-lg ${color}`}
                          >
                            {role}
                          </span>
                        </div>
                      </div>

                      {(role === "Owner" || role === "Admin") && (
                        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground relative z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvite(ws.id);
                            }}
                            className="font-bold text-primary hover:text-primary/80 transition-colors hover:scale-105 active:scale-95"
                            aria-label={`Invite member to ${ws.name}`}
                          >
                            Invite
                          </button>
                          <span className="text-xs font-semibold">Members</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-3">
                  <div className="text-sm text-muted-foreground font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-background/50 backdrop-blur-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/50 hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm ${
                            currentPage === page
                              ? "bg-linear-to-r from-primary to-accent text-primary-foreground shadow-lg scale-110"
                              : "bg-background/50 backdrop-blur-sm text-foreground hover:bg-secondary/50 hover:scale-105 active:scale-95"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-background/50 backdrop-blur-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/50 hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
