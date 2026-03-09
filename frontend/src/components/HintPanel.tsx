import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react';

interface Hint {
  id: number;
  text: string;
  revealed: boolean;
}

interface HintPanelProps {
  hints: string[];
  aiHints?: { number: number; text: string }[];
  aiLoading?: boolean;
  aiHintsRemaining?: number | null; // null = unknown/unlimited
  aiHintLimit?: number | null;
  onAskAiHint?: () => void;
  className?: string;
}

const HintPanel: React.FC<HintPanelProps> = ({ hints, aiHints, aiLoading, aiHintsRemaining, aiHintLimit, onAskAiHint, className }) => {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  
  const revealNextHint = () => {
    const nextIndex = revealedHints.length;
    if (nextIndex < hints.length) {
      setRevealedHints([...revealedHints, nextIndex]);
    }
  };
  
  const hasMoreHints = revealedHints.length < hints.length;
  const staticHintsRemaining = hints.length - revealedHints.length;
  const hasStaticHints = hints.length > 0;
  const canRequestAiHint = onAskAiHint && (aiHintsRemaining === null || aiHintsRemaining === undefined || aiHintsRemaining > 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Hints</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {hasStaticHints
            ? `${staticHintsRemaining} static hint${staticHintsRemaining !== 1 ? 's' : ''} remaining`
            : aiHintsRemaining != null
              ? `${aiHintsRemaining} AI hint${aiHintsRemaining !== 1 ? 's' : ''} remaining`
              : onAskAiHint
                ? 'AI hints available'
                : ''}
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

      {/* AI hint */}
      {onAskAiHint && (
        <div className="pt-2 border-t border-border/60 space-y-2">
          {aiHints && aiHints.length > 0 && (
            <div className="space-y-2">
              {aiHints.map((h) => (
                <div key={h.number} className="hint-card bg-primary/5 border border-primary/40 p-3 rounded-md text-sm text-foreground">
                  <div className="flex items-center gap-2 mb-1 text-primary-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-semibold text-xs uppercase tracking-wide">
                      AI hint {h.number}{aiHintLimit ? `/${aiHintLimit}` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{h.text}</p>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={aiLoading || !canRequestAiHint}
            onClick={onAskAiHint}
            className="w-full justify-center text-xs text-muted-foreground hover:text-primary"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {aiLoading
              ? "Asking AI..."
              : !canRequestAiHint
                ? "No AI hints remaining"
                : "Ask AI for a hint"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default HintPanel;
