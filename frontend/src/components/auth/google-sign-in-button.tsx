import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  flow?: "login" | "register";
  disabled?: boolean;
  actionLabel?: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 33.8 29.3 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.1l5.7-5.7C35 5.8 29.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12 24 12c3.3 0 6.3 1.2 8.6 3.1l5.7-5.7C35 5.8 29.9 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.8 0 10.8-2 14.4-5.5l-6.6-5.4C29.6 35 27 36 24 36c-5.2 0-9.6-3.2-11.3-7.7l-6.6 5.1C9.4 40.1 16.1 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-1 2.8-2.9 5.2-5.5 6.8l.1-.1 6.6 5.4C35.9 36.6 40 31.1 40 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

export function GoogleSignInButton({ flow = "login", disabled = false, actionLabel = "Continue with Google" }: GoogleSignInButtonProps) {
  const href = `${API_BASE}/api/v1/auth/google/start?flow=${flow}`;
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn(
        "h-12 w-full justify-start gap-3 border-border/70 bg-background/80 text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background hover:shadow-md",
        disabled && "pointer-events-none opacity-60",
      )}
      disabled={disabled}
      onClick={() => {
        window.location.href = href;
      }}
      aria-label={actionLabel}
    >
        <GoogleMark />
        <span className="text-sm font-medium">{actionLabel}</span>
    </Button>
  );
}