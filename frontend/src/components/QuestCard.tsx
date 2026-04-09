import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, Play, Sparkles } from "lucide-react";

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  status: "locked" | "available" | "in-progress" | "completed";
  xp: number;
  estimatedTime: string;
  tags?: string[];
}

interface QuestCardProps {
  quest: Quest;
  onClick?: () => void;
  className?: string;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onClick, className }) => {
  const statusIcons = {
    locked: <Lock className="h-8 w-8 text-muted-foreground" />,
    available: <Play className="h-9 w-9 text-primary" />,
    "in-progress": <Sparkles className="h-9 w-9 text-primary animate-pulse" />,
    completed: <Check className="h-11 w-11 text-success" />,
  };

  const isLocked = quest.status === "locked";
  const isCompleted = quest.status === "completed";
  const isActive =
    quest.status === "available" || quest.status === "in-progress";

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "group relative mx-auto flex w-full max-w-[520px] items-center justify-center px-3 sm:px-0",
        isLocked && "cursor-not-allowed",
        !isLocked && "cursor-pointer",
        className,
      )}
    >
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* description */}
          <div
            className={cn(
              "pointer-events-none absolute left-[60%] top-1/2 z-0 hidden w-[min(18rem,calc(100vw-2rem))] -translate-y-1/2 rounded-2xl bg-card/95 p-4 opacity-0 backdrop-blur-sm transition-all duration-500 ease-out lg:block",
              "group-hover:left-[calc(100%+0.5rem)] group-hover:opacity-100",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                {quest.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {quest.estimatedTime}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {quest.description}
            </p>
            {quest.tags && quest.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quest.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div
            className={cn(
              "relative z-20 flex h-32 w-32 items-center justify-center rounded-full border transition-all duration-300 sm:h-36 sm:w-36",
              isLocked && "border-border bg-muted/40",
              isCompleted && "border-success/35 bg-success/10",
              isActive && [
                "border-primary/45 bg-primary/10",
                "group-hover:scale-[1.02]",
              ],
            )}
          >
            <div className="absolute inset-2 rounded-full border border-foreground/10" />
            <div className="relative z-10">{statusIcons[quest.status]}</div>
          </div>
        </div>

        <h3 className="mt-3 max-w-[210px] text-center text-sm font-semibold text-muted-foreground sm:text-base">
          {quest.title}
        </h3>
      </div>
    </div>
  );
};

export default QuestCard;
