import { api } from "../lib/api";

export type WorkspaceRole = "Owner" | "Admin" | "Editor" | "Viewer";

export interface WorkspaceUser {
  id: string;
  name: string | null;
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  workspaceId: string;
  user?: WorkspaceUser;
  workspace: Workspace;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export interface CreateWorkspaceDto {
  name: string;
}

export const workspaceApi = {
  getUserWorkspaces: async (): Promise<WorkspaceMember[]> => {
    const res = await api.get("/workspace");
    return res.data;
  },

  getWorkspaceById: async (id: string): Promise<WorkspaceWithMembers> => {
    const res = await api.get(`/workspace/${id}`);
    return res.data;
  },

  createWorkspace: async (
    dto: CreateWorkspaceDto
  ): Promise<WorkspaceWithMembers> => {
    const res = await api.post("/workspace", dto);
    return res.data;
  },

  updateWorkspaceName: async (
    id: string,
    name: string
  ): Promise<WorkspaceWithMembers> => {
    const res = await api.patch(`/workspace/${id}`, { name });
    return res.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await api.delete(`/workspace/${id}`);
  },

  leaveWorkspace: async (id: string): Promise<void> => {
    await api.post(`/workspace/${id}/leave`);
  },

  inviteUser: async (
    workspaceId: string,
    inviteEmail: string,
    role: WorkspaceRole
  ): Promise<void> => {
    await api.post(`/workspace/${workspaceId}/invite`, {
      invitedUserEmail: inviteEmail,
      role,
    });
  },
};
