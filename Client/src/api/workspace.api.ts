import axios from "axios";

/** Roles exactly as backend returns */
export type WorkspaceRole = "Owner" | "Admin" | "Editor" | "Viewer";

/** Shape for user object embedded in member */
export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Member record as returned by backend */
export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  WorkspaceId: string;
  createdAt: string;
  updatedAt: string;
  user: WorkspaceUser;
}

/** Workspace as returned by backend */
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
}

/** DTOs */
export interface CreateWorkspaceDto {
  name: string;
}

/** axios instance */
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/workspace",
  withCredentials: true,
});

/** Raw API — does NOT compute currentUserRole (store will compute) */
export const workspaceApi = {
  getUserWorkspaces: async (): Promise<Workspace[]> => {
    const res = await api.get<Workspace[]>("/");
    return res.data;
  },

  getWorkspaceById: async (id: string): Promise<Workspace> => {
    const res = await api.get<Workspace>(`/${id}`);
    return res.data;
  },

  createWorkspace: async (dto: CreateWorkspaceDto): Promise<Workspace> => {
    const res = await api.post<Workspace>("/", dto);
    return res.data;
  },

  updateWorkspaceName: async (id: string, name: string): Promise<Workspace> => {
    const res = await api.put<Workspace>(`/${id}`, { name });
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
    await api.post(`/${workspaceId}/invite`, { inviteEmail });
  },
};
