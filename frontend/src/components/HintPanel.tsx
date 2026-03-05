import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface Hint {
  id: number;
  text: string;
  revealed: boolean;
}

interface HintPanelProps {
  hints: string[];
  className?: string;
}

const HintPanel: React.FC<HintPanelProps> = ({ hints, className }) => {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  
  const revealNextHint = () => {
    const nextIndex = revealedHints.length;
    if (nextIndex < hints.length) {
      setRevealedHints([...revealedHints, nextIndex]);
    }
  };
  
  const hasMoreHints = revealedHints.length < hints.length;
  const hintsRemaining = hints.length - revealedHints.length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Hints</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {hintsRemaining} hint{hintsRemaining !== 1 ? 's' : ''} remaining
        </span>
      </div>
      
      {/* Revealed hints */}
      <div className="space-y-3">
        {revealedHints.map((index) => (
          <div key={index} className="hint-card animate-slide-up">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <p className="text-sm text-foreground">{hints[index]}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Reveal more button */}
      {hasMoreHints && (
        <Button
          variant="outline"
          onClick={revealNextHint}
          className="w-full group"
        >
          <Eye className="w-4 h-4 mr-2" />
          Reveal Hint {revealedHints.length + 1}
          <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
        </Button>
      )}
      
      {!hasMoreHints && revealedHints.length > 0 && (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            <EyeOff className="w-4 h-4 inline mr-1" />
            All hints revealed
          </p>
        </div>
      )}
    </div>
  );
};

export default HintPanel;
