import React from 'react';
import { cn } from '@/lib/utils';

interface CodeLine {
  lineNumber: number;
  content: string;
  hasError?: boolean;
}

interface CodeEditorProps {
  code: string;
  onChange?: (code: string) => void;
  errorLine?: number;
  readOnly?: boolean;
  className?: string;
}

const highlightSyntax = (line: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  
  // Simple syntax highlighting patterns
  const patterns = [
    { regex: /(#.*)$/, className: 'text-code-comment' }, // comments
    { regex: /\b(def|class|if|else|elif|for|while|return|import|from|try|except|with|as|in|not|and|or|True|False|None|print)\b/g, className: 'text-code-keyword' },
    { regex: /(".*?"|'.*?')/g, className: 'text-code-string' },
    { regex: /\b(\w+)\s*(?=\()/g, className: 'text-code-function' },
  ];

  let remaining = line;
  let lastIndex = 0;
  
  // Handle comments first
  const commentMatch = line.match(/(#.*)$/);
  if (commentMatch && commentMatch.index !== undefined) {
    const beforeComment = line.slice(0, commentMatch.index);
    const comment = commentMatch[1];
    
    return [
      ...processCode(beforeComment),
      <span key="comment" className="text-code-comment">{comment}</span>
    ];
  }
  
  return processCode(line);
};

const processCode = (code: string): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let remaining = code;
  let key = 0;
  
  while (remaining.length > 0) {
    // Check for strings
    const stringMatch = remaining.match(/^(".*?"|'.*?')/);
    if (stringMatch) {
      result.push(<span key={key++} className="text-code-string">{stringMatch[0]}</span>);
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }
    
    // Check for keywords
    const keywordMatch = remaining.match(/^(def|class|if|else|elif|for|while|return|import|from|try|except|with|as|in|not|and|or|True|False|None|print)\b/);
    if (keywordMatch) {
      result.push(<span key={key++} className="text-code-keyword">{keywordMatch[0]}</span>);
      remaining = remaining.slice(keywordMatch[0].length);
      continue;
    }
    
    // Check for function calls
    const funcMatch = remaining.match(/^(\w+)(?=\s*\()/);
    if (funcMatch) {
      result.push(<span key={key++} className="text-code-function">{funcMatch[0]}</span>);
      remaining = remaining.slice(funcMatch[0].length);
      continue;
    }
    
    // Regular character
    result.push(remaining[0]);
    remaining = remaining.slice(1);
  }
  
  return result;
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  errorLine,
  readOnly = false,
  className
}) => {
  const lines = code.split('\n');

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
      
      {/* Code content */}
      <div className="p-4 overflow-auto max-h-96">
        <pre className="font-mono text-sm leading-relaxed">
          {lines.map((line, index) => {
            const lineNum = index + 1;
            const isError = errorLine === lineNum;
            
            return (
              <div
                key={index}
                className={cn(
                  "flex group",
                  isError && "bg-destructive/20 -mx-4 px-4 border-l-2 border-destructive"
                )}
              >
                <span className={cn(
                  "w-8 text-right pr-4 select-none text-muted-foreground/50 text-xs",
                  isError && "text-destructive"
                )}>
                  {lineNum}
                </span>
                <code className="flex-1">
                  {highlightSyntax(line)}
                </code>
              </div>
            );
          })}
        </pre>
      </div>
      
      {/* Editable textarea overlay if not readonly */}
      {!readOnly && (
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full resize-none"
          spellCheck={false}
        />
      )}
    </div>
  );
};

export default CodeEditor;
