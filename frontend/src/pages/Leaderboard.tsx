import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, Calendar } from "lucide-react";
import {
  fetchLeaderboard,
  type LeaderboardEntryDto,
  type LeaderboardPeriod,
} from "@/api/backend";
import LeaderboardEntryCard from "@/components/leaderboard/LeaderboardEntryCard";

const periodLabels: Record<LeaderboardPeriod, string> = {
  all: "All Time",
  weekly: "This Week",
  monthly: "This Month",
};

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
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
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground mb-4">
            {periodSubtitle}. Complete quests and build your streak to climb the
            ranks!
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
          <div className="flex items-center justify-center py-16 max-w-4xl mx-auto">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive text-center py-8 max-w-4xl mx-auto">
            {error}
          </p>
        ) : entries.length === 0 ? (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                No one on the leaderboard yet. Be the first to complete a quest!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 max-w-4xl mx-auto">
            {entries.map((entry) => (
              <LeaderboardEntryCard
                key={`${entry.rank ?? "na"}-${entry.username}`}
                entry={entry}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
