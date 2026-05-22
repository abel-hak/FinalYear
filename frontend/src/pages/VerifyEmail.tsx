import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  clearPendingVerification,
  loadPendingVerification,
  PendingVerificationSession,
  verifyEmail,
} from "@/api/backend";
import { Code2, ShieldCheck, Mail, TimerReset, ArrowLeft, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<PendingVerificationSession | null>(() => {
    const state = location.state as PendingVerificationSession | undefined;
    return state ?? loadPendingVerification();
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const state = location.state as PendingVerificationSession | undefined;
    if (state) {
      setSession(state);
      return;
    }
    if (!session) {
      const stored = loadPendingVerification();
      if (stored) {
        setSession(stored);
      }
    }
  }, [location.state, session]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expiresAt = session ? new Date(session.expiresAt).getTime() : null;
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const isExpired = expiresAt ? remainingMs <= 0 : false;
  const minutes = Math.floor(remainingMs / 1000 / 60);
  const seconds = Math.floor((remainingMs / 1000) % 60);

  const countdown = useMemo(() => `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`, [minutes, seconds]);

  if (!session) {
    return <Navigate to="/register" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyEmail(session.verificationId, otp);
      clearPendingVerification();
      setVerified(true);
      toast({
        title: "Email verified",
        description: "Your account is now active. You can sign in.",
      });
    } catch (e: any) {
      const message = e.message ?? "Verification failed";
      setError(message);
      if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("exhausted")) {
        clearPendingVerification();
        setTimeout(() => navigate("/register", { replace: true }), 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            <BadgeCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Email verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is active. You can now sign in with your username and password.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>Go to sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <main className="w-full max-w-md py-10 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-shadow">
              <Code2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">CodeQuest</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">
            Enter the 6-digit code we sent to {session.email}.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <Mail className="h-4 w-4" />
            <span>Verification pending for {session.username}</span>
          </div>

          <div className="mb-6 rounded-xl border border-border/60 bg-secondary/40 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Time remaining</p>
              <p className={`text-lg font-semibold ${isExpired ? "text-destructive" : "text-foreground"}`}>{countdown}</p>
            </div>
            <TimerReset className="h-5 w-5 text-muted-foreground" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading || isExpired}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {isExpired && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-sm text-amber-300">Your code expired. Please register again to receive a new one.</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading || isExpired || otp.length !== 6}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Verify email
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate("/register", { replace: true })}
            >
              <ArrowLeft className="h-4 w-4" />
              Start over
            </button>
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;