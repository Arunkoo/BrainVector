import { create } from "zustand";
import {
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
  type CreateWorkspaceDto,
  workspaceApi,
} from "../api/workspace.api";
// import { useAuthStore } from "./auth.store";

export interface WorkspaceWithRole extends Workspace {
  currentUserRole: WorkspaceRole;
}

interface WorkspaceState {
  workspaces: WorkspaceWithRole[];
  currentWorkspace:
    | (WorkspaceWithRole & { members?: WorkspaceMember[] })
    | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (
    dto: CreateWorkspaceDto
  ) => Promise<WorkspaceWithRole | null>;
  inviteUser: (workspaceId: string, email: string) => Promise<void>;
  reset: () => void;
}

// map membership -> WorkspaceWithRole
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

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const memberships = await workspaceApi.getUserWorkspaces();
      const data = memberships.map(membershipToWorkspaceWithRole);
      set({ workspaces: data, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspaces";
      set({ error: message, isLoading: false, workspaces: [] });
    }
  },

  createWorkspace: async (dto: CreateWorkspaceDto) => {
    set({ isLoading: true, error: null });
    try {
      const created = await workspaceApi.createWorkspace(dto);
      // const currentUser = useAuthStore.getState().user;
      const ws: WorkspaceWithRole = {
        id: created.id,
        name: created.name,
        ownerId: created.ownerId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        currentUserRole: "Owner",
      };

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
export const useWorkspaceLoading = () => useWorkspaceStore((s) => s.isLoading);
export const useFetchWorkspaces = () =>
  useWorkspaceStore((s) => s.fetchWorkspaces);
export const useCreateWorkspace = () =>
  useWorkspaceStore((s) => s.createWorkspace);
export const useInviteUser = () => useWorkspaceStore((s) => s.inviteUser);
export const useResetWorkspaces = () => useWorkspaceStore((s) => s.reset);
