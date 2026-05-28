import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { acceptCreatorInvitation } from "@/api/backend";
import { Code2, Loader2, TriangleAlert, BadgeCheck } from "lucide-react";

const CreatorInviteAccept = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function completeAcceptance() {
      try {
        await acceptCreatorInvitation(token);
        if (!cancelled) {
          setAccepted(true);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "Invitation acceptance failed");
          setLoading(false);
        }
      }
    }

    void completeAcceptance();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <main className="w-full max-w-md px-4 py-10 relative z-10">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pink-500 shadow-lg">
            <Code2 className="h-8 w-8 text-primary-foreground" />
          </div>
          {loading ? (
            <>
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Accepting invitation</h1>
              <p className="mt-2 text-sm text-muted-foreground">We’re connecting this path to your account.</p>
            </>
          ) : accepted ? (
            <>
              <BadgeCheck className="mx-auto mb-4 h-8 w-8 text-emerald-400" />
              <h1 className="text-xl font-semibold text-foreground">Invitation accepted</h1>
              <p className="mt-2 text-sm text-muted-foreground">You can now manage your assigned learning paths.</p>
              <button
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                onClick={() => navigate("/creator", { replace: true })}
              >
                Go to creator workspace
              </button>
            </>
          ) : (
            <>
              <TriangleAlert className="mx-auto mb-4 h-8 w-8 text-amber-400" />
              <h1 className="text-xl font-semibold text-foreground">Invitation could not be accepted</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80">
                  Back to login
                </Link>
                <span className="text-muted-foreground/40">|</span>
                <Link to="/" className="text-sm font-medium text-primary hover:text-primary/80">
                  Home
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatorInviteAccept;