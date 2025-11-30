import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuthUser } from "../auth/auth.store";

import {
  useWorkspaces,
  useWorkspaceLoading,
  useWorkspaceError,
  useFetchWorkspaces,
  useCreateWorkspace,
  useInviteUser,
} from "../workspace/workspace.store";
import type { WorkspaceRole } from "../api/workspace.api";

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  Owner: "bg-rose-500",
  Admin: "bg-amber-500",
  Editor: "bg-emerald-500",
  Viewer: "bg-sky-500",
};

const ROLE_LABELS: WorkspaceRole[] = ["Owner", "Admin", "Editor", "Viewer"];

const Dashboard: React.FC = () => {
  const user = useAuthUser();
  const userId = user?.id;

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
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email}
            </p>
          </div>

          {/* Create workspace pill */}
          <form
            onSubmit={handleCreate}
            className="flex w-full max-w-md items-stretch rounded-full border border-border bg-card shadow-sm overflow-hidden"
          >
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={isLoading}
              aria-label="Workspace name"
            />
            <button
              type="submit"
              disabled={isLoading || !newWorkspaceName.trim()}
              className="
                mx-1 my-1 flex items-center justify-center rounded-full px-4 text-xs sm:text-sm font-medium
                bg-primary text-primary-foreground hover:bg-primary/90
                dark:bg-white/90 dark:text-foreground dark:border dark:border-border dark:hover:bg-white
                disabled:cursor-not-allowed disabled:opacity-60
              "
              aria-label="Create new workspace"
            >
              Create
            </button>
          </form>
        </header>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm flex items-center justify-between min-h-[72px]">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Workspaces</p>
              <p className="text-base sm:text-lg font-semibold">
                {workspaces.length}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 shadow-sm flex items-center justify-between min-h-[72px] hover:bg-muted transition-colors"
              onClick={() => setFilterOpen((open) => !open)}
            >
              <div className="space-y-0.5 text-left">
                <p className="text-xs text-muted-foreground">Filter</p>
                <p className="text-sm font-medium capitalize text-foreground">
                  {roleFilter === "all" ? "All" : roleFilter}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {filterOpen && (
              <div
                className="
                  absolute z-40 top-full left-0 mt-2 w-full
                  rounded-2xl border border-border bg-card/95 backdrop-blur-xl
                  shadow-xl shadow-black/20 dark:shadow-black/40
                "
              >
                <div className="py-1.5 ">
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-3 py-2.5 text-left text-sm font-medium ${
                      roleFilter === "all"
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
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
                      className={`block w-full px-3 py-2.5 text-left text-sm font-medium capitalize ${
                        roleFilter === role
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm flex items-center justify-between min-h-[72px]">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium">
                {isLoading ? "Syncing" : "Ready"}
              </p>
            </div>
          </div>
        </section>

        {/* Workspaces + pagination */}
        <section className="space-y-4">
          {isLoading && !workspaces.length && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card px-8 py-12 text-center shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading workspaces…
              </p>
            </div>
          )}

          {!isLoading && workspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card px-8 py-12 text-center shadow-sm">
              <p className="text-lg font-semibold">No workspaces yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first workspace above.
              </p>
            </div>
          )}

          {filteredWorkspaces.length > 0 && currentItems.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground shadow-sm">
              No workspaces match this filter.
            </div>
          )}

          {currentItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {currentItems.map((ws) => {
                  const role = ws.currentUserRole;
                  const color = ROLE_COLORS[role] || "bg-slate-500";

                  return (
                    <div
                      key={ws.id}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold group-hover:text-primary transition-colors">
                            {ws.name || "Untitled workspace"}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(ws.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${color}`}
                        >
                          {role}
                        </span>
                      </div>

                      {(role === "Owner" || role === "Admin") && (
                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                          <button
                            onClick={() => handleInvite(ws.id)}
                            className="font-semibold text-primary hover:text-primary/80 transition-colors"
                            aria-label={`Invite member to ${ws.name}`}
                          >
                            Invite
                          </button>
                          <span className="text-[11px]">Members</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs rounded-md border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1 text-xs rounded-md border ${
                            currentPage === page
                              ? "border-primary bg-primary text-primary-foreground dark:bg-white/90 dark:text-foreground"
                              : "border-border bg-card text-foreground hover:bg-muted"
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
                      className="px-2 py-1 text-xs rounded-md border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
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
