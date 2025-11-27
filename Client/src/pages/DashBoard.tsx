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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top bar */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome, {user?.name || user?.email}
            </p>
          </div>

          {/* Pill-style create workspace form */}
          <form
            onSubmit={handleCreate}
            className="flex w-full max-w-md items-stretch rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              disabled={isLoading}
              aria-label="Workspace name"
            />
            <button
              type="submit"
              disabled={isLoading || !newWorkspaceName.trim()}
              className="mx-1 my-1 flex items-center justify-center rounded-full bg-slate-900 px-4 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              aria-label="Create new workspace"
            >
              Create
            </button>
          </form>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-100/50 bg-rose-50/80 backdrop-blur-sm px-5 py-4 text-sm text-rose-800 shadow-sm">
            {error}
          </div>
        )}

        {/* Stats row – all three boxes same size */}
        {/* Stats row – compact content, same card size */}
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Workspaces count */}
          <div className="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm flex items-center justify-between min-h-[72px]">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-500">Workspaces</p>
              <p className="text-base sm:text-lg font-semibold text-slate-900">
                {workspaces.length}
              </p>
            </div>
          </div>

          {/* Filter card with dropdown (unchanged alignment) */}
          <div className="relative">
            <div
              className="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm flex items-center justify-between min-h-[72px] cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFilterOpen((open) => !open)}
            >
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500">Filter</p>
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {roleFilter === "all" ? "All" : roleFilter}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-600 transition-transform ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {filterOpen && (
              <div className="absolute z-20 top-full left-0 mt-2 w-full rounded-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-1.5 shadow-lg shadow-slate-200/50 max-h-60 overflow-auto">
                <button
                  onClick={() => {
                    setRoleFilter("all");
                    setFilterOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    roleFilter === "all"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100"
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
                    className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium capitalize transition-colors ${
                      roleFilter === role
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm flex items-center justify-between min-h-[72px]">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-500">Status</p>
              <p className="text-sm font-medium text-slate-900">
                {isLoading ? "Syncing" : "Ready"}
              </p>
            </div>
          </div>
        </section>

        {/* Workspaces */}
        <section className="space-y-4">
          {isLoading && !workspaces.length && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200/50 bg-white/70 backdrop-blur-sm px-8 py-12 text-center shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
              <p className="text-sm font-medium text-slate-700">
                Loading workspaces…
              </p>
            </div>
          )}

          {!isLoading && workspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200/50 bg-white/70 backdrop-blur-sm px-8 py-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-700">
                No workspaces yet
              </p>
              <p className="text-sm text-slate-500">
                Create your first workspace above.
              </p>
            </div>
          )}

          {workspaces.length > 0 && filteredWorkspaces.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200/50 bg-white/70 backdrop-blur-sm px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
              No workspaces match this filter.
            </div>
          )}

          {filteredWorkspaces.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWorkspaces.map((ws) => {
                const role = ws.currentUserRole;
                const color = ROLE_COLORS[role] || "bg-slate-400";

                return (
                  <div
                    key={ws.id}
                    className="group flex flex-col rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl hover:shadow-slate-300/40 hover:-translate-y-1 transition-all duration-300 hover:border-slate-300/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {ws.name || "Untitled workspace"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
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
                      <div className="mt-6 pt-4 border-t border-slate-100/50 flex items-center justify-between text-xs text-slate-500">
                        <button
                          onClick={() => handleInvite(ws.id)}
                          className="font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                          aria-label={`Invite member to ${ws.name}`}
                        >
                          Invite
                        </button>
                        <span className="text-slate-400 text-xs">Members</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
