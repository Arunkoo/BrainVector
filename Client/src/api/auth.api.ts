import axios from "axios";
import type { LoginDto, RegisterDto, User } from "../types";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  withCredentials: true,
});

export const authApi = {
  checkAuth: async (): Promise<User> => {
    const response = await api.get<User>("/me");
    return response.data;
  },

  login: async (credentials: LoginDto): Promise<User> => {
    const response = await api.post<User>("/login", credentials);

    return response.data;
  },

  register: async (userData: RegisterDto): Promise<User> => {
    const response = await api.post<User>("/register", userData);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post("/logout");
    return response.data;
  },
};
