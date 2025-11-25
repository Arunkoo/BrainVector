import axios from "axios";

type WorkspaceRole = "Owner" | "Admin" | "Editor" | "Viewer";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  currentUserRole: WorkspaceRole;
}

interface CreateWorkspaceDto {
  name: string;
}

//base stepUp for axios...
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/workspace",
  withCredentials: true,
});

export const workspaceApi = {
  //Get/workspace..
  getUserWorkspace: async (): Promise<Workspace[]> => {
    const response = await api.get<Workspace[]>("/");
    return response.data;
  },

  //post /workspace...
  createWorkspace: async (data: CreateWorkspaceDto): Promise<Workspace> => {
    const response = await api.post<Workspace>("/", data);
    return response.data;
  },

  //post /workspace/:workspaceId/invite...

  inviteUser: async (
    workspaceId: string,
    inviteEmail: string
  ): Promise<void> => {
    await api.post(`/${workspaceId}/invite`, { inviteEmail });
  },
};
