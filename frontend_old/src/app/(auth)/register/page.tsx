/**
 * Register page - calls backend register API.
 * Per doc: user selects role (Learner or Admin).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJson } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"learner" | "admin">("learner");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetchJson("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password, role }),
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-950 text-slate-50">
      <h1 className="text-2xl font-bold text-emerald-300">Register</h1>
      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200">Username</label>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200">Role</label>
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
            value={role}
            onChange={(e) => setRole(e.target.value as "learner" | "admin")}
          >
            <option value="learner">Learner</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="underline text-emerald-300 hover:text-emerald-200">
          Log in
        </Link>
      </p>
      <Link href="/" className="mt-4 text-sm text-slate-400 underline hover:text-slate-200">
        Back to home
      </Link>
    </main>
  );
}

