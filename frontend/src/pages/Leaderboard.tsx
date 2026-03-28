import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Sparkles, Loader2, Calendar, Crown, Medal, Award } from "lucide-react";
import { fetchLeaderboard, type LeaderboardEntryDto, type LeaderboardPeriod } from "@/api/backend";

const periodLabels: Record<LeaderboardPeriod, string> = {
  all: "All Time",
  weekly: "This Week",
  monthly: "This Month",
};

const rankColors: Record<number, string> = {
  1: "from-yellow-400 to-amber-500",
  2: "from-slate-300 to-slate-400",
  3: "from-amber-600 to-amber-700",
};

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-yellow-300" />,
  2: <Medal className="w-5 h-5 text-slate-200" />,
  3: <Award className="w-5 h-5 text-amber-300" />,
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
  const [me, setMe] = useState<LeaderboardEntryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard(20, period)
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries ?? []);
          setMe((data.me as any) ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const periodSubtitle =
    period === "all"
      ? "Top learners by total XP"
      : period === "weekly"
      ? "Most XP earned in the last 7 days"
      : "Most XP earned in the last 30 days";

  // Split top 3 and rest
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground mb-4">
            {periodSubtitle}. Complete quests and build your streak to climb the ranks!
          </p>
          <div className="flex flex-wrap gap-2">
            {(["all", "weekly", "monthly"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive text-center py-8">{error}</p>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No one on the leaderboard yet. Be the first to complete a quest!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Your rank card */}
            {me && (
              <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(me.username)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                      {getInitials(me.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">You ({me.username})</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          {me.total_points} XP
                        </span>
                        <span>{me.quests_completed} quests</span>
                        {me.streak_days > 0 && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <Flame className="w-3.5h-3.5" />
                            {me.streak_days} day streak
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="gold" className="shrink-0 text-base px-4 py-1.5">
                      {me.rank ? `#${me.rank}` : "—"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 3 podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {top3.map((entry) => {
                  const rank = entry.rank ?? 99;
                  return (
                    <Card
                      key={`${entry.rank}-${entry.username}`}
                      className={`relative overflow-hidden ${
                        entry.is_me ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {/* Rank gradient bar at top */}
                      <div className={`h-1.5 bg-gradient-to-r ${rankColors[rank] ?? "from-muted to-muted"}`} />
                      <CardContent className="p-5 text-center">
                        <div className="relative mx-auto mb-3">
                          <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${getAvatarColor(entry.username)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                            {getInitials(entry.username)}
                          </div>
                          {rank <= 3 && (
                            <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br ${rankColors[rank]} flex items-center justify-center shadow-md`}>
                              {rankIcons[rank]}
                            </div>
                          )}
                        </div>
                        <p className="font-semibold truncate">{entry.username}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-lg font-bold text-foreground">{entry.total_points} XP</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{entry.quests_completed} quests</span>
                          {entry.streak_days > 0 && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <Flame className="w-3 h-3" />
                              {entry.streak_days}d
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Remaining entries */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((entry) => (
                  <Card
                    key={`${entry.rank ?? "na"}-${entry.username}`}
                    className={entry.is_me ? "border-primary/50 bg-primary/10" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center text-lg font-bold text-muted-foreground">
                          {entry.rank ?? "—"}
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(entry.username)} flex items-center justify-center text-white font-semibold text-xs shadow`}>
                          {getInitials(entry.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{entry.username}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              {entry.total_points} XP
                            </span>
                            <span>{entry.quests_completed} quests</span>
                            {entry.streak_days > 0 && (
                              <span className="flex items-center gap-1 text-orange-500">
                                <Flame className="w-3.5 h-3.5" />
                                {entry.streak_days}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
