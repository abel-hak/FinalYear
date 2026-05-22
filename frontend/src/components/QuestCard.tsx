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
    locked: <Lock className="h-5 w-5 text-muted-foreground" />,
    available: <Play className="h-5 w-5 text-primary" />,
    "in-progress": <Sparkles className="h-5 w-5 text-primary animate-pulse" />,
    completed: <Check className="h-5 w-5 text-success" />,
  };

  const isLocked = quest.status === "locked";
  const isCompleted = quest.status === "completed";
  const isActive =
    quest.status === "available" || quest.status === "in-progress";

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "group relative flex h-full w-full",
        isLocked && "cursor-not-allowed",
        !isLocked && "cursor-pointer",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col rounded-3xl border bg-card p-5 text-left shadow-sm transition-all duration-300",
          "border-border/80 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
          isLocked && "bg-muted/30",
          isCompleted && "border-success/30 bg-success/5",
          isActive && "border-primary/25 bg-primary/5",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center">
                {statusIcons[quest.status]}
              </span>
              <span className="capitalize">
                {quest.status.replace("-", " ")}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {quest.title}
            </h3>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              XP
            </div>
            <div className="text-sm font-semibold text-foreground">
              {quest.xp}
            </div>
          </div>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {quest.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
            {quest.category}
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
            {quest.estimatedTime}
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 capitalize">
            {quest.difficulty}
          </span>
        </div>

        {quest.tags && quest.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
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
    </div>
  );
};

export default QuestCard;
