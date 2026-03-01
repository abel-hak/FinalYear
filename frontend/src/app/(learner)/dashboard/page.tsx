/**
 * Learner dashboard - progress map and quest list (full UI in Milestone 4)
 */
import Link from "next/link";

export default function LearnerDashboardPage() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-bold text-slate-800">My Journey</h1>
      <p className="mt-2 text-slate-600">Progress map and quests will be wired in Milestone 4.</p>
      <Link href="/" className="mt-4 text-slate-600 underline hover:text-slate-800">
        Back to home
      </Link>
    </main>
  );
}
