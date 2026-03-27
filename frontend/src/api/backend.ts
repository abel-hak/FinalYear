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
  tags?: string[];
}

export interface ProgressSummaryDto {
  current_level: number;
  total_points: number;
  streak_days?: number;
  last_activity_date?: string | null;  // YYYY-MM-DD (US-013)
  quests: QuestSummaryDto[];
}

export interface LearningPathSummaryDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  quest_count: number;
  unlocked?: boolean;
}

export interface LearningPathQuestItemDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  status: "completed" | "current" | "locked";
  tags?: string[];
}

export interface LearningPathDetailDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  quests: LearningPathQuestItemDto[];
  is_unlocked?: boolean;
  unlock_hint?: string | null;
}

export interface ReviewSuggestionDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  tags?: string[];
  last_completed_at: string;
  days_since_completion: number;
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
  tags?: string[];
  prev_id?: string | null;
  next_id?: string | null;
}

export interface SubmissionResultDto {
  quest_id: string;
  passed: boolean;
  tests_passed: number;
  tests_total: number;
  stdout: string;
  stderr: string;
  actual_output: string;
  test_results: {
    test_case_id: string;
    passed: boolean;
    expected_output?: string | null;
    is_hidden: boolean;
  }[];
}

export interface ExplainFailureRequestDto {
  quest_id: string;
  code: string;
  expected_output?: string | null;
  actual_output?: string | null;
  stderr?: string | null;
}

export interface ExplainFailureResponseDto {
  what_it_does: string;
  why_wrong: string;
  next_action: string;
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
  tags?: string[];
  is_deleted: boolean;
}

export interface QuestQualityIssueDto {
  quest_id: string;
  order_rank: number;
  title: string;
  issues: string[];
}

export interface QuestQualityReportDto {
  total_quests: number;
  quests_with_issues: number;
  items: QuestQualityIssueDto[];
}

export interface AdminQuestAIDraftRequestDto {
  topic: string;
  difficulty: number;
  bug_type: string;
  extra_instructions?: string | null;
}

export interface AdminQuestAIDraftResponseDto {
  title: string;
  description: string;
  level: number;
  initial_code: string;
  solution_code: string;
  explanation: string;
  expected_output: string;
  tags: string[];
}

export interface AiHintResponseDto {
  hint: string;
  remaining: number;
  hint_number: number;
  limit: number;
}

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementProgressDto {
  current: number;
  max: number;
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
  icon_key: string;
  xp: number;
  rarity: AchievementRarity;
  unlocked: boolean;
  progress?: AchievementProgressDto | null;
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

export async function removeAdminUser(userId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Failed to remove user (${res.status})`);
  }
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
  window.dispatchEvent(new Event("auth-change"));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  window.dispatchEvent(new Event("auth-change"));
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

export async function fetchLearningPaths(): Promise<LearningPathSummaryDto[]> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/learning-paths`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  return (await res.json()) as LearningPathSummaryDto[];
}

export async function fetchLearningPathDetail(pathId: string): Promise<LearningPathDetailDto> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/learning-paths/${pathId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load path: ${res.status}`);
  }
  return (await res.json()) as LearningPathDetailDto;
}

export async function fetchReviewSuggestions(): Promise<ReviewSuggestionDto[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/v1/progress/review-suggestions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
    }
    return [];
  }
  return (await res.json()) as ReviewSuggestionDto[];
}

export interface LeaderboardEntryDto {
  rank: number | null;
  username: string;
  total_points: number;
  streak_days: number;
  quests_completed: number;
  is_me?: boolean;
}

export type LeaderboardPeriod = "all" | "weekly" | "monthly";

export interface LeaderboardResponseDto {
  entries: LeaderboardEntryDto[];
  me?: LeaderboardEntryDto | null;
}

export async function fetchLeaderboard(
  limit?: number,
  period?: LeaderboardPeriod
): Promise<LeaderboardResponseDto> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (period && period !== "all") params.set("period", period);
  const url = `${API_BASE}/api/v1/leaderboard${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load leaderboard: ${res.status}`);
  }
  return (await res.json()) as LeaderboardResponseDto;
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

export async function fetchAchievements(): Promise<AchievementDto[]> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/achievements`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load achievements: ${res.status}`);
  }
  return (await res.json()) as AchievementDto[];
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
    if (res.status === 503) {
      throw new Error(body.detail || "System Busy. Please try again later.");
    }
    throw new Error(body.detail || `Submission failed (${res.status})`);
  }
  return (await res.json()) as SubmissionResultDto;
}

export async function explainFailure(payload: ExplainFailureRequestDto): Promise<ExplainFailureResponseDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/ai/explain-failure`, {
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
    if (res.status === 503) {
      throw new Error(body.detail || "AI explanation temporarily unavailable. Please try again later.");
    }
    throw new Error(body.detail || `Failed to explain failure (${res.status})`);
  }
  return (await res.json()) as ExplainFailureResponseDto;
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

export async function fetchQuestQualityReport(): Promise<QuestQualityReportDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests/quality`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAuth();
      throw new Error("Unauthorized");
    }
    throw new Error(body.detail || `Failed to load quality report (${res.status})`);
  }
  return (await res.json()) as QuestQualityReportDto;
}

export async function generateAdminQuestDraft(
  payload: AdminQuestAIDraftRequestDto
): Promise<AdminQuestAIDraftResponseDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/quests/ai-draft`, {
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
    throw new Error(body.detail || `AI draft failed (${res.status})`);
  }
  return (await res.json()) as AdminQuestAIDraftResponseDto;
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
    tags: string[];
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

// Learning paths admin
export interface AdminLearningPathDto {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  quest_count: number;
}

export interface AdminPathQuestDto {
  id: string;
  quest_id: string;
  order_rank: number;
  quest_title: string;
  quest_level: number;
}

export async function fetchAdminLearningPaths(): Promise<AdminLearningPathDto[]> {
  return adminFetch<AdminLearningPathDto[]>("/learning-paths");
}

export async function createAdminLearningPath(payload: {
  title: string;
  description: string;
  level: number;
  order_rank: number;
}): Promise<AdminLearningPathDto> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/learning-paths`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Failed to create path (${res.status})`);
  }
  return (await res.json()) as AdminLearningPathDto;
}

export async function updateAdminLearningPath(
  pathId: string,
  payload: Partial<{ title: string; description: string; level: number; order_rank: number }>
): Promise<AdminLearningPathDto> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/learning-paths/${pathId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Failed to update path (${res.status})`);
  }
  return (await res.json()) as AdminLearningPathDto;
}

export async function deleteAdminLearningPath(pathId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/learning-paths/${pathId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Failed to delete path (${res.status})`);
  }
}

export async function fetchAdminPathQuests(pathId: string): Promise<AdminPathQuestDto[]> {
  return adminFetch<AdminPathQuestDto[]>(`/learning-paths/${pathId}/quests`);
}

export async function addQuestToPath(pathId: string, questId: string, orderRank?: number): Promise<AdminPathQuestDto> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/learning-paths/${pathId}/quests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quest_id: questId, order_rank: orderRank ?? null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Failed to add quest (${res.status})`);
  }
  return (await res.json()) as AdminPathQuestDto;
}

export async function removeQuestFromPath(pathId: string, questId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(
    `${API_BASE}/api/v1/admin/learning-paths/${pathId}/quests/${questId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Failed to remove quest (${res.status})`);
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
  tags?: string[];
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

export async function fetchHintRemaining(questId: string): Promise<{ remaining: number }> {
  const token = getToken();
  if (!token) return { remaining: 3 };
  const res = await fetch(`${API_BASE}/api/v1/hints/remaining?quest_id=${encodeURIComponent(questId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { remaining: 3 };
  return (await res.json()) as { remaining: number };
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


