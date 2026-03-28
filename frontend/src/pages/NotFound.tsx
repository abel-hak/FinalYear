import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Bug, RotateCcw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <main className="relative z-10 text-center px-4">
        {/* Bugsy mascot */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Mascot body */}
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
              <Bug className="w-14 h-14 text-white" />
            </div>
            {/* Antennas */}
            <div className="absolute -top-5 left-6 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <div className="w-1 h-5 bg-primary/50 rounded-full" />
            </div>
            <div className="absolute -top-5 right-6 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <div className="w-1 h-5 bg-primary/50 rounded-full" />
            </div>
            {/* Confused badge */}
            <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-lg font-bold shadow-lg text-white">
              ?
            </div>
          </div>
        </div>

        {/* 404 text */}
        <div className="mb-3">
          <span className="text-8xl font-black gradient-text leading-none">404</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          This code path doesn&apos;t exist!
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-base">
          Bugsy got lost debugging and ended up on a broken route.
          Let&apos;s get back to the quests!
        </p>

        {/* Error path pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border font-mono text-sm text-muted-foreground mb-8">
          <span className="text-red-400">404</span>
          <span>·</span>
          <span className="truncate max-w-48">{location.pathname}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => window.history.back()}>
            <RotateCcw className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
