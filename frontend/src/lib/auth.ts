/**
 * Simple client-side auth helpers using localStorage.
 * Stores:
 * - accessToken
 * - role ("learner" | "admin")
 */

export type UserRole = "learner" | "admin";

const TOKEN_KEY = "codequest_access_token";
const ROLE_KEY = "codequest_role";

export function setAuth(token: string, role: UserRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ROLE_KEY);
  return value === "learner" || value === "admin" ? value : null;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

