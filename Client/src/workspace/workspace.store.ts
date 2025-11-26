import { create } from "zustand";
import {
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
  type WorkspaceWithMembers,
  type CreateWorkspaceDto,
  workspaceApi,
} from "../api/workspace.api";

import { useAuthStore } from "../auth/auth.store";

export interface WorkspaceWithRole extends Workspace {
  currentUserRole: WorkspaceRole;
}

interface WorkspaceState {
  workspaces: WorkspaceWithRole[]; // list
  currentWorkspace:
    | (WorkspaceWithRole & { members?: WorkspaceMember[] })
    | null;
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

// Map list membership -> WorkspaceWithRole
const membershipToWorkspaceWithRole = (
  membership: WorkspaceMember
): WorkspaceWithRole => {
  const ws = membership.workspace;
  return {
    id: ws.id,
    name: ws.name,
    ownerId: ws.ownerId,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
    currentUserRole: membership.role,
  };
};

// Map single workspace (with members) -> WorkspaceWithRole (+members)
const workspaceWithMembersToWorkspaceWithRole = (
  workspace: WorkspaceWithMembers,
  currentUserId?: string
): WorkspaceWithRole & { members: WorkspaceMember[] } => {
  let role: WorkspaceRole = "Viewer";
  if (currentUserId && workspace.members) {
    const m = workspace.members.find((m) => m.userId === currentUserId);
    if (m) {
      role = m.role;
    }
  }

  return {
    id: workspace.id,
    name: workspace.name,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    currentUserRole: role,
    members: workspace.members,
  };
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const memberships = await workspaceApi.getUserWorkspaces(); // WorkspaceMember[]
      const data = memberships.map(membershipToWorkspaceWithRole);
      set({ workspaces: data, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspaces";
      set({ error: message, isLoading: false, workspaces: [] });
    }
  },

  fetchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const raw = await workspaceApi.getWorkspaceById(id); // WorkspaceWithMembers
      const currentUser = useAuthStore.getState().user;
      const ws = workspaceWithMembersToWorkspaceWithRole(raw, currentUser?.id);
      set({ currentWorkspace: ws, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspace";
      set({ error: message, isLoading: false, currentWorkspace: null });
    }
  },

  createWorkspace: async (dto: CreateWorkspaceDto) => {
    set({ isLoading: true, error: null });
    try {
      const created = await workspaceApi.createWorkspace(dto); // WorkspaceWithMembers
      const currentUser = useAuthStore.getState().user;
      const ws = workspaceWithMembersToWorkspaceWithRole(
        created,
        currentUser?.id
      );

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
      const updated = await workspaceApi.updateWorkspaceName(id, name); // WorkspaceWithMembers
      const currentUser = useAuthStore.getState().user;
      const ws = workspaceWithMembersToWorkspaceWithRole(
        updated,
        currentUser?.id
      );

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

export const useWorkspaces = () => useWorkspaceStore((s) => s.workspaces);
export const useWorkspaceCurrent = () =>
  useWorkspaceStore((s) => s.currentWorkspace);
export const useWorkspaceLoading = () => useWorkspaceStore((s) => s.isLoading);
export const useWorkspaceError = () => useWorkspaceStore((s) => s.error);

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
