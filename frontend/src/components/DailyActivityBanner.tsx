/**
 * Daily activity notification banner (US-013).
 * Shows when learner hasn't practiced today to remind them.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

interface DailyActivityBannerProps {
  lastActivityDate: string | null | undefined;
  onDismiss?: () => void;
}

export const DailyActivityBanner: React.FC<DailyActivityBannerProps> = ({
  lastActivityDate,
  onDismiss,
}) => {
  if (isToday(lastActivityDate)) return null;

  return (
    <div className="rounded-lg border border-border bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-4 flex items-center justify-between gap-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            You haven&apos;t practiced today!
          </p>
          <p className="text-sm text-muted-foreground">
            Keep your streak alive. A quick quest can make all the difference.
          </p>
        </div>
      </div>

      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="shrink-0"
        >
          Dismiss
        </Button>
      )}
    </div>
  );
};

export default DailyActivityBanner;
