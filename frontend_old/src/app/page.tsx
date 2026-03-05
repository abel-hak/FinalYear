/**
 * CodeQuest - Home / landing page
 * Links to login, register, and (when auth exists) dashboard
 */
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-slate-800">CodeQuest</h1>
      <p className="mt-2 text-slate-600">Debugging-based learning platform</p>
      <nav className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded border border-slate-800 px-4 py-2 text-slate-800 hover:bg-slate-100"
        >
          Register
        </Link>
      </nav>
    </main>
  );
}
