import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://brainvector-backend.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // VERY IMPORTANT
});
