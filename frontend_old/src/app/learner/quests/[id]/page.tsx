"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";
import { CodeEditor } from "@/components/editor/CodeEditor";

interface QuestDetail {
  id: string;
  title: string;
  description: string;
  level: number;
  order_rank: number;
  initial_code: string;
  explanation_unlocked: boolean;
  explanation?: string | null;
}

interface SubmissionResult {
  quest_id: string;
  passed: boolean;
  tests_passed: number;
  tests_total: number;
  stdout: string;
  stderr: string;
}

export default function LearnerQuestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const questId = params.id;

  const [quest, setQuest] = useState<QuestDetail | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl(`/api/v1/quests/${questId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to load quest");
        }
        const data = (await res.json()) as QuestDetail;
        setQuest(data);
        setCode(data.initial_code);
      } catch (err: any) {
        setError(err.message ?? "Failed to load quest");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [questId, router]);

  async function handleSubmit() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(getApiUrl(`/api/v1/quests/${questId}/submit`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Submission failed");
      }
      const data = (await res.json()) as SubmissionResult;
      setResult(data);
      // Reload quest to update explanation_unlocked if passed
      const questRes = await fetch(getApiUrl(`/api/v1/quests/${questId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (questRes.ok) {
        setQuest((await questRes.json()) as QuestDetail);
      }
    } catch (err: any) {
      setError(err.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p>Loading quest...</p>
      </main>
    );
  }

  if (!quest) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-red-600">{error ?? "Quest not found."}</p>
        <Link href="/learner/dashboard" className="mt-4 underline text-slate-700">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {quest.order_rank}. {quest.title}
          </h1>
          <p className="mt-2 text-slate-700">{quest.description}</p>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Your code</h2>
          <CodeEditor value={code} onChange={setCode} />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? "Running..." : "Run & Submit"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        {result && (
          <section className="space-y-2 rounded border bg-slate-50 p-4 text-sm">
            <p>
              Result:{" "}
              <span
                className={
                  result.passed ? "font-semibold text-emerald-700" : "font-semibold text-red-700"
                }
              >
                {result.passed ? "Passed" : "Failed"}
              </span>{" "}
              ({result.tests_passed}/{result.tests_total} tests)
            </p>
            <div>
              <h3 className="font-semibold text-slate-800">stdout</h3>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-black p-2 text-xs text-emerald-100">
                {result.stdout || "<empty>"}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">stderr</h3>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-black p-2 text-xs text-red-200">
                {result.stderr || "<empty>"}
              </pre>
            </div>
          </section>
        )}

        {quest.explanation_unlocked && quest.explanation && (
          <section className="rounded border bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-amber-800">Knowledge Scroll</h2>
            <p className="mt-1 text-sm text-amber-900 whitespace-pre-line">{quest.explanation}</p>
          </section>
        )}

        <Link
          href="/learner/dashboard"
          className="text-sm text-slate-600 underline hover:text-slate-800"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

