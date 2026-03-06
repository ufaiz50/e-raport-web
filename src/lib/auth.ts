import { TOKEN_KEY } from "@/lib/constants";

export const auth = {
  getToken: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => !!(typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)),
};
