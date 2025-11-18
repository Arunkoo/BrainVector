import { create } from "zustand";
import type { User } from "../types";
import { authApi } from "../api/auth.api";
import axios from "axios";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;
}

//Defining the interface for the store actions
interface AuthActions {
  // Authentication methods
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;

  // Initial check method
  checkAuthStatus: () => Promise<void>;

  //Utility..
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

//creating a zustand store

export const useAuthStore = create<AuthStore>((set) => ({
  //state...
  user: null,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
  //Actions...

  clearError: () => set({ error: null }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.login(credentials);
      set({ user, isLoading: false });
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Login failed"
        : "An unknown error occurred";
      set({ user: null, error: errorMessage, isLoading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.register(userData);
      set({ user, isLoading: false });
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Registration failed!"
        : "An unknown error occurred";
      set({ user: null, error: errorMessage, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      set({ user: null, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
  checkAuthStatus: async () => {
    set({ isCheckingAuth: true });
    try {
      const user = await authApi.checkAuth();
      set({ user, isCheckingAuth: false });
    } catch {
      set({ user: null, isCheckingAuth: false });
    }
  },
}));

// Optional: Custom hook for cleaner component access
export const useAuth = () =>
  useAuthStore((state) => ({
    user: state.user,
    isLoggedIn: !!state.user,
    isLoading: state.isLoading,
    isCheckingAuth: state.isCheckingAuth,
    error: state.error,
    login: state.login,
    logout: state.logout,
    register: state.register,
    clearError: state.clearError,
  }));
