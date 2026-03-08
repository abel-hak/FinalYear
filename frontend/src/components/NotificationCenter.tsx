/**
 * Notification center - achievements, streaks, system messages.
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Trophy, Flame, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchProgress } from "@/api/backend";
import { cn } from "@/lib/utils";

const SEEN_KEY = "codequest_notifications_seen";

type NotificationType = "achievement" | "streak" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  timestamp: number;
}

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(id: string) {
  const seen = getSeenIds();
  seen.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

function buildNotifications(
  progress: { total_points: number; current_level: number; streak_days: number; last_activity_date?: string | null; quests: { status: string }[] }
): Notification[] {
  const notifs: Notification[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Daily reminder
  if (progress.last_activity_date !== today) {
    notifs.push({
      id: "daily-reminder",
      type: "system",
      title: "Daily reminder",
      message: "You haven't practiced today. A quick quest keeps your streak alive!",
      link: "/quests",
      linkLabel: "Practice now",
      timestamp: Date.now(),
    });
  }

  // Streak
  if (progress.streak_days > 0) {
    notifs.push({
      id: `streak-${progress.streak_days}`,
      type: "streak",
      title: "Streak!",
      message: `${progress.streak_days} day streak. Keep it going!`,
      link: "/quests",
      linkLabel: "Practice now",
      timestamp: Date.now(),
    });
  }

  // Progress summary
  const completed = progress.quests.filter((q) => q.status === "completed").length;
  if (completed > 0) {
    notifs.push({
      id: `quests-${completed}`,
      type: "achievement",
      title: "Progress",
      message: `${completed} quest${completed > 1 ? "s" : ""} completed • ${progress.total_points} XP`,
      link: "/achievements",
      linkLabel: "View achievements",
      timestamp: Date.now(),
    });
  }

  return notifs.slice(0, 6);
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  achievement: <Trophy className="w-4 h-4 text-gold" />,
  streak: <Flame className="w-4 h-4 text-orange-500" />,
  system: <Sparkles className="w-4 h-4 text-primary" />,
};

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const seen = getSeenIds();
    fetchProgress()
      .then((p) => {
        if (!cancelled) {
          const all = buildNotifications(p);
          setNotifications(all.filter((n) => !seen.has(n.id)));
        }
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const unseenCount = notifications.length;

  const handleDismiss = (id: string) => {
    markSeen(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n) => markSeen(n.id));
    setNotifications([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="w-5 h-5" />
          {unseenCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No notifications yet.</p>
              <p className="mt-1 text-xs">Complete quests and build your streak!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                    "bg-primary/5"
                  )}
                >
                  <div className="shrink-0 mt-0.5">{typeIcons[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => {
                          handleDismiss(n.id);
                          setOpen(false);
                        }}
                      >
                        <span className="text-xs text-primary hover:underline mt-1 inline-block">
                          {n.linkLabel} →
                        </span>
                      </Link>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => handleDismiss(n.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
