import { create } from "zustand";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  CreateWorkspaceDto,
} from "../api/workspace.api";
import { workspaceApi } from "../api/workspace.api";
import { useAuthStore } from "../auth/auth.store";

/**
 * Frontend-friendly workspace shape that includes currentUserRole
 * computed from workspace.members and the currently logged-in user.
 */
export interface WorkspaceWithRole extends Workspace {
  currentUserRole: WorkspaceRole;
}

/* ----------------- Store types ----------------- */
interface WorkspaceState {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (
    dto: CreateWorkspaceDto
  ) => Promise<WorkspaceWithRole | null>;
  updateWorkspaceName: (
    id: string,
    name: string
  ) => Promise<WorkspaceWithRole | null>;
  deleteWorkspace: (id: string) => Promise<void>;
  leaveWorkspace: (id: string) => Promise<void>;
  inviteUser: (workspaceId: string, email: string) => Promise<void>;

  reset: () => void;
}

/* ----------------- Helper: derive role for current user ----------------- */
const computeCurrentUserRole = (
  workspace: Workspace,
  currentUserId?: string
): WorkspaceRole => {
  if (!currentUserId) return "Viewer";
  const membership: WorkspaceMember | undefined = workspace.members.find(
    (m) => m.userId === currentUserId
  );
  return membership?.role ?? "Viewer";
};

/* ----------------- Mapper: Workspace -> WorkspaceWithRole ----------------- */
const mapToWorkspaceWithRole = (
  workspace: Workspace,
  currentUserId?: string
): WorkspaceWithRole => {
  const currentUserRole = computeCurrentUserRole(workspace, currentUserId);
  return { ...workspace, currentUserRole };
};

/* ----------------- Zustand store ----------------- */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await workspaceApi.getUserWorkspaces();
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id;
      const data = raw.map((ws) => mapToWorkspaceWithRole(ws, userId));
      set({ workspaces: data, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspaces";
      set({ error: message, isLoading: false });
    }
  },

  fetchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const raw = await workspaceApi.getWorkspaceById(id);
      const currentUser = useAuthStore.getState().user;
      const ws = mapToWorkspaceWithRole(raw, currentUser?.id);
      set({ currentWorkspace: ws, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspace";
      set({ error: message, isLoading: false });
    }
  },

  createWorkspace: async (dto: CreateWorkspaceDto) => {
    set({ isLoading: true, error: null });
    try {
      const created = await workspaceApi.createWorkspace(dto);
      const currentUser = useAuthStore.getState().user;
      const ws = mapToWorkspaceWithRole(created, currentUser?.id);
      set((state) => ({
        workspaces: [...state.workspaces, ws],
        isLoading: false,
      }));
      return ws;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create workspace";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateWorkspaceName: async (id: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await workspaceApi.updateWorkspaceName(id, name);
      const currentUser = useAuthStore.getState().user;
      const ws = mapToWorkspaceWithRole(updated, currentUser?.id);

      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? ws : w)),
        currentWorkspace:
          state.currentWorkspace?.id === id ? ws : state.currentWorkspace,
        isLoading: false,
      }));

      return ws;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update workspace";
      set({ error: message, isLoading: false });
      return null;
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.deleteWorkspace(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace:
          state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete workspace";
      set({ error: message, isLoading: false });
    }
  },

  leaveWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.leaveWorkspace(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace:
          state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to leave workspace";
      set({ error: message, isLoading: false });
    }
  },

  inviteUser: async (workspaceId: string, email: string) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.inviteUser(workspaceId, email);
      set({ isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to invite user";
      set({ error: message, isLoading: false });
    }
  },

  reset: () =>
    set({
      workspaces: [],
      currentWorkspace: null,
      isLoading: false,
      error: null,
    }),
}));

/* ----------------- Stable selectors to use in components ----------------- */
export const useWorkspaces = () => useWorkspaceStore((s) => s.workspaces);
export const useWorkspaceCurrent = () =>
  useWorkspaceStore((s) => s.currentWorkspace);
export const useWorkspaceLoading = () => useWorkspaceStore((s) => s.isLoading);
export const useWorkspaceError = () => useWorkspaceStore((s) => s.error);

/* Individual action selectors (stable function references) */
export const useFetchWorkspaces = () =>
  useWorkspaceStore((s) => s.fetchWorkspaces);
export const useFetchWorkspace = () =>
  useWorkspaceStore((s) => s.fetchWorkspace);
export const useCreateWorkspace = () =>
  useWorkspaceStore((s) => s.createWorkspace);
export const useUpdateWorkspaceName = () =>
  useWorkspaceStore((s) => s.updateWorkspaceName);
export const useDeleteWorkspace = () =>
  useWorkspaceStore((s) => s.deleteWorkspace);
export const useLeaveWorkspace = () =>
  useWorkspaceStore((s) => s.leaveWorkspace);
export const useInviteUser = () => useWorkspaceStore((s) => s.inviteUser);
export const useResetWorkspaces = () => useWorkspaceStore((s) => s.reset);
