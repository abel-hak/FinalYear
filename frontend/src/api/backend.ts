const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "codequest_access_token";
const ROLE_KEY = "codequest_role";

export type QuestStatus = "completed" | "current" | "locked";

export interface QuestSummaryDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  status: QuestStatus;
}

export interface ProgressSummaryDto {
  current_level: number;
  total_points: number;
  quests: QuestSummaryDto[];
}

export interface QuestDetailDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  initial_code: string;
  explanation_unlocked: boolean;
  explanation?: string | null;
}

export interface SubmissionResultDto {
  quest_id: string;
  passed: boolean;
  tests_passed: number;
  tests_total: number;
  stdout: string;
  stderr: string;
}

export interface AdminQuestDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  initial_code: string;
  solution_code: string;
  explanation: string | null;
  is_deleted: boolean;
}

export interface AiHintResponseDto {
  hint: string;
}

export interface AdminStatsDto {
  total_users: number;
  quests_completed: number;
  total_quests: number;
  completion_rate_pct: number;
}

export interface AdminUserProgressDto {
  id: string;
  username: string;
  email: string;
  quests_completed: number;
  total_quests: number;
  xp_earned: number;
  last_active: string | null;
}

export interface AdminQuestCompletionDto {
  quest_id: string;
  quest_title: string;
  completed: number;
  failed: number;
}

export interface AdminDifficultyDto {
  level: number;
  label: string;
  count: number;
}

export interface AdminDailyActivityDto {
  day: string;
  date: string;
  submissions: number;
  unique_users: number;
}

export interface AdminAnalyticsDto {
  quest_completion: AdminQuestCompletionDto[];
  difficulty_distribution: AdminDifficultyDto[];
  weekly_activity: AdminDailyActivityDto[];
}

async function adminFetch<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchAdminStats(): Promise<AdminStatsDto> {
  return adminFetch<AdminStatsDto>("/stats");
}

export async function fetchAdminUsers(): Promise<AdminUserProgressDto[]> {
  return adminFetch<AdminUserProgressDto[]>("/users");
}

export async function fetchAdminAnalytics(): Promise<AdminAnalyticsDto> {
  return adminFetch<AdminAnalyticsDto>("/analytics");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, role: "learner" | "admin"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getRole(): "learner" | "admin" | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ROLE_KEY);
  return value === "learner" || value === "admin" ? value : null;
}

export async function login(username: string, password: string): Promise<void> {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Login failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string; token_type: string };

  // Fetch /me to get role
  const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (!meRes.ok) {
    throw new Error("Failed to fetch current user after login");
  }
  const me = (await meRes.json()) as { role: "learner" | "admin" };
  setAuth(data.access_token, me.role);
}

export async function register(params: {
  username: string;
  email: string;
  password: string;
  role: "learner" | "admin";
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Registration failed (${res.status})`);
  }
}

export async function fetchProgress(): Promise<ProgressSummaryDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load progress: ${res.status}`);
  }
  return (await res.json()) as ProgressSummaryDto;
}

export async function fetchQuestDetail(questId: string): Promise<QuestDetailDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/quests/${questId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load quest: ${res.status}`);
  }
  return (await res.json()) as QuestDetailDto;
}

export async function submitQuestSolution(
  questId: string,
  code: string,
): Promise<SubmissionResultDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/quests/${questId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Submission failed (${res.status})`);
  }
  return (await res.json()) as SubmissionResultDto;
}

export async function fetchAdminQuests(): Promise<AdminQuestDto[]> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load admin quests: ${res.status}`);
  }
  return (await res.json()) as AdminQuestDto[];
}

export async function updateAdminQuest(
  questId: string,
  payload: Partial<{
    title: string;
    description: string;
    level: number;
    order_rank: number;
    initial_code: string;
    solution_code: string;
    explanation: string;
  }>
): Promise<AdminQuestDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests/${questId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Failed to update quest (${res.status})`);
  }
  return (await res.json()) as AdminQuestDto;
}

export async function deleteAdminQuest(questId: string): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests/${questId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Failed to delete quest (${res.status})`);
  }
}

export interface TestCaseDto {
  id: string;
  quest_id: string;
  input_data: Record<string, unknown> | null;
  expected_output: string;
  is_hidden: boolean;
}

export async function fetchTestCases(questId: string): Promise<TestCaseDto[]> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests/${questId}/testcases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load test cases: ${res.status}`);
  }
  return (await res.json()) as TestCaseDto[];
}

export async function createTestCase(
  questId: string,
  payload: { input_data?: Record<string, unknown> | null; expected_output: string; is_hidden?: boolean }
): Promise<TestCaseDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests/${questId}/testcases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      input_data: payload.input_data ?? null,
      expected_output: payload.expected_output,
      is_hidden: payload.is_hidden ?? false,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Failed to create test case (${res.status})`);
  }
  return (await res.json()) as TestCaseDto;
}

export async function deleteTestCase(testCaseId: string): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/testcases/${testCaseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Failed to delete test case (${res.status})`);
  }
}

export async function createAdminQuest(payload: {
  title: string;
  description: string;
  level: number;
  order_rank: number;
  initial_code: string;
  solution_code: string;
  explanation: string;
}): Promise<AdminQuestDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Failed to create quest (${res.status})`);
  }
  return (await res.json()) as AdminQuestDto;
}

export async function requestAiHint(params: {
  questId: string;
  code: string;
  lastOutput?: string;
}): Promise<AiHintResponseDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/hints/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      quest_id: params.questId,
      code: params.code,
      last_output: params.lastOutput ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any));
    throw new Error(body.detail || `AI hint failed (${res.status})`);
  }
  return (await res.json()) as AiHintResponseDto;
}


