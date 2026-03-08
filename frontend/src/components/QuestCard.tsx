import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2, Play, Sparkles } from 'lucide-react';
import ProgressBar from './ProgressBar';

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
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
  const difficultyColors = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'destructive'
  } as const;
  
  const statusIcons = {
    locked: <Lock className="w-5 h-5 text-muted-foreground" />,
    available: <Play className="w-5 h-5 text-accent" />,
    'in-progress': <Sparkles className="w-5 h-5 text-primary animate-pulse" />,
    completed: <CheckCircle2 className="w-5 h-5 text-success" />
  };
  
  const isLocked = quest.status === 'locked';

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "quest-card p-5 cursor-pointer group",
        isLocked && "opacity-60 cursor-not-allowed",
        quest.status === 'completed' && "ring-2 ring-success/30",
        quest.status === 'in-progress' && "ring-2 ring-primary/50 animate-pulse-glow",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {statusIcons[quest.status]}
          <Badge variant={difficultyColors[quest.difficulty]}>
            {quest.difficulty}
          </Badge>
        </div>
        <Badge variant="gold" className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {quest.xp} XP
        </Badge>
      </div>
      
      {/* Content */}
      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
        {quest.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {quest.description}
      </p>

      {/* Concept tags */}
      {quest.tags && quest.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {quest.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent" />
          {quest.category}
        </span>
        <span>{quest.estimatedTime}</span>
      </div>
      
      {/* Progress for in-progress quests */}
      {quest.status === 'in-progress' && (
        <div className="mt-4">
          <ProgressBar value={35} size="sm" />
        </div>
      )}
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, hsl(262, 83%, 58%, 0.1) 0%, transparent 70%)' }} />
    </div>
  );
};

export default QuestCard;
