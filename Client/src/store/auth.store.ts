import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { User } from "../types";
import { authApi } from "../api/auth.api";
import axios, { AxiosError } from "axios";

/* ---------------------- Types ---------------------- */

interface Credentials {
  email: string;
  password: string;
}

interface RegisterData extends Credentials {
  name: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;

  checkAuthStatus: () => Promise<void>;
  login: (data: Credentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

type StoreSet = Parameters<StateCreator<AuthStore>>[0];

/* ----------------- Error Extraction ---------------- */

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err) && (err as AxiosError).response) {
    const data = err.response?.data as { message?: string | string[] };

    if (Array.isArray(data.message)) return data.message.join(", ");
    return data.message || "Something went wrong.";
  }
  return "Network error or unknown failure.";
};

/* ------------------- Functions -------------------- */

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
  } catch (err) {
    const msg = extractErrorMessage(err);
    set({ user: null, error: msg, isLoading: false });
    throw err;
  }
};

const registerFn = async (set: StoreSet, data: RegisterData) => {
  set({ isLoading: true, error: null });

  try {
    const user = await authApi.register(data);
    set({ user, isLoading: false });
  } catch (err) {
    const msg = extractErrorMessage(err);
    set({ user: null, error: msg, isLoading: false });
    throw err;
  }
};

const logoutFn = async (set: StoreSet) => {
  set({ isLoading: true });

  try {
    await authApi.logout();
  } finally {
    set({ user: null, isLoading: false });
  }
};

/* ------------------ Zustand Store ------------------ */

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  checkAuthStatus: () => checkAuthStatusFn(set),
  login: (data) => loginFn(set, data),
  register: (data) => registerFn(set, data),
  logout: () => logoutFn(set),

  clearError: () => set({ error: null }),
}));

/* ------- SAFE SELECTORS (NO INFINITE LOOPS) -------- */

export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthChecking = () => useAuthStore((s) => s.isCheckingAuth);
export const useAuthError = () => useAuthStore((s) => s.error);

export const useAuthLogin = () => useAuthStore((s) => s.login);
export const useAuthRegister = () => useAuthStore((s) => s.register);
export const useAuthLogout = () => useAuthStore((s) => s.logout);
export const useAuthCheck = () => useAuthStore((s) => s.checkAuthStatus);
export const useAuthClearError = () => useAuthStore((s) => s.clearError);
