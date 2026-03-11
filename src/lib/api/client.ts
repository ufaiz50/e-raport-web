import axios from "axios";
import { API_BASE_URL, API_KEY, TOKEN_KEY } from "@/lib/constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
  },
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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
  async (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const originalRequest = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error?.response?.status;

    if (status === 401 && originalRequest?.url?.includes("/refresh")) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = api
          .post<{ token?: string; access_token?: string }>("/refresh", {})
          .then((res) => {
            const nextAccessToken = res.data.access_token ?? res.data.token ?? null;
            if (nextAccessToken) {
              localStorage.setItem(TOKEN_KEY, nextAccessToken);
            }
            return nextAccessToken;
          })
          .catch(() => {
            localStorage.removeItem(TOKEN_KEY);
            if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            return null;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      const refreshedAccessToken = await refreshPromise;
      if (refreshedAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
