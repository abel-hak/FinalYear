/**
 * Login page - placeholder until auth API (Milestone 3/5)
 */
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-slate-800">Log in</h1>
      <p className="mt-2 text-slate-600">Auth will be wired in Milestone 3.</p>
      <Link href="/" className="mt-4 text-slate-600 underline hover:text-slate-800">
        Back to home
      </Link>
    </main>
  );
}
