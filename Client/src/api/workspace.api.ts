import axios from "axios";

export type WorkspaceRole = "Owner" | "Admin" | "Editor" | "Viewer";

export interface WorkspaceUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // owner is present in list API, but not needed on frontend right now
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  WorkspaceId: string;
  createdAt: string;
  updatedAt: string;
  user?: WorkspaceUser;
  workspace: Workspace;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export interface CreateWorkspaceDto {
  name: string;
}

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/workspace",
  withCredentials: true,
});

export const workspaceApi = {
  // GET /workspace -> WorkspaceMember[]
  getUserWorkspaces: async (): Promise<WorkspaceMember[]> => {
    const res = await api.get<WorkspaceMember[]>("/");
    return res.data;
  },

  // Assuming backend returns workspace + members here:
  getWorkspaceById: async (id: string): Promise<WorkspaceWithMembers> => {
    const res = await api.get<WorkspaceWithMembers>(`/${id}`);
    return res.data;
  },

  createWorkspace: async (
    dto: CreateWorkspaceDto
  ): Promise<WorkspaceWithMembers> => {
    const res = await api.post<WorkspaceWithMembers>("/", dto);
    return res.data;
  },

  updateWorkspaceName: async (
    id: string,
    name: string
  ): Promise<WorkspaceWithMembers> => {
    const res = await api.put<WorkspaceWithMembers>(`/${id}`, { name });
    return res.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await api.delete(`/${id}`);
  },

  leaveWorkspace: async (id: string): Promise<void> => {
    await api.post(`/${id}/leave`);
  },

  inviteUser: async (
    workspaceId: string,
    inviteEmail: string
  ): Promise<void> => {
    await api.post(`/${workspaceId}/invite`, { invitedUserEmail: inviteEmail });
  },
};
