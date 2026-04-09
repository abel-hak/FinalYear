import React from "react";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProgressBar from "@/components/ProgressBar";

type AchievementRarity = "common" | "rare" | "epic" | "legendary";

interface AchievementCardData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: { current: number; max: number };
  rarity: AchievementRarity;
}

interface AchievementCardProps {
  achievement: AchievementCardData;
}

const rarityColors: Record<AchievementRarity, string> = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-yellow-500",
};

const rarityLabels: Record<AchievementRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const { unlocked, rarity, progress } = achievement;

  return (
    <div
      className={`relative overflow-hidden p-6 rounded-xl border transition-all duration-300 shadow-xl ${
        unlocked
          ? "bg-[image:var(--achievement-card-unlocked-gradient)] shadow-[var(--achievement-card-unlocked-shadow)] border-white/20 hover:border-white/40"
          : "bg-secondary/30 border-border/50 opacity-70"
      }`}
    >
      <style>{`
        @keyframes achievement-card-shimmer {
          0% { transform: translateX(-180%) skewX(-20deg); opacity: 0; }
          20% { opacity: 1; }
          55% { transform: translateX(450%) skewX(-20deg); opacity: 1; }
          60% { opacity: 0; }
          100% { transform: translateX(450%) skewX(-20deg); opacity: 0; }
        }

        @keyframes sparkle-pop {
          0%, 50% { transform: scale(0); opacity: 0; }
          55% { transform: scale(1.2); opacity: 1; filter: brightness(2); }
          65% { transform: scale(1); opacity: 1; }
          80% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(0); opacity: 0; }
        }

        .shimmer-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }

        .shimmer-line {
          position: absolute;
          top: -20%;
          bottom: -20%;
          left: -60%;
          width: 60%;
          /* Light mode uses a white shimmer for purple bg, dark mode uses the variable */
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255, 0.05) 10%,
            rgba(255,255,255, 0.6) 50%,
            rgba(255,255,255, 0.05) 90%,
            transparent 100%
          );
        }

        /* Fallback for dark mode variable-based shimmer */
        @media (prefers-color-scheme: dark) {
            .shimmer-line {
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    hsl(var(--achievement-card-shimmer) / 0.05) 10%,
                    hsl(var(--achievement-card-shimmer) / 0.55) 50%,
                    hsl(var(--achievement-card-shimmer) / 0.05) 90%,
                    transparent 100%
                );
            }
        }

        .shimmer-line {
          animation: achievement-card-shimmer 3s ease-in-out infinite;
        }

        .shimmer-line-1 { opacity: 0.7; }
        .shimmer-line-2 {
          width: 45%;
          left: -65%;
          opacity: 0.35;
          animation-delay: 0.2s;
        }

        .final-sparkle {
          position: absolute;
          right: 15%;
          top: 20%;
          color: white;
          animation: sparkle-pop 3s ease-in-out infinite;
        }

        .sparkle-extra-1 { color: white; animation: sparkle-pop 3.5s ease-in-out infinite; }
        .sparkle-extra-2 { color: white; animation: sparkle-pop 4s ease-in-out infinite; }
        .sparkle-extra-3 { color: white; animation: sparkle-pop 4.5s ease-in-out infinite; }

        @media (prefers-color-scheme: dark) {
            .final-sparkle, .sparkle-extra-1, .sparkle-extra-2, .sparkle-extra-3 {
                color: hsl(var(--achievement-card-shimmer));
            }
        }
      `}</style>

      {unlocked && (
        <div className="shimmer-container">
          <div className="shimmer-line shimmer-line-1" />
          <div className="shimmer-line shimmer-line-2" />

          <Sparkles className="final-sparkle h-5 w-5 fill-current" />
          <Sparkles className="absolute top-10 left-10 h-4 w-4 fill-current sparkle-extra-1" />
          <Sparkles className="absolute bottom-10 right-10 h-4 w-4 fill-current sparkle-extra-2" />
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 fill-current sparkle-extra-3" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_75%)] dark:bg-[radial-gradient(circle_at_50%_0%,hsl(var(--achievement-card-glow)/0.15)_0%,transparent_75%)]" />
        </div>
      )}

      <div className="absolute top-4 right-4">
        <Badge
          variant="glass"
          className={`text-xs bg-gradient-to-r ${rarityColors[rarity]} text-white border-0 shadow-sm`}
        >
          {rarityLabels[rarity]}
        </Badge>
      </div>

      <div
        className={`relative w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
          unlocked
            ? `bg-gradient-to-br ${rarityColors[rarity]} text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]`
            : `bg-gradient-to-br ${rarityColors[rarity]} text-white/40 shadow`
        }`}
      >
        {achievement.icon}
      </div>

      <h3
        className={`text-lg font-bold mb-1 ${unlocked ? "text-white dark:text-[hsl(var(--achievement-card-title))]" : "text-primary"}`}
      >
        {achievement.title}
      </h3>
      <p
        className={`text-sm mb-4 ${unlocked ? "text-purple-100 dark:text-[hsl(var(--achievement-card-description))]" : "text-primary/80"}`}
      >
        {achievement.description}
      </p>

      {progress && !unlocked ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {progress.current}/{progress.max}
            </span>
          </div>
          <ProgressBar value={progress.current} max={progress.max} size="sm" />
        </div>
      ) : (
        <Badge
          variant={unlocked ? "gold" : "outline"}
          className={`flex items-center gap-1 w-fit ${unlocked ? "bg-white/20 dark:bg-[hsl(var(--achievement-card-glow))] text-white dark:text-[hsl(var(--warning-foreground))] border-0 backdrop-blur-sm" : ""}`}
        >
          {unlocked ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
          {unlocked ? "Completed" : "Locked"}
        </Badge>
      )}
    </div>
  );
};

export default AchievementCard;
