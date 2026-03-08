import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Sparkles, Loader2 } from "lucide-react";
import { fetchLeaderboard, type LeaderboardEntryDto } from "@/api/backend";

const rankMedals: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard(20)
      .then((data) => {
        if (!cancelled) setEntries(data);
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
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top learners by XP. Complete quests and build your streak to climb the ranks!
          </p>
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
          <div className="space-y-3 max-w-2xl">
            {entries.map((entry) => (
              <Card
                key={entry.rank}
                className={
                  entry.rank <= 3
                    ? "border-primary/30 bg-primary/5"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center text-2xl font-bold">
                      {rankMedals[entry.rank] ?? `#${entry.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.username}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {entry.total_points} XP
                        </span>
                        <span>{entry.quests_completed} quests</span>
                        {entry.streak_days > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Flame className="w-3.5 h-3.5" />
                            {entry.streak_days} day streak
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="gold" className="shrink-0">
                      #{entry.rank}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
