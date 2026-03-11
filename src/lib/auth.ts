import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "@/lib/constants";

type AuthClaims = {
  username?: string;
  role?: string;
  school_id?: number;
  exp?: number;
};

function decodeJwtPayload(token: string): AuthClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as AuthClaims;
  } catch {
    return null;
  }
}

export const auth = {
  getToken: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  getRefreshToken: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_TOKEN_KEY)),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  isLoggedIn: () => !!(typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)),
  getClaims: (): AuthClaims | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    return decodeJwtPayload(token);
  },
  getRole: (): string | null => {
    const claims = auth.getClaims();
    return claims?.role ?? null;
  },
};
