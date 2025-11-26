import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
  Owner: "bg-red-500",
  Admin: "bg-yellow-500",
  Editor: "bg-green-500",
  Viewer: "bg-blue-500",
};

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

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">
        Hello, {user?.name || user?.email}!
      </h1>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Create Workspace */}
      <section className="p-6 bg-white rounded-xl shadow border">
        <h2 className="text-2xl mb-4 font-semibold">Create Workspace</h2>

        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name..."
            className="p-3 border rounded flex-1"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !newWorkspaceName.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus />
            Create
          </button>
        </form>
      </section>

      {/* Workspaces List */}
      <section>
        <h2 className="text-2xl font-semibold">
          Your Workspaces ({workspaces.length})
        </h2>

        {isLoading && !workspaces.length && (
          <div className="text-center p-6">Loading workspaces...</div>
        )}

        {!isLoading && workspaces.length === 0 && (
          <div className="p-6 text-center border-2 border-dashed rounded text-gray-500">
            You are not a member of any workspace yet.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {workspaces.map((ws) => {
            const role = ws.currentUserRole;
            const color = ROLE_COLORS[role] || "bg-gray-400";

            return (
              <div
                key={ws.id}
                className="p-4 bg-white rounded-lg shadow border"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold truncate">
                      {ws.name || "Untitled Workspace"}
                    </h3>

                    <div className="mt-1 text-sm text-gray-600">
                      Role: <span className="font-medium">{role}</span>
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                      Created: {new Date(ws.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full text-white ${color}`}
                    >
                      {role}
                    </span>

                    {(role === "Owner" || role === "Admin") && (
                      <button
                        onClick={() => handleInvite(ws.id)}
                        className="mt-3 text-indigo-600 text-sm hover:underline"
                      >
                        Invite
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
