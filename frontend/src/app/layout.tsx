import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthShell } from "@/components/layout/AuthShell";

export const metadata: Metadata = {
  title: "CodeQuest",
  description: "Debugging-based learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-50">
        {/* Simple outer shell with header that can react to auth state */}
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}
