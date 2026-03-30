const TOKEN_KEY = "token";

export type AuthClaims = {
  username?: string;
  role?: string;
  school_id?: string;
  exp?: number;
  iss?: string;
};

function decodePayload(token: string): AuthClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = typeof window !== "undefined" ? window.atob(padded) : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as AuthClaims;
  } catch {
    return null;
  }
}

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
  clearToken() {
    this.clear();
  },
  getClaims(): AuthClaims | null {
    const token = this.getToken();
    if (!token) return null;
    return decodePayload(token);
  },
  getRole(): string | null {
    return this.getClaims()?.role ?? null;
  },
  getSchoolId(): string | null {
    return this.getClaims()?.school_id ?? null;
  },
  isAuthenticated(): boolean {
    const claims = this.getClaims();
    if (!claims?.exp) return !!this.getToken();
    return claims.exp * 1000 > Date.now();
  },
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  },
};
