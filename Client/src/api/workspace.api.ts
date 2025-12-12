import axios from "axios";

export type WorkspaceRole = "Owner" | "Editor" | "Viewer";

export interface WorkspaceUser {
  id: string;
  name: string | null;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: WorkspaceRole; // Add this optional property
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  user?: WorkspaceUser;
  invitedBy?: string;
}

export interface CreateWorkspaceDto {
  name: string;
}

export interface InviteUserDto {
  inviteEmail: string;
  role?: "Editor" | "Viewer";
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

export const workspaceApi = {
  // GET /workspaces -> Workspace[] (with currentUserRole)
  getUserWorkspaces: async (): Promise<Workspace[]> => {
    const res = await api.get<Workspace[]>("/workspaces");
    return res.data;
  },

  // POST /workspaces
  createWorkspace: async (dto: CreateWorkspaceDto): Promise<Workspace> => {
    const res = await api.post<Workspace>("/workspaces", dto);
    return res.data;
  },

  // POST /workspaces/:workspaceId/invite
  inviteUser: async (
    workspaceId: string,
    email: string,
    role?: "Editor" | "Viewer"
  ): Promise<WorkspaceMember> => {
    const res = await api.post<WorkspaceMember>(
      `/workspaces/${workspaceId}/invite`,
      { email, role }
    );
    return res.data;
  },

  // GET /workspaces/:workspaceId/members
  getWorkspaceMembers: async (
    workspaceId: string
  ): Promise<WorkspaceMember[]> => {
    const res = await api.get<WorkspaceMember[]>(
      `/workspaces/${workspaceId}/members`
    );
    return res.data;
  },

  // PUT /workspaces/:workspaceId/members/:memberId/role
  updateMemberRole: async (
    workspaceId: string,
    memberId: string,
    role: "Editor" | "Viewer"
  ): Promise<WorkspaceMember> => {
    const res = await api.put<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${memberId}/role`,
      { role }
    );
    return res.data;
  },

  // DELETE /workspaces/:workspaceId/members/:memberId
  removeMember: async (
    workspaceId: string,
    memberId: string
  ): Promise<void> => {
    await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  // PUT /workspaces/:id
  updateWorkspaceName: async (id: string, name: string): Promise<Workspace> => {
    const res = await api.put<Workspace>(`/workspaces/${id}`, { name });
    return res.data;
  },

  // DELETE /workspaces/:id
  deleteWorkspace: async (id: string): Promise<void> => {
    await api.delete(`/workspaces/${id}`);
  },

  // POST /workspaces/:id/leave
  leaveWorkspace: async (id: string): Promise<void> => {
    await api.post(`/workspaces/${id}/leave`);
  },

  // GET /workspaces/:workspaceId/permission
  getWorkspacePermission: async (
    workspaceId: string
  ): Promise<{ role: WorkspaceRole }> => {
    const res = await api.get<{ role: WorkspaceRole }>(
      `/workspaces/${workspaceId}/permission`
    );
    return res.data;
  },

  // GET single workspace
  getWorkspaceById: async (
    id: string
  ): Promise<Workspace & { members: WorkspaceMember[] }> => {
    const res = await api.get<Workspace & { members: WorkspaceMember[] }>(
      `/workspaces/${id}`
    );
    return res.data;
  },
};
