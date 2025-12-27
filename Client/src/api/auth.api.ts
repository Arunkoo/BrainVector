import { api } from "../lib/api";
import type { LoginDto, RegisterDto, User } from "../types";

export const authApi = {
  checkAuth: async (): Promise<User> => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },

  login: async (credentials: LoginDto): Promise<User> => {
    const res = await api.post<User>("/auth/login", credentials);
    return res.data;
  },

  register: async (data: RegisterDto): Promise<User> => {
    const res = await api.post<User>("/auth/register", data);
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await api.post("/auth/logout");
    return res.data;
  },
};
