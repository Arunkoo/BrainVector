import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { User } from "../types";
import { authApi } from "../api/auth.api";

interface Credentials {
  email: string;
  password: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;

  checkAuthStatus: () => Promise<void>;
  login: (data: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/* ---------- Strongly typed Set/Get ---------- */

type StoreSet = Parameters<StateCreator<AuthStore>>[0];
// type StoreGet = Parameters<StateCreator<AuthStore>>[1];

const checkAuthStatusFn = async (set: StoreSet) => {
  set({ isCheckingAuth: true });

  try {
    const user = await authApi.checkAuth();
    set({ user, isCheckingAuth: false });
  } catch {
    set({ user: null, isCheckingAuth: false });
  }
};

const loginFn = async (set: StoreSet, data: Credentials) => {
  set({ isLoading: true, error: null });

  try {
    const user = await authApi.login(data);
    set({ user, isLoading: false });
  } catch {
    set({
      user: null,
      error: "Invalid email or password",
      isLoading: false,
    });
    throw new Error("Login failed");
  }
};

const logoutFn = async (set: StoreSet) => {
  await authApi.logout();
  set({ user: null });
};

/* ---------- Zustand Store ---------- */

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  checkAuthStatus: () => checkAuthStatusFn(set),
  login: (data) => loginFn(set, data),
  logout: () => logoutFn(set),
  clearError: () => set({ error: null }),
}));
