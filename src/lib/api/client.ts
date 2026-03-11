import axios from "axios";
import { API_BASE_URL, API_KEY, TOKEN_KEY } from "@/lib/constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);

      const onLoginPage = window.location.pathname.startsWith("/login");
      if (!onLoginPage) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
