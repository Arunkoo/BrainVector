import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Settings } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useWorkspaceStore } from "../store/workspace.store";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const inviteUser = useWorkspaceStore((state) => state.inviteUser);
  const isLoading = useWorkspaceStore((state) => state.isLoading);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteData, setInviteData] = useState<{
    workspaceId: string | null;
    email: string;
    role: "Editor" | "Viewer";
  }>({
    workspaceId: null,
    email: "",
    role: "Viewer",
  });

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user, fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    await createWorkspace({ name: newWorkspaceName.trim() });
    setNewWorkspaceName("");
  };

  const handleInviteUser = async (workspaceId: string) => {
    if (!inviteData.email.trim()) return;

    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace || workspace.currentUserRole !== "Owner") {
      alert("Only workspace owners can invite users");
      return;
    }

    try {
      await inviteUser(workspaceId, inviteData.email, inviteData.role);
      alert("Invitation sent successfully!");
      setInviteData({ workspaceId: null, email: "", role: "Viewer" });
    } catch (error) {
      console.error("Failed to invite user:", error);
      alert("Failed to send invitation");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-purple-100 text-purple-800";
      case "Editor":
        return "bg-green-100 text-green-800";
      case "Viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Workspaces
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {workspaces.length} workspace
                {workspaces.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Create Workspace Form */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Workspace
            </h2>
            <form onSubmit={handleCreateWorkspace} className="flex gap-2">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Enter workspace name"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !newWorkspaceName.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        </div>

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : workspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                {/* Workspace Header */}
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">
                      {workspace.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                        workspace.currentUserRole
                      )}`}
                    >
                      {workspace.currentUserRole}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() =>
                        navigate(`/workspace/${workspace.id}/documents`)
                      }
                      className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Open Workspace
                    </button>

                    {workspace.currentUserRole === "Owner" && (
                      <button
                        onClick={() =>
                          navigate(`/workspace/${workspace.id}/members`)
                        }
                        className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 py-2 px-4 rounded-lg border hover:border-gray-300 transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        Manage Members
                      </button>
                    )}

                    {/* Invite Section */}
                    {workspace.currentUserRole === "Owner" && (
                      <div className="border-t pt-4 mt-2">
                        {inviteData.workspaceId === workspace.id ? (
                          <div className="space-y-3">
                            <div>
                              <input
                                type="email"
                                placeholder="user@example.com"
                                value={inviteData.email}
                                onChange={(e) =>
                                  setInviteData({
                                    ...inviteData,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setInviteData({
                                    ...inviteData,
                                    role: "Viewer",
                                  })
                                }
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                  inviteData.role === "Viewer"
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                Viewer
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setInviteData({
                                    ...inviteData,
                                    role: "Editor",
                                  })
                                }
                                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                  inviteData.role === "Editor"
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                Editor
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleInviteUser(workspace.id)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                              >
                                Send Invite
                              </button>
                              <button
                                onClick={() =>
                                  setInviteData({
                                    workspaceId: null,
                                    email: "",
                                    role: "Viewer",
                                  })
                                }
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setInviteData({
                                workspaceId: workspace.id,
                                email: "",
                                role: "Viewer",
                              })
                            }
                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            + Invite User
                          </button>
                        )}
                      </div>
                    )}

                    {/* Info for non-owners */}
                    {workspace.currentUserRole !== "Owner" && (
                      <div className="border-t pt-4 mt-2 text-center">
                        <p className="text-xs text-gray-500">
                          Only workspace owner can invite users
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Create your first workspace to start collaborating with others.
              You'll be the owner and can invite team members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
