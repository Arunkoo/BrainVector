import React, { useEffect, useState } from "react";
import { ChevronDown, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../store/auth.store";
import {
  useWorkspaces,
  useWorkspaceLoading,
  useFetchWorkspaces,
  useCreateWorkspace,
  useInviteUser,
} from "../store/workspace.store";
import type { WorkspaceRole } from "../api/workspace.api";

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  Owner: "bg-gradient-to-r from-purple-500 to-pink-500",
  Admin: "bg-gradient-to-r from-blue-500 to-cyan-500",
  Editor: "bg-gradient-to-r from-emerald-500 to-green-500",
  Viewer: "bg-gradient-to-r from-gray-500 to-slate-500",
};

const Dashboard: React.FC = () => {
  const user = useAuthUser();
  const navigate = useNavigate();
  const workspaces = useWorkspaces();
  const isLoading = useWorkspaceLoading();
  const fetchWorkspaces = useFetchWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const inviteUser = useInviteUser();

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // invite modal state
  const [inviteOpen, setInviteOpen] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (user?.id) {
      // fetch workspaces on mount and after user id changes
      fetchWorkspaces().catch((err) =>
        console.error("Failed to fetch workspaces:", err)
      );
    }
  }, [user?.id, fetchWorkspaces]);

  const handleSendInvite = async (workspaceId: string, email: string) => {
    if (!email.trim()) return;

    try {
      // send invite
      await inviteUser(workspaceId, email.trim());

      // refetch workspaces to reflect new invite immediately
      await fetchWorkspaces();

      // reset modal
      setInviteOpen(null);
      setInviteEmail("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to send invite:", err);
      alert(
        err?.response?.data?.message || err.message || "Failed to send invite"
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace({ name: newWorkspaceName.trim() });
    setNewWorkspaceName("");
  };

  const filteredWorkspaces =
    roleFilter === "all"
      ? workspaces
      : workspaces.filter((w) => w.currentUserRole === roleFilter);

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex items-stretch rounded-lg border border-border overflow-hidden max-w-md w-full"
        >
          <input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name"
            className="flex-1 bg-background px-4 py-2.5 text-sm focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newWorkspaceName.trim()}
            className="px-4 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Workspaces</p>
          <p className="text-2xl font-bold mt-1">{workspaces.length}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Role</p>
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center justify-between w-full mt-1"
            >
              <span className="capitalize font-medium">
                {roleFilter === "all" ? "All Roles" : roleFilter}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {filterOpen && (
              <div className="absolute z-10 mt-1 w-full bg-card border rounded-lg shadow-lg">
                {["all", "Owner", "Admin", "Editor", "Viewer"].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setRoleFilter(role as WorkspaceRole | "all");
                      setFilterOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm capitalize"
                  >
                    {role === "all" ? "All Roles" : role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-sm font-medium mt-1">
            {isLoading ? "Loading..." : "Ready"}
          </p>
        </div>
      </div>

      {/* Workspaces */}
      {currentItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((ws) => (
            <div
              key={ws.id}
              className="rounded-lg border p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate(`/workspace/${ws.id}/documents`)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg truncate">{ws.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium text-white rounded-full ${
                    ROLE_COLORS[ws.currentUserRole]
                  }`}
                >
                  {ws.currentUserRole}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-2">
                Created {new Date(ws.createdAt).toLocaleDateString()}
              </p>

              {(ws.currentUserRole === "Owner" ||
                ws.currentUserRole === "Admin") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInviteOpen(ws.id);
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <UserPlus className="h-3 w-3" />
                  Invite
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-md text-sm ${
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Invite user</h3>

            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setInviteOpen(null);
                  setInviteEmail("");
                }}
                className="text-sm px-3 py-2 rounded-md hover:bg-muted"
              >
                Cancel
              </button>

              <button
                onClick={async () => handleSendInvite(inviteOpen!, inviteEmail)}
                className="text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
