import React from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  onChange?: (code: string) => void;
  errorLine?: number;
  readOnly?: boolean;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  readOnly = false,
  className
}) => {
  return (
    <div className={cn("code-editor-bg rounded-xl overflow-hidden border border-border", className)}>
      {/* Editor header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/70" />
          <div className="w-3 h-3 rounded-full bg-warning/70" />
          <div className="w-3 h-3 rounded-full bg-success/70" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">quest.py</span>
      </div>

      {/* Simple textarea editor */}
      <textarea
        value={code}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="w-full h-72 bg-transparent px-4 py-3 font-mono text-sm text-foreground outline-none resize-none"
      />
    </div>
  );
};

export default CodeEditor;
