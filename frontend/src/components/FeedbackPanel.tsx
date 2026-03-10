import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Terminal } from 'lucide-react';

type FeedbackType = 'success' | 'error' | 'info';

interface FeedbackPanelProps {
  type: FeedbackType;
  title: string;
  message: string;
  output?: string;
  expectedOutput?: string | null;
  actualOutput?: string | null;
  extraContent?: React.ReactNode;
  className?: string;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  type,
  title,
  message,
  output,
  expectedOutput,
  actualOutput,
  extraContent,
  className
}) => {
  const icons = {
    success: <CheckCircle2 className="w-6 h-6 text-success" />,
    error: <XCircle className="w-6 h-6 text-destructive" />,
    info: <AlertCircle className="w-6 h-6 text-accent" />
  };
  
  const cardClasses = {
    success: 'success-card',
    error: 'error-card',
    info: 'border-l-4 border-accent bg-accent/10 rounded-lg p-4'
  };

  return (
    <div className={cn(cardClasses[type], "animate-slide-up", className)}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
          
          {(expectedOutput != null || actualOutput != null) && (
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {expectedOutput != null && (
                <div className="p-3 rounded-lg bg-code-bg border border-border">
                  <div className="text-xs text-muted-foreground font-mono mb-2">Expected</div>
                  <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                    {expectedOutput}
                  </pre>
                </div>
              )}
              {actualOutput != null && (
                <div className="p-3 rounded-lg bg-code-bg border border-border">
                  <div className="text-xs text-muted-foreground font-mono mb-2">Your output</div>
                  <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                    {actualOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          {output && (
            <div className="mt-3 p-3 rounded-lg bg-code-bg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">Output</span>
              </div>
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}

          {extraContent && (
            <div className="mt-3">
              {extraContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPanel;
