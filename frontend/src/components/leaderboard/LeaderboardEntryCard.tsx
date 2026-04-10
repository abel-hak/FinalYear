import React from "react";
import { Flame, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type LeaderboardEntryDto } from "@/api/backend";
import { getPlayerTitle } from "@/lib/utils";

type LeaderboardEntryCardProps = {
  entry: LeaderboardEntryDto;
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "leaderboard-avatar-1",
    "leaderboard-avatar-2",
    "leaderboard-avatar-3",
    "leaderboard-avatar-4",
    "leaderboard-avatar-5",
    "leaderboard-avatar-6",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const LeaderboardEntryCard: React.FC<LeaderboardEntryCardProps> = ({
  entry,
}) => {
  // 1. Define podium configurations
  const podiumConfigs: Record<
    number,
    { stripeClass: string; glowClass: string; textClass: string }
  > = {
    1: {
      stripeClass: "leaderboard-podium-1-stripe",
      glowClass: "leaderboard-podium-1-glow",
      textClass: "leaderboard-podium-1-text",
    },
    2: {
      stripeClass: "leaderboard-podium-2-stripe",
      glowClass: "leaderboard-podium-2-glow",
      textClass: "leaderboard-podium-2-text",
    },
    3: {
      stripeClass: "leaderboard-podium-3-stripe",
      glowClass: "leaderboard-podium-3-glow",
      textClass: "leaderboard-podium-3-text",
    },
  };

  const rank = entry.rank ?? 0;
  const config = podiumConfigs[rank];

  return (
    <Card
      className={`relative overflow-hidden ${
        entry.is_me ? "border-primary/50 bg-primary/10" : ""
      }`}
    >
      {/* Decorative Stripes for Podium (Rank 1, 2, 3) */}
      {config && (
        <div className="absolute bottom-0 right-0 pointer-events-none select-none">
          {/* Rank-specific glow */}
          <div
            className={`absolute bottom-0 right-0 w-16 h-16 blur-2xl rounded-full ${config.glowClass}`}
          />

          <div className="flex flex-col items-center gap-2 translate-x-6 translate-y-2">
            {/* Top Stripe */}
            <div
              className={`h-1.5 w-24 rotate-[-45deg] shadow-md ${config.stripeClass}`}
            />
            {/* Bottom Stripe */}
            <div
              className={`h-1 w-24 rotate-[-45deg] shadow-md ${config.stripeClass}`}
            />
          </div>
        </div>
      )}

      <CardContent className="p-4 relative z-10">
        <div className="flex items-center gap-4">
          <div
            className={`w-8 text-center text-lg font-bold ${
              config ? config.textClass : "text-muted-foreground"
            }`}
          >
            {entry.rank ?? "—"}
          </div>
          <div
            className={`w-10 h-10 rounded-full ${getAvatarColor(entry.username)} flex items-center justify-center text-white font-semibold text-xs shadow`}
          >
            {getInitials(entry.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {entry.username}
              <span
                className={`ml-2 text-xs ${getPlayerTitle(entry.total_points).color}`}
              >
                • {getPlayerTitle(entry.total_points).title}
              </span>
            </p>
            <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {entry.total_points} XP
              </span>
              <span>{entry.quests_completed} quests</span>
              {entry.streak_days > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  {entry.streak_days}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardEntryCard;
