import { create } from "zustand";
import {
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
  type CreateWorkspaceDto,
  workspaceApi,
} from "../api/workspace.api";

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

  // Actions
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
  inviteUser: (
    workspaceId: string,
    email: string,
    role?: "Editor" | "Viewer"
  ) => Promise<void>;
  updateMemberRole: (
    workspaceId: string,
    memberId: string,
    role: "Editor" | "Viewer"
  ) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
  getWorkspacePermission: (
    workspaceId: string
  ) => Promise<WorkspaceRole | null>;

  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspaceApi.getUserWorkspaces();

      // Transform to WorkspaceWithRole
      const workspacesWithRole: WorkspaceWithRole[] = workspaces.map((ws) => ({
        ...ws,
        currentUserRole: ws.currentUserRole || "Viewer", // Default to Viewer if not provided
      }));

      set({ workspaces: workspacesWithRole, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspaces";
      set({ error: message, isLoading: false, workspaces: [] });
    }
  },

  fetchWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const workspaceWithMembers = await workspaceApi.getWorkspaceById(id);

      const workspaceWithRole: WorkspaceWithRole = {
        ...workspaceWithMembers,
        currentUserRole: workspaceWithMembers.currentUserRole || "Viewer",
      };

      set({
        currentWorkspace: {
          ...workspaceWithRole,
          members: workspaceWithMembers.members,
        },
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspace";
      set({ error: message, isLoading: false, currentWorkspace: null });
    }
  },

  createWorkspace: async (dto: CreateWorkspaceDto) => {
    set({ isLoading: true, error: null });
    try {
      const created = await workspaceApi.createWorkspace(dto);

      const workspaceWithRole: WorkspaceWithRole = {
        ...created,
        currentUserRole: created.currentUserRole || "Owner", // New workspace is always Owner
      };

      set((state) => ({
        workspaces: [...state.workspaces, workspaceWithRole],
        isLoading: false,
      }));

      return workspaceWithRole;
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

      // Get current role from existing workspace
      const existingWorkspace = get().workspaces.find((w) => w.id === id);

      const workspaceWithRole: WorkspaceWithRole = {
        ...updated,
        currentUserRole: existingWorkspace?.currentUserRole || "Viewer",
      };

      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === id ? workspaceWithRole : w
        ),
        currentWorkspace:
          state.currentWorkspace?.id === id
            ? {
                ...state.currentWorkspace,
                ...workspaceWithRole,
              }
            : state.currentWorkspace,
        isLoading: false,
      }));

      return workspaceWithRole;
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

  inviteUser: async (
    workspaceId: string,
    email: string,
    role?: "Editor" | "Viewer"
  ) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.inviteUser(workspaceId, email, role);
      set({ isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to invite user";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateMemberRole: async (
    workspaceId: string,
    memberId: string,
    role: "Editor" | "Viewer"
  ) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.updateMemberRole(workspaceId, memberId, role);
      set({ isLoading: false });

      // Update local state if needed
      const { currentWorkspace } = get();
      if (currentWorkspace?.id === workspaceId && currentWorkspace.members) {
        const updatedMembers = currentWorkspace.members.map((member) =>
          member.userId === memberId ? { ...member, role } : member
        );
        set({
          currentWorkspace: { ...currentWorkspace, members: updatedMembers },
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update member role";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  removeMember: async (workspaceId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      set({ isLoading: false });

      // Update local state
      const { currentWorkspace } = get();
      if (currentWorkspace?.id === workspaceId && currentWorkspace.members) {
        const updatedMembers = currentWorkspace.members.filter(
          (member) => member.userId !== memberId
        );
        set({
          currentWorkspace: { ...currentWorkspace, members: updatedMembers },
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  getWorkspaceMembers: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const members = await workspaceApi.getWorkspaceMembers(workspaceId);
      set({ isLoading: false });
      return members;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch members";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  getWorkspacePermission: async (workspaceId: string) => {
    try {
      const { role } = await workspaceApi.getWorkspacePermission(workspaceId);
      return role;
    } catch (err) {
      console.error("Failed to get permission:", err);
      return null;
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

// Selectors
export const useWorkspaces = () => useWorkspaceStore((s) => s.workspaces);
export const useWorkspaceCurrent = () =>
  useWorkspaceStore((s) => s.currentWorkspace);
export const useWorkspaceLoading = () => useWorkspaceStore((s) => s.isLoading);
export const useWorkspaceError = () => useWorkspaceStore((s) => s.error);
export const useCanInvite = (workspaceId: string) =>
  useWorkspaceStore(
    (s) =>
      s.workspaces.find((w) => w.id === workspaceId)?.currentUserRole ===
      "Owner"
  );

// Actions
export const useFetchWorkspaces = () =>
  useWorkspaceStore((s) => s.fetchWorkspaces);
export const useFetchWorkspace = () =>
  useWorkspaceStore((s) => s.fetchWorkspace);
export const useCreateWorkspace = () =>
  useWorkspaceStore((s) => s.createWorkspace);
export const useInviteUser = () => useWorkspaceStore((s) => s.inviteUser);
export const useUpdateMemberRole = () =>
  useWorkspaceStore((s) => s.updateMemberRole);
export const useRemoveMember = () => useWorkspaceStore((s) => s.removeMember);
export const useGetWorkspaceMembers = () =>
  useWorkspaceStore((s) => s.getWorkspaceMembers);
export const useGetWorkspacePermission = () =>
  useWorkspaceStore((s) => s.getWorkspacePermission);
export const useResetWorkspaces = () => useWorkspaceStore((s) => s.reset);
