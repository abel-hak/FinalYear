"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getRole } from "@/lib/auth";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"learner" | "admin" | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, [pathname]);

  function handleLogout() {
    clearAuth();
    setRole(null);
    router.push("/login");
  }

  const inLearnerArea = pathname.startsWith("/learner");
  const inAdminArea = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold text-emerald-400">
              CodeQuest
            </Link>
            {role === "learner" && (
              <Link
                href="/learner/dashboard"
                className="text-xs text-slate-300 hover:text-emerald-300"
              >
                Learner dashboard
              </Link>
            )}
            {role === "admin" && (
              <Link href="/admin/dashboard" className="text-xs text-slate-300 hover:text-emerald-300">
                Admin dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            {role && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                Signed in as <span className="font-semibold">{role}</span>
              </span>
            )}
            {!role && (
              <>
                <Link href="/login" className="hover:text-emerald-300">
                  Log in
                </Link>
                <Link href="/register" className="hover:text-emerald-300">
                  Register
                </Link>
              </>
            )}
            {role && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded bg-slate-800 px-3 py-1 font-medium text-emerald-300 hover:bg-slate-700"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Simple client-side guard: if role is learner, gently block admin area; if admin, block learner area */}
      {role === "learner" && inAdminArea ? (
        <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-semibold text-red-300">Admins only area.</p>
          <p className="mt-2 text-sm text-slate-300">
            You&apos;re signed in as a learner. Ask an admin to grant you access or switch to an admin
            account.
          </p>
          <button
            type="button"
            onClick={() => router.push("/learner/dashboard")}
            className="mt-4 rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Go to learner dashboard
          </button>
        </main>
      ) : role === "admin" && inLearnerArea ? (
        <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-semibold text-red-300">Learner area only.</p>
          <p className="mt-2 text-sm text-slate-300">
            You&apos;re signed in as an admin. Use a learner account to experience quests as a learner.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="mt-4 rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Go to admin dashboard
          </button>
        </main>
      ) : (
        <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950">{children}</main>
      )}
    </div>
  );
}

