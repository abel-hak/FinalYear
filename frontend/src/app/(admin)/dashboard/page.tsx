/**
 * Admin dashboard - quest list, create quest, and manage test cases.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getApiUrl, fetchJson } from "@/lib/api";

interface QuestAdmin {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  initial_code: string;
  solution_code: string;
  explanation: string;
  is_deleted: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [quests, setQuests] = useState<QuestAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    level: 1,
    order_rank: 1,
    initial_code: "print('hello')",
    solution_code: "print('hello')",
    explanation: "Just prints hello.",
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        setLoading(true);
        const data = await fetchJson<QuestAdmin[]>("/api/v1/admin/quests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuests(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to load quests");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleCreateQuest(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const created = await fetchJson<QuestAdmin>("/api/v1/admin/quests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newQuest),
      });
      setQuests((prev) => [...prev, created].sort((a, b) => a.order_rank - b.order_rank));
      setNewQuest({
        title: "",
        description: "",
        level: 1,
        order_rank: newQuest.order_rank + 1,
        initial_code: "print('hello')",
        solution_code: "print('hello')",
        explanation: "Just prints hello.",
      });
    } catch (err: any) {
      setError(err.message ?? "Failed to create quest");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Manage quests and test cases.</p>
          </div>
          <Link href="/" className="text-sm text-slate-500 underline hover:text-slate-700">
            Back to home
          </Link>
        </header>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded border bg-slate-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Create quest</h2>
          <form onSubmit={handleCreateQuest} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700">Title</label>
              <input
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={newQuest.title}
                onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700">Order</label>
              <input
                type="number"
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={newQuest.order_rank}
                onChange={(e) =>
                  setNewQuest({ ...newQuest, order_rank: Number(e.target.value) || 1 })
                }
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700">Level</label>
              <input
                type="number"
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={newQuest.level}
                onChange={(e) => setNewQuest({ ...newQuest, level: Number(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Description</label>
              <textarea
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                rows={2}
                value={newQuest.description}
                onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700">Initial code</label>
              <textarea
                className="mt-1 w-full rounded border px-2 py-1 text-xs font-mono"
                rows={3}
                value={newQuest.initial_code}
                onChange={(e) => setNewQuest({ ...newQuest, initial_code: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-700">Solution code</label>
              <textarea
                className="mt-1 w-full rounded border px-2 py-1 text-xs font-mono"
                rows={3}
                value={newQuest.solution_code}
                onChange={(e) => setNewQuest({ ...newQuest, solution_code: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Explanation</label>
              <textarea
                className="mt-1 w-full rounded border px-2 py-1 text-xs"
                rows={2}
                value={newQuest.explanation}
                onChange={(e) => setNewQuest({ ...newQuest, explanation: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
              >
                Create quest
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Existing quests</h2>
          <div className="space-y-2">
            {quests.length === 0 && (
              <p className="text-sm text-slate-500">No quests yet. Create one above.</p>
            )}
            {quests.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded border px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">
                    {q.order_rank}. {q.title} (level {q.level})
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{q.description}</p>
                </div>
                <span className="text-xs text-slate-500">id: {q.id}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

