/**
 * API client base URL and helpers.
 * Used when calling CodeQuest backend (Milestone 3+).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getApiUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export { API_URL };
