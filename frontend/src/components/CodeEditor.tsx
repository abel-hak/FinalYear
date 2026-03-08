import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  onChange?: (code: string) => void;
  onRun?: () => void;
  errorLine?: number;
  readOnly?: boolean;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  readOnly = false,
  className
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta || !onChange) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newCode = code.slice(0, start) + '  ' + code.slice(end);
        onChange(newCode);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun?.();
      }
    },
    [code, onChange, onRun]
  );

  return (
    <div className={cn("code-editor-bg rounded-xl overflow-hidden border border-border", className)}>
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" />
            <div className="w-3 h-3 rounded-full bg-warning/70" />
            <div className="w-3 h-3 rounded-full bg-success/70" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">quest.py</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">Ctrl+Enter to run</span>
      </div>

      {/* Simple textarea editor */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        className="w-full h-72 bg-transparent px-4 py-3 font-mono text-sm text-foreground outline-none resize-none"
      />
    </div>
  );
};

export default CodeEditor;
