import { create } from "zustand";
import { useAuthStore } from "../auth/auth.store";
import { workspaceApi } from "../api/workspace.api";
import axios from "axios";

type WorkspaceRole = "Owner" | "Admin" | "Editor" | "Viewer";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  currentUserRole: WorkspaceRole;
}

interface WorkspaceState {
  workspace: Workspace[];
  loading: boolean;
  error: string | null;
}

interface WorkspaceActions {
  fetchWorkspace: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | void>;
  clearWorkspace: () => void;
}

type WorkspaceStore = WorkspaceActions & WorkspaceState;

export const userWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: [],
  loading: false,
  error: null,

  clearWorkspace: () => set({ workspace: [], error: null }),
  fetchWorkspace: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ workspace: [], error: "User not authenticated" });
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await workspaceApi.getUserWorkspace();
      set({ workspace: data, loading: false });
    } catch (error) {
      console.error("Workspace fetch failed:", error);
      set({
        error: "Failed to load workspace.please check server.",
        loading: false,
      });
    }
  },

  createWorkspace: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const newWorkspace = await workspaceApi.createWorkspace({ name });
      set({ workspace: [...get().workspace, newWorkspace], loading: false });
      return newWorkspace;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Creation Failed"
        : "Failed to create a workspace.";

      set({ error: errorMessage, loading: false });
    }
  },
}));

export const useWorkspaces = () =>
  userWorkspaceStore((state) => state.workspace);
export const useWorkspaceActions = () =>
  userWorkspaceStore((state) => ({
    fetchWorkspaces: state.fetchWorkspace,
    createWorkspace: state.createWorkspace,
    loading: state.loading,
    error: state.error,
    clearWorkspaces: state.clearWorkspace,
  }));
