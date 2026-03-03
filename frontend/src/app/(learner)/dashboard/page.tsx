/**
 * Learner dashboard - shows progress summary and quest path.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

interface QuestSummary {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  status: "completed" | "current" | "locked" | string;
}

interface ProgressSummary {
  current_level: number;
  total_points: number;
  quests: QuestSummary[];
}

export default function LearnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl("/api/v1/progress"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load progress");
        }
        const json = (await res.json()) as ProgressSummary;
        setData(json);
      } catch (err: any) {
        setError(err.message ?? "Failed to load progress");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p>Loading progress...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-red-600">{error ?? "Unable to load progress."}</p>
        <Link href="/" className="mt-4 text-slate-600 underline hover:text-slate-800">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Journey</h1>
            <p className="mt-1 text-sm text-slate-600">
              Level {data.current_level} · {data.total_points} XP
            </p>
          </div>
          <Link href="/" className="text-sm text-slate-500 underline hover:text-slate-700">
            Back to home
          </Link>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Quest path</h2>
          <div className="flex flex-col gap-3">
            {data.quests.length === 0 && (
              <p className="text-sm text-slate-500">No quests configured yet.</p>
            )}
            {data.quests.map((q) => {
              const isClickable = q.status !== "locked";
              const baseClasses =
                "flex items-center justify-between rounded border px-4 py-3 text-sm";
              const statusColors =
                q.status === "completed"
                  ? "border-emerald-400 bg-emerald-50"
                  : q.status === "current"
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-200 bg-slate-50";
              return (
                <div key={q.id} className={baseClasses + " " + statusColors}>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {q.order_rank}. {q.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{q.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                      {q.status}
                    </span>
                    {isClickable && (
                      <Link
                        href={`/learner/quests/${q.id}`}
                        className="text-xs font-medium text-sky-700 underline hover:text-sky-900"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

