import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/api/backend";
import { Code2, UserPlus, Eye, EyeOff, GraduationCap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"learner" | "admin">("learner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ username, email, password, role });
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
      navigate("/login");
    } catch (e: any) {
      setError(e.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 right-1/2 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <main className="w-full max-w-md px-4 py-10 relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-shadow">
              <Code2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">CodeQuest</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">
            Create your account and start debugging!
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8">
          <h1 className="text-xl font-semibold mb-6 text-foreground">Create your account</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selector - styled buttons instead of raw select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">I want to join as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === "learner"
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border bg-card/50 hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setRole("learner")}
                >
                  <GraduationCap className={`w-6 h-6 ${role === "learner" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${role === "learner" ? "text-primary" : "text-muted-foreground"}`}>
                    Learner
                  </span>
                  <span className="text-xs text-muted-foreground text-center">Solve quests & level up</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === "admin"
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border bg-card/50 hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setRole("admin")}
                >
                  <Shield className={`w-6 h-6 ${role === "admin" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${role === "admin" ? "text-primary" : "text-muted-foreground"}`}>
                    Admin
                  </span>
                  <span className="text-xs text-muted-foreground text-center">Manage content</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create account
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Register;
