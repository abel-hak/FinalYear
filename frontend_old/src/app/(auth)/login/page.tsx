/**
 * Login page - calls backend auth API and stores JWT + role.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchJson, getApiUrl } from "@/lib/api";
import { setAuth, UserRole } from "@/lib/auth";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.set("username", username);
      form.set("password", password);

      const res = await fetch(getApiUrl("/api/v1/auth/login"), {
        method: "POST",
        body: form,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Login failed");
      }
      const data = (await res.json()) as LoginResponse;

      // Fetch current user to know role
      const me = await fetchJson<{ id: string; username: string; email: string; role: UserRole }>(
        "/api/v1/auth/me",
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        },
      );

      setAuth(data.access_token, me.role);
      router.push(me.role === "admin" ? "/admin/dashboard" : "/learner/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-950 text-slate-50">
      <h1 className="text-2xl font-bold text-emerald-300">Log in</h1>
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
          <label className="block text-sm font-medium text-slate-200">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-300">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline text-emerald-300 hover:text-emerald-200">
          Register
        </Link>
      </p>
      <Link href="/" className="mt-4 text-sm text-slate-400 underline hover:text-slate-200">
        Back to home
      </Link>
    </main>
  );
}

