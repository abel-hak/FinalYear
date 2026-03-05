import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Code2, Lightbulb, ArrowRight, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface ErrorExplanationProps {
  errorType: string;
  errorMessage: string;
  lineNumber?: number;
  explanation: string;
  commonCauses: string[];
  suggestedFix: string;
  codeSnippet?: string;
  learnMoreUrl?: string;
}

const ErrorExplanation: React.FC<ErrorExplanationProps> = ({
  errorType,
  errorMessage,
  lineNumber,
  explanation,
  commonCauses,
  suggestedFix,
  codeSnippet,
  learnMoreUrl
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (suggestedFix) {
      await navigator.clipboard.writeText(suggestedFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Error Header */}
      <div className="bg-destructive/10 border-b border-destructive/30 p-4">
        <div className="flex items-start gap-3">
          <motion.div
            className="p-2 rounded-lg bg-destructive/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive" className="text-xs">
                {errorType}
              </Badge>
              {lineNumber && (
                <Badge variant="outline" className="text-xs">
                  Line {lineNumber}
                </Badge>
              )}
            </div>
            <code className="text-sm font-mono text-destructive block mt-2 p-2 bg-destructive/10 rounded">
              {errorMessage}
            </code>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="p-5 space-y-5">
        {/* What went wrong */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4" />
            What went wrong?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {explanation}
          </p>
        </motion.div>

        {/* Common Causes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-warning flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Common causes
          </h3>
          <ul className="space-y-2">
            {commonCauses.map((cause, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <ArrowRight className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                {cause}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Code Snippet if provided */}
        {codeSnippet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-code-bg border-b border-border">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Problematic Code</span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
            </div>
            <pre className="p-4 bg-code-bg overflow-x-auto">
              <code className="text-sm font-mono text-code-syntax-error">
                {codeSnippet}
              </code>
            </pre>
          </motion.div>
        )}

        {/* Suggested Fix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl overflow-hidden border border-success/30 bg-success/5"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-success/10 border-b border-success/30">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Suggested Fix</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-7 text-success hover:text-success hover:bg-success/20"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono text-success">
              {suggestedFix}
            </code>
          </pre>
        </motion.div>

        {/* Learn More */}
        {learnMoreUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-2"
          >
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Learn more about this error
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorExplanation;
